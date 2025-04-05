import PatientRouter from "@/routes/patient";
import { Express, Router } from "express";

// allows the router to inherit parameters from the parent router
const WrapperRouter = Router({ mergeParams: true });

WrapperRouter.get("/ping", (req, res) => {
  res.status(200).send("Ok");
});

WrapperRouter.use("/patients", PatientRouter);

const InitRoutes = (app: Express) => {
  app.use("/api", WrapperRouter);
};

export default InitRoutes;
