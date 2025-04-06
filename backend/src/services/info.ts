import {
  EPaymentMode,
  EInsuranceName,
  EAppointmentType,
  AppointmentTypeToPricingMap,
} from "@/enums";

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

const getAppointmentTypePricing = async () => {
  // Return all available appointment types with their pricing
  return Object.values(EAppointmentType).map((type) => ({
    id: type,
    name: type,
    price: AppointmentTypeToPricingMap[type],
  }));
};

const InfoService = {
  getPaymentMethods,
  getInsuranceProviders,
  getAppointmentTypePricing,
};

export default InfoService;
