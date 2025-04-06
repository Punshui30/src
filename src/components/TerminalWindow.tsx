import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Minus, Maximize, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';

interface TerminalEntry {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: string;
}

interface TerminalWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
}

const COMMANDS = {
  help: {
    description: 'List available commands',
    action: () => ({
      type: 'output' as const,
      content: `Available commands:
  help              Show this help message
  run [workflow]    Execute a workflow
  reload            Reload adapter registry
  clear             Clear terminal
  exit              Close terminal window`
    })
  },
  run: {
    description: 'Execute a workflow',
    action: (args: string[]) => {
      const workflowName = args[0];
      if (!workflowName) {
        return {
          type: 'error' as const,
          content: 'Error: Missing workflow name. Usage: run [workflow_name]'
        };
      }
      return {
        type: 'output' as const,
        content: `Executing workflow: ${workflowName}...`
      };
    }
  },
  reload: {
    description: 'Reload adapter registry',
    action: () => ({
      type: 'output' as const,
      content: 'Reloading adapter registry...\nAdapter registry reloaded successfully.'
    })
  },
  clear: {
    description: 'Clear terminal',
    action: () => null
  },
  exit: {
    description: 'Close terminal window',
    action: () => ({
      type: 'output' as const,
      content: 'Closing terminal...'
    })
  }
};

export function TerminalWindow({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false
}: TerminalWindowProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: 'welcome',
      type: 'output',
      content: 'A.R.G.O.S. Terminal v1.0.0\nType "help" for available commands.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const handleCommand = async (command: string) => {
    const timestamp = new Date().toISOString();
    const parts = command.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    setHistory(prev => [command, ...prev]);
    setHistoryIndex(-1);

    setEntries(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'command',
      content: command,
      timestamp
    }]);

    if (cmd === 'clear') {
      setEntries([]);
      return;
    }

    if (cmd === 'exit') {
      const result = COMMANDS.exit.action();
      if (result) {
        setEntries(prev => [...prev, {
          id: crypto.randomUUID(),
          type: result.type,
          content: result.content,
          timestamp
        }]);
      }
      setTimeout(onClose, 500);
      return;
    }

    const command_handler = COMMANDS[cmd as keyof typeof COMMANDS];
    if (!command_handler) {
      setEntries(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'error',
        content: `Command not found: ${cmd}`,
        timestamp
      }]);
      return;
    }

    const result = command_handler.action(args);
    if (result) {
      setEntries(prev => [...prev, {
        id: crypto.randomUUID(),
        type: result.type,
        content: result.content,
        timestamp
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      handleCommand(input.trim());
      setInput('');
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "fixed right-8 bottom-8 w-[600px] rounded-lg border shadow-lg backdrop-blur overflow-hidden",
            isFocused ? "bg-card/95 border-primary" : "bg-card/80 border-border"
          )}
          onBlur={onBlur}
        >
          <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
            <div className="flex items-center gap-2 px-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Terminal</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
                <Minus className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMaximize}>
                <Maximize className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="h-[400px] font-mono text-sm">
            <ScrollArea ref={scrollRef} className="h-full">
              <div className="p-4 space-y-2">
                {entries.map(entry => (
                  <div key={entry.id} className="space-y-1">
                    {entry.type === 'command' ? (
                      <div className="flex items-center gap-2 text-primary">
                        <ChevronRight className="w-3 h-3" />
                        <span>{entry.content}</span>
                      </div>
                    ) : (
                      <div className={cn(
                        'ml-5',
                        entry.type === 'error' && 'text-destructive'
                      )}>
                        {entry.content}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-primary">
                  <ChevronRight className="w-3 h-3" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none"
                    autoFocus={isFocused}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}