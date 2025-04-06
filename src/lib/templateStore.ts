import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkflowStep } from './workflowGenerator';

export interface SubFlowTemplate {
  id: string;
  name: string;
  description?: string;
  workflow: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  createdBy: {
    id: string;
    name: string;
  };
  tags: string[];
}

interface TemplateState {
  templates: SubFlowTemplate[];
  addTemplate: (template: Omit<SubFlowTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<SubFlowTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getWorkspaceTemplates: (workspaceId: string) => SubFlowTemplate[];
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      addTemplate: (template) => set((state) => ({
        templates: [
          ...state.templates,
          {
            ...template,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      })),

      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(template =>
          template.id === id
            ? {
                ...template,
                ...updates,
                updatedAt: new Date().toISOString()
              }
            : template
        )
      })),

      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(template => template.id !== id)
      })),

      getWorkspaceTemplates: (workspaceId) => {
        return get().templates.filter(template => template.workspaceId === workspaceId);
      }
    }),
    {
      name: 'template-storage'
    }
  )
);