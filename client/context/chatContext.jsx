import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unSeenMessages, setUnSeenMessages] = useState({});
  

  const { socket, axios } = useContext(AuthContext);

  // function to get all users in sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      // console.log("get users api data : ", data);
      if (data.success) {
        setUsers(data.users || data.user || []);
        setUnSeenMessages(data.unSeenMessages);
      }
    } catch (error) {
      
      toast.error(error.message);
    }
  };

  //fucntion to get messages for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.messages);
    }
  };

  //send messages to selected user
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData,
      );

      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newmsg]);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || error.message);
    }
  };

  //function to subscribe to messages for selected user
  const subscribeToMessages = async () => {
    if (!socket) {
      return;
    }

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        // chat box is open for selected user
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnSeenMessages((prevUnSeenMessages) => ({
          ...prevUnSeenMessages,
          [newMessage.senderId]: prevUnSeenMessages[newMessage.senderId]
            ? prevUnSeenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });
  };

  //function to unubscribe from messages for selected user
  const unSubscribeToMessages = () => {
    if (socket) {
      socket.off("newMessage");
    }
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unSubscribeToMessages();
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unSeenMessages,
    setUnSeenMessages,
    setMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
