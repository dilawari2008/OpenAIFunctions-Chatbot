import { forwardRequest } from "@/common";
import PatientController from "@/controllers/patient";
import { verifyJwt } from "@/middlewares";

import { Router } from "express";

const PatientRouter = Router({ mergeParams: true });

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
