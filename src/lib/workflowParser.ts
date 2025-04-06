import { Node, Edge } from 'reactflow';
import { InstalledApp } from './installedAppsStore';
import { useInstalledApps } from './installedAppsStore';
import { apiClient } from './api';

export interface ParsedTool {
  name: string;
  action: string;
  isInstalled: boolean;
  adapter?: any;
  gateInSuggested?: boolean;
}

export interface WorkflowPlan {
  tools: ParsedTool[];
  description: string;
  nodes: Node[];
  edges: Edge[];
}

export async function parseWorkflowPrompt(prompt: string, installedApps: InstalledApp[]): Promise<WorkflowPlan> {
  // Extract tool names using basic NLP patterns
  const toolPatterns = [
    'Typeform', 'Notion', 'Slack', 'Airtable', 'Google Sheets',
    'Gmail', 'Discord', 'Trello', 'Jira', 'GitHub'
  ].map(tool => ({
    name: tool.toLowerCase(),
    regex: new RegExp(`\\b${tool}\\b`, 'i')
  }));

  const foundTools: ParsedTool[] = [];
  
  // Find tools mentioned in prompt
  for (const pattern of toolPatterns) {
    if (pattern.regex.test(prompt)) {
      const isInstalled = installedApps.some(
        app => app.name.toLowerCase() === pattern.name
      );
      
      let adapter;
      if (!isInstalled) {
        // Only check for adapter if not installed
        adapter = await apiClient.findAdapter(pattern.name);
      }
      
      foundTools.push({
        name: pattern.name,
        action: 'unknown', // Will be determined by GPT
        isInstalled,
        adapter,
        gateInSuggested: false
      });
    }
  }

  // Generate nodes for each tool
  const nodes: Node[] = foundTools.map((tool, index) => ({
    id: `${index + 1}`,
    type: 'custom',
    position: { x: 100, y: 100 + (index * 150) },
    data: {
      label: tool.name,
      sourceTool: tool.name,
      retryCount: 3,
      delaySeconds: 5,
      fallbackAction: '',
      rescueSteps: [],
      params: {}
    }
  }));

  // Create edges connecting nodes in sequence
  const edges: Edge[] = nodes.slice(0, -1).map((node, index) => ({
    id: `e${index + 1}-${index + 2}`,
    source: node.id,
    target: nodes[index + 1].id,
    animated: true
  }));

  return {
    tools: foundTools,
    description: `Workflow using: ${foundTools.map(t => t.name).join(' → ')}`,
    robustness: {
      retryEnabled: true,
      fallbackEnabled: true,
      rescueEnabled: true
    },
    nodes,
    edges
  };
}