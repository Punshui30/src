import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  workspaceId: string;
  userId: string;
  userName: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (workspaceId: string) => void;
  clearNotifications: (workspaceId: string) => void;
  getWorkspaceNotifications: (workspaceId: string) => Notification[];
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false
        };

        const notifications = [newNotification, ...state.notifications];
        const unreadCount = notifications.filter(n => !n.read).length;

        return { notifications, unreadCount };
      }),

      markAsRead: (id) => set((state) => {
        const notifications = state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        const unreadCount = notifications.filter(n => !n.read).length;

        return { notifications, unreadCount };
      }),

      markAllAsRead: (workspaceId) => set((state) => {
        const notifications = state.notifications.map(n =>
          n.workspaceId === workspaceId ? { ...n, read: true } : n
        );
        const unreadCount = notifications.filter(n => !n.read).length;

        return { notifications, unreadCount };
      }),

      clearNotifications: (workspaceId) => set((state) => {
        const notifications = state.notifications.filter(
          n => n.workspaceId !== workspaceId
        );
        const unreadCount = notifications.filter(n => !n.read).length;

        return { notifications, unreadCount };
      }),

      getWorkspaceNotifications: (workspaceId) => {
        return get().notifications.filter(n => n.workspaceId === workspaceId);
      }
    }),
    {
      name: 'notification-storage'
    }
  )
);