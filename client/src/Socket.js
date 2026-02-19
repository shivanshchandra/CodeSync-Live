import { io } from "socket.io-client";

export const initSocket = async () => {
  const token = localStorage.getItem("token");

  const options = {
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ["websocket"],
    auth: { token }, // ✅ REQUIRED
  };

  return io(process.env.REACT_APP_BACKEND_URL, options);
};
