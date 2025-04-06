import AppointmentService from "@/services/appointment";
import { Request, Response } from "express";
import { Types } from "mongoose";
import createHttpError from "http-errors";
import { HttpStatusCodes } from "@/common/constants";
import { EPaymentMode } from "@/enums";
import LOGGER from "@/common/logger";

const getAppointments = async (req: Request, res: Response) => {
  try {
    const { patientId, status, timing, slot, appointmentType, limit } = req.body;

    const appointments = await AppointmentService.getAppointments({
      patientId,
      status,
      timing: timing ? new Date(timing) : undefined,
      slot,
      appointmentType,
      limit: limit || 10,
    });

    res.sendFormatted(appointments);
  } catch (error) {
    LOGGER.error("Error getting appointments", { error: (error as Error).message });
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).sendFormatted({ 
      error: "Failed to get appointments" 
    });
  }
};

const getUpcomingAppointmentsForPatient = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId, limit } = req.body;

    const appointments =
      await AppointmentService.getUpcomingAppointmentsForPatient({
        patientId,
        limit: limit || 10,
      });

    res.sendFormatted(appointments);
  } catch (error) {
    LOGGER.error("Error getting upcoming appointments for patient", { error: (error as Error).message });
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).sendFormatted({ 
      error: "Failed to get upcoming appointments" 
    });
  }
};

const scheduleAppointment = async (req: Request, res: Response) => {
  try {
    const { slotIds, patientId, paymentMode } = req.body;

    if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
      throw createHttpError(HttpStatusCodes.BAD_REQUEST, "Slot IDs are required");
    }

    if (!patientId) {
      throw createHttpError(
        HttpStatusCodes.BAD_REQUEST,
        "Patient ID is required"
      );
    }

    if (!paymentMode) {
      throw createHttpError(
        HttpStatusCodes.BAD_REQUEST,
        "Payment mode is required"
      );
    }

    const appointments = await AppointmentService.scheduleAppointment({
      slotIds,
      patientId,
      paymentMode: paymentMode as EPaymentMode,
    });

    res.sendFormatted(appointments);
  } catch (error) {
    LOGGER.error("Error scheduling appointment", { error: (error as Error).message });
    const statusCode = error instanceof createHttpError.HttpError 
      ? error.statusCode 
      : HttpStatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).sendFormatted({ 
      error: (error as Error).message || "Failed to schedule appointment" 
    });
  }
};

const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId, patientId } = req.body;

    if (!appointmentId) {
      throw createHttpError(
        HttpStatusCodes.BAD_REQUEST,
        "Appointment ID is required"
      );
    }

    if (!patientId) {
      throw createHttpError(
        HttpStatusCodes.BAD_REQUEST,
        "Patient ID is required"
      );
    }

    const result = await AppointmentService.cancelAppointment({
      appointmentId,
      patientId
    });
    
    res.sendFormatted(result);
  } catch (error) {
    LOGGER.error("Error cancelling appointment", { error: (error as Error).message });
    const statusCode = error instanceof createHttpError.HttpError 
      ? error.statusCode 
      : HttpStatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).sendFormatted({ 
      error: (error as Error).message || "Failed to cancel appointment" 
    });
  }
};

const rescheduleAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId, patientId, newSlotId } = req.body;

    if (!appointmentId) {
      throw createHttpError(
        HttpStatusCodes.BAD_REQUEST,
        "Appointment ID is required"
      );
    }

    if (!patientId) {
      throw createHttpError(
        HttpStatusCodes.BAD_REQUEST,
        "Patient ID is required"
      );
    }

    if (!newSlotId) {
      throw createHttpError(
        HttpStatusCodes.BAD_REQUEST,
        "New slot ID is required"
      );
    }

    const result = await AppointmentService.rescheduleAppointment({
      appointmentId,
      patientId,
      newSlotId,
    });

    res.sendFormatted(result);
  } catch (error) {
    LOGGER.error("Error rescheduling appointment", { error: (error as Error).message });
    const statusCode = error instanceof createHttpError.HttpError 
      ? error.statusCode 
      : HttpStatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).sendFormatted({ 
      error: (error as Error).message || "Failed to reschedule appointment" 
    });
  }
};

const bulkScheduleAppointments = async (req: Request, res: Response) => {
  try {
    const { appointmentRequests } = req.body;

    if (!appointmentRequests || !Array.isArray(appointmentRequests) || appointmentRequests.length === 0) {
      throw createHttpError(
        HttpStatusCodes.BAD_REQUEST,
        "Appointment requests are required"
      );
    }

    const results = await AppointmentService.bulkScheduleAppointments(appointmentRequests);

    res.sendFormatted(results);
  } catch (error) {
    LOGGER.error("Error bulk scheduling appointments", { error: (error as Error).message });
    const statusCode = error instanceof createHttpError.HttpError 
      ? error.statusCode 
      : HttpStatusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).sendFormatted({ 
      error: (error as Error).message || "Failed to bulk schedule appointments" 
    });
  }
};

const AppointmentController = {
  getAppointments,
  getUpcomingAppointmentsForPatient,
  scheduleAppointment,
  cancelAppointment,
  rescheduleAppointment,
  bulkScheduleAppointments,
};

export default AppointmentController;
