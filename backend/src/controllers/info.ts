import { Request, Response, NextFunction } from "express";
import InfoService from "@/services/info";
import LOGGER from "@/common/logger";

const getPaymentMethods = async (req: Request, res: Response) => {
  const paymentMethods = await InfoService.getPaymentMethods();
  res.sendFormatted(paymentMethods);
};

const getInsuranceProviders = async (req: Request, res: Response) => {
  const insuranceProviders = await InfoService.getInsuranceProviders();
  res.sendFormatted(insuranceProviders);
};

const InfoController = {
  getPaymentMethods,
  getInsuranceProviders,
};

export default InfoController;
