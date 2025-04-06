import LOGGER from "@/common/logger";
import { Appointment } from "@/db/models/appointment";
import { Types } from "mongoose";
import { getEndOfDayInUTC, getStartOfDayInUTC } from "@/utils";
import { EAppointmentStatus } from "@/enums";

const getAppointments = async ({
  patientId,
  appointmentIds,
  status,
  timing,
  slot,
  appointmentType,
  limit = 10,
}: {
  patientId: Types.ObjectId | string;
  appointmentIds?: Types.ObjectId[] | string[];
  status?: string;
  timing?: Date;
  slot?: string;
  appointmentType?: string;
  limit?: number;
}) => {
  const query: any = { deleted: false };

  // patientId is mandatory
  query.patientId = new Types.ObjectId(patientId);

  if (appointmentIds && appointmentIds.length > 0) {
    query._id = { $in: appointmentIds.map((id) => new Types.ObjectId(id)) };
  }

  if (status) {
    query.status = status;
  }

  if (timing) {
    query.timing = {
      $gte: getStartOfDayInUTC(timing),
      $lte: getEndOfDayInUTC(timing),
    };
  }

  if (slot) {
    query.slot = slot;
  }

  if (appointmentType) {
    query.appointmentType = appointmentType;
  }

  const appointments = await Appointment.find(query)
    .sort({ timing: 1 })
    .limit(limit);

  return appointments;
};

const getUpcomingAppointmentsForPatient = async ({
  patientId,
  limit = 10,
}: {
  patientId: Types.ObjectId | string;
  limit?: number;
}) => {
  LOGGER.debug("Getting upcoming appointments for patient", {
    patientId: JSON.stringify(patientId),
    limit,
  });

  const query: any = {
    deleted: false,
    patientId: new Types.ObjectId(patientId),
    timing: { $gte: new Date() },
    status: EAppointmentStatus.SCHEDULED,
  };

  const appointments = await Appointment.find(query)
    .sort({ timing: 1 })
    .limit(limit);

  return appointments;
};

const AppointmentService = {
  getAppointments,
  getUpcomingAppointmentsForPatient,
};

export default AppointmentService;
