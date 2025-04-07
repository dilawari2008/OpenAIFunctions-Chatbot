import { forwardRequest } from "@/common";
import ChatController from "@/controllers/chat";

import { Router } from "express";

const ChatRouter = Router({ mergeParams: true });

ChatRouter.post("/session", forwardRequest(ChatController.createThread));
ChatRouter.post("/merge", forwardRequest(ChatController.mergeSessions));
ChatRouter.post("/process", forwardRequest(ChatController.processChat));
ChatRouter.post("/assistant", forwardRequest(ChatController.createAssistant));
ChatRouter.get("/messages", forwardRequest(ChatController.getMessagesbyThreadId));

export default ChatRouter;
