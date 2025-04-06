import LOGGER from "@/common/logger";
import {
  EBillStatus,
  ENotificationDestination,
  EPaymentMode,
  EUrgency,
  EUserType,
} from "@/enums";
import { AdjustArrearsDTO, CreateBillingDTO } from "@/interfaces/dto";
import { IBilling } from "@/interfaces/model";
import { Billing } from "@/db/models/billing";
import { Types } from "mongoose";
import NotificationService from "@/services/notification";

const paymentGateway = async (
  amount: number,
  paymentMode: EPaymentMode,
  isRefund: boolean
) => {
  LOGGER.debug("Payment complete", {
    amount,
    paymentMode,
    isRefund,
  });
};

const makePayment = async (
  createBillingDTO: CreateBillingDTO
): Promise<EBillStatus> => {
  LOGGER.debug("Making payment", {
    createBillingDTO: JSON.stringify(createBillingDTO),
  });

  const bill: IBilling = {
    name: createBillingDTO.name,
    contact: createBillingDTO.contact,
    appointments: createBillingDTO.appointments.map(
      (appointment) => new Types.ObjectId(appointment)
    ),
    amount: createBillingDTO.amount,
    paymentMode: createBillingDTO.paymentMode,
    isRefund: createBillingDTO?.isRefund || false,
    notes: createBillingDTO?.notes,
    status: EBillStatus.PENDING,
  };
  LOGGER.debug("Created bill object", { bill: JSON.stringify(bill) });

  const billing = await Billing.create(bill);
  LOGGER.debug("Billing record created in database", { billing: JSON.stringify(billing) });

  await paymentGateway(billing.amount, billing.paymentMode, billing.isRefund);
  LOGGER.debug("Payment gateway processed transaction", {
    amount: billing.amount,
    paymentMode: billing.paymentMode,
    isRefund: billing.isRefund
  });

  billing.status = EBillStatus.SUCCESS;
  LOGGER.debug("Updated billing status to SUCCESS");
  
  await billing.save();
  LOGGER.debug("Saved updated billing status to database", { billingId: billing._id });

  // Send notification based on payment type
  if (billing.isRefund) {
    LOGGER.debug("Processing refund notification", { 
      billingId: billing._id, 
      amount: billing.amount,
      isRefund: billing.isRefund 
    });
    
    NotificationService.createNotification(
      `Refund for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.MEDIUM,
      EUserType.PATIENT,
      ENotificationDestination.SMS,
      billing.patientId.toString(),
      billing.contact
    );
    LOGGER.debug("Sent refund notification to patient", { 
      patientId: billing.patientId.toString(),
      contact: billing.contact 
    });

    NotificationService.createNotification(
      `Refund for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.MEDIUM,
      EUserType.ADMIN,
      ENotificationDestination.ADMIN_PANEL
    );
    LOGGER.debug("Sent refund notification to admin");
  } else {
    LOGGER.debug("Processing payment notification", { 
      billingId: billing._id, 
      amount: billing.amount 
    });
    
    NotificationService.createNotification(
      `Payment for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.MEDIUM,
      EUserType.PATIENT,
      ENotificationDestination.SMS,
      createBillingDTO?.patientId?.toString(),
      billing.contact
    );
    LOGGER.debug("Sent payment notification to patient", { 
      patientId: createBillingDTO?.patientId?.toString(),
      contact: billing.contact 
    });

    NotificationService.createNotification(
      `Payment for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.LOW,
      EUserType.ADMIN,
      ENotificationDestination.ADMIN_PANEL
    );
    LOGGER.debug("Sent payment notification to admin");
  }

  LOGGER.debug("Payment process completed successfully", { 
    billingId: billing._id, 
    status: billing.status 
  });
  return billing.status;
};

const makeFullRefund = async (billingId: string) => {
  LOGGER.debug("Making refund", {
    billingId,
  });

  const originalBilling = await Billing.findById(billingId);
  LOGGER.debug("Found original billing record", { 
    originalBilling: originalBilling ? JSON.stringify(originalBilling) : "not found" 
  });
  
  if (!originalBilling) {
    LOGGER.debug("Billing record not found", { billingId });
    throw new Error("Billing record not found");
  }

  const refundDTO: CreateBillingDTO = {
    patientId: originalBilling.patientId,
    name: originalBilling.name,
    contact: originalBilling.contact,
    appointments: originalBilling.appointments.map((id) => id.toString()),
    amount: originalBilling.amount,
    paymentMode: originalBilling.paymentMode,
    isRefund: true,
    notes: `Refund for billing ${billingId}`,
  };
  LOGGER.debug("Created refund DTO", { refundDTO: JSON.stringify(refundDTO) });

  const result = await makePayment(refundDTO);
  LOGGER.debug("Refund payment completed", { status: result });
  return result;
};

const adjustArrears = async (adjustArrearsDTO: AdjustArrearsDTO) => {
  LOGGER.debug("Adjusting arrears", {
    appointmentId: adjustArrearsDTO.appointment,
    amount: adjustArrearsDTO.amount,
  });

  const refundDTO: CreateBillingDTO = {
    patientId: adjustArrearsDTO.patientId,
    name: adjustArrearsDTO.name,
    contact: adjustArrearsDTO.contact,
    appointments: [adjustArrearsDTO.appointment.toString()],
    amount: adjustArrearsDTO.amount,
    paymentMode: adjustArrearsDTO.paymentMode,
    isRefund: adjustArrearsDTO.isRefund,
    notes: adjustArrearsDTO.notes || `Adjusting arrears for appointment`,
  };

  return await makePayment(refundDTO);
};

const BillingService = {
  makePayment,
  makeFullRefund,
};

export default BillingService;
