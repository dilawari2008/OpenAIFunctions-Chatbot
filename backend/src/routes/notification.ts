import { forwardRequest } from "@/common";
import * as NotificationController from "@/controllers/notification";

import { Router } from "express";

const NotificationRouter = Router({ mergeParams: true });

NotificationRouter.get(
  "/",
  forwardRequest(NotificationController.getNotifications)
);

NotificationRouter.post(
  "/generate-otp",
  forwardRequest(NotificationController.generateOTP)
);

export default NotificationRouter;
