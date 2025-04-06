import { Node, Edge } from 'reactflow';
import { diff, applyChange } from 'deep-diff';
import { format } from 'date-fns';

export interface WorkflowVersion {
  id: string;
  workspaceId: string;
  timestamp: string;
  userId: string;
  userName: string;
  nodes: Node[];
  edges: Edge[];
  hash: string;
  parentHash?: string;
}

export interface VersionConflict {
  type: 'merge' | 'overwrite' | 'reload';
  currentVersion: WorkflowVersion;
  incomingVersion: WorkflowVersion;
  differences: any[];
}

export class VersionControl {
  private versions: WorkflowVersion[] = [];
  private currentHash: string = '';

  constructor() {
    // Load versions from localStorage
    const savedVersions = localStorage.getItem('workflow_versions');
    if (savedVersions) {
      this.versions = JSON.parse(savedVersions);
    }
  }

  private generateHash(nodes: Node[], edges: Edge[]): string {
    const content = JSON.stringify({ nodes, edges });
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private saveVersions(): void {
    localStorage.setItem('workflow_versions', JSON.stringify(this.versions));
  }

  createVersion(
    workspaceId: string,
    userId: string,
    userName: string,
    nodes: Node[],
    edges: Edge[]
  ): WorkflowVersion {
    const hash = this.generateHash(nodes, edges);
    const version: WorkflowVersion = {
      id: crypto.randomUUID(),
      workspaceId,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      nodes,
      edges,
      hash,
      parentHash: this.currentHash || undefined
    };

    this.versions.push(version);
    this.currentHash = hash;
    this.saveVersions();

    return version;
  }

  getVersions(workspaceId: string): WorkflowVersion[] {
    return this.versions
      .filter(v => v.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getVersion(versionId: string): WorkflowVersion | undefined {
    return this.versions.find(v => v.id === versionId);
  }

  getCurrentHash(): string {
    return this.currentHash;
  }

  detectConflicts(
    currentNodes: Node[],
    currentEdges: Edge[],
    incomingNodes: Node[],
    incomingEdges: Edge[]
  ): VersionConflict | null {
    const currentHash = this.generateHash(currentNodes, currentEdges);
    const incomingHash = this.generateHash(incomingNodes, incomingEdges);

    if (currentHash === incomingHash) {
      return null;
    }

    const differences = [
      ...diff(currentNodes, incomingNodes) || [],
      ...diff(currentEdges, incomingEdges) || []
    ];

    if (differences.length === 0) {
      return null;
    }

    // Find the versions
    const currentVersion = this.versions.find(v => v.hash === currentHash);
    const incomingVersion = this.versions.find(v => v.hash === incomingHash);

    if (!currentVersion || !incomingVersion) {
      return null;
    }

    return {
      type: 'merge', // Default suggestion
      currentVersion,
      incomingVersion,
      differences
    };
  }

  async mergeChanges(
    currentNodes: Node[],
    currentEdges: Edge[],
    incomingNodes: Node[],
    incomingEdges: Edge[]
  ): Promise<{ nodes: Node[]; edges: Edge[] }> {
    const mergedNodes = [...currentNodes];
    const mergedEdges = [...currentEdges];

    // Apply non-conflicting changes
    const nodeDiffs = diff(currentNodes, incomingNodes) || [];
    const edgeDiffs = diff(currentEdges, incomingEdges) || [];

    for (const d of nodeDiffs) {
      if (d.kind === 'E' || d.kind === 'N') {
        applyChange(mergedNodes, true, d);
      }
    }

    for (const d of edgeDiffs) {
      if (d.kind === 'E' || d.kind === 'N') {
        applyChange(mergedEdges, true, d);
      }
    }

    return { nodes: mergedNodes, edges: mergedEdges };
  }

  formatVersion(version: WorkflowVersion): string {
    return `Version from ${format(new Date(version.timestamp), 'MMM d, yyyy HH:mm:ss')} by ${version.userName}`;
  }
}