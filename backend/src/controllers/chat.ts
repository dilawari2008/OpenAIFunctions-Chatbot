import { Request, Response, NextFunction } from "express";
import LOGGER from "@/common/logger";
import SessionService from "@/services/chat/session";

const getSession = async (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  const session = await SessionService.getSession(patientId);
  res.sendFormatted(session);
};

const mergeSessions = async (req: Request, res: Response) => {
  const { patientId, sessionId } = req.body;
  const result = await SessionService.mergeSessions(patientId, sessionId);
  res.sendFormatted(result);
};

const ChatController = {
  getSession,
  mergeSessions,
};

export default ChatController;
