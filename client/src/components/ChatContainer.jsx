import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formateMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/chatContext";
import { AuthContext } from "../../context/authContext";
import toast from "react-hot-toast";
import RightSideBar from "./RightSideBar";
import { Socket } from "../lib/socket";
import axios from "axios";


function ChatContainer() {
  const {
    messages,
    setMessages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
  } = useContext(ChatContext);
  const { authUser, onlineUser } = useContext(AuthContext);

  const [showInfo, setShowInfo] = useState(false);

  const scrollEnd = useRef();

  const [input, setInput] = useState(""); // input for message

  const [isuploading, setIsUploading] = useState(false);

  // handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return null;

    await sendMessage({ text: input.trim() });

    setInput("");
  };

  //handle delete message
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/messages/delete/${id}`);

      setMessages((prev) => prev.filter((msg) => msg._id != id));
    } catch (error) {
      console.log("error in deleting message (frontend) : ", error);
      toast.error("Failed to delete message ");
    }
  };

  // delete thay tyare refresh karva mate
  useEffect(() => {
    Socket.on("messageDeleted", (id) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
    });

    return () => {
      Socket.off("messageDeleted");
    };
  }, []);

  // handle sending an image
  const handleSendImg = async (e) => {
    if (isuploading) return;
    const file = e.target.files[0];

    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result;

      await sendMessage({ image: base64 });

      // reset file input
      e.target.value = "";
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  // ref vala div ma navu kai ave to useEffect call thay and ema scroll to end smooth thay e code lakhyo aya
  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {showInfo && <RightSideBar onClose={() => setShowInfo(false)} />}

      {!showInfo && (
        <>
          {/* name , picture and info icon  */}
          <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
            <img
              onClick={() => setSelectedUser(null)}
              className="cursor-pointer max-w-7"
              src={assets.arrow_icon}
              alt=""
            />

            <img
              className="w-8 aspect-square rounded-full"
              src={selectedUser.profilePic || assets.avatar_icon}
              alt=""
            />
            <p className="flex-1 text-lg text-white flex items-center gap-2">
              {selectedUser.fullName}
              {onlineUser.includes(selectedUser._id) && (
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              )}
            </p>
            <button
              onClick={() => setShowInfo(true)}
              className="max-md:hidden top-3 right-3 text-xs text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
            >
              Info
            </button>
            {/* <img
              src={assets.help_icon}
              className="max-md:hidden max-w-5"
              alt=""
            /> */}
          </div>

          {/* chat area................ */}
          <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
            {messages?.map((msg, index) => (
              <div
                key={msg._id}
                className={` flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && "flex-row-reverse"}`}
              >
                {msg.senderId === authUser._id && (
                  <button
                    onClick={() => handleDelete(msg._id)}
                    className="text-xs text-red-400 hover:text-red-600 mb-8"
                  >
                    Delete
                  </button>
                )}
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt=""
                    className="max-w-56 border border-gray-700 rounded-lg mb-8 overflow-hidden "
                  />
                ) : (
                  <p
                    className={` p-2 max-w-50 md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? "rounded-br-none" : "rounded-bl-none"}`}
                  >
                    {msg.text}
                  </p>
                )}

                {/* sender info and time */}
                <div className="text-center text-xs ">
                  <img
                    className="w-7 aspect-square rounded-full"
                    src={
                      msg.senderId === authUser._id
                        ? authUser?.profilePic || assets.avatar_icon
                        : selectedUser?.profilePic || assets.avatar_icon
                    }
                    alt=""
                  />

                  <p className="text-gray-500">
                    {formateMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            <div ref={scrollEnd}></div>
          </div>

          {/* message typing...... */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 ">
            <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
              <input
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyDown={(e) =>
                  e.key === "Enter" ? handleSendMessage(e) : null
                }
                type="text"
                placeholder={
                  isuploading
                    ? "Image is uploading..."
                    : "Type a message to send"
                }
                className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
              />
              <input
                onChange={handleSendImg}
                type="file"
                id="image"
                accept="image/png , image/jpeg"
                hidden
              />
              <label htmlFor="image">
                <img
                  src={assets.gallery_icon}
                  alt=""
                  className="w-5 mr-2 cursor-pointer"
                />
              </label>
            </div>
            <img
              onClick={handleSendMessage}
              src={assets.send_button}
              alt="send button"
              className="w-7 cursor-pointer"
            />
          </div>
        </>
      )}
    </div>
  ) : (
    // if not any user is selected to Chat
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} className="max-w-60" alt="" />
      <p className="text-lg font-medium text-white">Chat anytime , anywhere</p>
    </div>
  );
}

export default ChatContainer;
