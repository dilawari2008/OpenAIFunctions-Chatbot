const getAvailableTimeSlots = {
  "type": "function",
  "function": {
    "name": "getAvailableTimeSlots",
    "description":
      "Retrieves available appointment time slots within a specified date range (maximum 3 days).",
    "parameters": {
      "type": "object",
      "properties": {
        "from": {
          "type": "string",
          "description":
            "Start date in YYYY-MM-DD format. For date references: 'next week' = Monday through Saturday; 'later next week' = Friday and Saturday; 'early this week' = Monday and Tuesday; 'mid week' = Wednesday and Thursday.",
        },
        "to": {
          "type": "string",
          "description":
            "End date in YYYY-MM-DD format. Must be within 3 days of the start date.",
        },
        "limit": {
          "type": "integer",
          "description": "Maximum number of time slots to return (default: 10)",
          "default": 1,
        },
      },
      "required": ["from", "to"],
    },
  },
};

const getAvailableTimeSlotsByType = {
  "type": "function",
  "function": {
    "name": "getAvailableTimeSlotsByType",
    "description":
      "Retrieves available appointment time slots within a specified date range for a specific appointment type.",
    "parameters": {
      "type": "object",
      "properties": {
        "from": {
          "type": "string",
          "description": "Start date in YYYY-MM-DD format.",
        },
        "to": {
          "type": "string",
          "description": "End date in YYYY-MM-DD format.",
        },
        "type": {
          "type": "string",
          "description": "The type of appointment to find slots for.",
        },
        "limit": {
          "type": "integer",
          "description": "Maximum number of time slots to return (default: 10)",
          "default": 10,
        },
      },
      "required": ["from", "to", "type"],
    },
  },
};


const getCurrentDate = {
  "type": "function",
  "function": {
    "name": "getCurrentDate",
    "description": "Retrieves the current date in UTC",
  },
};


const getAppointmentTypes = {
  "type": "function",
  "function": {
    "name": "getAppointmentTypes",
    "description": "Retrieves all available appointment types and their pricing.",
  },
};

const getPaymentMethods = {
  "type": "function",
  "function": {
    "name": "getPaymentMethods",
    "description": "Retrieves all available payment methods.",
  },
};

const getInsuranceProviders = {
  "type": "function",
  "function": {
    "name": "getInsuranceProviders",
    "description": "Retrieves all available insurance providers.",
  },
};


const tools = [getAvailableTimeSlots, getCurrentDate, getAppointmentTypes, getPaymentMethods, getInsuranceProviders];

export default tools;
