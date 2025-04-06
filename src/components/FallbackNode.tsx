import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface FallbackNodeProps {
  data: {
    label: string;
    fallbackAction: string;
    sourceTool: string;
    params: Record<string, any>;
  };
  selected?: boolean;
}

export function FallbackNode({ data, selected }: FallbackNodeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "px-4 py-2 rounded-lg shadow-lg border transition-colors",
        selected ? "border-primary bg-accent" : "border-border bg-card"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary border-border"
      />
      
      <div className="flex items-center justify-between gap-2 min-w-[200px]">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{data.label}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Fallback: {data.fallbackAction}
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Settings size={14} />
        </Button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="w-3 h-3 !bg-emerald-500 border-border"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        className="w-3 h-3 !bg-destructive border-border"
        style={{ left: '75%' }}
      />
    </motion.div>
  );
}