import React, { useContext, useState } from "react";
import SideBar from "../components/SideBar";
import ChatContainer from "../components/ChatContainer";
import { ChatContext } from "../../context/chatContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <div className="border w-full h-screen h-[100dvh] overflow-hidden sm:px-[15%] sm:py-[5%]">
      <div
        className="grid grid-cols-1 md:grid-cols-[1fr_2fr]
        relative overflow-hidden h-full
        border-2 border-gray-600 rounded-2xl backdrop-blur-2xl"
      >
        <SideBar />
        <ChatContainer />
      </div>
    </div>
  );
};

export default HomePage;
