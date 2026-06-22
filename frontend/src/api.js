import axios from "axios";

// In production (Vercel), VITE_API_URL points to the Railway backend.
// In development, Vite's proxy forwards /api → localhost:5000.
const BASE = import.meta.env.VITE_API_URL || "";

export const api = axios.create({ baseURL: BASE });
