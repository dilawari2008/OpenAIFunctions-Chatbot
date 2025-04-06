import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { Notification } from "@/db/models/notification";
import { Patient } from "@/db/models/patient";
import { ENotificationDestination, EUrgency, EUserType } from "@/enums";
import { INotification } from "@/interfaces/model";
import PatientService from "@/services/patient";
import { generateShortCode } from "@/utils";
import createError from "http-errors";
import { Types } from "mongoose";

const createNotification = async (
  message: string,
  urgency: EUrgency,
  userType: EUserType,
  destinationType: ENotificationDestination,
  userId?: string,
  destinationAddress?: string
) => {
  LOGGER.debug(`Creating notification: ${message}, urgency: ${urgency}`);

  const notificationData: Partial<INotification> = {
    message,
    urgency,
    userType,
    destination: {
      type: destinationType,
      address: destinationAddress,
    },
  };

  if (userId) {
    notificationData.userId = new Types.ObjectId(userId);
  }

  const notification = await Notification.create(notificationData);
  return notification;
};

const getNotificationsList = async (
  userType: EUserType,
  userId?: string,
  phoneNumber?: string
) => {
  LOGGER.debug(
    `Fetching notifications for userType: ${userType}, userId: ${
      userId || "not provided"
    }`
  );

  let query: any = { userType };

  if (userType === EUserType.ADMIN) {
    // skip 4 now
  } else if (userId && userType === EUserType.PATIENT) {
    let patientIds = [new Types.ObjectId(userId)];

    if (userType === EUserType.PATIENT) {
      try {
        const dependants = await PatientService.getDependants(userId);
        if (dependants && dependants.length > 0) {
          const dependantIds = dependants.map((dep) => dep._id);
          patientIds = [...patientIds, ...dependantIds];
        }
      } catch (error) {
        LOGGER.error("Error fetching dependants for notifications", { error });
      }
    }

    query.userId = { $in: patientIds };
  } else if (phoneNumber) {
    query["destination.type"] = ENotificationDestination.SMS;
    query["destination.address"] = phoneNumber;
  } else {
    return [];
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .lean();

  const groupedNotifications = {
    [EUrgency.HIGH]: notifications.filter((n) => n.urgency === EUrgency.HIGH),
    [EUrgency.MEDIUM]: notifications.filter(
      (n) => n.urgency === EUrgency.MEDIUM
    ),
    [EUrgency.LOW]: notifications.filter((n) => n.urgency === EUrgency.LOW),
  };

  return groupedNotifications;
};

const generateOTP = async (phoneNumber: string) => {
  LOGGER.debug(`Generating OTP for phoneNumber: ${phoneNumber}`);

  // Generate 6-digit OTP
  const otp = generateShortCode({ length: 6 });

  // Create message template
  const message = `Your verification code is ${otp}. This code will expire in 10 minutes.`;

  // First update the patient with OTP and get the user object
  const patient = await Patient.findOneAndUpdate(
    { "contact.phoneNumber": phoneNumber, deleted: false },
    { $set: { verificationCode: otp } },
    { new: true }
  );

  if (!patient) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient not found with phoneNumber: ${phoneNumber}`
    );
  }

  // Create notification with the userId from the patient
  await createNotification(
    message,
    EUrgency.LOW,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    patient._id.toString(),
    phoneNumber
  );

  return { otp, patient };
};

const sendEmergencyNotification = async (
  emergencySummary: string,
  phoneNumber: string,
  patientName: string
) => {
  let patient: any = {};
  try {
    patient = await PatientService.getPatientByPhoneNumber(Number(phoneNumber));
  } catch (error) {
    LOGGER.error("Error sending emergency notification", { error });
  }
  const message = `Emergency: ${emergencySummary}. Patient Name: ${patientName}, Phone Number: ${phoneNumber}`;

  createNotification(
    message,
    EUrgency.HIGH,
    EUserType.ADMIN,
    ENotificationDestination.ADMIN_PANEL
  );

  createNotification(
    message,
    EUrgency.HIGH,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    patient?._id?.toString(),
    phoneNumber
  );
};

const NotificationService = {
  createNotification,
  getNotificationsList,
  generateOTP,
  sendEmergencyNotification,
};

export default NotificationService;
