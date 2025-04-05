import { forwardRequest } from "@/common";
import AppointmentController from "@/controllers/appointment";

import { Router } from "express";

const AppointmentRouter = Router({ mergeParams: true });

AppointmentRouter.post(
  "/book",
  forwardRequest(AppointmentController.bookTimeSlot)
);

AppointmentRouter.post(
  "/:appointmentId/payment",
  forwardRequest(AppointmentController.makePayment)
);

export default AppointmentRouter;
