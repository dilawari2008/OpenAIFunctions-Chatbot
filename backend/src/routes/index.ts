import AppointmentRouter from "@/routes/appointment";
import ChatRouter from "@/routes/chat";
import InfoRouter from "@/routes/info";
import PatientRouter from "@/routes/patient";
import SlotRouter from "@/routes/slot";
import NotificationRouter from "@/routes/notification";
import { Express, Router } from "express";

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         code:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// allows the router to inherit parameters from the parent router
const WrapperRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/ping:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns a 200 OK status if the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Ok
 */
WrapperRouter.get("/ping", (req, res) => {
  res.status(200).send("Ok");
});

WrapperRouter.use("/patients", PatientRouter);
WrapperRouter.use("/slots", SlotRouter);
WrapperRouter.use("/appointments", AppointmentRouter);
WrapperRouter.use("/info", InfoRouter);
WrapperRouter.use("/chat", ChatRouter);
WrapperRouter.use("/notifications", NotificationRouter);

const InitRoutes = (app: Express) => {
  app.use("/api", WrapperRouter);
};

export default InitRoutes;
