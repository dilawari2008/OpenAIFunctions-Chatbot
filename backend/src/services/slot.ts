import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { Slot } from "@/db/models/slot";
import { EAppointmentSlot, EAppointmentType } from "@/enums";
import { getEndOfDayInUTC, getStartOfDayInUTC } from "@/utils";
import createError from "http-errors";
import moment from "moment-timezone";
import { Types } from "mongoose";

const getAvailableTimeSlotsForDateRange = async (
  from: Date,
  to: Date,
  limit: number = 10
) => {
  LOGGER.debug(`Fetching available slots for date: ${from} to ${to}`);

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = getStartOfDayInUTC(from);

  const endOfDay = getEndOfDayInUTC(to);

  // Find all available slots for the given date
  const availableSlots = await Slot.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    available: true,
  })
    .sort({ date: 1 })
    .limit(limit);

  return availableSlots;
};

const getAvailableTimeSlots = async (
  from: Date,
  to: Date,
  limit: number = 10
) => {
  LOGGER.debug(`Fetching available slots for date: ${from} to ${to}`);

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = getStartOfDayInUTC(from);

  const endOfDay = getEndOfDayInUTC(to);

  // Find all available slots for the given date
  const availableSlots = await Slot.find(
    {
      date: { $gte: startOfDay, $lte: endOfDay },
      available: true,
    },
    { appointmentType: 1, date: 1 }
  )
    .sort({ date: 1 })
    .limit(limit);

  return availableSlots;
};

const getAvailableTimeSlotsByType = async (
  from: Date,
  to: Date,
  type: EAppointmentType,
  limit: number = 10
) => {
  LOGGER.debug(`Fetching available slots for date: ${from} to ${to}`);

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = getStartOfDayInUTC(from);

  const endOfDay = getEndOfDayInUTC(to);

  // Find all available slots for the given date
  const availableSlots = await Slot.find(
    {
      date: { $gte: startOfDay, $lte: endOfDay },
      available: true,
      appointmentType: type,
    },
    { date: 1 }
  )
    .sort({ date: 1 })
    .limit(limit);

  return availableSlots;
};

const bookSlot = async (type: string, date: Date, appointmentId: string) => {
  LOGGER.debug(`Booking slot: ${type} for appointment: ${appointmentId}`);

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const slot = await Slot.findOneAndUpdate(
    { slot: type, date: startOfDay, available: true },
    {
      $set: {
        available: false,
        appointmentId: new Types.ObjectId(appointmentId),
      },
    },
    { new: true }
  );

  if (!slot) {
    throw createError(
      HttpStatusCodes.CONFLICT,
      `Slot not available or already booked`
    );
  }

  return slot;
};

const createSlotsForTheMonth = async () => {
  LOGGER.debug(`Creating slots for the month`);

  // Get current date and end of month
  const currentDate = new Date();
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // Array to store bulk operations
  const bulkOps = [];

  // Loop through each day from current date to end of month
  for (
    let day = new Date(currentDate);
    day <= endOfMonth;
    day.setDate(day.getDate() + 1)
  ) {
    // Skip Sundays (0 is Sunday in JavaScript's getDay())
    // if (day.getDay() === 0) {
    //   continue;
    // }

    // Create a new date object for start of the day in UTC
    const dateForSlot = getStartOfDayInUTC(day);

    // Create 10 slots for each day
    for (let slotNum = 1; slotNum <= 10; slotNum++) {
      const slotType = `SLOT_${slotNum}` as EAppointmentSlot;

      // Determine appointment type based on slot number
      let appointmentType;
      if (slotNum <= 3) {
        appointmentType = EAppointmentType.CLEANING;
      } else if (slotNum <= 7) {
        appointmentType = EAppointmentType.ROOT_CANAL;
      } else {
        appointmentType = EAppointmentType.CHECKUP;
      }

      // Create upsert operation
      bulkOps.push({
        updateOne: {
          filter: {
            type: slotType,
            date: dateForSlot,
            appointmentType: appointmentType,
          },
          update: {
            $setOnInsert: {
              type: slotType,
              date: dateForSlot,
              appointmentType: appointmentType,
              available: true,
            },
          },
          upsert: true,
        },
      });
    }
  }

  // Execute bulk operations if there are any
  if (bulkOps.length > 0) {
    const result = await Slot.bulkWrite(bulkOps);
    LOGGER.debug(`Created ${result.upsertedCount} new slots for the month`);
    return result;
  }

  return { upsertedCount: 0 };
};

const getCurrentDateInUTC = () => {
  return getStartOfDayInUTC(new Date());
};

const SlotService = {
  getAvailableTimeSlotsForDateRange,
  bookSlot,
  createSlotsForTheMonth,
  getCurrentDateInUTC,
  getAvailableTimeSlots,
  getAvailableTimeSlotsByType,
};

export default SlotService;
