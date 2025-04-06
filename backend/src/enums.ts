export enum EInsuranceName {
  AETNA = "AETNA",
  CIGNA = "CIGNA",
  UNUM = "UNUM",
  BLUECROSS_BLUESHIELD = "BLUECROSS_BLUESHIELD",
  UNITEDHEALTH = "UNITEDHEALTH",
  HUMANA = "HUMANA",
  KAISER_PERMANENTE = "KAISER_PERMANENTE",
  ANTHEM = "ANTHEM",
  CENTENE = "CENTENE",
  MOLINA = "MOLINA",
  WELLCARE = "WELLCARE",
  METLIFE = "METLIFE",
  PRUDENTIAL = "PRUDENTIAL",
  LIBERTY_MUTUAL = "LIBERTY_MUTUAL",
  AFLAC = "AFLAC",
  ALLSTATE = "ALLSTATE",
  STATE_FARM = "STATE_FARM",
  PROGRESSIVE = "PROGRESSIVE",
  GEICO = "GEICO",
  NATIONWIDE = "NATIONWIDE",
}

export enum EPaymentMode {
  CASH = "CASH",
  CREDIT = "CREDIT",
  PAYPAL = "PAYPAL",
}

export enum EAppointmentStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RESCHEDULED = "RESCHEDULED",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
}

export enum EAppointmentType {
  CLEANING = "CLEANING",
  CHECKUP = "CHECKUP",
  EMERGENCY = "EMERGENCY",
  ROOT_CANAL = "ROOT_CANAL",
}

export const AppointmentTypeToPricingMap = {
  [EAppointmentType.CLEANING]: 100,
  [EAppointmentType.CHECKUP]: 200,
  [EAppointmentType.EMERGENCY]: 300,
  [EAppointmentType.ROOT_CANAL]: 400,
};

export enum EAppointmentSlot {
  SLOT_1 = "SLOT_1",
  SLOT_2 = "SLOT_2",
  SLOT_3 = "SLOT_3",
  SLOT_4 = "SLOT_4",
  SLOT_5 = "SLOT_5",
  SLOT_6 = "SLOT_6",
  SLOT_7 = "SLOT_7",
  SLOT_8 = "SLOT_8",
  SLOT_9 = "SLOT_9",
  SLOT_10 = "SLOT_10",
}

export const AppointmentToStartTimeMap = {
  [EAppointmentSlot.SLOT_1]: 8,
  [EAppointmentSlot.SLOT_2]: 9,
  [EAppointmentSlot.SLOT_3]: 10,
  [EAppointmentSlot.SLOT_4]: 11,
  [EAppointmentSlot.SLOT_5]: 12,
  [EAppointmentSlot.SLOT_6]: 13,
  [EAppointmentSlot.SLOT_7]: 14,
  [EAppointmentSlot.SLOT_8]: 15,
  [EAppointmentSlot.SLOT_9]: 16,
  [EAppointmentSlot.SLOT_10]: 17,
};

export enum EUrgency {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum EUserType {
  PATIENT = "PATIENT",
  ADMIN = "ADMIN",
}

export enum ENotificationDestination {
  EMAIL = "EMAIL",
  SMS = "SMS",
  ADMIN_PANEL = "ADMIN_PANEL",
}
