import { useEffect, useRef } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface LogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'success';
}

interface LogPanelProps {
  className?: string;
  logs: LogEntry[];
}

export function LogPanel({ className, logs }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card border-t border-border", className)}
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">System Logs</h2>
      </div>
      <ScrollArea className="h-[calc(100%-4rem)]">
        <div className="p-4 space-y-2">
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "py-2 px-3 rounded-md font-mono text-sm",
                log.level === 'error' && "bg-destructive/20 text-destructive-foreground",
                log.level === 'success' && "bg-emerald-500/20 text-emerald-400",
                log.level === 'info' && "bg-accent text-accent-foreground"
              )}
            >
              <span className="opacity-60">[{log.timestamp}]</span>{' '}
              {log.message}
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}