import { io } from "socket.io-client";

export const Socket = io("http://localhost:5000", {
    query: {
        userId: localStorage.getItem("userId"),
    },
});