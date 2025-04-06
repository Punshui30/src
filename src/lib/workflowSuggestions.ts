import { Node } from 'reactflow';
import { useInstalledApps } from './installedAppsStore';
import { apiClient } from './api';

export interface WorkflowSuggestion {
  type: 'missing_tool' | 'optimization' | 'security';
  title: string;
  description: string;
  actionType: 'gate_in' | 'install' | 'configure';
  actionLabel: string;
  tool?: string;
  nodeId?: string;
  autoFixAvailable?: boolean;
}

export async function analyzeWorkflowNode(
  node: Node,
  installedApps = useInstalledApps.getState().apps
): Promise<WorkflowSuggestion[]> {
  const suggestions: WorkflowSuggestion[] = [];
  
  // Check if tool is installed
  const toolName = node.data.sourceTool?.toLowerCase();
  if (!toolName) return suggestions;

  const isInstalled = installedApps.some(
    app => app.name.toLowerCase() === toolName
  );

  if (!isInstalled) {
    // Check if adapter exists
    const adapter = await apiClient.findAdapter(toolName);
    
    const commonTools = [
      'slack', 'notion', 'airtable', 'github', 'trello',
      'jira', 'discord', 'gmail', 'google-sheets', 'typeform'
    ];

    const isCommonTool = commonTools.includes(toolName.toLowerCase());
    
    suggestions.push({
      type: 'missing_tool',
      title: `${toolName} Not Connected`,
      description: adapter
        ? `${toolName} adapter is available but not connected. Would you like to set it up?`
        : `${toolName} is not installed. Would you like to connect it?`,
      actionType: 'gate_in',
      actionLabel: 'Connect Now',
      tool: toolName,
      nodeId: node.id,
      autoFixAvailable: isCommonTool || !!adapter
    });
  }

  return suggestions;
}

export async function getWorkflowSuggestions(
  nodes: Node[]
): Promise<WorkflowSuggestion[]> {
  const suggestions: WorkflowSuggestion[] = [];
  
  // Analyze each node
  for (const node of nodes) {
    const nodeSuggestions = await analyzeWorkflowNode(node);
    suggestions.push(...nodeSuggestions);
  }

  return suggestions;
}