import { forwardRequest } from "@/common";
import AppointmentController from "@/controllers/appointment";

import { Router } from "express";

const AppointmentRouter = Router({ mergeParams: true });

AppointmentRouter.get("/", AppointmentController.getAppointments);
AppointmentRouter.get("/upcoming", AppointmentController.getUpcomingAppointmentsForPatient);
AppointmentRouter.post("/schedule", AppointmentController.scheduleAppointment);
AppointmentRouter.post("/cancel", AppointmentController.cancelAppointment);
AppointmentRouter.post("/reschedule", AppointmentController.rescheduleAppointment);
AppointmentRouter.post("/bulk-schedule", AppointmentController.bulkScheduleAppointments);

export default AppointmentRouter;
