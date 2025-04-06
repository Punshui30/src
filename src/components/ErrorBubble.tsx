import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

interface ErrorBubbleProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBubble({ message, onDismiss }: ErrorBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-start gap-3 p-4 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive-foreground"
    >
      <XCircle size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1 text-sm">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-destructive-foreground/50 hover:text-destructive-foreground transition-colors"
        >
          <XCircle size={16} />
        </button>
      )}
    </motion.div>
  );
}