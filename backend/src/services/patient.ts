import { HttpStatusCodes } from "@/common/constants";
import LOGGER from "@/common/logger";
import { Patient } from "@/db/models/patient";
import { UpdatePatientDTO } from "@/interfaces/dto";
import { IPatient } from "@/interfaces/model";
import createError from "http-errors";
import NotificationService from "./notification";
import SessionService from "./chat/session";
import {
  EInsuranceName,
  ENotificationDestination,
  EUrgency,
  EUserType,
} from "@/enums";
import { Types } from "mongoose";

const upsertPatient = async (phoneNumber: number) => {
  LOGGER.debug(`Upserting patient with phone number: ${phoneNumber}`);

  const patient = (await Patient.findOneAndUpdate(
    {
      phoneNumber,
      deleted: false,
    },
    {
      $set: {
        phoneNumber,
      },
    },
    { upsert: true, new: true }
  )) as IPatient;

  // Generate OTP for verification
  NotificationService.generateOTP(phoneNumber.toString());

  return patient;
};

const verifyPhoneNumber = async (
  phoneNumber: number,
  verificationCode: string
) => {
  LOGGER.debug(
    `Verifying phone number: ${phoneNumber} with code: ${verificationCode}`
  );

  const patient = await Patient.findOne({
    phoneNumber,
    deleted: false,
  });

  if (!patient) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient with phone number ${phoneNumber} not found`
    );
  }

  // Verify the OTP
  const isVerified = patient?.verificationCode === verificationCode;

  if (!isVerified) {
    throw createError(
      HttpStatusCodes.UNAUTHORIZED,
      "Invalid verification code"
    );
  }

  // Clear verification code after successful verification
  await Patient.updateOne(
    { _id: patient._id },
    { $set: { verificationCode: undefined } }
  );

  // Merge sessions if verification successful
  await SessionService.mergeSessions(patient._id, patient.sessionId);

  // Check which mandatory fields are missing
  const missingFields = [];
  if (!patient.fullName) missingFields.push("fullName");
  if (!patient.dateOfBirth) missingFields.push("dateOfBirth");

  return {
    ...patient.toObject(),
    missingFields,
  };
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

const getPatientByPhoneNumber = async (phoneNumber: number) => {
  LOGGER.debug(`Fetching patient with phone number: ${phoneNumber}`);

  const patient = await Patient.findOne({
    phoneNumber,
    deleted: false,
  });

  if (!patient) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient with phone number ${phoneNumber} not found`
    );
  }

  return patient;
};

const updatePatientDetails = async (
  patientId: string,
  patientData: UpdatePatientDTO
) => {
  LOGGER.debug(`Updating patient details for ID: ${patientId}`);

  // Create update object with only the fields that are provided
  const updateData: Partial<UpdatePatientDTO> = {};

  if (patientData.fullName !== undefined) {
    updateData.fullName = patientData.fullName;
  }

  if (patientData.dateOfBirth !== undefined) {
    updateData.dateOfBirth = patientData.dateOfBirth;
  }

  if (patientData.insuranceName !== undefined) {
    updateData.insuranceName = patientData.insuranceName;
  }

  // Only update if there are fields to update
  if (Object.keys(updateData).length === 0) {
    return await getPatient(patientId);
  }

  const updatedPatient = await Patient.findOneAndUpdate(
    { _id: patientId, deleted: false },
    { $set: updateData },
    { new: true }
  );

  if (!updatedPatient) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient with ID ${patientId} not found`
    );
  }

  return updatedPatient;
};

const addDependant = async (
  patientId: string,
  dependantData: {
    fullName: string;
    dateOfBirth: Date;
    insuranceName?: EInsuranceName;
  }
) => {
  LOGGER.debug(`Adding dependant for patient ID: ${patientId}`);

  // Validate required fields
  if (!dependantData.fullName || !dependantData.dateOfBirth) {
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      "Dependant name and date of birth are required"
    );
  }

  // Verify parent patient exists
  const parentPatient = await Patient.findOne({
    _id: new Types.ObjectId(patientId),
    deleted: false,
  });

  if (!parentPatient) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Parent patient with ID ${patientId} not found`
    );
  }

  // Create new dependant patient
  const newDependant = await Patient.create({
    fullName: dependantData.fullName,
    dateOfBirth: dependantData.dateOfBirth,
    insuranceName: dependantData.insuranceName || EInsuranceName.NONE,
    contact: {
      contactRef: new Types.ObjectId(patientId),
    },
    deleted: false,
  });

  // Send notification about successful dependant addition
  NotificationService.createNotification(
    `Dependant ${dependantData.fullName} successfully added to your account.`,
    EUrgency.LOW,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    patientId,
    parentPatient.contact.phoneNumber?.toString()
  );

  return newDependant;
};

const PatientService = {
  upsertPatient,
  verifyPhoneNumber,
  getPatient,
  getPatientByPhoneNumber,
  updatePatientDetails,
  addDependant,
};

export default PatientService;
