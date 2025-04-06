import { forwardRequest } from "@/common";
import SlotController from "@/controllers/slot";

import { Router } from "express";

const SlotRouter = Router({ mergeParams: true });

SlotRouter.get(
  "/available",
  forwardRequest(SlotController.getAvailableTimeSlotsForDateRange)
);

SlotRouter.post("/book", forwardRequest(SlotController.bookSlot));

SlotRouter.post(
  "/slots-for-the-month",
  forwardRequest(SlotController.createSlotsForTheMonth)
);

SlotRouter.get(
  "/current-date",
  forwardRequest(SlotController.getCurrentDateInUTC)
);

export default SlotRouter;
