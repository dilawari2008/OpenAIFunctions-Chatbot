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
    paymentMode,
  });

  // Check if patient has vital information
  LOGGER.debug("Checking patient vital information");
  const vitalInfo = await PatientService.hasVitalInfo(patientId.toString());
  LOGGER.debug("Patient vital info result", {
    vitalInfo: JSON.stringify(vitalInfo),
  });

  const missingFields = [];
  if (!vitalInfo.fullName) missingFields.push("fullName");
  if (!vitalInfo.dateOfBirth) missingFields.push("dateOfBirth");
  LOGGER.debug("Missing vital fields check", {
    missingFields: JSON.stringify(missingFields),
  });

  if (missingFields.length > 0) {
    LOGGER.error("Patient vital information missing", {
      missingFields: JSON.stringify(missingFields),
    });
    throw new Error(
      `Patient vital information missing: ${missingFields.join(", ")}`
    );
  }

  if (paymentMode === EPaymentMode.INSURANCE) {
    LOGGER.debug("Checking insurance information for patient", {
      patientId: patientId.toString(),
    });
    const insuranceInfo = await PatientService.hasValidInsurance(
      patientId.toString()
    );
    LOGGER.debug("Insurance info result", {
      insuranceInfo: JSON.stringify(insuranceInfo),
    });

    // depeding on what is missing in insuranceInfo throw an error
    if (!insuranceInfo.insuranceName) {
      LOGGER.error("Insurance name is missing");
      throw new Error("Insurance name is missing");
    }
    if (!insuranceInfo.insuranceId) {
      LOGGER.error("Insurance ID is missing");
      throw new Error("Insurance ID is missing");
    }
  }

  // Convert inputs to ObjectId
  LOGGER.debug("Converting IDs to ObjectId");
  const objectIdSlotIds = slotIds.map((id) => new Types.ObjectId(id));
  const objectIdPatientId = new Types.ObjectId(patientId);
  LOGGER.debug("Converted IDs", {
    objectIdSlotIds: JSON.stringify(objectIdSlotIds),
    objectIdPatientId: JSON.stringify(objectIdPatientId),
  });

  // Check if all slots are available
  LOGGER.debug("Checking slot availability", {
    slotIds: JSON.stringify(objectIdSlotIds),
  });
  const slotsAvailable:
    | {
        type: EAppointmentSlot;
        appointmentType: EAppointmentType;
        date: Date;
      }[]
    | null = await SlotService.areAllSlotsAvailable(objectIdSlotIds);
  LOGGER.debug("Slots availability result", {
    slotsAvailable: JSON.stringify(slotsAvailable),
  });

  if (!slotsAvailable) {
    LOGGER.error("One or more selected slots are not available");
    throw new Error("One or more selected slots are not available");
  }

  // Fetch patient details
  LOGGER.debug("Fetching patient details", {
    patientId: objectIdPatientId.toString(),
  });
  const patient = await PatientService.getPatient(objectIdPatientId.toString());
  LOGGER.debug("Patient details result", { patient: JSON.stringify(patient) });

  if (!patient) {
    LOGGER.error("Patient not found");
    throw new Error("Patient not found");
  }

  // Create a new appointment with pending status
  LOGGER.debug("Creating new appointments with pending status");
  const newAppointments: IAppointment[] = slotsAvailable.map((slot) => ({
    patientId: objectIdPatientId,
    status: EAppointmentStatus.PENDING,
    timing: createDateWithSlotTime(slot.date, slot.type),
    slot: slot.type,
    appointmentType: slot.appointmentType,
  }));
  LOGGER.debug("New appointments created", {
    newAppointments: JSON.stringify(newAppointments),
  });

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
  LOGGER.debug("Bulk write operations prepared", {
    operations: JSON.stringify(operations),
  });

  LOGGER.debug("Executing bulk write operations");
  await Appointment.bulkWrite(operations);
  LOGGER.debug("Bulk write completed");

  LOGGER.debug("Finding saved appointments");
  const savedAppointments = await Appointment.find({
    patientId: objectIdPatientId,
    status: EAppointmentStatus.PENDING,
    timing: {
      $in: newAppointments.map((appointment) => appointment.timing),
    },
  });
  LOGGER.debug("Saved appointments found", {
    savedAppointments: JSON.stringify(savedAppointments),
  });

  const savedAppointmentIds = savedAppointments.map(
    (appointment) => appointment._id
  );
  LOGGER.debug("Saved appointment IDs", {
    savedAppointmentIds: JSON.stringify(savedAppointmentIds),
  });

  // Calculate total amount based on appointment types
  LOGGER.debug("Calculating total amount");
  const totalAmount = savedAppointments.reduce((sum, appointment) => {
    const price = AppointmentTypeToPricingMap[appointment.appointmentType] || 0;
    LOGGER.debug("Adding price for appointment type", {
      appointmentType: appointment.appointmentType,
      price: price,
      currentSum: sum,
    });
    return sum + price;
  }, 0);
  LOGGER.debug("Total amount calculated", { totalAmount });

  const createBillingDTO: CreateBillingDTO = {
    patientId: objectIdPatientId,
    name: patient.fullName || "",
    contact: patient.phoneNumber,
    appointments: savedAppointmentIds,
    amount: totalAmount,
    paymentMode: paymentMode,
  };
  LOGGER.debug("Billing DTO created", {
    billingDTO: JSON.stringify(createBillingDTO),
  });

  // Process payment
  LOGGER.debug("Processing payment");
  await BillingService.makePayment(createBillingDTO);
  LOGGER.debug("Payment processed successfully");

  // Book the slots and update appointment status
  LOGGER.debug("Booking slots and updating appointment status");
  for (let i = 0; i < savedAppointmentIds.length; i++) {
    const appointmentId = savedAppointmentIds[i];
    const slotId = objectIdSlotIds[i];
    LOGGER.debug("Processing appointment and slot", {
      appointmentId: JSON.stringify(appointmentId),
      slotId: JSON.stringify(slotId),
    });

    // Book the slot
    LOGGER.debug("Booking slot", {
      slotId: JSON.stringify(slotId),
      appointmentId: JSON.stringify(appointmentId),
    });
    await SlotService.bookSlotUsingSlotIdAndAppointmentId(
      slotId,
      appointmentId
    );
    LOGGER.debug("Slot booked successfully");

    // Update appointment status from PENDING to SCHEDULED
    LOGGER.debug("Updating appointment status to SCHEDULED", {
      appointmentId: JSON.stringify(appointmentId),
    });
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: EAppointmentStatus.SCHEDULED,
    });
    LOGGER.debug("Appointment status updated successfully");
  }

  LOGGER.debug("Getting patient phone number");
  let phoneNumber = patient?.contact?.phoneNumber;
  LOGGER.debug("Initial phone number", { phoneNumber });

  LOGGER.debug("Patient details", {
    patient: JSON.stringify(patient),
  });

  if (!phoneNumber) {
    // get the parent phone number
    LOGGER.debug("Phone number not found, getting parent patient", {
      patientId: objectIdPatientId.toString(),
    });
    const parent = await PatientService.getParentPatient(
      objectIdPatientId.toString()
    );
    LOGGER.debug("Parent patient found", { parent: JSON.stringify(parent) });
    phoneNumber = parent?.phoneNumber;
    LOGGER.debug("Using parent phone number", { phoneNumber });
  }

  // Send notification to patient
  LOGGER.debug("Sending notification to patient", {
    patientId: objectIdPatientId.toString(),
    phoneNumber: phoneNumber?.toString(),
  });
  NotificationService.createNotification(
    "Appointment scheduled successfully",
    EUrgency.LOW,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    objectIdPatientId.toString(),
    phoneNumber?.toString()
  );
  LOGGER.debug("Patient notification sent");

  LOGGER.debug("Sending notification to admin", {
    patientName: patient.fullName,
    phoneNumber: patient.phoneNumber,
  });
  NotificationService.createNotification(
    `Appointment scheduled successfully for patient ${patient.fullName} phone number ${patient.phoneNumber}`,
    EUrgency.LOW,
    EUserType.ADMIN,
    ENotificationDestination.ADMIN_PANEL
  );
  LOGGER.debug("Admin notification sent");
  LOGGER.debug("Appointment scheduling completed successfully");
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

  LOGGER.debug("Fetching patient details", { patientId: patientId.toString() });
  const patient = await PatientService.getPatient(patientId.toString());
  LOGGER.debug("Patient details result", { patient: JSON.stringify(patient) });

  if (!patient) {
    LOGGER.error("Patient not found");
    throw new Error("Patient not found");
  }

  LOGGER.debug("Converting IDs to ObjectId");
  const objectIdAppointmentId =
    typeof appointmentId === "string"
      ? new Types.ObjectId(appointmentId)
      : appointmentId;
  LOGGER.debug("Appointment ID converted", {
    objectIdAppointmentId: JSON.stringify(objectIdAppointmentId),
  });

  const objectIdPatientId =
    typeof patientId === "string" ? new Types.ObjectId(patientId) : patientId;
  LOGGER.debug("Patient ID converted", {
    objectIdPatientId: JSON.stringify(objectIdPatientId),
  });

  // Get the appointment from db
  LOGGER.debug("Fetching appointment details", {
    appointmentId: JSON.stringify(objectIdAppointmentId),
  });
  const appointment = await Appointment.findById(objectIdAppointmentId);
  LOGGER.debug("Appointment details result", {
    appointment: JSON.stringify(appointment),
  });

  if (!appointment) {
    LOGGER.error("Appointment not found", {
      appointmentId: JSON.stringify(appointmentId),
    });
    throw createHttpError(
      HttpStatusCodes.NOT_FOUND,
      `Appointment not found: ${appointmentId}`
    );
  }

  // Verify if the patientId matches with the appointment
  LOGGER.debug("Verifying patient authorization", {
    appointmentPatientId: JSON.stringify(appointment.patientId),
    requestPatientId: JSON.stringify(objectIdPatientId),
  });

  if (!appointment.patientId.equals(objectIdPatientId)) {
    LOGGER.error("Patient not authorized to cancel appointment", {
      appointmentPatientId: JSON.stringify(appointment.patientId),
      requestPatientId: JSON.stringify(objectIdPatientId),
    });
    throw createHttpError(
      HttpStatusCodes.FORBIDDEN,
      `Patient ${patientId} is not authorized to cancel this appointment`
    );
  }

  // Release the slot
  LOGGER.debug("Releasing slot", {
    appointmentId: JSON.stringify(objectIdAppointmentId),
  });
  await SlotService.releaseSlot(objectIdAppointmentId);
  LOGGER.debug("Slot released successfully");

  // Process refund
  LOGGER.debug("Processing refund");
  const refundAmount = AppointmentTypeToPricingMap[appointment.appointmentType];
  LOGGER.debug(
    `Calculated refund amount: $${refundAmount} based on appointment type: ${appointment.type}`
  );

  await BillingService.makePayment({
    patientId: appointment.patientId,
    name: patient.fullName || "",
    contact: patient.phoneNumber,
    appointments: [appointment._id],
    amount: refundAmount,
    paymentMode: EPaymentMode.CREDIT,
    isRefund: true,
    notes: `Refund for cancelled appointment ${appointment._id}`,
  });
  LOGGER.debug("Refund processed successfully");

  // Update appointment status to CANCELLED
  LOGGER.debug("Updating appointment status to CANCELLED");
  appointment.status = EAppointmentStatus.CANCELLED;
  await appointment.save();
  LOGGER.debug("Appointment status updated successfully");

  // Send notification to patient
  LOGGER.debug("Sending notification to patient", {
    patientId: objectIdPatientId.toString(),
    phoneNumber: patient.phoneNumber,
  });
  NotificationService.createNotification(
    `Appointment cancelled successfully.`,
    EUrgency.MEDIUM,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    objectIdPatientId.toString(),
    patient.phoneNumber
  );
  LOGGER.debug("Patient notification sent");

  LOGGER.debug("Sending notification to admin", {
    patientName: patient.fullName,
    phoneNumber: patient.phoneNumber,
  });
  NotificationService.createNotification(
    `Appointment cancelled successfully for patient ${patient.fullName} phone number ${patient.phoneNumber}`,
    EUrgency.MEDIUM,
    EUserType.ADMIN,
    ENotificationDestination.ADMIN_PANEL
  );
  LOGGER.debug("Admin notification sent");
  LOGGER.debug("Appointment cancellation completed successfully");

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
  LOGGER.debug("Converting IDs to ObjectId");
  const objectIdAppointmentId = new Types.ObjectId(appointmentId);
  LOGGER.debug("Appointment ID converted", {
    objectIdAppointmentId: JSON.stringify(objectIdAppointmentId),
  });

  const objectIdPatientId = new Types.ObjectId(patientId);
  LOGGER.debug("Patient ID converted", {
    objectIdPatientId: JSON.stringify(objectIdPatientId),
  });

  const objectIdNewSlotId = new Types.ObjectId(newSlotId);
  LOGGER.debug("New slot ID converted", {
    objectIdNewSlotId: JSON.stringify(objectIdNewSlotId),
  });

  // Get the appointment object from db
  LOGGER.debug("Fetching appointment details", {
    appointmentId: JSON.stringify(objectIdAppointmentId),
  });
  const appointment = await Appointment.findById(objectIdAppointmentId);
  LOGGER.debug("Appointment details result", {
    appointment: JSON.stringify(appointment),
  });

  if (!appointment) {
    LOGGER.error("Appointment not found", {
      appointmentId: JSON.stringify(appointmentId),
    });
    throw createHttpError(
      HttpStatusCodes.NOT_FOUND,
      `Appointment not found: ${appointmentId}`
    );
  }

  // Verify if the patientId matches with the appointment
  LOGGER.debug("Verifying patient authorization", {
    appointmentPatientId: JSON.stringify(appointment.patientId),
    requestPatientId: JSON.stringify(objectIdPatientId),
  });

  if (!appointment.patientId.equals(objectIdPatientId)) {
    LOGGER.error("Patient not authorized to reschedule appointment", {
      appointmentPatientId: JSON.stringify(appointment.patientId),
      requestPatientId: JSON.stringify(objectIdPatientId),
    });
    throw createHttpError(
      HttpStatusCodes.FORBIDDEN,
      `Patient ${patientId} is not authorized to reschedule this appointment`
    );
  }

  // Check if the new slot is available
  LOGGER.debug("Checking new slot availability", {
    slotId: JSON.stringify(objectIdNewSlotId),
  });
  const slotAvailable:
    | {
        type: EAppointmentSlot;
        appointmentType: EAppointmentType;
        date: Date;
      }[]
    | null = await SlotService.areAllSlotsAvailable([objectIdNewSlotId]);
  LOGGER.debug("Slot availability result", {
    slotAvailable: JSON.stringify(slotAvailable),
  });

  if (!slotAvailable) {
    LOGGER.error("The selected slot is not available");
    throw createHttpError(
      HttpStatusCodes.BAD_REQUEST,
      "The selected slot is not available"
    );
  }

  // Get slot details
  LOGGER.debug("Getting slot details");
  const slotDetails = slotAvailable[0];
  LOGGER.debug("Slot details", { slotDetails: JSON.stringify(slotDetails) });

  // Release the old slot
  LOGGER.debug("Releasing old slot", {
    appointmentId: JSON.stringify(objectIdAppointmentId),
  });
  await SlotService.releaseSlot(objectIdAppointmentId);
  LOGGER.debug("Old slot released successfully");

  // Book the new slot
  LOGGER.debug("Booking new slot", {
    slotId: JSON.stringify(objectIdNewSlotId),
    appointmentId: JSON.stringify(objectIdAppointmentId),
  });
  await SlotService.bookSlotUsingSlotIdAndAppointmentId(
    objectIdNewSlotId,
    objectIdAppointmentId
  );
  LOGGER.debug("New slot booked successfully");

  // Update the appointment with new details
  LOGGER.debug("Updating appointment with new details");
  appointment.timing = createDateWithSlotTime(
    slotDetails.date,
    slotDetails.type
  );
  appointment.slot = slotDetails.type;
  appointment.appointmentType = slotDetails.appointmentType;
  appointment.status = EAppointmentStatus.RESCHEDULED;
  LOGGER.debug("Saving updated appointment", {
    updatedAppointment: JSON.stringify(appointment),
  });
  await appointment.save();
  LOGGER.debug("Appointment updated successfully");

  // Fetch patient details for notification
  LOGGER.debug("Fetching patient details for notification", {
    patientId: objectIdPatientId.toString(),
  });
  const patient = await PatientService.getPatient(objectIdPatientId.toString());
  LOGGER.debug("Patient details result", { patient: JSON.stringify(patient) });

  if (!patient) {
    LOGGER.error("Patient not found");
    throw createHttpError(HttpStatusCodes.NOT_FOUND, "Patient not found");
  }

  // Send notification to patient
  LOGGER.debug("Sending notification to patient", {
    patientId: objectIdPatientId.toString(),
    phoneNumber: patient.phoneNumber,
    appointmentTime: appointment.timing.toLocaleString(),
  });
  NotificationService.createNotification(
    `Your appointment has been rescheduled to ${appointment.timing.toLocaleString()}.`,
    EUrgency.HIGH,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    objectIdPatientId.toString(),
    patient.phoneNumber
  );
  LOGGER.debug("Patient notification sent");

  LOGGER.debug("Sending notification to admin", {
    patientName: patient.fullName,
    phoneNumber: patient.phoneNumber,
  });
  NotificationService.createNotification(
    `Appointment rescheduled successfully for patient ${patient.fullName} phone number ${patient.phoneNumber}`,
    EUrgency.MEDIUM,
    EUserType.ADMIN,
    ENotificationDestination.ADMIN_PANEL
  );
  LOGGER.debug("Admin notification sent");
  LOGGER.debug("Appointment rescheduling completed successfully");

  return appointment;
};

