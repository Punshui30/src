import axios from 'axios';
import axiosRetry from 'axios-retry';

const api = axios.create({
  baseURL: 'https://argos-backend-elkxxhknhq-uc.a.run.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

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

axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000),
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    (error.response?.status && error.response.status >= 500) ||
    error.response?.status === 429
});

export const sendToCopilot = async (prompt: string) => {
  const response = await api.post("/copilot", { prompt });
  return response.data.response;
};

export const injectSnippet = async (snippet: string) => {
  const response = await api.post("/inject", { snippet });
  return response.data.status;
};

export const checkHealth = async () => {
  try {
    const res = await api.get("/health");
    return res.data.status === "ok" || res.data.status === "ARGOS backend is live ✅";
  } catch {
    return false;
  }
};

export default api;
