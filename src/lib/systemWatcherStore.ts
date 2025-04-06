import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SystemComponentType = 'adapter' | 'agent' | 'workflow' | 'copilot';
export type AlertStatus = 'pending' | 'fixed' | 'ignored';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SystemAlert {
  id: string;
  timestamp: string;
  component: SystemComponentType;
  title: string;
  message: string;
  status: AlertStatus;
  severity: AlertSeverity;
  error?: string;
  componentId?: string;
  autoFixAvailable: boolean;
  fixAttempts: number;
  lastFixAttempt?: string;
}

interface SystemWatcherState {
  alerts: SystemAlert[];
  addAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp' | 'status' | 'fixAttempts'>) => void;
  updateAlert: (id: string, updates: Partial<SystemAlert>) => void;
  removeAlert: (id: string) => void;
  markAsFixed: (id: string) => void;
  markAsIgnored: (id: string) => void;
  clearAlerts: () => void;
  getComponentAlerts: (component: SystemComponentType) => SystemAlert[];
}

export const useSystemWatcher = create<SystemWatcherState>()(
  persist(
    (set, get) => ({
      alerts: [],

      addAlert: (alert) => set((state) => ({
        alerts: [
          {
            ...alert,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            status: 'pending',
            fixAttempts: 0
          },
          ...state.alerts
        ]
      })),

      updateAlert: (id, updates) => set((state) => ({
        alerts: state.alerts.map(alert =>
          alert.id === id ? { ...alert, ...updates } : alert
        )
      })),

      removeAlert: (id) => set((state) => ({
        alerts: state.alerts.filter(alert => alert.id !== id)
      })),

      markAsFixed: (id) => set((state) => ({
        alerts: state.alerts.map(alert =>
          alert.id === id ? { ...alert, status: 'fixed' } : alert
        )
      })),

      markAsIgnored: (id) => set((state) => ({
        alerts: state.alerts.map(alert =>
          alert.id === id ? { ...alert, status: 'ignored' } : alert
        )
      })),

      clearAlerts: () => set({ alerts: [] }),

      getComponentAlerts: (component) => {
        return get().alerts.filter(alert => alert.component === component);
      }
    }),
    {
      name: 'system-watcher-storage'
    }
  )
);

