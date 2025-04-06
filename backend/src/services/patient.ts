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
      "contact.phoneNumber": phoneNumber,
      deleted: false,
    },
    {
      $set: {
        "contact.phoneNumber": phoneNumber,
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
    "contact.phoneNumber": phoneNumber,
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
    "contact.phoneNumber": phoneNumber,
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

  if (patientData.insuranceId !== undefined) {
    updateData.insuranceId = patientData.insuranceId;
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
    insuranceId?: string;
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
    insuranceId: dependantData?.insuranceId,
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

const getPatients = async ({
  patientIds,
  fullName,
  phoneNumber,
  insuranceName,
  insuranceId,
  dateOfBirth,
  contactRef,
  limit = 10,
}: {
  patientIds?: Types.ObjectId[];
  fullName?: string;
  phoneNumber?: number;
  insuranceName?: EInsuranceName;
  insuranceId?: string;
  dateOfBirth?: Date;
  contactRef?: Types.ObjectId;
  limit?: number;
}) => {
  LOGGER.debug("Getting patients with filters", {
    patientIds: JSON.stringify(patientIds),
    fullName,
    phoneNumber,
    insuranceName,
    dateOfBirth,
    contactRef,
    limit,
  });

  const query: any = { deleted: false };

  if (patientIds && patientIds.length > 0) {
    query._id = { $in: patientIds };
  }

  if (fullName) {
    query.fullName = { $regex: fullName, $options: "i" };
  }

  if (phoneNumber) {
    query["contact.phoneNumber"] = phoneNumber;
  }

  if (insuranceName) {
    query.insuranceName = insuranceName;
  }

  if (insuranceId) {
    query.insuranceId = insuranceId;
  }

  if (dateOfBirth) {
    query.dateOfBirth = dateOfBirth;
  }

  if (contactRef) {
    query["contact.contactRef"] = contactRef;
  }

  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  return patients;
};

const hasVitalInfo = async (patientId: string): Promise<boolean> => {
  const patient = await Patient.findById(patientId);
  if (!patient) return false;

  const missingFields = [];
  if (!patient.fullName) missingFields.push("fullName");
  if (!patient.dateOfBirth) missingFields.push("dateOfBirth");

  if (missingFields.length > 0) {
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      `Patient is missing required fields: ${missingFields.join(", ")}`
    );
  }

  return true;
};

const hasValidInsurance = async (patientId: string): Promise<boolean> => {
  const patient = await Patient.findById(patientId);
  if (!patient) return false;

  const missingFields = [];
  if (!patient.insuranceName || patient.insuranceName === EInsuranceName.NONE)
    missingFields.push("insurance type");
  if (!patient.insuranceId) missingFields.push("insurance ID");

  if (missingFields.length > 0) {
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      `Patient is missing required insurance fields: ${missingFields.join(
        ", "
      )}`
    );
  }

  return true;
};

const updateInsuranceDetails = async (
  patientId: string,
  insuranceName: EInsuranceName,
  insuranceId: string
): Promise<IPatient | null> => {
  if (!insuranceName || insuranceName === EInsuranceName.NONE || !insuranceId) {
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      "Both insurance name and insurance ID are required"
    );
  }

  const updatedPatient = await Patient.findByIdAndUpdate(
    patientId,
    {
      insuranceName,
      insuranceId,
    },
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

const getDependants = async (patientId: string): Promise<IPatient[]> => {
  LOGGER.debug(`Getting dependants for patient ID: ${patientId}`);

  const projection = {
    fullName: 1,
    dateOfBirth: 1,
    insuranceName: 1,
    insuranceId: 1,
  };

  const dependants = await Patient.find(
    {
      "contact.contactRef": new Types.ObjectId(patientId),
      deleted: false,
    },
    projection
  );

  return dependants;
};

const getParentPatient = async (
  dependantId: string
): Promise<IPatient | null> => {
  LOGGER.debug(`Getting parent for dependant ID: ${dependantId}`);

  const dependant = await Patient.findOne({
    _id: new Types.ObjectId(dependantId),
    deleted: false,
  });

  if (!dependant) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Dependant with ID ${dependantId} not found`
    );
  }

  if (!dependant.contact.contactRef) {
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      `Patient with ID ${dependantId} is not a dependant (no parent reference found)`
    );
  }

  const parentPatient = await Patient.findOne({
    _id: dependant.contact.contactRef,
    deleted: false,
  });

  if (!parentPatient) {
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Parent patient for dependant ID ${dependantId} not found`
    );
  }

  return parentPatient;
};

const PatientService = {
  upsertPatient,
  verifyPhoneNumber,
  getPatient,
  getPatientByPhoneNumber,
  updatePatientDetails,
  addDependant,
  getPatients,
  hasVitalInfo,
  hasValidInsurance,
  updateInsuranceDetails,
  getDependants,
  getParentPatient,
};

export default PatientService;
