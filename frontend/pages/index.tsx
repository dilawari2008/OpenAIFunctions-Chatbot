import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import axios from "axios";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if threadId exists in localStorage
    const storedThreadId = localStorage.getItem("threadId");
    if (storedThreadId) {
      setThreadId(storedThreadId);
      fetchMessages(storedThreadId);
    } else {
      createNewThread();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async (id: string) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/chat/messages?threadId=${id}`
      );
      // Transform the data format if needed
      if (response.data?.data) {
        const formattedMessages = response.data.data.map((msg: any) => ({
          role: msg.role,
          content: msg.message || msg.content
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
      console.log("Fetched messages:", response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const createNewThread = async () => {
    try {
      const response = await axios.post("http://localhost:3001/api/chat/session");
      const newThreadId = response.data.data;
      localStorage.setItem("threadId", newThreadId);
      setThreadId(newThreadId);
      setMessages([]);
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !threadId) return;

    const userMessage = {
      role: "user" as const,
      content: input,
    };

    // Update messages with user message immediately
    setMessages((prev) => [...prev, userMessage]);
    // Clear input field
    setInput("");
    // Show loading indicator
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/chat/process",
        {
          threadId,
          message: input,
        }
      );

      console.log("Response from server:", response.data);

      const assistantMessage = {
        role: "assistant" as const,
        content: response.data.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setLoading(false);

      // Show error message
      const errorMessage = {
        role: "assistant" as const,
        content:
          "There has been an error, please refresh the thread and start a new conversation",
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleRefreshThread = () => {
    localStorage.removeItem("threadId");
    createNewThread();
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <Head>
        <title>Smile Bright Dental Practice</title>
        <meta name="description" content="Dental Practice Chat Interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex-1 flex flex-col h-full w-full">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-2">😊</span>
            <h1 className="text-xl font-medium m-0">
              Smile Bright Dental Practice
            </h1>
          </div>
          <button
            className="bg-transparent border-none text-white text-2xl cursor-pointer p-1 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={handleRefreshThread}
            title="Start New Conversation"
          >
            🔄
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-gray-100 h-[calc(100vh-10rem)]">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            {messages && messages.length > 0 ? (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[80%] p-3 rounded-2xl animate-fade-in ${
                    message.role === "assistant"
                      ? "self-start bg-white border border-gray-200 rounded-bl-sm"
                      : "self-end bg-blue-500 text-white rounded-br-sm"
                  }`}
                >
                  <div className="break-words">{message.content}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 mt-4">
                Start a conversation by typing a message below
              </div>
            )}
            {loading && (
              <div className="max-w-[80%] self-start p-3 rounded-2xl bg-white border border-gray-200 rounded-bl-sm animate-fade-in">
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce-delay-1"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce-delay-2"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce-delay-3"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            className="flex p-4 bg-white border-t border-gray-200"
            onSubmit={handleSendMessage}
          >
            <input
              type="text"
              className="flex-1 py-3 px-4 border border-gray-200 rounded-full text-base outline-none focus:border-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
            />
            <button
              type="submit"
              className="ml-2 w-10 h-10 bg-blue-500 text-white border-none rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
            >
              <span className="text-base">➤</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
