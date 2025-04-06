import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  useStoreApi
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { FlowNode, FlowEdge } from '../types/dslTypes';
import { useWindowStore } from '../lib/windowStore';

interface FlowEditorWindowProps {
  isOpen: boolean;
  isFocused?: boolean;
  position?: { x: number; y: number };
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  data: {
    nodes: FlowNode[];
    edges: FlowEdge[];
  };
  allowNodeEditing?: boolean;
  allowEdgeEditing?: boolean;
  enableDslActions?: boolean;
}

export function Flow3DWindow({
  isOpen,
  isFocused = false,
  position = { x: 150, y: 150 },
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  data,
  allowNodeEditing = true,
  allowEdgeEditing = true,
  enableDslActions = true,
}: FlowEditorWindowProps) {
  const [nodes, setNodes] = useState<FlowNode[]>(data.nodes);
  const [edges, setEdges] = useState<FlowEdge[]>(data.edges);
  const { addToast } = useToast();

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  const store = useStoreApi();

  const handleDslExport = async () => {
    const snapshot = store.getState();
    const dsl = {
      nodes: snapshot.getNodes(),
      edges: snapshot.getEdges(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(dsl, null, 2));
      addToast('Workflow DSL copied to clipboard', 'info');
    } catch (error) {
      addToast('Failed to copy DSL to clipboard', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute flex flex-col',
        'rounded-lg overflow-hidden backdrop-blur bg-card/90 border shadow-md',
        isFocused ? 'border-primary' : 'border-border'
      )}
      style={{ top: position.y, left: position.x }}
      onBlur={onBlur}
    >
      <div className="flex items-center justify-between p-2 bg-muted/50 border-b cursor-move backdrop-blur-sm">
        <div className="flex items-center gap-2 px-2">
          <span className="text-sm font-medium">Flow Editor</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            DSL
          </span>
        </div>
        <div className="flex items-center gap-1">
          {enableDslActions && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDslExport}>
              ⤓
            </Button>
          )}
          {onMinimize && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
              –
            </Button>
          )}
          {onMaximize && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMaximize}>
              ☐
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      <div className="flex-grow w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={allowNodeEditing ? onNodesChange : undefined}
          onEdgesChange={allowEdgeEditing ? onEdgesChange : undefined}
          onConnect={allowEdgeEditing ? onConnect : undefined}
          fitView
        />
      </div>
    </div>
  );
}

