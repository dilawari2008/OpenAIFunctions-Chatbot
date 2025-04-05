import { HttpStatusCodes } from "@/common/constants";
import { EPaymentMode, EInsuranceName } from "@/enums";
import createError from "http-errors";

const getPaymentMethods = async () => {
  // Return all available payment methods from the enum
  return Object.values(EPaymentMode).map((method) => ({
    id: method,
    name: method,
  }));
};

const getInsuranceProviders = async () => {
  // Return all available insurance providers from the enum
  return Object.values(EInsuranceName).map((provider) => ({
    id: provider,
    name: provider,
  }));
};

const InfoService = {
  getPaymentMethods,
  getInsuranceProviders,
};

export default InfoService;
