import { api } from "../api";

export const registerUser = async (payload) => {
  const res = await api.post("/api/auth/register", payload);
  return res.data;
};

export const loginUser = async (payload) => {
  const res = await api.post("/api/auth/login", payload);
  return res.data;
};

export const getMe = async () => {
  const res = await api.get("/api/auth/me");
  return res.data;
};




// What it does:
// Keeps all auth API calls in one place.

// ✅ Why: Cleaner code + easier debugging.