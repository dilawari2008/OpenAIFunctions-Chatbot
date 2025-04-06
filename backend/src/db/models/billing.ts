import DB from "@/db/db";
import { EBillStatus, EPaymentMode } from "@/enums";
import { IBilling } from "@/interfaces/model";
import { Schema } from "mongoose";

const billingSchema: Schema = new Schema<IBilling>(
  {
    name: { type: String },
    contact: { type: String },
    appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
    amount: { type: Number },
    paymentMode: {
      type: String,
      enum: Object.values(EPaymentMode),
      default: EPaymentMode.CASH,
    },
    status: {
      type: String,
      enum: Object.values(EBillStatus),
      default: EBillStatus.PENDING,
    },
    notes: { type: String },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Billing = DB.model<IBilling>("Billing", billingSchema);
