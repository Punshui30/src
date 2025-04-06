import { Node, Edge } from 'reactflow';

export interface OptimizationSuggestion {
  type: 'combine' | 'split' | 'add' | 'modify' | 'remove';
  description: string;
  nodes?: string[];
  autoApplicable: boolean;
  changes?: {
    addNodes?: Node[];
    removeNodes?: string[];
    addEdges?: Edge[];
    removeEdges?: string[];
    updateNodes?: Array<{ id: string; updates: Partial<Node> }>;
  };
}

export interface WorkflowAnalysis {
  suggestions: OptimizationSuggestion[];
  explanation: string;
}

function analyzeNodeConnectivity(nodes: Node[], edges: Edge[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  
  // Check for disconnected nodes
  const connectedNodes = new Set(edges.flatMap(e => [e.source, e.target]));
  const disconnectedNodes = nodes.filter(n => !connectedNodes.has(n.id));
  
  if (disconnectedNodes.length > 0) {
    suggestions.push({
      type: 'remove',
      description: `Found ${disconnectedNodes.length} disconnected node(s). Consider removing or connecting them to the workflow.`,
      nodes: disconnectedNodes.map(n => n.id),
      autoApplicable: true,
      changes: {
        removeNodes: disconnectedNodes.map(n => n.id)
      }
    });
  }

  return suggestions;
}

function analyzeNodeEfficiency(nodes: Node[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  
  // Find potential node combinations
  const similarNodes = nodes.reduce((groups, node) => {
    const tool = node.data.sourceTool;
    if (!groups[tool]) groups[tool] = [];
    groups[tool].push(node);
    return groups;
  }, {} as Record<string, Node[]>);

  Object.entries(similarNodes).forEach(([tool, nodes]) => {
    if (nodes.length > 1) {
      suggestions.push({
        type: 'combine',
        description: `Found ${nodes.length} nodes using ${tool}. Consider combining them for better efficiency.`,
        nodes: nodes.map(n => n.id),
        autoApplicable: false
      });
    }
  });

  return suggestions;
}

function analyzeErrorHandling(nodes: Node[], edges: Edge[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  
  // Check for missing error handling
  const nodesWithoutErrorHandling = nodes.filter(node => {
    if (node.type === 'conditional') return false;
    const outgoingEdges = edges.filter(e => e.source === node.id);
    return !outgoingEdges.some(e => e.sourceHandle === 'error');
  });

  if (nodesWithoutErrorHandling.length > 0) {
    suggestions.push({
      type: 'add',
      description: 'Add error handling paths for better reliability.',
      nodes: nodesWithoutErrorHandling.map(n => n.id),
      autoApplicable: true,
      changes: {
        addNodes: [{
          id: 'error-handler',
          type: 'custom',
          position: { x: 400, y: 200 },
          data: {
            label: 'Error Handler',
            sourceTool: 'error_handler',
            params: {
              retries: 3,
              fallback: true
            }
          }
        }],
        addEdges: nodesWithoutErrorHandling.map(node => ({
          id: `e-${node.id}-error`,
          source: node.id,
          target: 'error-handler',
          sourceHandle: 'error',
          animated: true,
          style: { stroke: '#ef4444' }
        }))
      }
    });
  }

  return suggestions;
}

export async function analyzeWorkflow(nodes: Node[], edges: Edge[]): Promise<WorkflowAnalysis> {
  // Collect all suggestions
  const suggestions = [
    ...analyzeNodeConnectivity(nodes, edges),
    ...analyzeNodeEfficiency(nodes),
    ...analyzeErrorHandling(nodes, edges)
  ];

  // Generate explanation
  const explanation = suggestions.length > 0
    ? "I've analyzed your workflow and found several potential improvements:"
    : "Your workflow looks well-structured! Here are some general tips for optimization:";

  return {
    suggestions,
    explanation: `${explanation}\n\n${suggestions.map((s, i) => 
      `${i + 1}. ${s.description}`
    ).join('\n')}`
  };
}