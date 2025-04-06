import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useWindowStore } from '../lib/windowStore';
import { WorkflowSuggestion } from '../lib/workflowSuggestions';

interface WorkflowSuggestionPopoverProps {
  suggestion: WorkflowSuggestion;
  onAction: () => void;
}

export function WorkflowSuggestionPopover({
  suggestion,
  onAction
}: WorkflowSuggestionPopoverProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { addWindow } = useWindowStore();

  const handleAction = () => {
    if (suggestion.actionType === 'gate_in') {
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
          target: suggestion.tool
        }
      });
    }
    onAction();
    setIsOpen(false);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground"
        >
          <AlertCircle className="w-3 h-3" />
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          className="w-80 p-4 rounded-lg border bg-card shadow-lg"
          sideOffset={5}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <h3 className="font-medium">{suggestion.title}</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              {suggestion.description}
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={handleAction}
                className="gap-1"
              >
                {suggestion.actionLabel}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}