import PatientService from "@/services/patient";
import { Request, Response } from "express";

const getPatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const patient = await PatientService.getPatient(id);

  res.sendFormatted(patient);
};

const PatientController = {
  getPatient,
};

export default PatientController;
