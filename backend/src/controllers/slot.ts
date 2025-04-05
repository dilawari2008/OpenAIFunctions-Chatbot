import { Request, Response, NextFunction } from "express";
import SlotService from "@/services/slot";
import LOGGER from "@/common/logger";

const getAvailableTimeSlotsForDateRange = async (
  req: Request,
  res: Response
) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: "From and to dates are required",
    });
  }

  const fromDate = new Date(from as string);
  const toDate = new Date(to as string);

  const availableSlots = await SlotService.getAvailableTimeSlotsForDateRange(
    fromDate,
    toDate
  );

  res.sendFormatted(availableSlots);
};

const bookSlot = async (req: Request, res: Response) => {
  const { type, date, appointmentId } = req.body;

  if (!type || !date || !appointmentId) {
    return res.status(400).json({
      success: false,
      message: "Slot type, date, and appointment ID are required",
    });
  }

  const bookedSlot = await SlotService.bookSlot(
    type,
    new Date(date),
    appointmentId
  );

  res.sendFormatted(bookedSlot);
};

const SlotController = {
  getAvailableTimeSlotsForDateRange,
  bookSlot,
};

export default SlotController;
