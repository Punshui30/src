
import axios from 'axios';
import axiosRetry from 'axios-retry';

// ✅ Create Axios instance first
const api = axios.create({
  baseURL: 'https://dan-backend-882939068032.us-central1.run.app',
  timeout: 30000,  // Increased timeout to 30s
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 🪵 Request/Response logging for debug
api.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} → ${config.url}`, config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ← ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API Error] ← ${error.config?.url}`, error.message);
    return Promise.reject(error);
  }
);

// 🔁 Retry logic for timeouts & 5xx errors
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000),
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    (error.response?.status && error.response.status >= 500) ||
    error.response?.status === 429
});

// 🤖 Send prompt to Copilot
export const sendToCopilot = async (prompt: string) => {
  const response = await api.post("/copilot", { prompt });
  return response.data.response;
};

// 🔧 Inject code snippets into backend
export const injectSnippet = async (snippet: string) => {
  const response = await api.post("/inject", { snippet });
  return response.data.status;
};

// ✅ Optional health check
export const checkHealth = async () => {
  try {
    const res = await api.get("/health");
    return res.data.status === "ok" || res.data.status === "DAN backend is live ✅";
  } catch {
    return false;
  }
};

export default api;
