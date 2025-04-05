import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { Patient } from "@/db/models/patient";
import { CreatePatientDTO } from "@/interfaces/dto";
import { IPatient } from "@/interfaces/model";
import createError from "http-errors";

const upsertPatient = async (patientData: CreatePatientDTO) => {
  LOGGER.debug(`patientData: ${JSON.stringify(patientData)}`);

  const patient = (await Patient.findOneAndUpdate(
    {
      phoneNumber: patientData.phoneNumber,
      deleted: false,
    },
    {
      $set: {
        ...patientData,
      },
    },
    { upsert: true, new: true }
  )) as IPatient;

  return patient;
};

const getPatient = async (patientId: string) => {
  LOGGER.debug(`Fetching patient with ID: ${patientId}`);

  const patient = await Patient.findOne({
    _id: patientId,
    deleted: false,
  });

  if (!patient) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient with ID ${patientId} not found`
    );
  }

  return patient;
};


const PatientService = {
  upsertPatient,
  getPatient,
};

export default PatientService;
