import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InstalledApp } from './installedAppsStore';
import { GateLog } from './gateLogsStore';
import { AgentConfig } from './agentStore';

export interface ScoutSuggestion {
  id: string;
  type: 'workflow' | 'tool' | 'integration';
  title: string;
  description: string;
  confidence: number; // 0-1
  source: 'behavior' | 'pattern' | 'agent' | 'logs';
  tools: string[];
  workflow?: any;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  explanation?: string;
}

interface ScoutState {
  suggestions: ScoutSuggestion[];
  addSuggestion: (suggestion: Omit<ScoutSuggestion, 'id' | 'createdAt' | 'status'>) => void;
  updateSuggestion: (id: string, updates: Partial<ScoutSuggestion>) => void;
  removeSuggestion: (id: string) => void;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  analyzeBehavior: (apps: InstalledApp[], logs: GateLog[], agents: AgentConfig[]) => void;
}

export const useScoutStore = create<ScoutState>()(
  persist(
    (set, get) => ({
      suggestions: [],
      
      addSuggestion: (suggestion) => set((state) => ({
        suggestions: [
          {
            ...suggestion,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'pending'
          },
          ...state.suggestions
        ]
      })),
      
      updateSuggestion: (id, updates) => set((state) => ({
        suggestions: state.suggestions.map(suggestion =>
          suggestion.id === id ? { ...suggestion, ...updates } : suggestion
        )
      })),
      
      removeSuggestion: (id) => set((state) => ({
        suggestions: state.suggestions.filter(s => s.id !== id)
      })),
      
      acceptSuggestion: (id) => set((state) => ({
        suggestions: state.suggestions.map(s =>
          s.id === id ? { ...s, status: 'accepted' } : s
        )
      })),
      
      rejectSuggestion: (id) => set((state) => ({
        suggestions: state.suggestions.map(s =>
          s.id === id ? { ...s, status: 'rejected' } : s
        )
      })),
      
      analyzeBehavior: (apps, logs, agents) => {
        const state = get();
        const patterns = new Map<string, number>();
        
        // Analyze tool usage patterns
        logs.forEach(log => {
          if (log.status === 'success') {
            const tools = log.target.split(',').map(t => t.trim());
            tools.forEach(tool => {
              patterns.set(tool, (patterns.get(tool) || 0) + 1);
            });
          }
        });
        
        // Find frequently used tool combinations
        const toolPairs = new Map<string, number>();
        logs.forEach(log => {
          if (log.status === 'success' && log.target.includes(',')) {
            const tools = log.target.split(',').map(t => t.trim()).sort();
            for (let i = 0; i < tools.length; i++) {
              for (let j = i + 1; j < tools.length; j++) {
                const pair = `${tools[i]},${tools[j]}`;
                toolPairs.set(pair, (toolPairs.get(pair) || 0) + 1);
              }
            }
          }
        });
        
        // Generate suggestions based on patterns
        toolPairs.forEach((count, pair) => {
          const [tool1, tool2] = pair.split(',');
          const isInstalled1 = apps.some(app => app.name === tool1);
          const isInstalled2 = apps.some(app => app.name === tool2);
          
          if (isInstalled1 && isInstalled2 && count >= 3) {
            // Suggest workflow for frequently used tool combination
            state.addSuggestion({
              type: 'workflow',
              title: `Connect ${tool1} with ${tool2}`,
              description: `I noticed you frequently use ${tool1} and ${tool2} together. Would you like me to create an automated workflow?`,
              confidence: Math.min(count / 10, 0.9),
              source: 'pattern',
              tools: [tool1, tool2],
              explanation: `Based on ${count} successful operations using both tools`
            });
          }
        });
        
        // Analyze agent goals and suggest tools
        agents.forEach(agent => {
          const goalTools = extractToolsFromText(agent.goal);
          goalTools.forEach(tool => {
            if (!apps.some(app => app.name === tool)) {
              state.addSuggestion({
                type: 'tool',
                title: `Gate In ${tool} for ${agent.name}`,
                description: `${tool} would help ${agent.name} achieve its goal of "${agent.goal}"`,
                confidence: 0.8,
                source: 'agent',
                tools: [tool],
                explanation: `Based on agent goal analysis`
              });
            }
          });
        });
      }
    }),
    {
      name: 'scout-storage'
    }
  )
);

// Helper function to extract potential tool names from text
function extractToolsFromText(text: string): string[] {
  const commonTools = [
    'Slack', 'Notion', 'Airtable', 'GitHub', 'Trello',
    'Jira', 'Discord', 'Gmail', 'Google Sheets', 'Typeform'
  ];
  
  return commonTools.filter(tool => 
    text.toLowerCase().includes(tool.toLowerCase())
  );
}