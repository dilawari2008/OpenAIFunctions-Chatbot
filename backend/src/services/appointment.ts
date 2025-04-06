import LOGGER from "@/common/logger";
import { Appointment } from "@/db/models/appointment";
import { Types } from "mongoose";
import {
  createDateWithSlotTime,
  getEndOfDayInUTC,
  getStartOfDayInUTC,
} from "@/utils";
import SlotService from "./slot";
import BillingService from "./billing";
import NotificationService from "./notification";
import PatientService from "./patient";
import {
  AppointmentTypeToPricingMap,
  EAppointmentSlot,
  EAppointmentStatus,
  EAppointmentType,
  EPaymentMode,
  ENotificationDestination,
  EUrgency,
  EUserType,
} from "@/enums";
import { IAppointment } from "@/interfaces/model";
import { CreateBillingDTO } from "@/interfaces/dto";
import { HttpStatusCodes } from "@/common/constants";
import createHttpError from "http-errors";

const getAppointments = async ({
  patientId,
  appointmentIds,
  status,
  timing,
  slot,
  appointmentType,
  limit = 10,
}: {
  patientId: Types.ObjectId | string;
  appointmentIds?: Types.ObjectId[] | string[];
  status?: string;
  timing?: Date;
  slot?: string;
  appointmentType?: string;
  limit?: number;
}) => {
  const query: any = { deleted: false };

  // patientId is mandatory
  query.patientId = new Types.ObjectId(patientId);

  if (appointmentIds && appointmentIds.length > 0) {
    query._id = { $in: appointmentIds.map((id) => new Types.ObjectId(id)) };
  }

  if (status) {
    query.status = status;
  }

  if (timing) {
    query.timing = {
      $gte: getStartOfDayInUTC(timing),
      $lte: getEndOfDayInUTC(timing),
    };
  }

  if (slot) {
    query.slot = slot;
  }

  if (appointmentType) {
    query.appointmentType = appointmentType;
  }

  const appointments = await Appointment.find(query)
    .sort({ timing: 1 })
    .limit(limit);

  return appointments;
};

const getUpcomingAppointmentsForPatient = async ({
  patientId,
  limit = 10,
}: {
  patientId: Types.ObjectId | string;
  limit?: number;
}) => {
  LOGGER.debug("Getting upcoming appointments for patient", {
    patientId: JSON.stringify(patientId),
    limit,
  });

  const query: any = {
    deleted: false,
    patientId: new Types.ObjectId(patientId),
    timing: { $gte: new Date() },
    status: EAppointmentStatus.SCHEDULED,
  };

  const appointments = await Appointment.find(query)
    .sort({ timing: 1 })
    .limit(limit);

  return appointments;
};

const scheduleAppointment = async ({
  slotIds,
  patientId,
  paymentMode,
}: {
  slotIds: (Types.ObjectId | string)[];
  patientId: Types.ObjectId | string;
  paymentMode: EPaymentMode;
}) => {
  LOGGER.debug("Scheduling appointment", {
    slotIds: JSON.stringify(slotIds),
    patientId: JSON.stringify(patientId),
  });

  // Check if patient has vital information
  await PatientService.hasVitalInfo(patientId.toString());

  if (paymentMode === EPaymentMode.INSURANCE)
    await PatientService.hasValidInsurance(patientId.toString());

  // Convert inputs to ObjectId
  const objectIdSlotIds = slotIds.map((id) => new Types.ObjectId(id));
  const objectIdPatientId = new Types.ObjectId(patientId);

  // Check if all slots are available
  const slotsAvailable:
    | {
        type: EAppointmentSlot;
        appointmentType: EAppointmentType;
        date: Date;
      }[]
    | null = await SlotService.areAllSlotsAvailable(objectIdSlotIds);
  if (!slotsAvailable) {
    throw new Error("One or more selected slots are not available");
  }

  // Fetch patient details
  const patient = await PatientService.getPatient(objectIdPatientId.toString());
  if (!patient) {
    throw new Error("Patient not found");
  }

  // Create a new appointment with pending status
  const newAppointments: IAppointment[] = slotsAvailable.map((slot) => ({
    patientId: objectIdPatientId,
    status: EAppointmentStatus.PENDING,
    timing: createDateWithSlotTime(slot.date, slot.type),
    slot: slot.type,
    appointmentType: slot.appointmentType,
  }));

  const operations = newAppointments.map((appointment) => ({
    updateOne: {
      filter: {
        patientId: appointment.patientId,
        timing: appointment.timing,
      },
      update: appointment,
      upsert: true,
    },
  }));

  await Appointment.bulkWrite(operations);
  const savedAppointments = await Appointment.find({
    patientId: objectIdPatientId,
    timing: new Date(),
  });

  const savedAppointmentIds = savedAppointments.map(
    (appointment) => appointment._id
  );

  // Calculate total amount based on appointment types
  const totalAmount = savedAppointments.reduce((sum, appointment) => {
    const price = AppointmentTypeToPricingMap[appointment.appointmentType] || 0;
    return sum + price;
  }, 0);

  const createBillingDTO: CreateBillingDTO = {
    patientId: objectIdPatientId,
    name: patient.fullName || "",
    contact: patient.phoneNumber,
    appointments: savedAppointmentIds,
    amount: totalAmount,
    paymentMode: paymentMode,
  };
  // Process payment
  await BillingService.makePayment(createBillingDTO);

  // Book the slots and update appointment status
  for (let i = 0; i < savedAppointmentIds.length; i++) {
    const appointmentId = savedAppointmentIds[i];
    const slotId = objectIdSlotIds[i];

    // Book the slot
    await SlotService.bookSlotUsingSlotIdAndAppointmentId(
      slotId,
      appointmentId
    );

    // Update appointment status from PENDING to SCHEDULED
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: EAppointmentStatus.SCHEDULED,
    });
  }

  // Send notification to patient
  await NotificationService.createNotification(
    "Appointment scheduled successfully",
    EUrgency.LOW,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    objectIdPatientId.toString(),
    patient.phoneNumber
  );
};

