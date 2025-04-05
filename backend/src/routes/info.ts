import { forwardRequest } from "@/common";
import InfoController from "@/controllers/info";
import { Router } from "express";

const InfoRouter = Router({ mergeParams: true });

InfoRouter.get(
  "/payment-methods",
  forwardRequest(InfoController.getPaymentMethods)
);

InfoRouter.get(
  "/insurance-providers",
  forwardRequest(InfoController.getInsuranceProviders)
);

export default InfoRouter;
