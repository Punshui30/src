import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, ChevronDown, Settings } from 'lucide-react';
import { Button } from './ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { ScrollArea } from './ui/scroll-area';

interface SubFlowNodeProps {
  data: {
    label: string;
    workflow: {
      source_tool: string;
      data: Record<string, any>;
    }[];
    onEdit?: () => void;
  };
  selected?: boolean;
}

export function SubFlowNode({ data, selected }: SubFlowNodeProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`px-4 py-2 rounded-lg shadow-lg border transition-colors ${
          selected ? 'border-primary bg-accent' : 'border-border bg-card'
        }`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-primary border-border"
        />
        
        <div className="flex items-center justify-between gap-2 min-w-[250px]">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm font-medium">{data.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.workflow.length} steps
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => data.onEdit?.()}
            >
              <Settings size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(true)}
            >
              <ChevronDown size={14} />
            </Button>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-primary border-border"
        />
      </motion.div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-card rounded-lg border shadow-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">{data.label}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <ChevronDown size={16} />
                </Button>
              </div>

              <ScrollArea className="max-h-[500px] p-4">
                <div className="space-y-3">
                  {data.workflow.map((step, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-md border bg-accent/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {step.source_tool}
                          </p>
                          <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}