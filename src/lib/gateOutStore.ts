import { create } from 'zustand';
import { apiClient } from './api';

interface GateOutState {
  lastResponse: any;
  lastError: Error | null;
  sendPayload: (payload: any, target?: string) => Promise<any>;
  clearState: () => void;
}

export const useGateOut = create<GateOutState>((set) => ({
  lastResponse: null,
  lastError: null,

  sendPayload: async (payload, target) => {
    try {
      // First try to find a matching adapter
      const adapter = target ? await apiClient.findAdapter(target) : null;
      
      let response;
      if (adapter) {
        // Use adapter-specific endpoint
        response = await apiClient.post(`/api/adapters/${adapter.name}/send`, {
          payload,
          target
        });
      } else {
        // Fallback to default send endpoint
        response = await apiClient.post('/api/send', { payload });
      }

      set({ lastResponse: response, lastError: null });
      return response;

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      set({ lastResponse: null, lastError: errorObj });
      throw errorObj;
    }
  },

  clearState: () => set({ lastResponse: null, lastError: null })
}));