import axios from 'axios';
import axiosRetry from 'axios-retry';

const api = axios.create({
  baseURL: 'https://argos-backend-elkxxhknhq-uc.a.run.app/health',
 // Updated to use HTTPS
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000),
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    (error.response?.status && error.response.status >= 500) ||
    error.response?.status === 429
});

api.interceptors.response.use(
  response => response,
  error => {
    let errorMessage = 'An unexpected error occurred';

    if (error.response) {
      switch (error.response.status) {
        case 429:
          errorMessage = 'Rate limit exceeded. Please try again later.';
          break;
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in.';
          break;
        case 403:
          errorMessage = 'Access denied. Insufficient permissions.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service is currently offline. Please try again later.';
          break;
        default:
          errorMessage = `Server error: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = 'Network Error: Failed to connect to server. Please ensure the server is running.';
    }

    error.userMessage = errorMessage;
    return Promise.reject(error);
  }
);

// ----------------- Interfaces -----------------

export interface Template {
  id: string;
  name: string;
  description?: string;
  workflow: any[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  workspaceId: string;
}

export interface Adapter {
  id: string;
  name: string;
  version: string;
  status: string;
  file_path: string;
  last_updated: string;
}

// ----------------- API Client -----------------

export const apiClient = {
  async get<T>(url: string, config?: any) {
    const response = await api.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: any, config?: any) {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  async getTemplates() {
    const response = await api.get<{ templates: Template[] }>('/templates');
    return response.data;
  },

  async searchTemplates(query: string) {
    const response = await api.get<{ templates: Template[] }>(
      `/templates/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  async createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await api.post<{ template: Template }>('/templates', template);
    return response.data;
  },

  async updateTemplate(id: string, updates: Partial<Template>) {
    const response = await api.put<{ template: Template }>(`/templates/${id}`, updates);
    return response.data;
  },

  async deleteTemplate(id: string) {
    await api.delete(`/templates/${id}`);
  },

  async transcodeCode(
    input: string,
    options: { mode?: 'smart' | 'manual'; target?: string } = {}
  ): Promise<{
    output: string;
    tool?: string;
    action?: string;
    metadata?: any;
  }> {
    try {
      if (!input || typeof input !== 'string') {
        throw new Error('Code input is required and must be a string');
      }

      const endpoint = '/transcode';
      console.log('Sending transcode request:', {
        endpoint: api.defaults.baseURL + endpoint,
        input: input.slice(0, 100) + '...',
        mode: options.mode,
        target: options.target
      });

      const response = await api.post(endpoint, {
        code: input,
        target: options.target
      });

      console.log('Received transcoded response:', response.data);

      if (!response.data || !response.data.output) {
        throw new Error('Invalid response format from server');
      }

      return response.data;
    } catch (error) {
      console.error('Transcode error:', error);
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new Error('Network Error: Failed to connect to transcode service.');
        }

        const errorMessage = error.response.data?.error || error.message;
        if (errorMessage) {
          throw new Error(errorMessage);
        }
      }
      throw new Error('An unexpected error occurred while transcoding');
    }
  },

  async getAdapters() {
    const response = await api.get<{ adapters: Adapter[] }>('/adapters');
    return response.data;
  },

  async findAdapter(target: string) {
    const response = await api.get<{ adapters: Adapter[] }>('/adapters');
    return response.data.adapters.find((a: Adapter) =>
      a.name.toLowerCase() === target.toLowerCase()
    );
  },

  async sendPayload(payload: any, target?: string) {
    const response = await api.post('/send', { payload, target });
    return response.data;
  },

  async askCopilot(input: string, target: string, error?: string) {
    try {
      const response = await api.post('/copilot/suggest', {
        input,
        target,
        error,
        timestamp: new Date().toISOString()
      });

      if (!response.data?.suggestion) {
        throw new Error('Invalid response format from Copilot service');
      }

      return response.data;
    } catch (error) {
      console.error('Copilot service error:', error);
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error('Network Error: Failed to connect to Copilot service.');
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to get Copilot suggestion');
    }
  },

  async reloadAdapters() {
    const response = await api.post<{ success: boolean; message: string }>('/adapters/reload');
    return response.data;
  },

  async sendCopilotMessage(message: string) {
    try {
      if (!message?.trim()) {
        throw new Error('Message cannot be empty');
      }

      const response = await api.post('/copilot/chat', {
        message: message || '',
        timestamp: new Date().toISOString()
      });

      const responseMessage = response.data?.message || response.data?.text;
      if (!responseMessage) {
        throw new Error('Invalid or empty response from Copilot service');
      }

      console.log('Copilot response:', responseMessage);

      return {
        message: responseMessage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Copilot service error:', error);

      let errorMessage = 'Failed to send Copilot message';

      if (axios.isAxiosError(error)) {
        if (!error.response) {
          errorMessage = 'Failed to connect to Copilot service. Please check server logs.';
        } else if (error.response.status === 401) {
          errorMessage = 'API key validation failed. Please check your Gemini API key.';
        } else if (error.response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else {
          errorMessage = error.response.data?.error || error.message;
        }
      }

      throw new Error(errorMessage);
    }
  },

  async ingest(payload: any) {
    const response = await api.post('/ingest', payload);
    return response.data;
  },

  // ✅ Gate & Copilot health checks for BootSequence
  async pingGate(): Promise<boolean> {
    try {
      const response = await api.get('/gate/ready');
      return response.status === 200;
    } catch (err) {
      console.error('pingGate failed:', err);
      return false;
    }
  },

  async pingCopilot(): Promise<boolean> {
    try {
      const response = await api.get('/copilot/ready');
      return response.status === 200;
    } catch (err) {
      console.error('pingCopilot failed:', err);
      return false;
    }
  }
};