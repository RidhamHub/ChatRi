import Message from "../models/message.js";
import User from "../models/user.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { getPublicIdFromUrl } from "../lib/utils.js";

// get all users except the logged in user
export const getUserForSidebar = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.json({ success: false, msg: "Auth user not found in request" });
    }

    const loggedInUserId = req.user._id;
    const sidebarUsers = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password",
    );

    const unSeenMessages = {};
    const promises = sidebarUsers.map(async (u) => {
      const messages = await Message.find({
        senderId: u._id,
        receiverId: loggedInUserId,
        seen: false,
      });

      if (messages.length > 0) {
        unSeenMessages[u._id] = messages.length;
      }
    });

    await Promise.all(promises);
    return res.json({ success: true, users: sidebarUsers, unSeenMessages });
  } catch (error) {
    console.log("Error in getUserForSidebar:", error.message);
    return res.json({ success: false, msg: error.message });
  }
};

// Get all messages for selected user
export const getMessages = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.json({ success: false, msg: "Auth user not found in request" });
    }

    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
      clearedFor: { $ne: myId }, // clearted user ne pn dhyan ma le 
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true },
    );

    const senderSocketId = userSocketMap[selectedUserId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen", {
        seenBy: myId,
      });
    }

    return res.json({ success: true, messages });
  } catch (error) {
    console.log("Error in getMessages:", error.message);
    return res.json({ success: false, msg: error.message });
  }
};

// api to mark messages as seen using sender id
export const markMessageAsSeen = async (req, res) => {
  try {
    const senderId = req.params.id;
    const myId = req.user._id;

    await Message.updateMany(
      {
        senderId,
        receiverId: myId,
        seen: false,
      },
      {
        $set: { seen: true },
      },
    );

    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen", {
        seenBy: myId,
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.log("Error in markMessageAsSeen:", error.message);
    return res.json({ success: false, msg: error.message });
  }
};

// send message to selected user
export const sendMessage = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.json({ success: false, msg: "Auth user not found in request" });
    }

    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.json({ success: true, newmsg: newMessage });
  } catch (error) {
    console.log("Error in sendMessage:", error.message);
    return res.json({ success: false, msg: error.message });
  }
};

// delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(400).json({ success: false, msg: "Message not found" });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, msg: "Not authorized to delete message" });
    }

    if (message.image) {
      const publicId = getPublicIdFromUrl(message.image);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Message.findByIdAndDelete(messageId);

    const receiverSocketId = userSocketMap[message.receiverId.toString()];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    return res.json({ success: true, msg: "message delete successfully " });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// clear chat for current user
export const clearChatForMe = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      {
        $or: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
      },
      {
        $addToSet: { clearedFor: userId },
      },
    );

    const messagesToDelete = await Message.find({
        senderId: { $in: [userId, receiverId] }, //value must be inside this array
        receiverId: { $in: [userId, receiverId] }, //receiver must also be one of the two users.
        clearedFor: { $all: [userId, receiverId] }, //The array must contain ALL given values
    });

    for (const msg of messagesToDelete) {
      if (msg.image) {
        const publicId = getPublicIdFromUrl(msg.image);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    if (messagesToDelete.length > 0) {
      await Message.deleteMany({
        _id: { $in: messagesToDelete.map((m) => m._id) },
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Chat cleared successfully" });
  } catch (error) {
    console.log("Error in clearChatForMe:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};
