import { useEffect, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import CollaborationWebSocket from '../lib/websocket';
import { useWorkspaceStore } from '../lib/store';
import { useToast } from '../components/ui/use-toast';

export function useCollaboration(
  nodes: Node[],
  edges: Edge[],
  onNodesChange: (nodes: Node[]) => void,
  onEdgesChange: (edges: Edge[]) => void
) {
  const { currentUser, currentWorkspace } = useWorkspaceStore();
  const { toast } = useToast();

  const ws = new CollaborationWebSocket(
    currentUser?.id || 'anonymous',
    currentWorkspace?.id || 'default'
  );

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<Node>) => {
    onNodesChange(
      nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }, [nodes, onNodesChange]);

  const handleEdgeUpdate = useCallback((edgeId: string, updates: Partial<Edge>) => {
    onEdgesChange(
      edges.map(edge => 
        edge.id === edgeId ? { ...edge, ...updates } : edge
      )
    );
  }, [edges, onEdgesChange]);

  const handleNodeLock = useCallback((nodeId: string, userId: string) => {
    toast({
      title: "Node Locked",
      description: `Node is being edited by another user`,
      variant: "default"
    });
  }, [toast]);

  const handleNodeUnlock = useCallback((nodeId: string) => {
    toast({
      title: "Node Unlocked",
      description: `Node is now available for editing`,
      variant: "default"
    });
  }, [toast]);

  const handleSyncRequest = useCallback(() => {
    return { nodes, edges };
  }, [nodes, edges]);

  const handleSyncResponse = useCallback((data: { nodes: Node[]; edges: Edge[] }) => {
    onNodesChange(data.nodes);
    onEdgesChange(data.edges);
  }, [onNodesChange, onEdgesChange]);

  useEffect(() => {
    ws.setHandlers({
      onNodeUpdate: handleNodeUpdate,
      onEdgeUpdate: handleEdgeUpdate,
      onNodeLock: handleNodeLock,
      onNodeUnlock: handleNodeUnlock,
      onSyncRequest: handleSyncRequest,
      onSyncResponse: handleSyncResponse
    });

    ws.connect();
    ws.requestSync();

    return () => {
      ws.disconnect();
    };
  }, [
    handleNodeUpdate,
    handleEdgeUpdate,
    handleNodeLock,
    handleNodeUnlock,
    handleSyncRequest,
    handleSyncResponse
  ]);

  return {
    lockNode: ws.lockNode.bind(ws),
    unlockNode: ws.unlockNode.bind(ws),
    isNodeLocked: ws.isNodeLocked.bind(ws),
    updateNode: ws.updateNode.bind(ws),
    updateEdge: ws.updateEdge.bind(ws)
  };
}