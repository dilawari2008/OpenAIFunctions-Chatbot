import { forwardRequest } from "@/common";
import SlotController from "@/controllers/slot";

import { Router } from "express";

const SlotRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/slots/available:
 *   get:
 *     summary: Get available time slots
 *     description: Retrieves available time slots for a specified date range
 *     tags: [Slots]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the range
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the range
 *       - in: query
 *         name: specialtyId
 *         schema:
 *           type: string
 *         description: Filter by specialty ID (optional)
 *     responses:
 *       200:
 *         description: List of available time slots
 *       400:
 *         description: Invalid date range
 *       500:
 *         description: Server error
 */
SlotRouter.get(
  "/available",
  forwardRequest(SlotController.getAvailableTimeSlotsForDateRange)
);

/**
 * @swagger
 * /api/slots/book:
 *   post:
 *     summary: Book a slot
 *     description: Books a specific time slot
 *     tags: [Slots]
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
 *     responses:
 *       200:
 *         description: Slot booked successfully
 *       400:
 *         description: Invalid input or slot already booked
 *       404:
 *         description: Slot not found
 *       500:
 *         description: Server error
 */
SlotRouter.post("/book", forwardRequest(SlotController.bookSlot));

/**
 * @swagger
 * /api/slots/slots-for-the-month:
 *   post:
 *     summary: Create slots for the month
 *     description: Generates time slots for a specified month
 *     tags: [Slots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - month
 *             properties:
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               doctorId:
 *                 type: string
 *                 description: Optional doctor ID to create slots for
 *     responses:
 *       200:
 *         description: Slots created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
SlotRouter.post(
  "/slots-for-the-month",
  forwardRequest(SlotController.createSlotsForTheMonth)
);

export default SlotRouter;
