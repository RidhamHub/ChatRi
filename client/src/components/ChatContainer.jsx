import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formateMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/chatContext";
import { AuthContext } from "../../context/authContext";
import toast from "react-hot-toast";
import RightSideBar from "./RightSideBar";
// import { Socket } from "../lib/socket";
// import axios from "axios";

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

  const { socket, axios } = useContext(AuthContext);

  const [activeMsgId, setActiveMsgId] = useState(null);

  const [isTyping, setIsTyping] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false); // for clear chat

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

  // handle ClearChat
  const handleClearChat = async () => {
    try {
      if (!confirm("are you sure ??")) return;
      await axios.put(`/api/messages/clear/${selectedUser._id}`);
      setMessages([]); // instantly clear UI
      setShowConfirm(false); // close modal
    } catch (error) {
      console.log("Error clearing chat:", error);
    }
  };

  // delete thay tyare refresh karva mate
  useEffect(() => {
    if (!socket) return;

    const handleMessageDeleted = (id) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
    };

    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, []);

  // Close delete button when clicking elsewhere
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMsgId(null);
    };

    if (activeMsgId) {
      window.addEventListener("click", handleOutsideClick);
    }

    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [activeMsgId]);

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

  //on selecting user get message
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

  // press Esc to go back
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  });

  // if user is opening chat then run this for seen
  useEffect(() => {
    if (!socket) return;

    const handleMessageSeen = ({ seenBy }) => {
      if (selectedUser && seenBy === selectedUser._id) {
        setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
      }
    };

    socket.on("messageSeen", handleMessageSeen);

    return () => socket.off("messageSeen", handleMessageSeen);
  }, [socket, selectedUser]);

  //typing or not typing effect
  useEffect(() => {
    if (!socket) return;

    socket.on("typing", ({ from }) => {
      if (selectedUser && from == selectedUser._id) {
        setIsTyping(true);
        // console.log("typing");
      }
    });

    socket.on("stopTyping", ({ from }) => {
      if (selectedUser && from == selectedUser._id) {
        setIsTyping(false);
        console.log("stoptyping");
      }
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, selectedUser]);

  return selectedUser ? (
    <div className="h-full overflow-y-auto relative backdrop-blur-lg">
      {showInfo && <RightSideBar onClose={() => setShowInfo(false)} />}

      {!showInfo && (
        <>
          {/* name , picture and info icon  */}
          <div className="flex items-center justify-center gap-3 py-3 mx-4 border-b border-stone-500">
            <img
              onClick={() => setSelectedUser(null)}
              className="cursor-pointer max-w-7"
              src={assets.arrow_icon}
              alt=""
            />

            <img
              onClick={() => setShowInfo(true)}
              className="w-8 aspect-square rounded-full  cursor-pointerF"
              src={selectedUser.profilePic || assets.avatar_icon}
              alt=""
            />
            <p
              onClick={() => setShowInfo(true)}
              className="flex-1 text-lg text-white flex items-center gap-2 cursor-pointer"
            >
              {selectedUser.fullName}
              {onlineUser.includes(selectedUser._id) ? (
                isTyping ? (
                  <p className="text-xs text-green-400">Typing...</p>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                )
              ) : (
                <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
              )}
            </p>
            <button
              // onClick={handleClearChat}
              onClick={() => setShowConfirm(true)}
              className="text-xs px-4 py-1.5 rounded-lg font-medium bg-violet-500/30 hover:bg-violet-500  text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
            >
              Clear Chat
            </button>
            {showConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                {/* Modal */}
                <div
                  className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 w-80 
                    animate-[fadeIn_.2s_ease] scale-100"
                >
                  {/* Title */}
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Clear Chat
                  </h2>
                  {/* Message */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    This will permanently delete whole conversation for you
                    only.
                    <span className="font-medium text-red-500">
                      This cannot be undone.
                    </span>
                  </p>
                  {/* Buttons */}
                  <div className="flex justify-end gap-3 mt-6">
                    {/* Confirm */}
                    <button
                      onClick={handleClearChat}
                      className="px-4 py-1.5 text-sm rounded-lg text-white bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow hover:shadow-md transition active:scale-95"
                    >
                      Clear
                    </button>
                    {/* Cancel */}
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-1.5 text-sm rounded-lg border border-gray-300  text-white bg-violet-500/30 hover:bg-violet-500   transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* chat area................ */}
          <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3">
            {messages?.map((msg, index) => {
              const isLast = index === messages.length - 1;
              const isMe = String(msg.senderId) === String(authUser._id);
              return (
                <div
                  key={msg._id}
                  className={` flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && "flex-row-reverse"}`}
                >
                  {msg.image ? (
                    <img
                      src={msg.image}
                      alt=""
                      className="max-w-56 border border-gray-700 rounded-lg mb-8 overflow-hidden "
                    />
                  ) : (
                    <p
                      className={` p-2 max-w-50 md:text-sm text-xl font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? "rounded-br-none" : "rounded-bl-none"}`}
                    >
                      {msg.text}
                    </p>
                  )}

                  {/* sender info and time */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMsgId((prev) =>
                        prev === msg._id ? null : msg._id,
                      );
                    }}
                    className="relative group text-center text-xs "
                  >
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
                    {String(msg.senderId) === String(authUser._id) &&
                      activeMsgId === msg._id && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center group/del">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(msg._id);
                              setActiveMsgId(null);
                            }}
                            className="bg-red-500 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-2xl hover:bg-red-600 transition-all active:scale-95 whitespace-nowrap border border-red-400/30"
                          >
                            Delete
                          </button>
                          {/* Triangle pointer */}
                          <div className="w-2 h-2 bg-red-500 rotate-45 -mt-1 border-r border-b border-red-400/30"></div>
                        </div>
                      )}
                    {/* SEEN / DELIVERED — ONLY LAST MESSAGE SENT BY ME */}
                    {isLast && isMe && (
                      <div className="w-full flex justify-end mt-1">
                        <p className="text-[11px] text-gray-400 ">
                          {msg.seen ? "Seen" : "Sent"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={scrollEnd}></div>
          </div>

          {/* message typing...... */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 ">
            <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
              <input
                onChange={(e) => {
                  setInput(e.target.value);

                  socket.emit("typing", {
                    to: selectedUser._id,
                  });

                  //stop typing after 1 sec is ideal condition for typing....
                  clearTimeout(window.typingTimer);
                  window.typingTimer = setTimeout(() => {
                    socket.emit("stopTyping", {
                      to: selectedUser._id,
                    });
                  }, 1000);
                }}
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
