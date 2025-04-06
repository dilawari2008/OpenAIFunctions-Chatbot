import { forwardRequest } from "@/common";
import PatientController from "@/controllers/patient";
import { verifyJwt } from "@/middlewares";

import { Router } from "express";

const PatientRouter = Router({ mergeParams: true });

PatientRouter.get("/:id", forwardRequest(PatientController.getPatient));

export default PatientRouter;
