import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from 'reactflow';
import { InstalledApp } from './installedAppsStore';
import { GateLog } from './gateLogsStore';

export interface AutopilotDraft {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-1
  source: 'behavior' | 'pattern' | 'schedule';
  nodes: Node[];
  edges: Edge[];
  tools: string[];
  createdAt: string;
  status: 'draft' | 'deployed' | 'rejected';
  explanation?: string;
}

interface AutopilotState {
  isEnabled: boolean;
  drafts: AutopilotDraft[];
  toggleAutopilot: () => void;
  addDraft: (draft: Omit<AutopilotDraft, 'id' | 'createdAt' | 'status'>) => void;
  updateDraft: (id: string, updates: Partial<AutopilotDraft>) => void;
  removeDraft: (id: string) => void;
  deployDraft: (id: string) => void;
  rejectDraft: (id: string) => void;
  analyzeBehavior: (apps: InstalledApp[], logs: GateLog[]) => void;
}

export const useAutopilotStore = create<AutopilotState>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      drafts: [],
      
      toggleAutopilot: () => set((state) => ({
        isEnabled: !state.isEnabled
      })),
      
      addDraft: (draft) => set((state) => ({
        drafts: [
          {
            ...draft,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'draft'
          },
          ...state.drafts
        ]
      })),
      
      updateDraft: (id, updates) => set((state) => ({
        drafts: state.drafts.map(draft =>
          draft.id === id ? { ...draft, ...updates } : draft
        )
      })),
      
      removeDraft: (id) => set((state) => ({
        drafts: state.drafts.filter(d => d.id !== id)
      })),
      
      deployDraft: (id) => set((state) => ({
        drafts: state.drafts.map(d =>
          d.id === id ? { ...d, status: 'deployed' } : d
        )
      })),
      
      rejectDraft: (id) => set((state) => ({
        drafts: state.drafts.map(d =>
          d.id === id ? { ...d, status: 'rejected' } : d
        )
      })),
      
      analyzeBehavior: (apps, logs) => {
        const state = get();
        if (!state.isEnabled) return;
        
        // Analyze recurring patterns
        const patterns = new Map<string, number>();
        
        logs.forEach(log => {
          if (log.status === 'success') {
            const tools = log.target.split(',').map(t => t.trim());
            tools.forEach(tool => {
              patterns.set(tool, (patterns.get(tool) || 0) + 1);
            });
          }
        });
        
        // Find recurring time patterns
        const timePatterns = new Map<string, number>();
        logs.forEach(log => {
          const date = new Date(log.timestamp);
          const dayOfWeek = date.getDay();
          const hour = date.getHours();
          
          const key = `${dayOfWeek}-${hour}`;
          timePatterns.set(key, (timePatterns.get(key) || 0) + 1);
        });
        
        // Generate workflow drafts based on patterns
        timePatterns.forEach((count, timeKey) => {
          if (count >= 3) { // At least 3 occurrences
            const [day, hour] = timeKey.split('-').map(Number);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            // Get most used tools during this time
            const toolsUsed = new Map<string, number>();
            logs.forEach(log => {
              const date = new Date(log.timestamp);
              if (date.getDay() === day && date.getHours() === hour) {
                const tools = log.target.split(',').map(t => t.trim());
                tools.forEach(tool => {
                  toolsUsed.set(tool, (toolsUsed.get(tool) || 0) + 1);
                });
              }
            });
            
            const topTools = Array.from(toolsUsed.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([tool]) => tool);
            
            if (topTools.length >= 2) {
              state.addDraft({
                title: `${days[day]} ${hour}:00 Automation`,
                description: `I noticed you frequently use ${topTools.join(' and ')} on ${days[day]}s around ${hour}:00. Would you like me to automate this workflow?`,
                confidence: Math.min(count / 10, 0.9),
                source: 'schedule',
                nodes: [
                  {
                    id: '1',
                    type: 'custom',
                    position: { x: 100, y: 100 },
                    data: {
                      label: topTools[0],
                      sourceTool: topTools[0],
                      params: {}
                    }
                  },
                  {
                    id: '2',
                    type: 'custom',
                    position: { x: 300, y: 100 },
                    data: {
                      label: topTools[1],
                      sourceTool: topTools[1],
                      params: {}
                    }
                  }
                ],
                edges: [
                  {
                    id: 'e1-2',
                    source: '1',
                    target: '2',
                    animated: true
                  }
                ],
                tools: topTools,
                explanation: `Based on ${count} occurrences of this pattern`
              });
            }
          }
        });
      }
    }),
    {
      name: 'autopilot-storage'
    }
  )
);