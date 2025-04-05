import PatientService from "@/services/patient";
import { Request, Response } from "express";
import { CreatePatientDTO, UpdatePatientDTO } from "@/interfaces/dto";

const upsertPatient = async (req: Request, res: Response) => {
  const patientData: CreatePatientDTO = req.body;
  const patient = await PatientService.upsertPatient(patientData);

  res.sendFormatted(patient);
};

const getPatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const patient = await PatientService.getPatient(id);

  res.sendFormatted(patient);
};

const PatientController = {
  upsertPatient,
  getPatient,
};

export default PatientController;
