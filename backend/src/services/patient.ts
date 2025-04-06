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
  LOGGER.debug(`Patient upserted successfully`, { patient: JSON.stringify(patient) });

  // Generate OTP for verification
  LOGGER.debug(`Generating OTP for phone number: ${phoneNumber}`);
  NotificationService.generateOTP(phoneNumber.toString());
  LOGGER.debug(`OTP generation request sent for phone number: ${phoneNumber}`);

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
  LOGGER.debug(`Patient lookup result`, { patient: JSON.stringify(patient) });

  if (!patient) {
    LOGGER.error(`Patient with phone number ${phoneNumber} not found`);
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient with phone number ${phoneNumber} not found`
    );
  }

  // Verify the OTP
  const isVerified = patient?.verificationCode === verificationCode;
  LOGGER.debug(`OTP verification result`, { isVerified, patientCode: patient.verificationCode, providedCode: verificationCode });

  if (!isVerified) {
    LOGGER.error(`Invalid verification code for phone number: ${phoneNumber}`);
    throw createError(
      HttpStatusCodes.UNAUTHORIZED,
      "Invalid verification code"
    );
  }

  // Clear verification code after successful verification
  LOGGER.debug(`Clearing verification code for patient ID: ${patient._id}`);
  await Patient.updateOne(
    { _id: patient._id },
    { $set: { verificationCode: undefined } }
  );
  LOGGER.debug(`Verification code cleared for patient ID: ${patient._id}`);

  // Merge sessions if verification successful
  LOGGER.debug(`Merging sessions for patient ID: ${patient._id}, sessionId: ${patient.sessionId}`);
  await SessionService.mergeSessions(patient._id, patient.sessionId);
  LOGGER.debug(`Sessions merged for patient ID: ${patient._id}`);

  // Check which mandatory fields are missing
  const missingFields = [];
  if (!patient.fullName) missingFields.push("fullName");
  if (!patient.dateOfBirth) missingFields.push("dateOfBirth");
  LOGGER.debug(`Missing fields check`, { missingFields: JSON.stringify(missingFields) });

  const result = {
    ...patient.toObject(),
    missingFields,
  };
  LOGGER.debug(`Verification completed successfully`, { result: JSON.stringify(result) });

  return result;
};

const getPatient = async (patientId: string) => {
  LOGGER.debug(`Fetching patient with ID: ${patientId}`);

  const patient = await Patient.findOne({
    _id: patientId,
    deleted: false,
  });
  LOGGER.debug(`Patient lookup result`, { patient: JSON.stringify(patient) });

  if (!patient) {
    LOGGER.error(`Patient with ID ${patientId} not found`);
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
  LOGGER.debug(`Patient lookup by phone number result`, { patient: JSON.stringify(patient) });

  if (!patient) {
    LOGGER.error(`Patient with phone number ${phoneNumber} not found`);
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
  LOGGER.debug(`Updating patient details for ID: ${patientId}`, { patientData: JSON.stringify(patientData) });

  // Create update object with only the fields that are provided
  const updateData: Partial<UpdatePatientDTO> = {};

  if (patientData.fullName !== undefined) {
    updateData.fullName = patientData.fullName;
    LOGGER.debug(`Adding fullName to update data: ${patientData.fullName}`);
  }

  if (patientData.dateOfBirth !== undefined) {
    updateData.dateOfBirth = patientData.dateOfBirth;
    LOGGER.debug(`Adding dateOfBirth to update data: ${patientData.dateOfBirth}`);
  }

  if (patientData.insuranceName !== undefined) {
    updateData.insuranceName = patientData.insuranceName;
    LOGGER.debug(`Adding insuranceName to update data: ${patientData.insuranceName}`);
  }

  if (patientData.insuranceId !== undefined) {
    updateData.insuranceId = patientData.insuranceId;
    LOGGER.debug(`Adding insuranceId to update data: ${patientData.insuranceId}`);
  }

  LOGGER.debug(`Final update data`, { updateData: JSON.stringify(updateData) });

  // Only update if there are fields to update
  if (Object.keys(updateData).length === 0) {
    LOGGER.debug(`No fields to update, returning current patient data`);
    return await getPatient(patientId);
  }

  const updatedPatient = await Patient.findOneAndUpdate(
    { _id: patientId, deleted: false },
    { $set: updateData },
    { new: true }
  );
  LOGGER.debug(`Patient update result`, { updatedPatient: JSON.stringify(updatedPatient) });

  if (!updatedPatient) {
    LOGGER.error(`Patient with ID ${patientId} not found during update`);
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
  LOGGER.debug(`Adding dependant for patient ID: ${patientId}`, { dependantData: JSON.stringify(dependantData) });

  // Validate required fields
  if (!dependantData.fullName || !dependantData.dateOfBirth) {
    LOGGER.error(`Missing required fields for dependant`, { 
      hasFullName: !!dependantData.fullName, 
      hasDateOfBirth: !!dependantData.dateOfBirth 
    });
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      "Dependant name and date of birth are required"
    );
  }

  // Verify parent patient exists
  LOGGER.debug(`Verifying parent patient exists: ${patientId}`);
  const parentPatient = await Patient.findOne({
    _id: new Types.ObjectId(patientId),
    deleted: false,
  });
  LOGGER.debug(`Parent patient lookup result`, { parentPatient: JSON.stringify(parentPatient) });

  if (!parentPatient) {
    LOGGER.error(`Parent patient with ID ${patientId} not found`);
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Parent patient with ID ${patientId} not found`
    );
  }

  // Create new dependant patient
  LOGGER.debug(`Creating new dependant patient`);
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
  LOGGER.debug(`New dependant created`, { newDependant: JSON.stringify(newDependant) });

  // Send notification about successful dependant addition
  LOGGER.debug(`Sending notification about dependant addition to parent`, { 
    parentId: patientId, 
    phoneNumber: parentPatient.contact.phoneNumber 
  });
  NotificationService.createNotification(
    `Dependant ${dependantData.fullName} successfully added to your account.`,
    EUrgency.LOW,
    EUserType.PATIENT,
    ENotificationDestination.SMS,
    patientId,
    parentPatient.contact.phoneNumber?.toString()
  );
  LOGGER.debug(`Notification sent for dependant addition`);

  return newDependant;
};

