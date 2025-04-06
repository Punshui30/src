import { Node, Edge } from 'reactflow';
import { apiClient } from './api';

export interface WorkflowEdit {
  type: 'add' | 'remove' | 'modify' | 'insert';
  description: string;
  changes: {
    nodes?: Node[];
    edges?: Edge[];
    removeNodes?: string[];
    removeEdges?: string[];
    updateNodes?: Array<{ id: string; updates: Partial<Node> }>;
  };
}

export interface WorkflowContext {
  nodes: Node[];
  edges: Edge[];
  activeNodeId?: string;
}

export async function parseWorkflowEdit(
  instruction: string,
  context: WorkflowContext
): Promise<WorkflowEdit> {
  // Extract action type and target
  const addMatch = instruction.match(/add (an?|the) ([^ ]+)/i);
  const removeMatch = instruction.match(/remove|delete (the )?([^ ]+)/i);
  const swapMatch = instruction.match(/swap|replace ([^ ]+) (with|for) ([^ ]+)/i);
  const modifyMatch = instruction.match(/modify|update|change (the )?([^ ]+)/i);
  const retryMatch = instruction.match(/retry ([0-9]+) times? every ([0-9]+) seconds?/i);
  const fallbackMatch = instruction.match(/fallback to ([^ ]+)/i);
  const rescueMatch = instruction.match(/rescue with ([^ ]+)/i);

  if (addMatch) {
    const nodeType = addMatch[2].toLowerCase();
    const position = { x: 200, y: 200 };
    
    // Handle robustness nodes
    if (nodeType === 'retry' || nodeType === 'fallback' || nodeType === 'rescue') {
      const newNode: Node = {
        id: `${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: `${nodeType.charAt(0).toUpperCase()}${nodeType.slice(1)} Node`,
          sourceTool: nodeType,
          retryCount: 3,
          delaySeconds: 5,
          fallbackAction: '',
          rescueSteps: [],
          params: {}
        }
      };
      
      return {
        type: 'add',
        description: `Adding ${nodeType} node for error handling`,
        changes: {
          nodes: [newNode]
        }
      };
    }
    
    // If adding after a specific node, adjust position
    const afterMatch = instruction.match(/after (the )?([^ ]+)/i);
    if (afterMatch) {
      const targetNode = context.nodes.find(n => 
        n.data.label.toLowerCase() === afterMatch[2].toLowerCase()
      );
      if (targetNode) {
        position.x = targetNode.position.x;
        position.y = targetNode.position.y + 150;
      }
    }

    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'custom',
      position,
      data: {
        label: nodeType,
        sourceTool: nodeType,
        params: {}
      }
    };

    return {
      type: 'add',
      description: `Adding ${nodeType} node`,
      changes: {
        nodes: [newNode],
        edges: afterMatch ? [{
          id: `e-${Date.now()}`,
          source: context.nodes.find(n => 
            n.data.label.toLowerCase() === afterMatch[2].toLowerCase()
          )?.id || '',
          target: newNode.id,
          animated: true
        }] : []
      }
    };
  }

  if (swapMatch) {
    const oldTool = swapMatch[1].toLowerCase();
    const newTool = swapMatch[3].toLowerCase();
    
    const targetNode = context.nodes.find(n => 
      n.data.label.toLowerCase() === oldTool
    );

    if (!targetNode) {
      throw new Error(`Could not find node "${oldTool}" to replace`);
    }

    return {
      type: 'modify',
      description: `Replacing ${oldTool} with ${newTool}`,
      changes: {
        updateNodes: [{
          id: targetNode.id,
          updates: {
            data: {
              ...targetNode.data,
              label: newTool,
              sourceTool: newTool
            }
          }
        }]
      }
    };
  }

  if (modifyMatch) {
    const targetTool = modifyMatch[2].toLowerCase();
    const targetNode = context.nodes.find(n => 
      n.data.label.toLowerCase() === targetTool
    );

    if (!targetNode) {
      throw new Error(`Could not find node "${targetTool}" to modify`);
    }

    // Extract parameter changes from instruction
    const paramMatch = instruction.match(/set ([^ ]+) to ([^ ]+)/i);
    if (paramMatch) {
      return {
        type: 'modify',
        description: `Updating ${targetTool} parameters`,
        changes: {
          updateNodes: [{
            id: targetNode.id,
            updates: {
              data: {
                ...targetNode.data,
                params: {
                  ...targetNode.data.params,
                  [paramMatch[1]]: paramMatch[2]
                }
              }
            }
          }]
        }
      };
    }
  }

  throw new Error('Could not understand workflow edit instruction');
}