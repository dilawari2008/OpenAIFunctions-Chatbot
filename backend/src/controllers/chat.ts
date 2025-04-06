import { Request, Response, NextFunction } from "express";
import LOGGER from "@/common/logger";
import SessionService from "@/services/chat/session";
import ChatService from "@/services/chat/service";

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
  const { sessionId, message } = req.body;
  const result = await ChatService.processChat(sessionId, message);
  res.sendFormatted(result);
};

const ChatController = {
  getSession,
  mergeSessions,
  processChat,
};

export default ChatController;
