import PatientService from "@/services/patient";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

const getPatient = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res
      .status(400)
      .sendFormatted({ error: "Invalid patient ID format" });
  }

  const patient = await PatientService.getPatient(id);
  res.sendFormatted(patient);
};

const upsertPatient = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  const updatedPatient = await PatientService.upsertPatient(phoneNumber);
  res.sendFormatted(updatedPatient);
};

const updatePatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const patientData = req.body;
  const updatedPatient = await PatientService.updatePatientDetails(
    id,
    patientData
  );
  res.sendFormatted(updatedPatient);
};

const verifyPhoneNumber = async (req: Request, res: Response) => {
  const { phoneNumber, verificationCode } = req.body;
  const result = await PatientService.verifyPhoneNumber(
    phoneNumber,
    verificationCode
  );
  res.sendFormatted(result);
};

const getPatientByPhoneNumber = async (req: Request, res: Response) => {
  const { phoneNumber } = req.params;
  const phoneNum = Number(phoneNumber);
  if (isNaN(phoneNum)) {
    return res
      .status(400)
      .sendFormatted({ error: "Invalid phone number format" });
  }
  const patient = await PatientService.getPatientByPhoneNumber(phoneNum);
  res.sendFormatted(patient);
};

const addDependant = async (req: Request, res: Response) => {
  const { id } = req.params;
  const dependantData = req.body;
  const newDependant = await PatientService.addDependant(id, dependantData);
  res.sendFormatted(newDependant);
};

const getDependants = async (req: Request, res: Response) => {
  const { id } = req.params;
  const dependants = await PatientService.getDependants(id);
  res.sendFormatted(dependants);
};

const getParentPatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parentPatient = await PatientService.getParentPatient(id);
  res.sendFormatted(parentPatient);
};

const getPatients = async (req: Request, res: Response) => {
  const filters = req.query;
  const patients = await PatientService.getPatients(filters);
  res.sendFormatted(patients);
};

const updateInsuranceDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { insuranceName, insuranceId } = req.body;
  const updatedPatient = await PatientService.updateInsuranceDetails(
    id,
    insuranceName,
    insuranceId
  );
  res.sendFormatted(updatedPatient);
};

const hasVitalInfo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const vitalInfo = await PatientService.hasVitalInfo(id);
  res.sendFormatted(vitalInfo);
};

const hasValidInsurance = async (req: Request, res: Response) => {
  const { id } = req.params;
  const insuranceInfo = await PatientService.hasValidInsurance(id);
  res.sendFormatted(insuranceInfo);
};

const PatientController = {
  getPatient,
  upsertPatient,
  updatePatient,
  verifyPhoneNumber,
  getPatientByPhoneNumber,
  addDependant,
  getDependants,
  getParentPatient,
  getPatients,
  updateInsuranceDetails,
  hasVitalInfo,
  hasValidInsurance,
};

export default PatientController;
