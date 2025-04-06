import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 100, y: 50 },
    data: { label: 'Start' },
    type: 'input',
  },
  {
    id: '2',
    position: { x: 300, y: 150 },
    data: { label: 'Process' },
  },
  {
    id: '3',
    position: { x: 500, y: 250 },
    data: { label: 'End' },
    type: 'output',
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

export default function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Edge<any> | Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  return (
    <div className='w-full h-full bg-gray-800 text-white'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}