import { EInsuranceName } from "@/enums";

export interface CreatePatientDTO {
  fullName?: string;
  phoneNumber: number;
  dateOfBirth?: Date;
  insuranceName?: EInsuranceName;
}

export interface UpdatePatientDTO {
  fullName?: string;
  phoneNumber?: number;
  dateOfBirth?: Date;
  insuranceName?: EInsuranceName;
}
