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
    createBillingDTO,
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

  const billing = await Billing.create(bill);

  await paymentGateway(billing.amount, billing.paymentMode, billing.isRefund);

  billing.status = EBillStatus.SUCCESS;
  await billing.save();

  // Send notification based on payment type
  if (billing.isRefund) {
    NotificationService.createNotification(
      `Refund for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.MEDIUM,
      EUserType.PATIENT,
      ENotificationDestination.SMS,
      billing.patientId.toString(),
      billing.contact
    );

    NotificationService.createNotification(
      `Refund for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.MEDIUM,
      EUserType.ADMIN,
      ENotificationDestination.ADMIN_PANEL
    );
  } else {
    NotificationService.createNotification(
      `Payment for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.MEDIUM,
      EUserType.PATIENT,
      ENotificationDestination.SMS,
      createBillingDTO?.patientId?.toString(),
      billing.contact
    );

    NotificationService.createNotification(
      `Payment for billing ${billing._id} of amount $${billing.amount}`,
      EUrgency.LOW,
      EUserType.ADMIN,
      ENotificationDestination.ADMIN_PANEL
    );
  }

  return billing.status;
};

const makeFullRefund = async (billingId: string) => {
  LOGGER.debug("Making refund", {
    billingId,
  });

  const originalBilling = await Billing.findById(billingId);
  if (!originalBilling) {
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

  return await makePayment(refundDTO);
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
  adjustArrears,
};

export default BillingService;
