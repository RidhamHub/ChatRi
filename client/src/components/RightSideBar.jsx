import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/chatContext";
import { AuthContext } from "../../context/authContext";

function RightSideBar({ onClose }) {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUser } = useContext(AuthContext);
  const [msgImage, setMsgImage] = useState([]); // urls sent in the messages

  // get all the images form the messages and set them to state
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setMsgImage([]);
      return;
    }

    const images = messages.filter((msg) => msg?.image).map((msg) => msg.image);

    setMsgImage(images);
  }, [messages]);

  return (
    selectedUser && (
      <div
        className={` bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll p-5`}
      >
        <div
          onClick={onClose}
          className="cursor-pointer flex items-center text-center  text-white mt-2 text-md"
        >
          <img className=" max-h-5 max-w-7" src={assets.close_icon} alt="" />
          <p className="text-sm">close info</p>
        </div>
        <div className="pt-6 flex items-center gap-2 mx-auto">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-20 aspect-square rounded-full"
          />
          <div className="text-xs  font-light ">
            <h1 className="px-10 text-2xl font-medium mx-auto flex  items-center gap-2">
              {onlineUser.includes(selectedUser._id) && (
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              )}
              {selectedUser.fullName}
            </h1>

            <p className="px-10 mx-auto">{selectedUser.bio}</p>
          </div>
        </div>

        <hr className="border-[#ffffff50] my-4" />

        {/* media.................. */}
        <div className="px-5 text-md">
          <p>Media</p>
          <div className="mt-2 max-h-65 overflow-y-scroll grid grid-cols-2  gap-4 opacity-80">
            {msgImage.map((url, index) => (
              <div
                key={index}
                onClick={() => window.open(url)}
                className="cursor-pointer rounded"
              >
                <img src={url} alt="" className="h-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* logout button  */}
        {/* <button
          onClick={() => logout()}
          className="absolute text-white border-0 text-sm font-light py-2 px-20 rounded-full cursor-pointer bottom-5 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-purple-400 to-violet-600"
        >
          Logout
        </button> */}
      </div>
    )
  );
}

export default RightSideBar;
