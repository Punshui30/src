import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { 
  Bot, X, Play, ArrowRight, Eye, 
  EyeOff, CheckCircle2, XCircle, Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useAutopilotStore, AutopilotDraft } from '../lib/autopilotStore';
import { useWindowStore } from '../lib/windowStore';

interface AutopilotDraftsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutopilotDrafts({
  isOpen,
  onClose
}: AutopilotDraftsProps) {
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const { drafts, deployDraft, rejectDraft, isEnabled, toggleAutopilot } = useAutopilotStore();
  const { addWindow } = useWindowStore();
  const { addToast } = useToast();

  const handleDeploy = async (draft: AutopilotDraft) => {
    try {
      // Open flow editor with draft workflow
      addWindow({
        id: `flow-${Date.now()}`,
        type: 'flow',
        title: draft.title,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        position: { x: 200, y: 100 },
        size: { width: 800, height: 600 },
        data: {
          nodes: draft.nodes,
          edges: draft.edges
        }
      });
      
      deployDraft(draft.id);
      addToast('Draft deployed to Flow Editor', 'success');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deploy draft';
      addToast(message, 'error');
    }
  };

  const handleReject = (draft: AutopilotDraft) => {
    rejectDraft(draft.id);
    addToast('Draft rejected', 'info');
  };

  if (!isOpen) return null;

  const pendingDrafts = drafts.filter(d => d.status === 'draft');

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Autopilot Drafts</h2>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            {pendingDrafts.length} Drafts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAutopilot}
            className={cn(
              "h-7 px-2 gap-1",
              isEnabled && "text-primary border-primary"
            )}
          >
            <Bot className="w-3 h-3" />
            {isEnabled ? 'Disable' : 'Enable'} Autopilot
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {drafts.map((draft) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onClick={() => setSelectedDraft(
                  selectedDraft === draft.id ? null : draft.id
                )}
                className={cn(
                  "p-4 rounded-lg border bg-card/50 cursor-pointer",
                  draft.status === 'draft' && "border-primary/50",
                  draft.status === 'deployed' && "border-emerald-500/50",
                  draft.status === 'rejected' && "border-muted opacity-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {draft.source === 'schedule' ? (
                      <Calendar className="w-4 h-4 text-primary" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                    <span className="font-medium">{draft.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {draft.status === 'draft' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {Math.round(draft.confidence * 100)}% match
                      </span>
                    )}
                    {draft.status === 'deployed' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {draft.status === 'rejected' && (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {draft.description}
                </p>

                {selectedDraft === draft.id && draft.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-2 text-xs bg-muted/30 rounded border-t"
                  >
                    {draft.explanation}
                  </motion.div>
                )}

                {draft.status === 'draft' && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(draft);
                      }}
                      className="h-7 px-2"
                    >
                      Ignore
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeploy(draft);
                      }}
                      className="h-7 px-2 gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Deploy
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}

            {drafts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                No drafts yet
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  );
}