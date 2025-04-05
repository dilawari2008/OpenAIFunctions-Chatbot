import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { Slot } from "@/db/models/slot";
import createError from "http-errors";
import { Types } from "mongoose";

const getAvailableTimeSlotsForDateRange = async (from: Date, to: Date) => {
  LOGGER.debug(`Fetching available slots for date: ${from} to ${to}`);

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = new Date(from);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(to);
  endOfDay.setHours(23, 59, 59, 999);

  // Find all available slots for the given date
  const availableSlots = await Slot.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    available: true,
  }).sort({ slot: 1 });

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

const SlotService = {
  getAvailableTimeSlotsForDateRange,
  bookSlot,
};

export default SlotService;
