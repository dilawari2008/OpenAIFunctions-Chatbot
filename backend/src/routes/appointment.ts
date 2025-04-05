import { forwardRequest } from "@/common";
import AppointmentController from "@/controllers/appointment";

import { Router } from "express";

const AppointmentRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/appointments/book:
 *   post:
 *     summary: Book a time slot
 *     description: Creates a new appointment by booking an available time slot
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotId
 *               - patientId
 *             properties:
 *               slotId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment created successfully
 *       400:
 *         description: Invalid input or slot not available
 *       500:
 *         description: Server error
 */
AppointmentRouter.post(
  "/book",
  forwardRequest(AppointmentController.bookTimeSlot)
);

/**
 * @swagger
 * /api/appointments/{appointmentId}/payment:
 *   post:
 *     summary: Make payment for an appointment
 *     description: Process payment for a specific appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - amount
 *             properties:
 *               paymentMethod:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid payment information
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
AppointmentRouter.post(
  "/:appointmentId/payment",
  forwardRequest(AppointmentController.makePayment)
);

export default AppointmentRouter;
