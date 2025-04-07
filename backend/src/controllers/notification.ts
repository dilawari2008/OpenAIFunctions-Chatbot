import { Request, Response, NextFunction } from "express";
import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import NotificationService from "@/services/notification";
import { EUserType } from "@/enums";

/**
 * Get notifications for the current user
 */
export const getNotifications = async (req: Request, res: Response) => {
  const { userType, userId, phoneNumber } = req.query;

  LOGGER.debug(`Getting notifications for user: ${userId}, type: ${userType}`);

  const notifications = await NotificationService.getNotificationsList(
    userType as EUserType,
    userId as string,
    phoneNumber as string
  );

  res.sendFormatted(notifications);
};

/**
 * Generate OTP for phone verification
 */
export const generateOTP = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Phone number is required",
    });
  }

  LOGGER.debug(`Generating OTP for phone: ${phoneNumber}`);

  const { otp, patient } = await NotificationService.generateOTP(phoneNumber);

  res.sendFormatted({
    message: "OTP generated successfully",
    patientId: patient._id,
  });
};
