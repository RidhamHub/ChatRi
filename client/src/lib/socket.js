import { io } from "socket.io-client";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const Socket = io(backendUrl, {
    query: {
        userId: localStorage.getItem("userId"),
    },
});