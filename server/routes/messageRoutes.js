import express from "express";
import protectRoute from "../middleware/auth.js";
import {
  clearChatForMe,
  deleteMessage,
  getMessages,
  getUserForSidebar,
  markMessageAsSeen,
  sendMessage,
} from "../controller/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUserForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.delete("/delete/:messageId", protectRoute, deleteMessage);
messageRouter.put("/clear/:receiverId", protectRoute, clearChatForMe);

export default messageRouter;
