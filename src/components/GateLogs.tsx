import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Clock, Copy, ArrowRight, Database, Trash } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useGateLogs, GateLog } from '../lib/gateLogsStore';
import { useWindowStore } from '../lib/windowStore';

interface GateLogsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GateLogs({
  isOpen,
  onClose
}: GateLogsProps) {
  const { logs, clearLogs } = useGateLogs();
  const { addWindow } = useWindowStore();
  const { addToast } = useToast();

  const handleRetry = (log: GateLog) => {
    // Open new Gate In window with log data
    addWindow({
      id: `gate-${Date.now()}`,
      type: 'gateIn',
      title: 'Gate In',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 300, y: 200 },
      size: { width: 600, height: 300 },
      data: {
        input: log.input,
        target: log.target
      }
    });
    
    addToast('Loaded input from log', 'info');
  };

  const handleClearLogs = () => {
    clearLogs();
    addToast('Cleared all logs', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-lg border bg-card shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Gate Logs</h2>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
              {logs.length} entries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLogs}
              className="gap-2"
            >
              <Trash className="w-4 h-4" />
              Clear All
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "p-4 rounded-lg border",
                    log.status === 'success' 
                      ? "bg-emerald-500/10 border-emerald-500/30" 
                      : "bg-destructive/10 border-destructive/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/50">
                          {log.target || 'No target'}
                        </span>
                      </div>
                      
                      <div className="font-mono text-xs bg-background/50 p-2 rounded">
                        <div className="text-muted-foreground">Input:</div>
                        <div className="truncate">{log.input}</div>
                      </div>
                      
                      <div className="font-mono text-xs bg-background/50 p-2 rounded">
                        <div className="text-muted-foreground">Output:</div>
                        <div className="truncate">{log.output}</div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetry(log)}
                      className="shrink-0"
                    >
                      Retry
                    </Button>
                  </div>
                </motion.div>
              ))}
              
              {logs.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground py-8"
                >
                  No logs yet
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}