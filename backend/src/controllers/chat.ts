import { Request, Response, NextFunction } from "express";
import LOGGER from "@/common/logger";
import SessionService from "@/services/chat/session";
import ChatService from "@/services/chat/service";
import AssistantService from "@/services/chat/assistant";

const getSession = async (req: Request, res: Response) => {
  const patientId = req?.body?.patientId;
  const sessionId = req?.body?.sessionId;
  const session = await SessionService.getSession(patientId, sessionId);
  res.sendFormatted(session);
};

const mergeSessions = async (req: Request, res: Response) => {
  const { patientId, sessionId } = req.body;
  const result = await SessionService.mergeSessions(patientId, sessionId);
  res.sendFormatted(result);
};

const processChat = async (req: Request, res: Response) => {
  const { threadId, message } = req.body;
  const result = await AssistantService.processChat(threadId, message);
  res.sendFormatted(result);
};

const createThread = async (req: Request, res: Response) => {
  const result = await AssistantService.createThread();
  res.sendFormatted(result);
};

const createAssistant = async (req: Request, res: Response) => {
  const result = await AssistantService.createAssistant();
  res.sendFormatted(result);
};

const ChatController = {
  getSession,
  mergeSessions,
  processChat,
  createThread,
  createAssistant,
};

export default ChatController;
