import { EInsuranceName } from "@/enums";

export interface UpdatePatientDTO {
  fullName?: string;
  dateOfBirth?: Date;
  insuranceName?: EInsuranceName;
}