const getDependants = async (patientId: string): Promise<IPatient[]> => {
  LOGGER.debug(`Getting dependants for patient ID: ${patientId}`);

  const projection = {
    fullName: 1,
    dateOfBirth: 1,
    insuranceName: 1,
    insuranceId: 1,
  };
  LOGGER.debug(`Using projection for dependants query`, { projection: JSON.stringify(projection) });

  const dependants = await Patient.find(
    {
      "contact.contactRef": new Types.ObjectId(patientId),
      deleted: false,
    },
    projection
  );
  LOGGER.debug(`Found dependants for patient ID: ${patientId}`, { 
    count: dependants.length, 
    dependants: JSON.stringify(dependants) 
  });

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
  LOGGER.debug(`Dependant lookup result`, { dependant: JSON.stringify(dependant) });

  if (!dependant) {
    LOGGER.error(`Dependant with ID ${dependantId} not found`);
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Dependant with ID ${dependantId} not found`
    );
  }

  if (!dependant.contact.contactRef) {
    LOGGER.error(`Patient with ID ${dependantId} is not a dependant (no parent reference found)`);
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      `Patient with ID ${dependantId} is not a dependant (no parent reference found)`
    );
  }

  LOGGER.debug(`Looking up parent with ID: ${dependant.contact.contactRef}`);
  const parentPatient = await Patient.findOne({
    _id: dependant.contact.contactRef,
    deleted: false,
  });
  LOGGER.debug(`Parent patient lookup result`, { parentPatient: JSON.stringify(parentPatient) });

  if (!parentPatient) {
    LOGGER.error(`Parent patient for dependant ID ${dependantId} not found`);
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Parent patient for dependant ID ${dependantId} not found`
    );
  }

  return parentPatient;
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
    insuranceId,
    dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
    contactRef: contactRef ? contactRef.toString() : undefined,
    limit,
  });

  const query: any = { deleted: false };
  LOGGER.debug(`Starting with base query`, { query: JSON.stringify(query) });

  if (patientIds && patientIds.length > 0) {
    query._id = { $in: patientIds };
    LOGGER.debug(`Added patientIds filter to query`, { idCount: patientIds.length });
  }

  if (fullName) {
    query.fullName = { $regex: fullName, $options: "i" };
    LOGGER.debug(`Added fullName filter to query: ${fullName}`);
  }

  if (phoneNumber) {
    query["contact.phoneNumber"] = phoneNumber;
    LOGGER.debug(`Added phoneNumber filter to query: ${phoneNumber}`);
  }

  if (insuranceName) {
    query.insuranceName = insuranceName;
    LOGGER.debug(`Added insuranceName filter to query: ${insuranceName}`);
  }

  if (insuranceId) {
    query.insuranceId = insuranceId;
    LOGGER.debug(`Added insuranceId filter to query: ${insuranceId}`);
  }

  if (dateOfBirth) {
    query.dateOfBirth = dateOfBirth;
    LOGGER.debug(`Added dateOfBirth filter to query: ${dateOfBirth}`);
  }

  if (contactRef) {
    query["contact.contactRef"] = contactRef;
    LOGGER.debug(`Added contactRef filter to query: ${contactRef}`);
  }

  LOGGER.debug(`Final query for patients`, { query: JSON.stringify(query) });

  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
  LOGGER.debug(`Patient search results`, { 
    count: patients.length, 
    patients: JSON.stringify(patients) 
  });

  return patients;
};

