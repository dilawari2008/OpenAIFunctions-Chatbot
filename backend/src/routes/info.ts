import { forwardRequest } from "@/common";
import InfoController from "@/controllers/info";
import { Router } from "express";

const InfoRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/info/payment-methods:
 *   get:
 *     summary: Get available payment methods
 *     description: Retrieves a list of all available payment methods
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *       500:
 *         description: Server error
 */
InfoRouter.get(
  "/payment-methods",
  forwardRequest(InfoController.getPaymentMethods)
);

/**
 * @swagger
 * /api/info/insurance-providers:
 *   get:
 *     summary: Get insurance providers
 *     description: Retrieves a list of supported insurance providers
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: List of insurance providers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   coverageDetails:
 *                     type: string
 *       500:
 *         description: Server error
 */
InfoRouter.get(
  "/insurance-providers",
  forwardRequest(InfoController.getInsuranceProviders)
);

export default InfoRouter;
