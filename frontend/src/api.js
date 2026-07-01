import axios from "axios";

// In production, /api/* is served by Vercel serverless functions (same domain).
// In development, Vite's proxy forwards /api → localhost:6000.
const BASE = import.meta.env.VITE_API_URL || "";

export const api = axios.create({ baseURL: BASE });
