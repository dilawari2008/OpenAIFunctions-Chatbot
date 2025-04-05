import DB from "@/db/db";
import { EAppointmentSlot, EAppointmentType } from "@/enums";
import { ISlot } from "@/interfaces/model";
import { Schema } from "mongoose";

const slotSchema: Schema = new Schema<ISlot>(
  {
    type: {
      type: String,
      enum: Object.values(EAppointmentSlot),
    },
    date: { type: Date },
    available: { type: Boolean, default: true },
    appointmentType: {
      type: String,
      enum: Object.values(EAppointmentType),
    },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Slot = DB.model<ISlot>("Slot", slotSchema);
