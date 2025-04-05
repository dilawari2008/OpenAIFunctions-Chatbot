import DB from "@/db/db";
import { EAppointmentSlot, ESlotTier } from "@/enums";
import { ISlot } from "@/interfaces/model";
import { Schema } from "mongoose";

const slotSchema: Schema = new Schema<ISlot>(
  {
    type: {
      type: String,
      enum: Object.values(EAppointmentSlot),
    },
    date: { type: Date },
    tier: {
      type: String,
      enum: Object.values(ESlotTier),
    },
    available: { type: Boolean, default: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
  },
  {
    timestamps: true,
  }
);

export const Slot = DB.model<ISlot>("Slot", slotSchema);
