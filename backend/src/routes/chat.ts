import { forwardRequest } from "@/common";
import ChatController from "@/controllers/chat";

import { Router } from "express";

const ChatRouter = Router({ mergeParams: true });

ChatRouter.post("/session", forwardRequest(ChatController.getSession));

ChatRouter.post("/merge", forwardRequest(ChatController.mergeSessions));

export default ChatRouter;
