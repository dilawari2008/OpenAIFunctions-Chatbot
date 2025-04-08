// slot functions
const getAvailableTimeSlots = {
  type: "function",
  function: {
    name: "getAvailableTimeSlots",
    description:
      "Retrieves available appointment time slots within a specified date range (maximum 3 days).",
    parameters: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description:
            "Start date in YYYY-MM-DD format. For date references: 'next week' = Monday through Saturday; 'later next week' = Friday and Saturday; 'early this week' = Monday and Tuesday; 'mid week' = Wednesday and Thursday.",
        },
        to: {
          type: "string",
          description:
            "End date in YYYY-MM-DD format. Must be within 3 days of the start date.",
        },
        limit: {
          type: "integer",
          description: "Maximum number of time slots to return (default: 10)",
          default: 1,
        },
      },
      required: ["from", "to"],
    },
  },
};

const getCurrentDate = {
  type: "function",
  function: {
    name: "getCurrentDate",
    description: "Retrieves the current date in UTC",
  },
};

// patient functions

const upsertPatient = {
  type: "function",
  function: {
    name: "upsertPatient",
    description:
      "Creates a new patient or updates an existing one based on phone number, and generates an OTP for verification. Needs to be followed up with verifyPatient tool call.",
    parameters: {
      type: "object",
      properties: {
        phoneNumber: {
          type: "integer",
          description: "The patient's phone number",
        },
      },
      required: ["phoneNumber"],
    },
  },
};

const verifyPatient = {
  type: "function",
  function: {
    name: "verifyPatient",
    description:
      "Verifies a patient's phone number using the provided verification code. For a new patient, this should be followed up with upsertPatient tool call.",
    parameters: {
      type: "object",
      properties: {
        phoneNumber: {
          type: "integer",
          description: "The patient's phone number to verify",
        },
        verificationCode: {
          type: "string",
          description: "The verification code sent to the patient's phone",
        },
      },
      required: ["phoneNumber", "verificationCode"],
    },
  },
};

const getPatientByPhoneNumber = {
  type: "function",
  function: {
    name: "getPatientByPhoneNumber",
    description: "Retrieves a patient's information using their phone number.",
    parameters: {
      type: "object",
      properties: {
        phoneNumber: {
          type: "integer",
          description: "The patient's phone number to look up",
        },
      },
      required: ["phoneNumber"],
    },
  },
};

const updatePatientDetails = {
  type: "function",
  function: {
    name: "updatePatientDetails",
    description: "Updates a patient's information with the provided details.",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The ID of the patient to update",
        },
        patientDetails: {
          fullName: {
            type: "string",
            description: "The patient's full name",
          },
          dateOfBirth: {
            type: "string",
            format: "date",
            description:
              "The patient's date of birth in ISO format (YYYY-MM-DD)",
          },
          insuranceName: {
            type: "string",
            description: "The name of the patient's insurance provider",
          },
          insuranceId: {
            type: "string",
            description: "The patient's insurance ID number",
          },
        },
      },
      required: [
        "patientId",
        "patientDetails.fullName",
        "patientDetails.dateOfBirth",
      ],
    },
  },
};

const addDependant = {
  type: "function",
  function: {
    name: "addDependant",
    description: "Adds a dependant to a patient's account.",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The ID of the parent patient",
        },
        dependantDetails: {
          fullName: {
            type: "string",
            description: "The dependant's full name",
          },
          dateOfBirth: {
            type: "string",
            format: "date",
            description:
              "The dependant's date of birth in ISO format (YYYY-MM-DD)",
          },
          insuranceName: {
            type: "string",
            description:
              "The name of the dependant's insurance provider (optional)",
          },
          insuranceId: {
            type: "string",
            description: "The dependant's insurance ID number (optional)",
          },
        },
      },
      required: [
        "patientId",
        "dependantDetails.fullName",
        "dependantDetails.dateOfBirth",
      ],
    },
  },
};

const getDependants = {
  type: "function",
  function: {
    name: "getDependants",
    description: "Gets all dependants associated with a patient's account.",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The ID of the parent patient",
        },
      },
      required: ["patientId"],
    },
  },
};

const getParentPatient = {
  type: "function",
  function: {
    name: "getParentPatient",
    description: "Gets the parent patient of a dependant.",
    parameters: {
      type: "object",
      properties: {
        dependantId: {
          type: "string",
          description: "The ID of the dependant patient",
        },
      },
      required: ["dependantId"],
    },
  },
};

const updateInsuranceDetails = {
  type: "function",
  function: {
    name: "updateInsuranceDetails",
    description: "Updates a patient's insurance details.",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The ID of the patient",
        },
        insuranceName: {
          type: "string",
          description: "The name of the patient's insurance provider",
        },
        insuranceId: {
          type: "string",
          description: "The patient's insurance ID number",
        },
      },
      required: ["patientId", "insuranceName", "insuranceId"],
    },
  },
};

// appointment functions

