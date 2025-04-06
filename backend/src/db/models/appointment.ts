import DB from "@/db/db";
import {
  EAppointmentSlot,
  EAppointmentStatus,
  EAppointmentType,
  EPaymentMode,
} from "@/enums";
import { IAppointment } from "@/interfaces/model";
import { Schema } from "mongoose";

const appointmentSchema: Schema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
    status: {
      type: String,
      enum: Object.values(EAppointmentStatus),
    },
    timing: { type: Date },
    notes: { type: String, default: "" },
    slot: {
      type: String,
      enum: Object.values(EAppointmentSlot),
    },
    appointmentType: {
      type: String,
      enum: Object.values(EAppointmentType),
    },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Appointment = DB.model<IAppointment>(
  "Appointment",
  appointmentSchema
);
