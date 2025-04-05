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
    date: { type: Date },
    slot: {
      type: String,
      enum: Object.values(EAppointmentSlot),
    },
    appointmentType: {
      type: String,
      enum: Object.values(EAppointmentType),
    },
    status: {
      type: String,
      enum: Object.values(EAppointmentStatus),
    },
    selectedPaymentMode: {
      type: String,
      enum: Object.values(EPaymentMode),
    },
    notes: { type: String, default: "" },
    amount: { type: Number },
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
