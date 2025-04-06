import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { Slot } from "@/db/models/slot";
import {
  AppointmentToStartTimeMap,
  EAppointmentSlot,
  EAppointmentType,
} from "@/enums";
import {
  createDateWithSlotTime,
  getEndOfDayInUTC,
  getStartOfDayInUTC,
} from "@/utils";
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

// Helper function to create a date with the slot's time

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
    { appointmentType: 1, date: 1, type: 1 }
  )
    .sort({ date: 1 })
    .limit(limit);

  // Transform the slots to include the correct time
  const transformedSlots = availableSlots.map((slot) => {
    const { _doc, ...rest } = slot;
    const { type, ...slotData } = _doc;

    return {
      ...slotData,
      date: createDateWithSlotTime(slot.date, type as EAppointmentSlot),
    };
  });

  return transformedSlots;
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
    { date: 1, type: 1 }
  )
    .sort({ date: 1 })
    .limit(limit);

  // Transform the slots to include the correct time
  const transformedSlots = availableSlots.map((slot) => {
    const { _doc, ...rest } = slot;
    const { type, ...slotData } = _doc;

    return {
      ...slotData,
      date: createDateWithSlotTime(slot.date, type as EAppointmentSlot),
    };
  });

  return transformedSlots;
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

const bookSlotUsingSlotIdAndAppointmentId = async (
  slotId: Types.ObjectId,
  appointmentId: Types.ObjectId
) => {
  LOGGER.debug(`Booking slot: ${slotId} for appointment: ${appointmentId}`);

  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, available: true, deleted: false },
    {
      $set: {
        available: false,
        appointmentId: appointmentId,
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

const getSlots = async ({
  slotIds,
  type,
  date,
  available,
  appointmentType,
  appointmentId,
  limit = 10,
}: {
  slotIds?: Types.ObjectId[];
  type?: EAppointmentSlot;
  date?: Date;
  available?: boolean;
  appointmentType?: EAppointmentType;
  appointmentId?: Types.ObjectId;
  limit?: number;
}) => {
  LOGGER.debug("Getting slots with filters", {
    slotIds: JSON.stringify(slotIds),
    type,
    date,
    available,
    appointmentType,
    appointmentId,
    limit,
  });

  const query: any = { deleted: false };

  if (slotIds && slotIds.length > 0) {
    query._id = { $in: slotIds };
  }

  if (type) {
    query.type = type;
  }

  if (date) {
    query.date = getStartOfDayInUTC(date);
  }

  if (available !== undefined) {
    query.available = available;
  }

  if (appointmentType) {
    query.appointmentType = appointmentType;
  }

  if (appointmentId) {
    query.appointmentId = appointmentId;
  }

  const slots = await Slot.find(query).sort({ date: 1 }).limit(limit);

  return slots;
};

const areAllSlotsAvailable = async (
  slotIds: (Types.ObjectId | string)[]
): Promise<
  | { type: EAppointmentSlot; appointmentType: EAppointmentType; date: Date }[]
  | null
> => {
  LOGGER.debug("Checking if all slots are available", {
    slotIds: JSON.stringify(slotIds),
  });

  if (!slotIds || slotIds.length === 0) {
    return null;
  }

  const objectIdSlots = slotIds.map((id) =>
    typeof id === "string" ? new Types.ObjectId(id) : id
  );

  // First check if all slots are available
  const count = await Slot.countDocuments({
    _id: { $in: objectIdSlots },
    available: true,
    deleted: false,
  });

  // If not all slots are available, return null
  if (count !== slotIds.length) {
    return null;
  }

  // If all slots are available, return the slots with projection
  const slots = await Slot.find(
    { _id: { $in: objectIdSlots }, available: true, deleted: false },
    { type: 1, appointmentType: 1, date: 1 }
  );

  return slots;
};

const releaseSlot = async (appointmentId: Types.ObjectId | string) => {
  LOGGER.debug(`Releasing slot for appointment: ${appointmentId}`);

  const objectIdAppointmentId =
    typeof appointmentId === "string"
      ? new Types.ObjectId(appointmentId)
      : appointmentId;

  const slot = await Slot.findOneAndUpdate(
    { appointmentId: objectIdAppointmentId, deleted: false },
    {
      $set: {
        available: true,
        appointmentId: undefined,
      },
    },
    { new: true }
  );

  if (!slot) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `No slot found for appointment: ${appointmentId}`
    );
  }

  return slot;
};

const SlotService = {
  getAvailableTimeSlotsForDateRange,
  bookSlot,
  createSlotsForTheMonth,
  getCurrentDateInUTC,
  getAvailableTimeSlots,
  getAvailableTimeSlotsByType,
  getSlots,
  areAllSlotsAvailable,
  bookSlotUsingSlotIdAndAppointmentId,
  releaseSlot,
};

export default SlotService;
