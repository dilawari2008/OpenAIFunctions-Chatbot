import { Types } from "mongoose";
import { Document } from "mongodb";
import {
  EAppointmentSlot,
  EAppointmentStatus,
  EAppointmentType,
  EBillStatus,
  EInsuranceName,
  ENotificationDestination,
  EPaymentMode,
  EUrgency,
  EUserType,
} from "@/enums";

export interface IMongooseDocument extends Document {
  deleted?: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface IPatient extends IMongooseDocument {
  fullName?: string;
  contact:
    | { phoneNumber: number; contactRef?: never }
    | { phoneNumber?: never; contactRef: Types.ObjectId };
  dateOfBirth?: Date;
  insuranceName: EInsuranceName;
  verificationCode?: string;
}

export interface IBilling extends IMongooseDocument {
  name: string;
  contact: string;
  appointments: Types.ObjectId[];
  amount: number;
  paymentMode: EPaymentMode;
  status: EBillStatus;
  notes?: string;
  isRefund?: boolean;
}

export interface IAppointment extends IMongooseDocument {
  patientId: Types.ObjectId;
  status: EAppointmentStatus;
  timing: Date;
  notes?: string;
  slot: EAppointmentSlot;
  appointmentType: EAppointmentType;
}

export interface ISlot extends IMongooseDocument {
  type: EAppointmentSlot;
  date: Date;
  appointmentType: EAppointmentType;
  available: boolean;
  appointmentId?: Types.ObjectId;
}

export interface IChatSession extends IMongooseDocument {
  patientId?: Types.ObjectId;
  sessionId: string;
  messages: object[];
}

export interface INotification extends IMongooseDocument {
  userType: EUserType;
  message: string;
  urgency: EUrgency;
  userId?: Types.ObjectId;
  destination: {
    type: ENotificationDestination;
    address?: string;
  };
}
