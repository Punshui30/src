import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { GitBranch, Settings } from 'lucide-react';
import { Button } from './ui/button';

interface ConditionalNodeProps {
  data: {
    label: string;
    condition: string;
    sourceTool: string;
    params: {
      field: string;
      operator: string;
      value: string | number;
    };
  };
  selected?: boolean;
}

export function ConditionalNode({ data, selected }: ConditionalNodeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-4 py-2 rounded-lg shadow-lg border transition-colors transform rotate-45 ${
        selected ? 'border-primary bg-accent' : 'border-border bg-card'
      }`}
      style={{ width: '140px', height: '140px' }}
    >
      <div className="-rotate-45">
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-primary border-border"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        />
        
        <div className="flex flex-col items-center gap-2 py-2">
          <GitBranch className="w-5 h-5 text-primary" />
          <div className="text-sm font-medium text-center">{data.label}</div>
          <div className="text-xs text-muted-foreground text-center mt-1">
            {data.condition}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 mt-1">
            <Settings size={14} />
          </Button>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="w-3 h-3 !bg-emerald-500 border-border"
          style={{ left: '25%', transform: 'translateX(-50%)' }}
        />
        
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="w-3 h-3 !bg-destructive border-border"
          style={{ left: '75%', transform: 'translateX(-50%)' }}
        />
      </div>
    </motion.div>
  );
}