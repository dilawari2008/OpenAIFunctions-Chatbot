import { Request, Response, NextFunction } from "express";
import AppointmentService from "@/services/appointment";
import { EPaymentMode } from "@/enums";
import LOGGER from "@/common/logger";

const bookTimeSlot = async (req: Request, res: Response) => {
  const appointmentData = req.body;
  const appointment = await AppointmentService.bookTimeSlot(appointmentData);
  res.sendFormatted(appointment);
};

const makePayment = async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  const { selectedPaymentMode } = req.body;
  const appointment = await AppointmentService.makePayment(
    appointmentId,
    selectedPaymentMode as EPaymentMode
  );
  res.sendFormatted(appointment);
};

const AppointmentController = {
  bookTimeSlot,
  makePayment,
};

export default AppointmentController;
