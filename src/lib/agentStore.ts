import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InstalledApp } from './installedAppsStore';
import { WorkflowStep } from './workflowGenerator';

export interface AgentConfig {
  id: string;
  name: string;
  goal: string;
  schedule: {
    type: 'interval' | 'cron';
    value: string; // Interval in ms or cron expression
  };
  tools: string[]; // IDs of required tools/apps
  workflow?: WorkflowStep[];
  isActive: boolean;
  lastRun?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'error';
  error?: string;
  result?: any;
}

interface AgentState {
  agents: AgentConfig[];
  executions: AgentExecution[];
  addAgent: (agent: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAgent: (id: string, updates: Partial<AgentConfig>) => void;
  removeAgent: (id: string) => void;
  toggleAgent: (id: string) => void;
  addExecution: (execution: Omit<AgentExecution, 'id'>) => void;
  updateExecution: (id: string, updates: Partial<AgentExecution>) => void;
  getAgentExecutions: (agentId: string) => AgentExecution[];
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      executions: [],
      
      addAgent: (agent) => set((state) => ({
        agents: [
          ...state.agents,
          {
            ...agent,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      })),
      
      updateAgent: (id, updates) => set((state) => ({
        agents: state.agents.map(agent =>
          agent.id === id
            ? {
                ...agent,
                ...updates,
                updatedAt: new Date().toISOString()
              }
            : agent
        )
      })),
      
      removeAgent: (id) => set((state) => ({
        agents: state.agents.filter(agent => agent.id !== id),
        executions: state.executions.filter(exec => exec.agentId !== id)
      })),
      
      toggleAgent: (id) => set((state) => ({
        agents: state.agents.map(agent =>
          agent.id === id
            ? {
                ...agent,
                isActive: !agent.isActive,
                updatedAt: new Date().toISOString()
              }
            : agent
        )
      })),
      
      addExecution: (execution) => set((state) => ({
        executions: [
          ...state.executions,
          {
            ...execution,
            id: crypto.randomUUID()
          }
        ]
      })),
      
      updateExecution: (id, updates) => set((state) => ({
        executions: state.executions.map(exec =>
          exec.id === id ? { ...exec, ...updates } : exec
        )
      })),
      
      getAgentExecutions: (agentId) => {
        return get().executions
          .filter(exec => exec.agentId === agentId)
          .sort((a, b) => 
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );
      }
    }),
    {
      name: 'agent-storage'
    }
  )
);