import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgentConfig } from './agentStore';

export type AgentRole = 'analyzer' | 'notifier' | 'fixer' | 'monitor';

export interface TeamMember {
  agentId: string;
  role: AgentRole;
  permissions: string[];
}

export interface AgentTeam {
  id: string;
  name: string;
  goal: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
}

export interface TeamMessage {
  id: string;
  teamId: string;
  fromAgentId: string;
  toAgentId?: string; // If undefined, message is broadcast to team
  type: 'alert' | 'request' | 'response' | 'status' | 'suggestion';
  content: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface AgentTeamState {
  teams: AgentTeam[];
  messages: TeamMessage[];
  addTeam: (team: Omit<AgentTeam, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTeam: (id: string, updates: Partial<AgentTeam>) => void;
  removeTeam: (id: string) => void;
  addMember: (teamId: string, member: TeamMember) => void;
  removeMember: (teamId: string, agentId: string) => void;
  updateMemberRole: (teamId: string, agentId: string, role: AgentRole) => void;
  sendMessage: (message: Omit<TeamMessage, 'id' | 'timestamp'>) => void;
  getTeamMessages: (teamId: string) => TeamMessage[];
  getAgentMessages: (agentId: string) => TeamMessage[];
}

export const useAgentTeam = create<AgentTeamState>()(
  persist(
    (set, get) => ({
      teams: [],
      messages: [],
      
      addTeam: (team) => set((state) => ({
        teams: [
          ...state.teams,
          {
            ...team,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      })),
      
      updateTeam: (id, updates) => set((state) => ({
        teams: state.teams.map(team =>
          team.id === id
            ? {
                ...team,
                ...updates,
                updatedAt: new Date().toISOString()
              }
            : team
        )
      })),
      
      removeTeam: (id) => set((state) => ({
        teams: state.teams.filter(team => team.id !== id),
        messages: state.messages.filter(msg => msg.teamId !== id)
      })),
      
      addMember: (teamId, member) => set((state) => ({
        teams: state.teams.map(team =>
          team.id === teamId
            ? {
                ...team,
                members: [...team.members, member],
                updatedAt: new Date().toISOString()
              }
            : team
        )
      })),
      
      removeMember: (teamId, agentId) => set((state) => ({
        teams: state.teams.map(team =>
          team.id === teamId
            ? {
                ...team,
                members: team.members.filter(m => m.agentId !== agentId),
                updatedAt: new Date().toISOString()
              }
            : team
        )
      })),
      
      updateMemberRole: (teamId, agentId, role) => set((state) => ({
        teams: state.teams.map(team =>
          team.id === teamId
            ? {
                ...team,
                members: team.members.map(m =>
                  m.agentId === agentId ? { ...m, role } : m
                ),
                updatedAt: new Date().toISOString()
              }
            : team
        )
      })),
      
      sendMessage: (message) => set((state) => ({
        messages: [
          {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          },
          ...state.messages
        ]
      })),
      
      getTeamMessages: (teamId) => {
        return get().messages
          .filter(msg => msg.teamId === teamId)
          .sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
      },
      
      getAgentMessages: (agentId) => {
        return get().messages
          .filter(msg => 
            msg.fromAgentId === agentId || 
            msg.toAgentId === agentId ||
            (!msg.toAgentId && get().teams.some(team =>
              team.members.some(m => m.agentId === agentId)
            ))
          )
          .sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
      }
    }),
    {
      name: 'agent-team-storage'
    }
  )
);