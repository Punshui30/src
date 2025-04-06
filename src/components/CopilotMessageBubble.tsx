import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface CopilotMessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export function CopilotMessageBubble({ message }: CopilotMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-primary/10"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4 text-primary" />
        )}
      </div>

      <div className={cn(
        "rounded-lg p-4 max-w-[80%]",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-accent/50 border"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}