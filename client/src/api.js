import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});




// What it does:
// Creates one axios instance + automatically attaches the JWT token to every request.

// ✅ Why: You don’t want to manually add Authorization: Bearer ... in every request again and again.