const updateInsuranceDetails = async (
  patientId: string,
  insuranceName: EInsuranceName,
  insuranceId: string
): Promise<IPatient | null> => {
  LOGGER.debug(`Updating insurance details for patient ID: ${patientId}`, {
    insuranceName,
    insuranceId
  });

  if (!insuranceName || insuranceName === EInsuranceName.NONE || !insuranceId) {
    LOGGER.error(`Invalid insurance details provided`, {
      hasInsuranceName: !!insuranceName,
      isNoneInsurance: insuranceName === EInsuranceName.NONE,
      hasInsuranceId: !!insuranceId
    });
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      "Both insurance name and insurance ID are required"
    );
  }

  LOGGER.debug(`Updating patient with insurance details`);
  const updatedPatient = await Patient.findByIdAndUpdate(
    patientId,
    {
      insuranceName,
      insuranceId,
    },
    { new: true }
  );
  LOGGER.debug(`Insurance update result`, { updatedPatient: JSON.stringify(updatedPatient) });

  if (!updatedPatient) {
    LOGGER.error(`Patient with ID ${patientId} not found during insurance update`);
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient with ID ${patientId} not found`
    );
  }

  return updatedPatient;
};

const hasVitalInfo = async (
  patientId: string
): Promise<{ fullName?: string; dateOfBirth?: Date }> => {
  LOGGER.debug(`Checking vital info for patient ID: ${patientId}`);

  const patient = await Patient.findById(patientId);
  LOGGER.debug(`Patient lookup result`, { patient: JSON.stringify(patient) });

  if (!patient) {
    LOGGER.error(`Patient with ID ${patientId} not found during vital info check`);
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient with ID ${patientId} not found`
    );
  }

  const missingFields = [];
  if (!patient.fullName) missingFields.push("fullName");
  if (!patient.dateOfBirth) missingFields.push("dateOfBirth");
  LOGGER.debug(`Vital info check results`, { 
    hasFullName: !!patient.fullName, 
    hasDateOfBirth: !!patient.dateOfBirth,
    missingFields: JSON.stringify(missingFields)
  });

  if (missingFields.length > 0) {
    LOGGER.error(`Patient is missing required fields`, { missingFields: JSON.stringify(missingFields) });
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      `Patient is missing required fields: ${missingFields.join(", ")}`
    );
  }

  const vitalInfo = {
    fullName: patient?.fullName,
    dateOfBirth: patient?.dateOfBirth,
  };
  LOGGER.debug(`Vital info retrieved successfully`, { vitalInfo: JSON.stringify(vitalInfo) });

  return vitalInfo;
};

const hasValidInsurance = async (
  patientId: string
): Promise<{ insuranceName: EInsuranceName; insuranceId: string }> => {
  LOGGER.debug(`Checking insurance validity for patient ID: ${patientId}`);

  const patient = await Patient.findById(patientId);
  LOGGER.debug(`Patient lookup result`, { patient: JSON.stringify(patient) });

  if (!patient) {
    LOGGER.error(`Patient with ID ${patientId} not found during insurance check`);
    throw createError(
      HttpStatusCodes.NOT_FOUND,
      `Patient with ID ${patientId} not found`
    );
  }

  const missingFields = [];
  if (!patient.insuranceName || patient.insuranceName === EInsuranceName.NONE)
    missingFields.push("insurance type");
  if (!patient.insuranceId) missingFields.push("insurance ID");
  LOGGER.debug(`Insurance check results`, { 
    hasInsuranceName: !!patient.insuranceName && patient.insuranceName !== EInsuranceName.NONE, 
    hasInsuranceId: !!patient.insuranceId,
    missingFields: JSON.stringify(missingFields)
  });

  if (missingFields.length > 0) {
    LOGGER.error(`Patient is missing required insurance fields`, { missingFields: JSON.stringify(missingFields) });
    throw createError(
      HttpStatusCodes.BAD_REQUEST,
      `Patient is missing required insurance fields: ${missingFields.join(
        ", "
      )}`
    );
  }

  const result = {
    insuranceName: patient?.insuranceName || EInsuranceName.NONE,
    insuranceId: patient?.insuranceId || "",
  };
  LOGGER.debug(`Valid insurance information retrieved`, { result: JSON.stringify(result) });

  return result;
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