const getAppointments = {
  type: "function",
  function: {
    name: "getAppointments",
    description: "Retrieves appointments for a patient with optional filters.",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The ID of the patient",
        },
        appointmentIds: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Optional list of specific appointment IDs to retrieve",
        },
        status: {
          type: "string",
          enum: [
            "SCHEDULED",
            "COMPLETED",
            "CANCELLED",
            "RESCHEDULED",
            "PENDING",
            "EXPIRED",
          ],
          description: "Filter by appointment status",
        },
        timing: {
          type: "string",
          description: "Filter by appointment date (YYYY-MM-DD)",
        },
        slot: {
          type: "string",
          enum: [
            "SLOT_1",
            "SLOT_2",
            "SLOT_3",
            "SLOT_4",
            "SLOT_5",
            "SLOT_6",
            "SLOT_7",
            "SLOT_8",
            "SLOT_9",
            "SLOT_10",
          ],
          description: "Filter by appointment slot",
        },
        appointmentType: {
          type: "string",
          enum: ["CLEANING", "CHECKUP", "ROOT_CANAL"],
          description: "Filter by appointment type",
        },
        limit: {
          type: "integer",
          description: "Maximum number of appointments to return (default: 10)",
          default: 10,
        },
      },
      required: ["patientId"],
    },
  },
};

const getUpcomingAppointmentsForPatient = {
  type: "function",
  function: {
    name: "getUpcomingAppointmentsForPatient",
    description: "Retrieves upcoming scheduled appointments for a patient.",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The ID of the patient",
        },
        limit: {
          type: "integer",
          description: "Maximum number of appointments to return (default: 10)",
          default: 10,
        },
      },
      required: ["patientId"],
    },
  },
};

const scheduleAppointment = {
  type: "function",
  function: {
    name: "scheduleAppointment",
    description: "Schedules a new appointment for a patient.",
    parameters: {
      type: "object",
      properties: {
        slotIds: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Array of slot IDs to book for the appointment",
        },
        patientId: {
          type: "string",
          description: "The ID of the patient",
        },
        paymentMode: {
          type: "string",
          description:
            "Payment method for the appointment (INSURANCE, CASH, CREDIT, PAYPAL)",
        },
      },
      required: ["slotIds", "patientId", "paymentMode"],
    },
  },
};

const cancelAppointment = {
  type: "function",
  function: {
    name: "cancelAppointment",
    description: "Cancels an existing appointment.",
    parameters: {
      type: "object",
      properties: {
        appointmentId: {
          type: "string",
          description: "The ID of the appointment to cancel",
        },
        patientId: {
          type: "string",
          description: "The ID of the patient who owns the appointment",
        },
      },
      required: ["appointmentId", "patientId"],
    },
  },
};

const rescheduleAppointment = {
  type: "function",
  function: {
    name: "rescheduleAppointment",
    description: "Reschedules an existing appointment to a new time slot.",
    parameters: {
      type: "object",
      properties: {
        appointmentId: {
          type: "string",
          description: "The ID of the appointment to reschedule",
        },
        patientId: {
          type: "string",
          description: "The ID of the patient who owns the appointment",
        },
        newSlotId: {
          type: "string",
          description: "The ID of the new time slot",
        },
      },
      required: ["appointmentId", "patientId", "newSlotId"],
    },
  },
};

const bulkScheduleAppointments = {
  type: "function",
  function: {
    name: "bulkScheduleAppointments",
    description: "Schedules multiple appointments in a single request.",
    parameters: {
      type: "object",
      properties: {
        appointmentRequests: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slotId: {
                type: "string",
                description: "The ID of the slot to book",
              },
              patientId: {
                type: "string",
                description: "The ID of the patient",
              },
              paymentMode: {
                type: "string",
                description:
                  "Payment method for the appointment (INSURANCE, CASH, CREDIT, PAYPAL)",
              },
            },
            required: ["slotId", "patientId", "paymentMode"],
          },
          description: "Array of appointment requests to process",
        },
      },
      required: ["appointmentRequests"],
    },
  },
};

// notifications functions

const sendEmergencyNotification = {
  type: "function",
  function: {
    name: "sendEmergencyNotification",
    description:
      "Sends an emergency notification to administrators and the patient via SMS.",
    parameters: {
      type: "object",
      properties: {
        emergencySummary: {
          type: "string",
          description: "A brief summary of the emergency situation",
        },
        phoneNumber: {
          type: "string",
          description: "The patient's phone number",
        },
        patientName: {
          type: "string",
          description: "The name of the patient",
        },
      },
      required: ["emergencySummary", "phoneNumber", "patientName"],
    },
  },
};

const tools = [
  getAvailableTimeSlots,
  getCurrentDate,
  upsertPatient,
  verifyPatient,
  getPatientByPhoneNumber,
  updatePatientDetails,
  addDependant,
  getDependants,
  getParentPatient,
  getAppointments,
  getUpcomingAppointmentsForPatient,
  scheduleAppointment,
  cancelAppointment,
  rescheduleAppointment,
  bulkScheduleAppointments,
  sendEmergencyNotification,
  updateInsuranceDetails,
];

export default tools;
