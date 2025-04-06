import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InstalledApp {
  id: string;
  name: string;
  status: 'connected' | 'needs_setup' | 'error';
  icon?: string;
  installedAt: string;
  lastUsed?: string;
  config?: Record<string, any>;
  error?: string;
}

interface InstalledAppsState {
  apps: InstalledApp[];
  addApp: (app: Omit<InstalledApp, 'id' | 'installedAt'>) => void;
  removeApp: (id: string) => void;
  updateApp: (id: string, updates: Partial<InstalledApp>) => void;
  getApp: (id: string) => InstalledApp | undefined;
}

export const useInstalledApps = create<InstalledAppsState>()(
  persist(
    (set, get) => ({
      apps: [],

      addApp: (app) => set((state) => ({
        apps: [
          ...state.apps,
          {
            ...app,
            id: crypto.randomUUID(),
            installedAt: new Date().toISOString()
          }
        ]
      })),

      removeApp: (id) => set((state) => ({
        apps: state.apps.filter(app => app.id !== id)
      })),

      updateApp: (id, updates) => set((state) => ({
        apps: state.apps.map(app =>
          app.id === id ? { ...app, ...updates } : app
        )
      })),

      getApp: (id) => {
        return get().apps.find(app => app.id === id);
      }
    }),
    {
      name: 'installed-apps-storage'
    }
  )
);