const bulkScheduleAppointments = async (
  appointmentRequests: {
    slotId: Types.ObjectId | string;
    patientId: Types.ObjectId | string;
    paymentMode: EPaymentMode;
  }[]
): Promise<{ patientId: string; success: boolean; errorMsg?: string }[]> => {
  LOGGER.debug("Bulk scheduling appointments", {
    requests: JSON.stringify(appointmentRequests),
  });

  LOGGER.debug("Processing appointment requests in parallel");
  const results = await Promise.all(
    appointmentRequests.map(async (request) => {
      LOGGER.debug("Processing individual appointment request", {
        request: JSON.stringify(request),
      });
      try {
        LOGGER.debug("Scheduling appointment", {
          slotId: JSON.stringify(request.slotId),
          patientId: JSON.stringify(request.patientId),
          paymentMode: request.paymentMode,
        });
        await scheduleAppointment({
          slotIds: [request.slotId],
          patientId: request.patientId,
          paymentMode: request.paymentMode,
        });
        LOGGER.debug("Appointment scheduled successfully", {
          patientId: request.patientId.toString(),
        });

        return {
          patientId: request.patientId.toString(),
          success: true,
        };
      } catch (error: any) {
        LOGGER.error("Error scheduling appointment", {
          error: error.message,
          stack: error.stack,
          patientId: request.patientId.toString(),
        });
        return {
          patientId: request.patientId.toString(),
          success: false,
          errorMsg: error.message || "Failed to schedule appointment",
        };
      }
    })
  );
  LOGGER.debug("Bulk scheduling completed", {
    results: JSON.stringify(results),
  });

  return results;
};

const AppointmentService = {
  getAppointments,
  getUpcomingAppointmentsForPatient,
  scheduleAppointment,
  cancelAppointment,
  rescheduleAppointment,
  bulkScheduleAppointments,
};

export default AppointmentService;
