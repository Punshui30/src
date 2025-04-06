import { Node, Edge } from 'reactflow';

export interface WorkflowStep {
  source_tool: string;
  data: Record<string, any>;
  workflow?: WorkflowStep[]; // For sub-flows
}

export interface WorkflowDefinition {
  workflow: WorkflowStep[];
  explanation?: string;
}

// Mock GPT-4 response for workflow generation
const mockWorkflowResponse = {
  workflow: [
    {
      source_tool: "gpt-4",
      data: {
        prompt: "Summarize the following text in a concise way that would make a good image prompt: {{input}}",
        temperature: 0.7,
        max_tokens: 500
      }
    },
    {
      source_tool: "sub_flow",
      workflow: [
        {
          source_tool: "stable_diffusion",
          data: {
            prompt: "{{gpt-4.output}}",
            steps: 50,
            width: 1024,
            height: 1024,
            guidance_scale: 7.5
          }
        },
        {
          source_tool: "image_upscaler",
          data: {
            scale: 2,
            denoise: 0.5
          }
        }
      ],
      data: {
        label: "Image Generation Pipeline"
      }
    },
    {
      source_tool: "webhook",
      data: {
        url: "https://api.example.com/webhook",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        payload: {
          summary: "{{gpt-4.output}}",
          image_url: "{{stable_diffusion.output}}"
        }
      }
    }
  ],
  explanation: "I've created a workflow that will:\n\n1. Use GPT-4 to generate a concise summary\n2. Process it through an image generation sub-flow that includes:\n   - Stable Diffusion for initial generation\n   - Image upscaling for better quality\n3. Send both the summary and image URL to your webhook endpoint"
};

export function generateWorkflowLayout(workflow: WorkflowStep[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Calculate grid layout
  const VERTICAL_SPACING = 150;
  const START_Y = 50;
  const CENTER_X = 250;

  workflow.forEach((step, index) => {
    // Create node
    const node: Node = {
      id: `${index + 1}`,
      type: step.source_tool === 'sub_flow' ? 'sub_flow' : 'custom',
      position: { 
        x: CENTER_X,
        y: START_Y + (index * VERTICAL_SPACING)
      },
      data: step.source_tool === 'sub_flow' ? {
        label: step.data.label || 'Sub-Flow',
        workflow: step.workflow || [],
        sourceTool: step.source_tool
      } : {
        label: step.source_tool.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        sourceTool: step.source_tool,
        params: step.data
      }
    };
    nodes.push(node);

    // Create edge to previous node
    if (index > 0) {
      edges.push({
        id: `e${index}-${index + 1}`,
        source: `${index}`,
        target: `${index + 1}`,
        animated: true,
        type: 'smoothstep'
      });
    }
  });

  return { nodes, edges };
}

export async function generateWorkflow(prompt: string): Promise<WorkflowDefinition> {
  // In sandbox environment, return mock response
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
  return mockWorkflowResponse;
}

export function createSubFlow(nodes: Node[], selectedNodes: string[]): WorkflowStep {
  // Convert selected nodes to a sub-flow
  const subFlowNodes = nodes
    .filter(node => selectedNodes.includes(node.id))
    .sort((a, b) => Number(a.id) - Number(b.id));

  const workflow = subFlowNodes.map(node => ({
    source_tool: node.data.sourceTool,
    data: node.data.params || {}
  }));

  return {
    source_tool: 'sub_flow',
    workflow,
    data: {
      label: `Sub-Flow (${workflow.length} steps)`
    }
  };
}