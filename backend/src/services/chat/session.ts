import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { ChatSession } from "@/db/models/session";
import { Types } from "mongoose";
import createError from "http-errors";

const getSession = async (patientId?: string | Types.ObjectId) => {
  LOGGER.debug(
    `Getting or creating session for patientId: ${patientId || "none"}`
  );

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
  const existingSession = await ChatSession.findOne({
    patientId: patientObjectId,
    deleted: false,
  });

  // Find the current session
  const currentSession = await ChatSession.findOne({
    sessionId,
    deleted: false,
  });

  if (!currentSession) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Session not found with id: ${sessionId}`
    );
  }

  // If no existing session or current session is the existing session, just return current
  if (!existingSession || existingSession.sessionId === sessionId) {
    return currentSession;
  }

  // Merge sessions - append messages from current to existing and mark current as deleted
  await ChatSession.findOneAndUpdate(
    { _id: new Types.ObjectId(existingSession._id) },
    { $push: { messages: { $each: currentSession.messages || [] } } }
  );

  // Mark current session as deleted
  await ChatSession.findOneAndUpdate(
    { _id: new Types.ObjectId(currentSession._id) },
    { $set: { deleted: true } }
  );

  return existingSession;
};

const SessionService = {
  getSession,
  mergeSessions,
};

export default SessionService;
