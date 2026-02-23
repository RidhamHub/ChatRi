import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import { ChatContext } from "../../context/chatContext";

const SideBar = () => {
  const { logout, onlineUser } = useContext(AuthContext);

  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unSeenMessages,
    setUnSeenMessages,
  } = useContext(ChatContext);

  const [input, setInput] = useState("");

  const usersList = Array.isArray(users) ? users : [];

  const filteredUsers = input
    ? usersList.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase()),
      )
    : usersList;

  const navigate = useNavigate();
  useEffect(() => {
    getUsers();
  }, [onlineUser]);
  // console.log("Users from context:", users);
  return (
    <div
      className={`bg-[#8185B2]/10 h-full  p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ""}  `}
    >
      <div className="pb-5">
        {/* logo and 3 dots */}
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-w-5 cursor-pointer"
            />
            <div className="absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm"
              >
                Edit profile
              </p>
              <hr className="my-2 border-t border-gray-500 " />
              <p onClick={() => logout()} className="cursor-pointer text-sm">
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* seacrh icon and inputr feild  */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <img src={assets.search_icon} alt="search" className="w-3" />
          <input
            onChange={(event) => setInput(event.target.value)}
            className="bg-transparent border-none outline-none text-white text-sx placeholder-[#c8c8c8] flex-1"
            type="text"
            placeholder="Search user..."
          />
        </div>

        {/* all user profiles */}
        <div className="flex flex-col mt-2">
          {filteredUsers.map((user, index) => (
            <div
              onClick={() => {
                setSelectedUser(user);
                setUnSeenMessages((prev) => ({ ...prev, [user._id]: 0 }));
              }}
              key={index}
              className={` relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer  max-sm:text-sm  ${selectedUser?._id === user._id && "bg-[#282142]/50"}`}
            >
              <img
                src={user?.profilePic || assets.avatar_icon}
                className="w-9 aspect-square rounded-full"
                alt=""
              />
              <div className=" flex flex-col leading-5">
                <p>{user.fullName}</p>
                {onlineUser.includes(user._id) ? (
                  <span className="text-green-400 text-xs">Online</span>
                ) : (
                  <span className="text-neutral-400 text-xs">Offline</span>
                )}
              </div>
              {unSeenMessages[user._id] > 0 && (
                <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                  {unSeenMessages[user._id]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
