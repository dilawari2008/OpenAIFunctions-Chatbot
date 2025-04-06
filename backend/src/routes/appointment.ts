import { forwardRequest } from "@/common";
import AppointmentController from "@/controllers/appointment";

import { Router } from "express";

const AppointmentRouter = Router({ mergeParams: true });

export default AppointmentRouter;
