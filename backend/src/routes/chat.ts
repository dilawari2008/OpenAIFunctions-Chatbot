import { forwardRequest } from "@/common";
import ChatController from "@/controllers/chat";

import { Router } from "express";

const ChatRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/chat/session:
 *   post:
 *     summary: Get chat session
 *     description: Creates or retrieves a chat session
 *     tags: [Chat]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Session ID (optional for new sessions)
 *               patientId:
 *                 type: string
 *                 description: Patient ID for the chat session
 *     responses:
 *       200:
 *         description: Chat session retrieved/created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
ChatRouter.post("/session", forwardRequest(ChatController.getSession));

/**
 * @swagger
 * /api/chat/merge:
 *   post:
 *     summary: Merge chat sessions
 *     description: Combines multiple chat sessions into one
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionIds
 *             properties:
 *               sessionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of session IDs to merge
 *               targetSessionId:
 *                 type: string
 *                 description: Optional target session ID to merge into
 *     responses:
 *       200:
 *         description: Sessions merged successfully
 *       400:
 *         description: Invalid session IDs
 *       404:
 *         description: One or more sessions not found
 *       500:
 *         description: Server error
 */
ChatRouter.post("/merge", forwardRequest(ChatController.mergeSessions));

/**
 * @swagger
 * /api/chat/process:
 *   post:
 *     summary: Process chat message
 *     description: Processes a chat message and returns a response
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Session ID
 *               message:
 *                 type: string
 *                 description: Chat message to process
 *     responses:
 *       200:
 *         description: Chat message processed successfully
 *       400:
 *         description: Invalid session ID or message
 *       500:
 *         description: Server error
 */
ChatRouter.post("/process", forwardRequest(ChatController.processChat));

export default ChatRouter;
