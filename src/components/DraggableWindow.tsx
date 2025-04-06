// src/components/DraggableWindow.tsx
import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface DraggableWindowProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
  badge?: string;
}

export function DraggableWindow({
  title,
  icon,
  children,
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  className,
  badge
}: DraggableWindowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  return (
    <motion.div
      className={cn(
        "absolute bg-card border border-border rounded-lg shadow-lg overflow-hidden",
        className
      )}
      drag
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0}
      onDragEnd={(e, info) => {
        setPosition({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y
        });
      }}
      style={{
        x: position.x,
        y: position.y,
        width: className?.includes('w-') ? undefined : '800px',
        height: className?.includes('h-') ? undefined : '600px',
      }}
    >
      {/* Window header - draggable area */}
      <div className="window-header flex items-center justify-between p-2 bg-muted/50 border-b cursor-move">
        <div className="flex items-center gap-2 px-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 window-button cursor-pointer" 
              onClick={onMinimize}
            >
              <Minus className="w-3 h-3" />
            </Button>
          )}
          {onMaximize && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 window-button cursor-pointer" 
              onClick={onMaximize}
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 window-button cursor-pointer" 
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Window content */}
      <div className="window-content h-[calc(100%-36px)]">
        {children}
      </div>
    </motion.div>
  );
}