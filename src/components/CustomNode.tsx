import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { WorkflowSuggestionPopover } from './WorkflowSuggestionPopover';
import { analyzeWorkflowNode } from '../lib/workflowSuggestions';

interface CustomNodeProps {
  data: {
    label: string;
    type?: string;
    sourceTool: string;
    params: Record<string, any>;
  };
  selected?: boolean;
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const checkNode = async () => {
      const nodeSuggestions = await analyzeWorkflowNode({
        data,
        id: data.id
      });
      setSuggestions(nodeSuggestions);
    };
    checkNode();
  }, [data]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-2 rounded-lg shadow-lg border transition-colors ${
        selected ? 'border-primary bg-accent' : 'border-border bg-card'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary border-border"
      />
      <div className="flex items-center justify-between gap-2 min-w-[200px]">
        <div>
          <div className="text-sm font-medium">{data.label}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {data.sourceTool}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Settings size={14} />
        </Button>
      </div>
      
      {suggestions.map((suggestion, index) => (
        <WorkflowSuggestionPopover
          key={index}
          suggestion={suggestion}
          onAction={() => setSuggestions(s => s.filter((_, i) => i !== index))}
        />
      ))}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary border-border"
      />
    </motion.div>
  );
}