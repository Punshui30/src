import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface RetryIndicatorProps {
  attempt: number;
  maxAttempts: number;
  message: string;
}

export function RetryIndicator({ attempt, maxAttempts, message }: RetryIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center gap-3 p-4 bg-card/50 border border-border rounded-lg backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {attempt < maxAttempts ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw size={16} />
          </motion.div>
        ) : (
          <AlertCircle size={16} className="text-destructive" />
        )}
        <span>
          {attempt < maxAttempts
            ? `Retry attempt ${attempt}/${maxAttempts}: ${message}`
            : `Failed after ${maxAttempts} attempts: ${message}`}
        </span>
      </div>
    </motion.div>
  );
}