const cancelAppointment = async ({
  appointmentId,
  patientId,
}: {
  appointmentId: Types.ObjectId | string;
  patientId: Types.ObjectId | string;
}) => {
  LOGGER.debug(
    `Cancelling appointment: ${appointmentId} for patient: ${patientId}`
  );

  const patient = await PatientService.getPatient(patientId.toString());
  if (!patient) {
    throw new Error("Patient not found");
  }

  const objectIdAppointmentId =
    typeof appointmentId === "string"
      ? new Types.ObjectId(appointmentId)
      : appointmentId;

  const objectIdPatientId =
    typeof patientId === "string" ? new Types.ObjectId(patientId) : patientId;

  // Get the appointment from db
  const appointment = await Appointment.findById(objectIdAppointmentId);

  if (!appointment) {
    throw createHttpError(
      HttpStatusCodes.NOT_FOUND,
      `Appointment not found: ${appointmentId}`
    );
  }

  // Verify if the patientId matches with the appointment
  if (!appointment.patientId.equals(objectIdPatientId)) {
    throw createHttpError(
      HttpStatusCodes.FORBIDDEN,
      `Patient ${patientId} is not authorized to cancel this appointment`
    );
  }

  // Release the slot
  await SlotService.releaseSlot(objectIdAppointmentId);

  // Process refund
  await BillingService.makeFullRefund(appointment.billingId.toString());

  // Update appointment status to CANCELLED
  appointment.status = EAppointmentStatus.CANCELLED;
  await appointment.save();

  // Send notification to patient
  await NotificationService.createNotification(
    `Appointment cancelled successfully.`,
    EUrgency.MEDIUM,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    objectIdPatientId.toString(),
    patient.phoneNumber
  );

  return appointment;
};

const rescheduleAppointment = async ({
  appointmentId,
  patientId,
  newSlotId,
}: {
  appointmentId: Types.ObjectId | string;
  patientId: Types.ObjectId | string;
  newSlotId: Types.ObjectId | string;
}) => {
  LOGGER.debug("Rescheduling appointment", {
    appointmentId: JSON.stringify(appointmentId),
    patientId: JSON.stringify(patientId),
    newSlotId: JSON.stringify(newSlotId),
  });

  // Convert inputs to ObjectId
  const objectIdAppointmentId = new Types.ObjectId(appointmentId);
  const objectIdPatientId = new Types.ObjectId(patientId);
  const objectIdNewSlotId = new Types.ObjectId(newSlotId);

  // Get the appointment object from db
  const appointment = await Appointment.findById(objectIdAppointmentId);
  if (!appointment) {
    throw createHttpError(
      HttpStatusCodes.NOT_FOUND,
      `Appointment not found: ${appointmentId}`
    );
  }

  // Verify if the patientId matches with the appointment
  if (!appointment.patientId.equals(objectIdPatientId)) {
    throw createHttpError(
      HttpStatusCodes.FORBIDDEN,
      `Patient ${patientId} is not authorized to reschedule this appointment`
    );
  }

  // Check if the new slot is available
  const slotAvailable:
    | {
        type: EAppointmentSlot;
        appointmentType: EAppointmentType;
        date: Date;
      }[]
    | null = await SlotService.areAllSlotsAvailable([objectIdNewSlotId]);
  if (!slotAvailable) {
    throw createHttpError(
      HttpStatusCodes.BAD_REQUEST,
      "The selected slot is not available"
    );
  }

  // Get slot details
  const slotDetails = slotAvailable[0];

  // Release the old slot
  await SlotService.releaseSlot(objectIdAppointmentId);

  // Book the new slot
  await SlotService.bookSlotUsingSlotIdAndAppointmentId(
    objectIdNewSlotId,
    objectIdAppointmentId
  );

  // Update the appointment with new details
  appointment.timing = createDateWithSlotTime(
    slotDetails.date,
    slotDetails.type
  );
  appointment.slot = slotDetails.type;
  appointment.appointmentType = slotDetails.appointmentType;
  appointment.status = EAppointmentStatus.RESCHEDULED;
  await appointment.save();

  // Fetch patient details for notification
  const patient = await PatientService.getPatient(objectIdPatientId.toString());
  if (!patient) {
    throw createHttpError(HttpStatusCodes.NOT_FOUND, "Patient not found");
  }

  // Send notification to patient
  await NotificationService.createNotification(
    `Your appointment has been rescheduled to ${appointment.timing.toLocaleString()}.`,
    EUrgency.HIGH,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    objectIdPatientId.toString(),
    patient.phoneNumber
  );

  return appointment;
};

const AppointmentService = {
  getAppointments,
  getUpcomingAppointmentsForPatient,
  scheduleAppointment,
  cancelAppointment,
  rescheduleAppointment,
};

export default AppointmentService;
