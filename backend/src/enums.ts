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

export enum ESlotTier {
  ONE_HOUR = "ONE_HOUR",
  TWO_HOUR = "THREE_HOUR",
}

export enum EAppointmentSlot {
  MORNING = "MORNING",
  AFTERNOON = "AFTERNOON",
  EVENING = "EVENING",
}

export const TierSlotMap = {
  [ESlotTier.TWO_HOUR]: [EAppointmentSlot.MORNING, EAppointmentSlot.AFTERNOON],
  [ESlotTier.ONE_HOUR]: [EAppointmentSlot.EVENING],
};

export const AppointmentTypeTierMap = {
  [EAppointmentType.ROOT_CANAL]: [ESlotTier.TWO_HOUR],
  [EAppointmentType.EMERGENCY]: [ESlotTier.TWO_HOUR],
  [EAppointmentType.CLEANING]: [ESlotTier.TWO_HOUR],
  [EAppointmentType.CHECKUP]: [ESlotTier.ONE_HOUR],
};

export const appointmentSlotToStartTimeMap = {
  [EAppointmentSlot.MORNING]: 9,
  [EAppointmentSlot.AFTERNOON]: 13,
  [EAppointmentSlot.EVENING]: 17,
};

export const TierToCostMap = {
  [ESlotTier.ONE_HOUR]: 100,
  [ESlotTier.TWO_HOUR]: 200,
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
