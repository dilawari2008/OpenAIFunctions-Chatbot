import DB from "@/db/db";
import { EInsuranceName } from "@/enums";
import { IPatient } from "@/interfaces/model";
import { Schema, Types } from "mongoose";

const contactSchema = new Schema(
  {
    phoneNumber: { type: Number },
    contactRef: { type: Schema.Types.ObjectId, ref: "Patient" },
  },
  { _id: false }
);

const patientSchema: Schema = new Schema<IPatient>(
  {
    fullName: { type: String },
    contact: {
      type: contactSchema,
      required: true,
    },
    dateOfBirth: { type: Date },
    insuranceName: {
      type: String,
      enum: Object.values(EInsuranceName),
      default: EInsuranceName.NONE,
    },
    verificationCode: { type: String },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Patient = DB.model<IPatient>("Patient", patientSchema);
