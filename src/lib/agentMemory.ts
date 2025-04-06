import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MemoryEntry {
  id: string;
  agentId: string;
  type: 'task' | 'error' | 'learning' | 'preference';
  content: string;
  timestamp: string;
  importance: number; // 0-1 scale
  context?: Record<string, any>;
}

export interface AgentMemory {
  lastSuccessfulTask?: {
    timestamp: string;
    task: string;
    outcome: string;
  };
  recentFailures: Array<{
    timestamp: string;
    error: string;
    context: Record<string, any>;
  }>;
  toolPreferences: Array<{
    tool: string;
    confidence: number; // 0-1 scale
    lastSuccess?: string;
    failureCount: number;
  }>;
  learnings: Array<{
    timestamp: string;
    insight: string;
    source: string;
  }>;
  notes: string[];
}

interface MemoryState {
  memories: MemoryEntry[];
  agentMemories: Record<string, AgentMemory>;
  addMemory: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => void;
  updateMemory: (id: string, updates: Partial<MemoryEntry>) => void;
  getAgentMemories: (agentId: string) => MemoryEntry[];
  summarizeMemory: (agentId: string) => AgentMemory;
  pruneMemories: (agentId: string, maxEntries?: number) => void;
}

export const useAgentMemory = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [],
      agentMemories: {},

      addMemory: (entry) => set((state) => {
        const newMemory: MemoryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        };

        // Update agent's memory summary
        const agentId = entry.agentId;
        const currentMemory = state.agentMemories[agentId] || {
          recentFailures: [],
          toolPreferences: [],
          learnings: [],
          notes: []
        };

        const updatedMemory = { ...currentMemory };

        switch (entry.type) {
          case 'task':
            if (entry.content.includes('success')) {
              updatedMemory.lastSuccessfulTask = {
                timestamp: newMemory.timestamp,
                task: entry.content,
                outcome: entry.context?.outcome || 'completed'
              };

              // Update tool preference if applicable
              if (entry.context?.tool) {
                const toolPref = updatedMemory.toolPreferences.find(
                  t => t.tool === entry.context?.tool
                );
                if (toolPref) {
                  toolPref.confidence = Math.min(1, toolPref.confidence + 0.1);
                  toolPref.lastSuccess = newMemory.timestamp;
                } else {
                  updatedMemory.toolPreferences.push({
                    tool: entry.context.tool,
                    confidence: 0.6,
                    lastSuccess: newMemory.timestamp,
                    failureCount: 0
                  });
                }
              }
            }
            break;

          case 'error':
            updatedMemory.recentFailures.unshift({
              timestamp: newMemory.timestamp,
              error: entry.content,
              context: entry.context || {}
            });

            // Update tool preference on failure
            if (entry.context?.tool) {
              const toolPref = updatedMemory.toolPreferences.find(
                t => t.tool === entry.context?.tool
              );
              if (toolPref) {
                toolPref.confidence = Math.max(0, toolPref.confidence - 0.2);
                toolPref.failureCount++;
              }
            }

            // Keep only recent failures
            updatedMemory.recentFailures = updatedMemory.recentFailures
              .slice(0, 10);
            break;

          case 'learning':
            updatedMemory.learnings.unshift({
              timestamp: newMemory.timestamp,
              insight: entry.content,
              source: entry.context?.source || 'experience'
            });
            break;

          case 'preference':
            updatedMemory.notes.unshift(entry.content);
            break;
        }

        return {
          memories: [newMemory, ...state.memories],
          agentMemories: {
            ...state.agentMemories,
            [agentId]: updatedMemory
          }
        };
      }),

      updateMemory: (id, updates) => set((state) => ({
        memories: state.memories.map(memory =>
          memory.id === id ? { ...memory, ...updates } : memory
        )
      })),

      getAgentMemories: (agentId) => {
        return get().memories
          .filter(m => m.agentId === agentId)
          .sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
      },

      summarizeMemory: (agentId) => {
        return get().agentMemories[agentId] || {
          recentFailures: [],
          toolPreferences: [],
          learnings: [],
          notes: []
        };
      },

      pruneMemories: (agentId, maxEntries = 1000) => set((state) => {
        const memories = state.memories
          .filter(m => m.agentId === agentId)
          .sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

        // Keep only the most important and recent memories
        const prunedMemories = memories
          .sort((a, b) => b.importance - a.importance)
          .slice(0, maxEntries);

        return {
          memories: [
            ...state.memories.filter(m => m.agentId !== agentId),
            ...prunedMemories
          ]
        };
      })
    }),
    {
      name: 'agent-memory-storage'
    }
  )
);