import { EInsuranceName } from "@/enums";

export interface CreatePatientDTO {
  fullName?: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  insuranceName?: EInsuranceName;
}

export interface UpdatePatientDTO {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  insuranceName?: EInsuranceName;
}
