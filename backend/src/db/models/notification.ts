import DB from "@/db/db";
import { EUserType, EUrgency, ENotificationDestination } from "@/enums";
import { INotification } from "@/interfaces/model";
import { Schema, Types } from "mongoose";

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
    userId: { type: Types.ObjectId, ref: "Patient" },
    destination: {
      type: {
        type: String,
        enum: Object.values(ENotificationDestination),
      },
      address: { type: String },
    },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Notification = DB.model<INotification>(
  "Notification",
  notificationSchema
);
