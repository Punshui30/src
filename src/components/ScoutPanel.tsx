import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { 
  Sparkles, X, Play, ArrowRight, Eye, 
  EyeOff, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useScoutStore, ScoutSuggestion } from '../lib/scoutStore';
import { useInstalledApps } from '../lib/installedAppsStore';
import { useGateLogs } from '../lib/gateLogsStore';
import { useAgentStore } from '../lib/agentStore';
import { useWindowStore } from '../lib/windowStore';

interface ScoutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScoutPanel({
  isOpen,
  onClose
}: ScoutPanelProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const { suggestions, acceptSuggestion, rejectSuggestion, analyzeBehavior } = useScoutStore();
  const { apps } = useInstalledApps();
  const { logs } = useGateLogs();
  const { agents } = useAgentStore();
  const { addWindow } = useWindowStore();
  const { addToast } = useToast();

  // Run analysis periodically
  useEffect(() => {
    if (!isOpen) return;
    
    analyzeBehavior(apps, logs, agents);
    const interval = setInterval(() => {
      analyzeBehavior(apps, logs, agents);
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [isOpen, apps, logs, agents]);

  const handleAccept = async (suggestion: ScoutSuggestion) => {
    try {
      if (suggestion.type === 'workflow') {
        // Open flow editor with suggested workflow
        addWindow({
          id: `flow-${Date.now()}`,
          type: 'flow',
          title: 'Suggested Workflow',
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          position: { x: 200, y: 100 },
          size: { width: 800, height: 600 },
          data: suggestion.workflow
        });
      } else if (suggestion.type === 'tool') {
        // Open Gate In for suggested tool
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
            target: suggestion.tools[0]
          }
        });
      }
      
      acceptSuggestion(suggestion.id);
      addToast('Suggestion accepted', 'success');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply suggestion';
      addToast(message, 'error');
    }
  };

  const handleReject = (suggestion: ScoutSuggestion) => {
    rejectSuggestion(suggestion.id);
    addToast('Suggestion rejected', 'info');
  };

  if (!isOpen) return null;

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">ARGOS Scout</h2>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            {pendingSuggestions.length} Suggestions
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {suggestions.map((suggestion) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onClick={() => setSelectedSuggestion(
                  selectedSuggestion === suggestion.id ? null : suggestion.id
                )}
                className={cn(
                  "p-4 rounded-lg border bg-card/50 cursor-pointer",
                  suggestion.status === 'pending' && "border-primary/50",
                  suggestion.status === 'accepted' && "border-emerald-500/50",
                  suggestion.status === 'rejected' && "border-muted opacity-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {suggestion.status === 'pending' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {Math.round(suggestion.confidence * 100)}% match
                      </span>
                    )}
                    {suggestion.status === 'accepted' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {suggestion.status === 'rejected' && (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {suggestion.description}
                </p>

                {selectedSuggestion === suggestion.id && suggestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-2 text-xs bg-muted/30 rounded border-t"
                  >
                    {suggestion.explanation}
                  </motion.div>
                )}

                {suggestion.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(suggestion);
                      }}
                      className="h-7 px-2"
                    >
                      Ignore
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(suggestion);
                      }}
                      className="h-7 px-2 gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Apply
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}

            {suggestions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                No suggestions yet
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  );
}