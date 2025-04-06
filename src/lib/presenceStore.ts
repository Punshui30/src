import { create } from 'zustand';

export interface OnlineUser {
  id: string;
  workspaceId: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'online' | 'idle';
  lastSeen: string;
}

interface PresenceState {
  onlineUsers: OnlineUser[];
  setUserOnline: (user: OnlineUser) => void;
  setUserOffline: (userId: string) => void;
  updateUserStatus: (userId: string, status: 'online' | 'idle') => void;
  getWorkspaceUsers: (workspaceId: string) => OnlineUser[];
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: [],

  setUserOnline: (user) => set((state) => ({
    onlineUsers: [...state.onlineUsers.filter(u => u.id !== user.id), user]
  })),

  setUserOffline: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.filter(u => u.id !== userId)
  })),

  updateUserStatus: (userId, status) => set((state) => ({
    onlineUsers: state.onlineUsers.map(user =>
      user.id === userId
        ? { ...user, status, lastSeen: new Date().toISOString() }
        : user
    )
  })),

  getWorkspaceUsers: (workspaceId) => {
    return get().onlineUsers.filter(user => user.workspaceId === workspaceId);
  }
}));