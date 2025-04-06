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
  LOGGER.debug("Billing record created in database", {
    billing: JSON.stringify(billing),
  });

  await paymentGateway(billing.amount, billing.paymentMode, billing.isRefund);
  LOGGER.debug("Payment gateway processed transaction", {
    amount: billing.amount,
    paymentMode: billing.paymentMode,
    isRefund: billing.isRefund,
  });

  billing.status = EBillStatus.SUCCESS;
  LOGGER.debug("Updated billing status to SUCCESS");

  await billing.save();
  LOGGER.debug("Saved updated billing status to database", {
    billingId: billing._id,
  });

  // Send notification based on payment type
  if (billing.isRefund) {
    LOGGER.debug("Processing refund notification", {
      billingId: billing._id,
      amount: billing.amount,
      isRefund: billing.isRefund,
    });

    NotificationService.createNotification(
      `Refund for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.MEDIUM,
      EUserType.PATIENT,
      ENotificationDestination.SMS,
      createBillingDTO?.patientId?.toString(),
      billing.contact
    );
    LOGGER.debug("Sent refund notification to patient", {
      patientId: createBillingDTO?.patientId?.toString(),
      contact: billing.contact,
    });

    NotificationService.createNotification(
      `Refund of amount $${billing.amount}`,
      EUrgency.MEDIUM,
      EUserType.ADMIN,
      ENotificationDestination.ADMIN_PANEL
    );
    LOGGER.debug("Sent refund notification to admin");
  } else {
    LOGGER.debug("Processing payment notification", {
      billingId: billing._id,
      amount: billing.amount,
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
      contact: billing.contact,
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
    status: billing.status,
  });
  return billing.status;
};

const BillingService = {
  makePayment,
};

export default BillingService;
