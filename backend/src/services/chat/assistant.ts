import OpenAI from "openai";
import Config from "@/config";
import ChatService from "./service";
import LOGGER from "@/common/logger";
import { PromptLibrary } from "@/services/chat/prompt-library";
import tools from "@/services/chat/function";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const createThread = async () => {
  const thread = await client.beta.threads.create();
  return thread.id;
};

const processChat = async (threadId: string, message: string) => {
  let res: any = "";
  try {
    // Check if there's an active run on the thread
    const runs = await client.beta.threads.runs.list(threadId);
    const activeRun = runs.data.find((run) =>
      ["in_progress", "queued", "requires_action"].includes(run.status)
    );

    // If there's an active run, wait for it to complete
    if (activeRun) {
      let runStatus = await client.beta.threads.runs.retrieve(
        threadId,
        activeRun.id
      );

      // Poll for the run to complete
      while (
        runStatus.status !== "completed" &&
        runStatus.status !== "failed" &&
        runStatus.status !== "cancelled" &&
        runStatus.status !== "expired"
      ) {
        if (runStatus.status === "requires_action") {
          await handleToolCalls(threadId, runStatus, activeRun.id);
        }

        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 500));
        runStatus = await client.beta.threads.runs.retrieve(
          threadId,
          activeRun.id
        );
      }
    }

    // Add the user message to the thread after any active runs are complete
    await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    // Run the assistant on the thread
    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: Config.assistantId,
    });

    let runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);

    // Poll for the run to complete
    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      if (runStatus.status === "requires_action") {
        await handleToolCalls(threadId, runStatus, run.id);
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 500));
      runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (runStatus.status === "failed") {
      throw new Error(
        `Run failed with error: ${runStatus.last_error?.message}`
      );
    }

    // Get the messages from the thread
    const messages = await client.beta.threads.messages.list(threadId);

    // Return the latest assistant message
    const assistantMessages = messages.data.filter(
      (msg) => msg.role === "assistant"
    );
    res =
      assistantMessages[0]?.content[0]?.type === "text"
        ? assistantMessages[0]?.content[0]?.text?.value
        : assistantMessages[0];
  } catch (error) {
    console.error("Error processing chat:", error);
    // Instead of returning a generic error message, let's handle specific errors
    if (error instanceof Error) {
      // Create a user-friendly error message to send back to the assistant
      await client.beta.threads.messages.create(threadId, {
        role: "user",
        content: `Error occurred: ${error.message}. Please provide a helpful response.`,
      });

      // Run the assistant to get a response to the error
      const errorRun = await client.beta.threads.runs.create(threadId, {
        assistant_id: Config.assistantId,
      });

      // Wait for the assistant to process the error
      let errorRunStatus = await client.beta.threads.runs.retrieve(
        threadId,
        errorRun.id
      );
      while (
        errorRunStatus.status !== "completed" &&
        errorRunStatus.status !== "failed"
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        errorRunStatus = await client.beta.threads.runs.retrieve(
          threadId,
          errorRun.id
        );
      }

      // Get the assistant's response to the error
      const errorMessages = await client.beta.threads.messages.list(threadId);
      const errorAssistantMessages = errorMessages.data.filter(
        (msg) => msg.role === "assistant"
      );

      if (
        errorAssistantMessages.length > 0 &&
        errorAssistantMessages[0]?.content[0]?.type === "text"
      ) {
        return errorAssistantMessages[0].content[0].text.value;
      }
    }
    return "I'm sorry, there was an issue processing your request. Please try again.";
  }
  return res;
};

// Helper function to handle tool calls
const handleToolCalls = async (
  threadId: string,
  runStatus: any,
  runId: string
) => {
  const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    const toolOutputs = [];
    let toolCallErrors = [];

    // Process each tool call
    for (const toolCall of toolCalls) {
      const {
        id,
        function: { name, arguments: args },
      } = toolCall;

      try {
        console.log(`Tool call: ${name}`, args);
        const result = await ChatService.toolCalls(name, args);

        toolOutputs.push({
          tool_call_id: id,
          output: JSON.stringify(result || {}) || "{}", // Ensure output is never empty
        });
      } catch (error: any) {
        console.log(
          `Tool call error: ${name}`,
          args,
          error.message,
          error.stack
        );

        // Add error to list of tool call errors
        toolCallErrors.push(`Error in tool call ${name}: ${error.message}`);

        // Send the error as a proper response to the tool call
        toolOutputs.push({
          tool_call_id: id,
          output:
            JSON.stringify({
              error: true,
              message: error.message,
              details: `Failed to ${name}: ${error.message}`,
            }) || '{"error":true}', // Ensure output is never empty
        });
      }
    }

    // Submit the tool outputs back to the assistant
    if (toolOutputs.length > 0) {
      await client.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: toolOutputs,
      });
    }

    // If there were any errors, add them to the thread as a user message
    // so the assistant can respond to them properly
    if (toolCallErrors.length > 0) {
      const errorMessage = `I encountered the following issues:\n${toolCallErrors.join(
        "\n"
      )}\nPlease provide a helpful response.`;
      await client.beta.threads.messages.create(threadId, {
        role: "user",
        content: errorMessage,
      });
    }
  }
};

const getMessagesbyThreadId = async (
  threadId: string
): Promise<{ role: "user" | "assistant"; message: string }[]> => {
  const messages = await client.beta.threads.messages.list(threadId, {
    limit: 100,
    order: "asc",
  });
  const res = messages.data.map((msg) => ({
    role: msg.role,
    message:
      msg.content[0]?.type === "text"
        ? msg.content[0]?.text?.value
        : msg.content[0]?.type,
  }));

  return res;
};

const createAssistant = async () => {
  try {
    const assistant = await client.beta.assistants.create({
      name: "Dental Clinic Assistant",
      instructions: PromptLibrary.dentalBotPersonality,
      model: "gpt-3.5-turbo",
      tools: [
        {
          type: "code_interpreter",
        },
        ...tools.map(tool => ({
          type: "function" as const,
          function: tool.function
        })),
      ],
    });

    return {
      assistantId: assistant.id,
      success: true,
    };
  } catch (error) {
    LOGGER.error("Failed to create assistant", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

const AssistantService = {
  processChat,
  createThread,
  getMessagesbyThreadId,
  createAssistant,
};

export default AssistantService;
