import { EBillStatus, EInsuranceName, EPaymentMode } from "@/enums";
import { Types } from "mongoose";

export interface UpdatePatientDTO {
  fullName?: string;
  dateOfBirth?: Date;
  insuranceName?: EInsuranceName;
  insuranceId?: string;
}

export interface CreateBillingDTO {
  patientId: Types.ObjectId | string;
  name: string;
  contact: string;
  appointments: Types.ObjectId[] | string[];
  amount: number;
  paymentMode: EPaymentMode;
  isRefund?: boolean;
  notes?: string;
}

export interface AdjustArrearsDTO {
  patientId: Types.ObjectId | string;
  name: string;
  contact: string;
  appointment: Types.ObjectId | string;
  amount: number;
  paymentMode: EPaymentMode;
  isRefund: boolean;
  notes?: string;
}
