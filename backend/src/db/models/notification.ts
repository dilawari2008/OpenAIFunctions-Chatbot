import DB from "@/db/db";
import { EUserType, EUrgency } from "@/enums";
import { INotification } from "@/interfaces/model";
import { Schema } from "mongoose";

const notificationSchema: Schema = new Schema<INotification>(
  {
    userType: {
      type: String,
      enum: Object.values(EUserType),
    },
    message: { type: String },
    urgency: {
      type: String,
      enum: Object.values(EUrgency),
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = DB.model<INotification>(
  "Notification",
  notificationSchema
);
