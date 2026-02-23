import Message from "../models/message.js";
import User from "../models/user.js";
import cloudinary from "../lib/cloudinary.js"
import { io, userSocketMap } from "../server.js"
import {  getPublicIdFromUrl } from "../lib/utils.js";


// get all users except the logged in user 
export const getUserForSidebar = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.json({ success: false, msg: "Auth user not found in request" });
        }

        const loggedInUserId = req.user._id;
        // Rename this to something distinct to avoid conflict with the 'user' parameter in map
        const sidebarUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        // count for unseen msgs
        const unSeenMessages = {}
        const promises = sidebarUsers.map(async (u) => {
            const messages = await Message.find({ senderId: u._id, receiverId: loggedInUserId, seen: false })
            if (messages.length > 0) {
                unSeenMessages[u._id] = messages.length;
            }
        })

        await Promise.all(promises);
        // console.log("get users api response : ", { success: true, users: sidebarUsers, unSeenMessages });
        return res.json({ success: true, users: sidebarUsers, unSeenMessages });

    } catch (error) {
        console.log("Error in getUserForSidebar:", error.message);
        return res.json({ success: false, msg: error.message });
    }
}


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
            ]
        })

        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true })

        return res.json({ success: true, messages });

    } catch (error) {
        console.log("Error in getMessages:", error.message);
        return res.json({ success: false, msg: error.message });
    }
}

// api to mark messages as seen using messages id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });

        return res.json({ success: true });

    } catch (error) {
        console.log("Error in markMessageAsSeen:", error.message);
        return res.json({ success: false, msg: error.message });
    }
}


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
            senderId: senderId,
            receiverId: receiverId,
            text,
            image: imageUrl,
        })

        // Emit new message to selected user(receiver's socket)
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        return res.json({ success: true, newmsg: newMessage });

    } catch (error) {
        console.log("Error in sendMessage:", error.message);
        return res.json({ success: false, msg: error.message });
    }
}



//delete message 
export const deleteMessage = async (req, res) => {

    try {

        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(400).json({ success: false, msg: "Message not found" });
        }


        // only user can delete it 
        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, msg: "Not authorized to delete message" });
        }

        // if image then also delete from cloudinary
        if (message.image) {

            // New format (object)
            // if (typeof message.image === "object" && message.image.public_id) {
            //     publicId = message.image.public_id;
            // }

            const publicId = getPublicIdFromUrl(message.image);

            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        //delete message from db
        await Message.findByIdAndDelete(messageId);

        // const io = req.app.get("io");
        // io.to(message.receiverId.toString()).emit("messageDeleted", messageId);

        const receiverSocketId = userSocketMap[message.receiverId.toString()];

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", messageId);
        }
        // console.log("Receiver socket:", receiverSocketId);

        return res.json({ success: true, msg: "message delete successfully " })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, msg: "Server error" });
    }
}
