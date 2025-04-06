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
  LOGGER.debug(`Input parameters`, {
    from: JSON.stringify(from),
    to: JSON.stringify(to),
    limit,
  });

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = getStartOfDayInUTC(from);
  LOGGER.debug(`Start of day calculated`, {
    startOfDay: JSON.stringify(startOfDay),
  });

  const endOfDay = getEndOfDayInUTC(to);
  LOGGER.debug(`End of day calculated`, { endOfDay: JSON.stringify(endOfDay) });

  // Find all available slots for the given date
  LOGGER.debug(`Finding available slots with query`, {
    date: { $gte: JSON.stringify(startOfDay), $lte: JSON.stringify(endOfDay) },
    available: true,
    limit,
  });
  const availableSlots = await Slot.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    available: true,
  })
    .sort({ date: 1 })
    .limit(limit);
  LOGGER.debug(`Available slots found`, {
    count: availableSlots.length,
    slots: JSON.stringify(availableSlots),
  });

  return availableSlots;
};

// Helper function to create a date with the slot's time

const getAvailableTimeSlots = async (
  from: Date,
  to: Date,
  limit: number = 10
) => {
  LOGGER.debug(`Fetching available slots for date: ${from} to ${to}`);
  LOGGER.debug(`Input parameters`, {
    from: JSON.stringify(from),
    to: JSON.stringify(to),
    limit,
  });

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = getStartOfDayInUTC(from);
  LOGGER.debug(`Start of day calculated`, {
    startOfDay: JSON.stringify(startOfDay),
  });

  const endOfDay = getEndOfDayInUTC(to);
  LOGGER.debug(`End of day calculated`, { endOfDay: JSON.stringify(endOfDay) });

  // Find all available slots for the given date
  LOGGER.debug(`Finding available slots with query`, {
    date: { $gte: JSON.stringify(startOfDay), $lte: JSON.stringify(endOfDay) },
    available: true,
    projection: { appointmentType: 1, date: 1, type: 1 },
    limit,
  });
  const availableSlots = await Slot.find(
    {
      date: { $gte: startOfDay, $lte: endOfDay },
      available: true,
    },
    { appointmentType: 1, date: 1, type: 1 }
  )
    .sort({ date: 1 })
    .limit(limit);
  LOGGER.debug(`Available slots found`, {
    count: availableSlots.length,
    slots: JSON.stringify(availableSlots),
  });

  // Transform the slots to include the correct time
  LOGGER.debug(`Transforming slots to include correct time`);
  const transformedSlots = availableSlots.map((slot) => {
    LOGGER.debug(`Processing slot`, { slot: JSON.stringify(slot) });
    const { _doc, ...rest } = slot;
    LOGGER.debug(`Extracted _doc from slot`, {
      _doc: JSON.stringify(_doc),
      rest: JSON.stringify(rest),
    });

    const { type, ...slotData } = _doc;
    LOGGER.debug(`Extracted type from _doc`, {
      type,
      slotData: JSON.stringify(slotData),
    });

    const transformedSlot = {
      ...slotData,
      date: createDateWithSlotTime(slot.date, type as EAppointmentSlot),
    };
    LOGGER.debug(`Transformed slot`, {
      transformedSlot: JSON.stringify(transformedSlot),
    });

    return transformedSlot;
  });
  LOGGER.debug(`All slots transformed`, {
    count: transformedSlots.length,
    transformedSlots: JSON.stringify(transformedSlots),
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
  LOGGER.debug(`Input parameters`, {
    from: JSON.stringify(from),
    to: JSON.stringify(to),
    type,
    limit,
  });

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = getStartOfDayInUTC(from);
  LOGGER.debug(`Start of day calculated`, {
    startOfDay: JSON.stringify(startOfDay),
  });

  const endOfDay = getEndOfDayInUTC(to);
  LOGGER.debug(`End of day calculated`, { endOfDay: JSON.stringify(endOfDay) });

  // Find all available slots for the given date
  LOGGER.debug(`Finding available slots with query`, {
    date: { $gte: JSON.stringify(startOfDay), $lte: JSON.stringify(endOfDay) },
    available: true,
    appointmentType: type,
    projection: { date: 1, type: 1 },
    limit,
  });
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
  LOGGER.debug(`Available slots found`, {
    count: availableSlots.length,
    slots: JSON.stringify(availableSlots),
  });

  // Transform the slots to include the correct time
  LOGGER.debug(`Transforming slots to include correct time`);
  const transformedSlots = availableSlots.map((slot) => {
    LOGGER.debug(`Processing slot`, { slot: JSON.stringify(slot) });
    const { _doc, ...rest } = slot;
    LOGGER.debug(`Extracted _doc from slot`, {
      _doc: JSON.stringify(_doc),
      rest: JSON.stringify(rest),
    });

    const { type, ...slotData } = _doc;
    LOGGER.debug(`Extracted type from _doc`, {
      type,
      slotData: JSON.stringify(slotData),
    });

    const transformedSlot = {
      ...slotData,
      date: createDateWithSlotTime(slot.date, type as EAppointmentSlot),
    };
    LOGGER.debug(`Transformed slot`, {
      transformedSlot: JSON.stringify(transformedSlot),
    });

    return transformedSlot;
  });
  LOGGER.debug(`All slots transformed`, {
    count: transformedSlots.length,
    transformedSlots: JSON.stringify(transformedSlots),
  });

  return transformedSlots;
};

const bookSlot = async (type: string, date: Date, appointmentId: string) => {
  LOGGER.debug(`Booking slot: ${type} for appointment: ${appointmentId}`);
  LOGGER.debug(`Input parameters`, {
    type,
    date: JSON.stringify(date),
    appointmentId,
  });

  // Set the date to start of the day (00:00:00:000)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  LOGGER.debug(`Start of day calculated`, {
    startOfDay: JSON.stringify(startOfDay),
  });

  LOGGER.debug(`Finding and updating slot with query`, {
    slot: type,
    date: JSON.stringify(startOfDay),
    available: true,
    update: {
      available: false,
      appointmentId: new Types.ObjectId(appointmentId),
    },
  });
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
  LOGGER.debug(`Slot update result`, { slot: JSON.stringify(slot) });

  if (!slot) {
    LOGGER.error(`Slot not available or already booked`, {
      type,
      date: JSON.stringify(startOfDay),
      appointmentId,
    });
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
  LOGGER.debug(`Input parameters`, {
    slotId: JSON.stringify(slotId),
    appointmentId: JSON.stringify(appointmentId),
  });

  LOGGER.debug(`Finding and updating slot with query`, {
    _id: JSON.stringify(slotId),
    available: true,
    deleted: false,
    update: { available: false, appointmentId },
  });
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
  LOGGER.debug(`Slot update result`, { slot: JSON.stringify(slot) });

  if (!slot) {
    LOGGER.error(`Slot not available or already booked`, {
      slotId: JSON.stringify(slotId),
      appointmentId: JSON.stringify(appointmentId),
    });
    throw createError(
      HttpStatusCodes.CONFLICT,
      `Slot not available or already booked`
    );
  }

  return slot;
};

const createSlotsForTheMonth = async () => {
  await Slot.deleteMany({});
  LOGGER.debug(`Deleted all slots`);

  LOGGER.debug(`Creating slots for the month`);

  // Get current date and end of month
  const currentDate = new Date();
  LOGGER.debug(`Current date`, { currentDate: JSON.stringify(currentDate) });

  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  LOGGER.debug(`End of month calculated`, {
    endOfMonth: JSON.stringify(endOfMonth),
  });

  // Array to store bulk operations
  const bulkOps = [];
  LOGGER.debug(`Initialized bulk operations array`);

  // Loop through each day from current date to end of month
  LOGGER.debug(`Starting loop through days from current date to end of month`);
  for (
    let day = new Date(currentDate);
    day <= endOfMonth;
    day.setDate(day.getDate() + 1)
  ) {
    LOGGER.debug(`Processing day`, { day: JSON.stringify(day) });
    // Skip Sundays (0 is Sunday in JavaScript's getDay())
    if (day.getDay() === 0) {
      continue;
    }

    // Create a new date object for start of the day in UTC
    const dateForSlot = getStartOfDayInUTC(day);
    LOGGER.debug(`Date for slot calculated`, {
      dateForSlot: JSON.stringify(dateForSlot),
    });

    // Create 10 slots for each day
    LOGGER.debug(`Creating 10 slots for the day`);
    for (let slotNum = 1; slotNum <= 10; slotNum++) {
      LOGGER.debug(`Processing slot number ${slotNum}`);

      const slotType = `SLOT_${slotNum}` as EAppointmentSlot;
      LOGGER.debug(`Slot type determined`, { slotType });

      // Determine appointment type based on slot number
      let appointmentType;
      if (slotNum <= 3) {
        appointmentType = EAppointmentType.CLEANING;
      } else if (slotNum <= 7) {
        appointmentType = EAppointmentType.ROOT_CANAL;
      } else {
        appointmentType = EAppointmentType.CHECKUP;
      }
      LOGGER.debug(`Appointment type determined`, { appointmentType });

      // Create upsert operation
      const bulkOp = {
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
      };
      LOGGER.debug(`Created bulk operation`, {
        bulkOp: JSON.stringify(bulkOp),
      });

      bulkOps.push(bulkOp);
      LOGGER.debug(
        `Added bulk operation to array, current count: ${bulkOps.length}`
      );
    }
  }

  // Execute bulk operations if there are any
  LOGGER.debug(`Checking if there are bulk operations to execute`, {
    bulkOpsCount: bulkOps.length,
  });
  if (bulkOps.length > 0) {
    LOGGER.debug(`Executing ${bulkOps.length} bulk operations`);
    const result = await Slot.bulkWrite(bulkOps);
    LOGGER.debug(`Created ${result.upsertedCount} new slots for the month`, {
      result: JSON.stringify(result),
    });
    return result;
  }

  LOGGER.debug(`No bulk operations to execute`);
  return { upsertedCount: 0 };
};

const getCurrentDateInUTC = () => {
  LOGGER.debug(`Getting current date in UTC`);
  const result = getStartOfDayInUTC(new Date());
  LOGGER.debug(`Current date in UTC`, { result: JSON.stringify(result) });
  return result;
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
    date: date ? JSON.stringify(date) : undefined,
    available,
    appointmentType,
    appointmentId: appointmentId ? JSON.stringify(appointmentId) : undefined,
    limit,
  });

  const query: any = { deleted: false };
  LOGGER.debug(`Initialized query with deleted: false`);

  if (slotIds && slotIds.length > 0) {
    query._id = { $in: slotIds };
    LOGGER.debug(`Added slotIds to query`, { _id: JSON.stringify(query._id) });
  }

  if (type) {
    query.type = type;
    LOGGER.debug(`Added type to query`, { type });
  }

  if (date) {
    query.date = getStartOfDayInUTC(date);
    LOGGER.debug(`Added date to query`, { date: JSON.stringify(query.date) });
  }

  if (available !== undefined) {
    query.available = available;
    LOGGER.debug(`Added available to query`, { available });
  }

  if (appointmentType) {
    query.appointmentType = appointmentType;
    LOGGER.debug(`Added appointmentType to query`, { appointmentType });
  }

  if (appointmentId) {
    query.appointmentId = appointmentId;
    LOGGER.debug(`Added appointmentId to query`, {
      appointmentId: JSON.stringify(appointmentId),
    });
  }

  LOGGER.debug(`Final query for finding slots`, {
    query: JSON.stringify(query),
    limit,
  });
  const slots = await Slot.find(query).sort({ date: 1 }).limit(limit);
  LOGGER.debug(`Slots found`, {
    count: slots.length,
    slots: JSON.stringify(slots),
  });

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
    LOGGER.debug(`No slot IDs provided, returning null`);
    return null;
  }

  const objectIdSlots = slotIds.map((id) =>
    typeof id === "string" ? new Types.ObjectId(id) : id
  );
  LOGGER.debug(`Converted slot IDs to ObjectIds`, {
    objectIdSlots: JSON.stringify(objectIdSlots),
  });

  // First check if all slots are available
  LOGGER.debug(`Counting available slots`, {
    query: {
      _id: { $in: JSON.stringify(objectIdSlots) },
      available: true,
      deleted: false,
    },
  });
  const count = await Slot.countDocuments({
    _id: { $in: objectIdSlots },
    available: true,
    deleted: false,
  });
  LOGGER.debug(`Count of available slots`, {
    count,
    expectedCount: slotIds.length,
  });

  // If not all slots are available, return null
  if (count !== slotIds.length) {
    LOGGER.debug(`Not all slots are available, returning null`, {
      count,
      expectedCount: slotIds.length,
    });
    return null;
  }

  // If all slots are available, return the slots with projection
  LOGGER.debug(`All slots are available, fetching slot details`);
  const slots = await Slot.find(
    { _id: { $in: objectIdSlots }, available: true, deleted: false },
    { type: 1, appointmentType: 1, date: 1 }
  );
  LOGGER.debug(`Slot details fetched`, { slots: JSON.stringify(slots) });

  return slots;
};

const releaseSlot = async (appointmentId: Types.ObjectId | string) => {
  LOGGER.debug(`Releasing slot for appointment: ${appointmentId}`);
  LOGGER.debug(`Input parameters`, {
    appointmentId: JSON.stringify(appointmentId),
  });

  const objectIdAppointmentId =
    typeof appointmentId === "string"
      ? new Types.ObjectId(appointmentId)
      : appointmentId;
  LOGGER.debug(`Converted appointmentId to ObjectId`, {
    objectIdAppointmentId: JSON.stringify(objectIdAppointmentId),
  });

  LOGGER.debug(`Finding and updating slot with query`, {
    appointmentId: JSON.stringify(objectIdAppointmentId),
    deleted: false,
    update: { available: true, appointmentId: undefined },
  });
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
  LOGGER.debug(`Slot update result`, { slot: JSON.stringify(slot) });

  if (!slot) {
    LOGGER.error(`No slot found for appointment`, {
      appointmentId: JSON.stringify(objectIdAppointmentId),
    });
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
