import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { Notification } from "@/db/models/notification";
import { Patient } from "@/db/models/patient";
import { ENotificationDestination, EUrgency, EUserType } from "@/enums";
import { INotification } from "@/interfaces/model";
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

const getNotificationsList = async (userType: EUserType, userId?: string) => {
  LOGGER.debug(
    `Fetching notifications for userType: ${userType}, userId: ${
      userId || "not provided"
    }`
  );

  let query: any = { userType };

  if (userType !== EUserType.ADMIN && userId) {
    query.userId = new Types.ObjectId(userId);
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
    { phoneNumber, deleted: false },
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

const NotificationService = {
  createNotification,
  getNotificationsList,
  generateOTP,
};

export default NotificationService;
