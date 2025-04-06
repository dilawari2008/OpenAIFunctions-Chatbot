import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { ChatSession } from "@/db/models/session";
import { Types } from "mongoose";
import createError from "http-errors";
import createHttpError from "http-errors";

const getSession = async (
  patientId?: string | Types.ObjectId,
  sessionId?: string
) => {
  LOGGER.debug(
    `Getting or creating session for patientId: ${
      patientId || "none"
    }, sessionId: ${sessionId || "none"}`
  );

  // If sessionId is provided, try to find session by id first
  if (sessionId) {
    const sessionById = await ChatSession.findOne({
      _id: new Types.ObjectId(sessionId),
      deleted: false,
    });

    if (sessionById) {
      return sessionById;
    }
  }

  if (patientId) {
    const patientObjectId = new Types.ObjectId(patientId);

    // Try to find existing session for patient
    const existingSession = await ChatSession.findOne({
      patientId: patientObjectId,
      deleted: false,
    });

    if (existingSession) {
      return existingSession;
    }
  }

  // Create new session if none exists
  const session = await ChatSession.create({
    patientId: patientId ? new Types.ObjectId(patientId) : undefined,
    deleted: false,
  });

  return session;
};

const mergeSessions = async (
  patientId: string | Types.ObjectId,
  sessionId: string
) => {
  LOGGER.debug(
    `Checking for session merge: patientId=${patientId}, sessionId=${sessionId}`
  );

  const patientObjectId = new Types.ObjectId(patientId);

  // Find patient's existing session if any
  let existingSession = await ChatSession.findOne({
    patientId: patientObjectId,
    deleted: false,
  });

  // Find the current session
  let currentSession = await ChatSession.findOne({
    sessionId,
    deleted: false,
  });

  if (!currentSession) {
    throw createHttpError(
      HttpStatusCodes.NOT_FOUND,
      `Session not found with id: ${sessionId}`
    );
  }

  // If no existing session or current session is the existing session, just return current
  if (!existingSession || existingSession.sessionId === sessionId) {
    currentSession = await ChatSession.findOneAndUpdate(
      { _id: new Types.ObjectId(currentSession._id) },
      { $set: { patientId: patientObjectId } },
      { new: true }
    );

    return currentSession;
  }

  // Merge sessions - append messages from current to existing and mark current as deleted
  // Filter out system messages from currentSession.messages
  const filteredMessages = (currentSession.messages || []).filter(
    (message: any) => message?.role !== "system"
  );

  existingSession = await ChatSession.findOneAndUpdate(
    { _id: new Types.ObjectId(existingSession._id) },
    { $push: { messages: { $each: filteredMessages } } },
    { new: true }
  );

  // Mark current session as deleted
  await ChatSession.findOneAndUpdate(
    { _id: new Types.ObjectId(currentSession._id) },
    { $set: { deleted: true } }
  );

  return existingSession;
};

const getPatientIdBySessionId = async (sessionId: string) => {
  const session = await ChatSession.findOne({
    sessionId,
    deleted: false,
  });
  return session?.patientId;
};

const SessionService = {
  getSession,
  mergeSessions,
  getPatientIdBySessionId,
};

export default SessionService;
