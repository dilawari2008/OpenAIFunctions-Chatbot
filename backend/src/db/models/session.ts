import DB from "@/db/db";
import { IChatSession } from "@/interfaces/model";
import { Schema } from "mongoose";

const chatSessionSchema: Schema = new Schema<IChatSession>(
  {
    sessionId: { type: String },
    messages: { type: [Schema.Types.Mixed], default: [] },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ChatSession = DB.model<IChatSession>(
  "ChatSession",
  chatSessionSchema
);
