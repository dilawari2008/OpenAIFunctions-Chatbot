import { forwardRequest } from "@/common";
import PatientController from "@/controllers/patient";
import { verifyJwt } from "@/middlewares";

import { Router } from "express";

const PatientRouter = Router({ mergeParams: true });

PatientRouter.get("/:id", forwardRequest(PatientController.getPatient));
PatientRouter.post("/", forwardRequest(PatientController.upsertPatient)); 
PatientRouter.put("/:id", forwardRequest(PatientController.updatePatient));
PatientRouter.post("/verify-phone-number", forwardRequest(PatientController.verifyPhoneNumber));
PatientRouter.get("/phone-number/:phoneNumber", forwardRequest(PatientController.getPatientByPhoneNumber));
PatientRouter.post("/dependants/:id", forwardRequest(PatientController.addDependant));
PatientRouter.get("/dependants/:id", forwardRequest(PatientController.getDependants));
PatientRouter.get("/parent/:id", forwardRequest(PatientController.getParentPatient));
PatientRouter.get("/", forwardRequest(PatientController.getPatients));
PatientRouter.put("/insurance/:id", forwardRequest(PatientController.updateInsuranceDetails));
PatientRouter.get("/vital-info/:id", forwardRequest(PatientController.hasVitalInfo));
PatientRouter.get("/insurance/:id", forwardRequest(PatientController.hasValidInsurance));

export default PatientRouter;
