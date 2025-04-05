import AppointmentRouter from "@/routes/appointment";
import ChatRouter from "@/routes/chat";
import InfoRouter from "@/routes/info";
import PatientRouter from "@/routes/patient";
import SlotRouter from "@/routes/slot";
import { Express, Router } from "express";

// allows the router to inherit parameters from the parent router
const WrapperRouter = Router({ mergeParams: true });

WrapperRouter.get("/ping", (req, res) => {
  res.status(200).send("Ok");
});

WrapperRouter.use("/patients", PatientRouter);
WrapperRouter.use("/slots", SlotRouter);
WrapperRouter.use("/appointments", AppointmentRouter);
WrapperRouter.use("/info", InfoRouter);
WrapperRouter.use("/chat", ChatRouter);

const InitRoutes = (app: Express) => {
  app.use("/api", WrapperRouter);
};

export default InitRoutes;
