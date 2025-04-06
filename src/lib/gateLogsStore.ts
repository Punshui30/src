import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GateLog {
  id: string;
  timestamp: string;
  input: string;
  target: string;
  output: string;
  status: 'success' | 'error';
}

interface GateLogsState {
  logs: GateLog[];
  addLog: (log: GateLog) => void;
  clearLogs: () => void;
  getLog: (id: string) => GateLog | undefined;
}

export const useGateLogs = create<GateLogsState>()(
  persist(
    (set, get) => ({
      logs: [],
      
      addLog: (log) => set((state) => ({
        logs: [log, ...state.logs]
      })),
      
      clearLogs: () => set({ logs: [] }),
      
      getLog: (id) => {
        return get().logs.find(log => log.id === id);
      }
    }),
    {
      name: 'gate-logs-storage'
    }
  )
);