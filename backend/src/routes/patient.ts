import { forwardRequest } from "@/common";
import PatientController from "@/controllers/patient";
import { verifyJwt } from "@/middlewares";

import { Router } from "express";

const PatientRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create or update patient
 *     description: Creates a new patient record or updates an existing one
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Patient ID (if updating)
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               medicalHistory:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Patient created or updated successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
PatientRouter.post("/", forwardRequest(PatientController.upsertPatient));

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     description: Retrieves a patient record by ID
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient record retrieved successfully
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
PatientRouter.get("/:id", forwardRequest(PatientController.getPatient));

export default PatientRouter;
