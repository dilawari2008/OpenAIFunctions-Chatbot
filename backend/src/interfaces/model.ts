import { Types } from "mongoose";
import { Document } from "mongodb";
import {
  EAppointmentSlot,
  EAppointmentStatus,
  EAppointmentType,
  EInsuranceName,
  ENotificationDestination,
  EPaymentMode,
  EUrgency,
  EUserType,
} from "@/enums";

export interface IUserObj {
  userId: Types.ObjectId;
  code?: string;
}

export interface IMongooseDocument extends Document {
  deleted?: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface IPatient extends IMongooseDocument {
  fullName?: string;
  phoneNumber: number;
  dateOfBirth?: Date;
  insuranceName?: EInsuranceName;
  sessionId?: string;
  verificationCode?: string;
}

export interface IAppointment extends IMongooseDocument {
  patientId: Types.ObjectId;
  status: EAppointmentStatus;
  selectedPaymentMode: EPaymentMode;
  notes: string;
  amount: number;
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
