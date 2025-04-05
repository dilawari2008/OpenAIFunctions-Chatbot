import DB from "@/db/db";
import { EInsuranceName } from "@/enums";
import { IPatient } from "@/interfaces/model";
import { Schema, Types } from "mongoose";

const patientSchema: Schema = new Schema<IPatient>(
  {
    fullName: { type: String },
    phoneNumber: { type: Number },
    dateOfBirth: { type: Date },
    insuranceName: {
      type: String,
      enum: Object.values(EInsuranceName),
    },
    sessionId: { type: String },
    verificationCode: { type: String },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Patient = DB.model<IPatient>("Patient", patientSchema);
