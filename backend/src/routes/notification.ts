import { forwardRequest } from "@/common";
import * as NotificationController from "@/controllers/notification";

import { Router } from "express";

const NotificationRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications
 *     description: Retrieves notifications for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID to get notifications for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notifications to skip
 *     responses:
 *       200:
 *         description: List of notifications
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
NotificationRouter.get(
  "/",
  forwardRequest(NotificationController.getNotifications)
);

/**
 * @swagger
 * /api/notifications/generate-otp:
 *   post:
 *     summary: Generate OTP
 *     description: Generates a one-time password for verification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number to send OTP to
 *               email:
 *                 type: string
 *                 description: Email to send OTP to (optional)
 *     responses:
 *       200:
 *         description: OTP generated and sent successfully
 *       400:
 *         description: Invalid phone number or email
 *       500:
 *         description: Server error
 */
NotificationRouter.post(
  "/generate-otp",
  forwardRequest(NotificationController.generateOTP)
);

export default NotificationRouter;
