import { ChatSession } from "@/db/models/session";
import SlotService from "@/services/slot";
import { getStartOfDayInUTC } from "@/utils";
import axios from "axios";
import { PromptLibrary } from "./prompt-library";
import tools from "./function";
import { Types } from "mongoose";
import AppointmentService from "@/services/appointment";
import NotificationService from "@/services/notification";
import PatientService from "@/services/patient";

const toolCalls = async (name: string, args: string) => {
  console.log("Tool call:", name, args);
  switch (name) {
    case "getAvailableTimeSlots":
      const { from, to, limit } = JSON.parse(args);
      return await SlotService.getAvailableTimeSlots(
        getStartOfDayInUTC(from),
        getStartOfDayInUTC(to),
        limit
      );

    case "getAvailableTimeSlotsByType":
      const { from1, to1, type, limit1 } = JSON.parse(args);
      return await SlotService.getAvailableTimeSlotsByType(
        getStartOfDayInUTC(from1),
        getStartOfDayInUTC(to1),
        type,
        limit1
      );

    case "getCurrentDate":
      return await SlotService.getCurrentDateInUTC();
    case "getAppointments":
      const appointmentParams = JSON.parse(args);
      return await AppointmentService.getAppointments(appointmentParams);
    case "getUpcomingAppointmentsForPatient":
      const upcomingParams = JSON.parse(args);
      return await AppointmentService.getUpcomingAppointmentsForPatient(
        upcomingParams
      );
    case "scheduleAppointment":
      const scheduleParams = JSON.parse(args);
      return await AppointmentService.scheduleAppointment(scheduleParams);
    case "cancelAppointment":
      const cancelParams = JSON.parse(args);
      return await AppointmentService.cancelAppointment(cancelParams);
    case "rescheduleAppointment":
      const rescheduleParams = JSON.parse(args);
      return await AppointmentService.rescheduleAppointment(rescheduleParams);
    case "bulkScheduleAppointments":
      const bulkScheduleParams = JSON.parse(args);
      return await AppointmentService.bulkScheduleAppointments(
        bulkScheduleParams.appointmentRequests
      );
    case "sendEmergencyNotification":
      const emergencyParams = JSON.parse(args);
      return await NotificationService.sendEmergencyNotification(
        emergencyParams.emergencySummary,
        emergencyParams.phoneNumber,
        emergencyParams.patientName
      );
    case "upsertPatient":
      const upsertParams = JSON.parse(args);
      return await PatientService.upsertPatient(
        Number(upsertParams.phoneNumber)
      );
    case "verifyPatient":
      const verifyParams = JSON.parse(args);
      return await PatientService.verifyPhoneNumber(
        Number(verifyParams.phoneNumber),
        verifyParams.verificationCode
      );
    case "getPatientByPhoneNumber":
      const patientPhoneParams = JSON.parse(args);
      return await PatientService.getPatientByPhoneNumber(
        Number(patientPhoneParams.phoneNumber)
      );
    case "updatePatientDetails":
      const updatePatientParams = JSON.parse(args);
      return await PatientService.updatePatientDetails(
        updatePatientParams.patientId,
        updatePatientParams.patientDetails
      );
    case "addDependant":
      const dependantParams = JSON.parse(args);
      return await PatientService.addDependant(
        dependantParams.parentId,
        dependantParams.dependantDetails
      );
    case "getDependants":
      const getDependantsParams = JSON.parse(args);
      return await PatientService.getDependants(getDependantsParams.patientId);
    case "getParentPatient":
      const parentPatientParams = JSON.parse(args);
      return await PatientService.getParentPatient(
        parentPatientParams.dependantId
      );
    case "updateInsuranceDetails":
      const insuranceParams = JSON.parse(args);
      return await PatientService.updateInsuranceDetails(
        insuranceParams.patientId,
        insuranceParams.insuranceName,
        insuranceParams.insuranceId
      );

    default:
      throw new Error(`Tool call ${name} not found`);
  }
};

const processChat = async (sessionId: string, message: string) => {
  let session = await ChatSession.findOne({
    _id: new Types.ObjectId(sessionId),
  });
  if (!session) {
    throw new Error("Session not found");
  }
  let messages = session?.messages || [];

  if (messages.length === 0) {
    messages.push({
      role: "system",
      content: PromptLibrary.dentalBotPersonality,
    });
  }

  messages.push({
    role: "user",
    content: message,
  });

  const finalMessages = await processConversationWithTools(messages);

  session.messages = finalMessages;
  await session.save();

  return finalMessages;
};

const processConversationWithTools = async (messages: any[]) => {
  let continueProcessing = true;

  while (continueProcessing) {
    const response = await callOpenAI(messages);

    messages.push(response);

    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        const {
          id,
          function: { name, arguments: args },
        } = toolCall;

        try {
          console.log(`Tool call: ${name}`, args);

          const result = await toolCalls(name, args);

          messages.push({
            role: "tool",
            tool_call_id: id,
            content: JSON.stringify(result),
          });
        } catch (error: any) {
          console.log(
            `Tool call error: ${name}`,
            args,
            error.message,
            error.stack
          );

          messages.push({
            role: "tool",
            tool_call_id: id,
            content: JSON.stringify({ error: error.message }),
          });
        }
      }
    } else {
      continueProcessing = false;
    }
  }

  return messages;
};

const callOpenAI = async (messages: any[]) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages,
        tools,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw new Error("Failed to process chat with OpenAI");
  }
};

const ChatService = {
  toolCalls,
  processChat,
};

export default ChatService;
