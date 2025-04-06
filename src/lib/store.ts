import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  members: {
    userId: string;
    role: Role;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceState {
  currentUser: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentUser: (user: User | null) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  addMemberToWorkspace: (workspaceId: string, userId: string, role: Role) => void;
  removeMemberFromWorkspace: (workspaceId: string, userId: string) => void;
  updateMemberRole: (workspaceId: string, userId: string, role: Role) => void;
  hasPermission: (permission: 'create' | 'edit' | 'delete' | 'view') => boolean;
}

// Mock initial user for development
const mockUser: User = {
  id: '1',
  name: 'Demo User',
  email: 'demo@example.com',
  avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=demo'
};

// Mock initial workspace for development
const mockWorkspace: Workspace = {
  id: '1',
  name: 'Demo Team',
  description: 'Default workspace for testing',
  members: [{ userId: '1', role: 'admin' }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentUser: mockUser,
      currentWorkspace: mockWorkspace,
      workspaces: [mockWorkspace],

      setCurrentUser: (user) => set({ currentUser: user }),
      
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      
      addWorkspace: (workspace) => set((state) => ({
        workspaces: [...state.workspaces, workspace]
      })),
      
      updateWorkspace: (id, updates) => set((state) => ({
        workspaces: state.workspaces.map(w => 
          w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
        ),
        currentWorkspace: state.currentWorkspace?.id === id 
          ? { ...state.currentWorkspace, ...updates, updatedAt: new Date().toISOString() }
          : state.currentWorkspace
      })),
      
      removeWorkspace: (id) => set((state) => ({
        workspaces: state.workspaces.filter(w => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace
      })),
      
      addMemberToWorkspace: (workspaceId, userId, role) => set((state) => ({
        workspaces: state.workspaces.map(w => 
          w.id === workspaceId 
            ? { 
                ...w, 
                members: [...w.members, { userId, role }],
                updatedAt: new Date().toISOString()
              }
            : w
        )
      })),
      
      removeMemberFromWorkspace: (workspaceId, userId) => set((state) => ({
        workspaces: state.workspaces.map(w => 
          w.id === workspaceId
            ? {
                ...w,
                members: w.members.filter(m => m.userId !== userId),
                updatedAt: new Date().toISOString()
              }
            : w
        )
      })),
      
      updateMemberRole: (workspaceId, userId, role) => set((state) => ({
        workspaces: state.workspaces.map(w => 
          w.id === workspaceId
            ? {
                ...w,
                members: w.members.map(m => 
                  m.userId === userId ? { ...m, role } : m
                ),
                updatedAt: new Date().toISOString()
              }
            : w
        )
      })),
      
      hasPermission: (permission) => {
        const state = get();
        if (!state.currentUser || !state.currentWorkspace) return false;
        
        const member = state.currentWorkspace.members.find(
          m => m.userId === state.currentUser?.id
        );
        
        if (!member) return false;
        
        switch (member.role) {
          case 'admin':
            return true;
          case 'editor':
            return permission !== 'delete';
          case 'viewer':
            return permission === 'view';
          default:
            return false;
        }
      }
    }),
    {
      name: 'workspace-storage'
    }
  )
);