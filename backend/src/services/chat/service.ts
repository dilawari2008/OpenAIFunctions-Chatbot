import { ChatSession } from "@/db/models/session";
import SlotService from "@/services/slot";
import { getStartOfDayInUTC } from "@/utils";
import axios from "axios";
import { PromptLibrary } from "./prompt-library";
import tools from "./function";
import { Types } from "mongoose";
import InfoService from "@/services/info";

const toolCalls = async (name: string, args: string) => {
  switch (name) {
    case "getAvailableTimeSlots":
      const { from, to } = JSON.parse(args);
      return await SlotService.getAvailableTimeSlotsForDateRange(
        getStartOfDayInUTC(from),
        getStartOfDayInUTC(to)
      );
    case "getCurrentDate":
      return await SlotService.getCurrentDateInUTC();
    case "getAppointmentTypes":
      return await InfoService.getAppointmentTypePricing();
    case "getPaymentMethods":
      return await InfoService.getPaymentMethods();
    case "getInsuranceProviders":
      return await InfoService.getInsuranceProviders();
    default:
      throw new Error(`Tool call ${name} not found`);
  }
};

const processChat = async (sessionId: string, message: string) => {
  let session = await ChatSession.findOne({
    _id: new Types.ObjectId(sessionId),
  });
  if (!session) {
    throw new Error("Session not found");
  }
  let messages = session?.messages || [];

  if (messages.length === 0) {
    messages.push({
      role: "system",
      content: PromptLibrary.dentalBotPersonality,
    });
  }

  messages.push({
    role: "user",
    content: message,
  });

  const finalMessages = await processConversationWithTools(messages);

  session.messages = finalMessages;
  await session.save();

  return finalMessages;
};

const processConversationWithTools = async (messages: any[]) => {
  let continueProcessing = true;

  while (continueProcessing) {
    const response = await callOpenAI(messages);

    messages.push(response);

    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        const {
          id,
          function: { name, arguments: args },
        } = toolCall;

        try {
          console.log(`Tool call: ${name}`, args);

          const result = await toolCalls(name, args);

          messages.push({
            role: "tool",
            tool_call_id: id,
            content: JSON.stringify(result),
          });
        } catch (error: any) {
          console.log(`Tool call error: ${name}`, args, error.message);

          messages.push({
            role: "tool",
            tool_call_id: id,
            content: JSON.stringify({ error: error.message }),
          });
        }
      }
    } else {
      continueProcessing = false;
    }
  }

  return messages;
};

const callOpenAI = async (messages: any[]) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages,
        tools,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw new Error("Failed to process chat with OpenAI");
  }
};

const ChatService = {
  toolCalls,
  processChat,
};

export default ChatService;
