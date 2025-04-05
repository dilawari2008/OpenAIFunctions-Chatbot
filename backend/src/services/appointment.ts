import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { Appointment } from "@/db/models/appointment";
import { Slot } from "@/db/models/slot";
import { EAppointmentStatus, EPaymentMode } from "@/enums";
import { IAppointment } from "@/interfaces/model";
import SlotService from "@/services/slot";
import createError from "http-errors";
import { Types } from "mongoose";

const bookTimeSlot = async (appointmentData: {
  appointmentId?: string;
  patientId: string;
  date: Date;
  slot: string;
  appointmentType: string;
  amount: number;
  notes?: string;
}) => {
  LOGGER.debug(`appointmentData: ${JSON.stringify(appointmentData)}`);

  // Check if slot is available using findOneAndUpdate
  const existingAppointment = await Appointment.findOne({
    date: appointmentData.date,
    slot: appointmentData.slot,
    status: { $ne: EAppointmentStatus.CANCELLED },
  });

  if (existingAppointment) {
    throw createError(
      HttpStatusCodes.CONFLICT,
      `Appointment slot already booked`
    );
  }

  // Create new appointment using findOneAndUpdate with upsert
  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: new Types.ObjectId(appointmentData?.appointmentId || ""),
    },
    {
      $set: {
        patientId: new Types.ObjectId(appointmentData.patientId),
        date: appointmentData.date,
        slot: appointmentData.slot,
        appointmentType: appointmentData.appointmentType,
        status: EAppointmentStatus.PENDING,
        selectedPaymentMode: EPaymentMode.CASH,
        amount: appointmentData.amount,
        notes: appointmentData.notes || "",
      },

      //     patientId: Types.ObjectId;
      // appointmentType: EAppointmentType;
      // status: EAppointmentStatus;
      // selectedPaymentMode: EPaymentMode;
      // notes: string;
      // amount: number;
    },
    { upsert: true, new: true }
  );

  return appointment;
};

const makePayment = async (
  appointmentId: string,
  selectedPaymentMode: EPaymentMode
) => {
  LOGGER.debug(
    `Processing payment for appointment: ${appointmentId}, payment mode: ${selectedPaymentMode}`
  );

  const appointment = await Appointment.findOneAndUpdate(
    { _id: new Types.ObjectId(appointmentId) },
    {
      $set: {
        selectedPaymentMode,
        status: EAppointmentStatus.SCHEDULED,
      },
    },
    { new: true }
  );

  if (!appointment) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Appointment not found with id: ${appointmentId}`
    );
  }

  const slot = await SlotService.bookSlot(
    appointment.slot,
    appointment.date,
    appointment._id.toString()
  );

  return appointment;
};

const AppointmentService = {
  bookTimeSlot,
  makePayment,
};

export default AppointmentService;
