import { Node, Edge } from 'reactflow';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import yaml from 'yaml';

export interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    name: string;
    description?: string;
    created: string;
    modified: string;
    version: string;
    tags?: string[];
    author?: {
      id: string;
      name: string;
    };
  };
}

export interface WorkflowExport {
  format: 'json' | 'yaml';
  data: string;
  filename: string;
}

export function validateWorkflowData(data: any): data is WorkflowData {
  try {
    // Check basic structure
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return false;
    if (!data.metadata || typeof data.metadata !== 'object') return false;

    // Validate metadata
    const { metadata } = data;
    if (typeof metadata.name !== 'string') return false;
    if (typeof metadata.created !== 'string') return false;
    if (typeof metadata.modified !== 'string') return false;
    if (typeof metadata.version !== 'string') return false;

    // Validate nodes
    for (const node of data.nodes) {
      if (!node.id || !node.type || !node.data || !node.position) return false;
      if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false;
    }

    // Validate edges
    for (const edge of data.edges) {
      if (!edge.id || !edge.source || !edge.target) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function exportWorkflow(
  nodes: Node[],
  edges: Edge[],
  metadata: Partial<WorkflowData['metadata']>
): WorkflowData {
  return {
    nodes,
    edges,
    metadata: {
      name: metadata.name || 'Untitled Workflow',
      description: metadata.description,
      created: metadata.created || new Date().toISOString(),
      modified: new Date().toISOString(),
      version: metadata.version || '1.0',
      tags: metadata.tags,
      author: metadata.author
    }
  };
}

export function generateWorkflowExport(
  workflow: WorkflowData,
  format: 'json' | 'yaml' = 'json'
): WorkflowExport {
  const sanitizedName = workflow.metadata.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${sanitizedName}-${timestamp}.workflow.${format}`;

  let data: string;
  if (format === 'yaml') {
    data = yaml.stringify(workflow, { indent: 2 });
  } else {
    data = JSON.stringify(workflow, null, 2);
  }

  return { format, data, filename };
}

export function downloadWorkflow(exportData: WorkflowExport): void {
  const blob = new Blob([exportData.data], {
    type: exportData.format === 'json' ? 'application/json' : 'text/yaml'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportData.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateShareableLink(workflow: WorkflowData): string {
  // Remove visual state that shouldn't be shared
  const cleanWorkflow = {
    ...workflow,
    nodes: workflow.nodes.map(node => ({
      ...node,
      selected: undefined,
      dragging: undefined,
      zIndex: undefined
    })),
    edges: workflow.edges.map(edge => ({
      ...edge,
      selected: undefined,
      animated: undefined
    }))
  };

  // Compress workflow data
  const compressed = compressToEncodedURIComponent(
    JSON.stringify(cleanWorkflow)
  );

  // Generate link with compressed data
  const baseUrl = window.location.origin;
  return `${baseUrl}/import/${compressed}`;
}

export function importFromShareableLink(link: string): WorkflowData {
  try {
    // Extract compressed data from URL
    const compressed = link.split('/import/')[1];
    if (!compressed) {
      throw new Error('Invalid share link format');
    }

    // Decompress and parse data
    const decompressed = decompressFromEncodedURIComponent(compressed);
    if (!decompressed) {
      throw new Error('Failed to decompress workflow data');
    }

    const workflow = JSON.parse(decompressed);
    
    // Validate imported data
    if (!validateWorkflowData(workflow)) {
      throw new Error('Invalid workflow data structure');
    }

    return workflow;
  } catch (error) {
    throw new Error(`Failed to import workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}