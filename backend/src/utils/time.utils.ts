import { EAppointmentSlot } from "@/enums";
import { AppointmentToStartTimeMap } from "@/enums";
import moment from "moment-timezone";

export const getStartOfDayInUTC = (date: Date) => {
  return moment(date).utc().startOf('day').toDate();
};

export const getEndOfDayInUTC = (date: Date) => {
  return moment(date).utc().endOf('day').toDate();
};

export const createDateWithSlotTime = (date: Date, slot: EAppointmentSlot): Date => {
  const newDate = new Date(date);
  const hour = AppointmentToStartTimeMap[slot];
  newDate.setUTCHours(hour, 0, 0, 0);
  return newDate;
};



