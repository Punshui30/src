import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { LifeBuoy, Settings, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface RescueFlowProps {
  data: {
    label: string;
    rescueSteps: Array<{
      id: string;
      action: string;
    }>;
    sourceTool: string;
    params: Record<string, any>;
  };
  selected?: boolean;
}

export function RescueFlow({ data, selected }: RescueFlowProps) {
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
      
      <div className="flex items-center justify-between gap-2 min-w-[250px]">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{data.label}</span>
          </div>
          
          <div className="mt-2 space-y-1">
            {data.rescueSteps.map((step) => (
              <div 
                key={step.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <AlertTriangle className="w-3 h-3" />
                {step.action}
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Settings size={14} />
        </Button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary border-border"
      />
    </motion.div>
  );
}