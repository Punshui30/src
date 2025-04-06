import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, { 
  ReactFlowProvider, 
  Controls, 
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import { X, Minus, Maximize2, RotateCw, GitBranch } from 'lucide-react';
import { Button } from './ui/button';
import FlowCanvas3D from './FlowCanvas3D';
import { cn } from '../lib/utils';
import { CustomNode } from './CustomNode';
import { ConditionalNode } from './ConditionalNode';
import { RetryNode } from './RetryNode';
import { FallbackNode } from './FallbackNode';
import { RescueFlow } from './RescueFlow';

const nodeTypes = {
  custom: CustomNode,
  conditional: ConditionalNode,
  retry: RetryNode,
  fallback: FallbackNode,
  rescue: RescueFlow
};

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: { label: 'Start', sourceTool: 'start', params: {} }
  }
];

interface FlowWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  position?: { x: number; y: number };
}

export function FlowWindow({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false,
  position = { x: 100, y: 100 }
}: FlowWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const addNode = (type: 'custom' | 'conditional') => {
    const newNode = {
      id: `${Date.now()}`,
      type,
      position: { x: 200, y: 200 },
      data: {
        label: type === 'custom' ? 'New Node' : 'Condition',
        sourceTool: type === 'custom' ? 'process' : 'condition',
        retryCount: 3,
        delaySeconds: 5,
        fallbackAction: 'Send Email',
        rescueSteps: [],
        params: {}
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    onMaximize?.();
  };

  const toggleViewMode = () => {
    setIs3DMode(!is3DMode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "w-full h-full rounded-lg overflow-hidden backdrop-blur",
            isFocused ? "bg-card/95 border-primary" : "bg-card/80 border-border"
          )}
          onBlur={onBlur}
        >
          <div className="window-header flex items-center justify-between p-2 bg-muted/50 border-b cursor-move">
            <div className="flex items-center gap-2 px-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Flow Editor</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                {is3DMode ? '3D' : '2D'} View
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleViewMode}
                title={`Switch to ${is3DMode ? '2D' : '3D'} View`}
              >
                <RotateCw className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 window-button cursor-pointer" 
                onClick={onMinimize}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 window-button cursor-pointer" 
                onClick={handleMaximize}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 window-button cursor-pointer" 
                onClick={onClose}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="h-[calc(100%-36px)]">
            {is3DMode ? (
              <FlowCanvas3D />
            ) : (
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background />
                  <Controls />
                  <Panel position="top-left" className="bg-card/80 p-2 rounded-lg border">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => addNode('custom')}>
                        Add Node
                      </Button>
                      <Button size="sm" onClick={() => addNode('conditional')}>
                        Add Condition
                      </Button>
                      <Button size="sm" onClick={() => addNode('retry')}>
                        Add Retry
                      </Button>
                      <Button size="sm" onClick={() => addNode('fallback')}>
                        Add Fallback
                      </Button>
                      <Button size="sm" onClick={() => addNode('rescue')}>
                        Add Rescue
                      </Button>
                    </div>
                  </Panel>
                </ReactFlow>
              </ReactFlowProvider>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}