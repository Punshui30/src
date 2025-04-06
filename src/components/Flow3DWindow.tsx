import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Camera, GitBranch, Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import FlowCanvas3D from './FlowCanvas3D';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';

interface Flow3DWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  position?: { x: number; y: number };
}

export function Flow3DWindow({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false,
  position = { x: 100, y: 100 }
}: Flow3DWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const { addToast } = useToast();
  
  // Controls for camera animation effects
  const [cameraAnimation, setCameraAnimation] = useState<'orbit' | 'zoom' | 'none'>('none');

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    onMaximize?.();
  };

  const handleCameraControl = (mode: 'orbit' | 'zoom') => {
    setCameraAnimation(mode);
    addToast(`Camera animation: ${mode === 'orbit' ? 'Orbit mode' : 'Zoom mode'} activated`, "info");
    
    // Automatically return to normal mode after a few seconds
    setTimeout(() => {
      setCameraAnimation('none');
    }, 8000);
  };

  const handleApplyLayout = () => {
    addToast("Layout optimized - Nodes have been rearranged for better visualization", "success");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "w-full h-full rounded-lg overflow-hidden backdrop-blur",
            isFocused ? "bg-card/95 border-primary" : "bg-card/80 border-border"
          )}
          onBlur={onBlur}
        >
          <div className="window-header flex items-center justify-between p-2 bg-muted/50 border-b cursor-move">
            <div className="flex items-center gap-2 px-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">3D Flow Visualization</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                Premium
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCameraControl('orbit')}
                title="Orbit Camera"
              >
                <Camera className={cn(
                  "w-3 h-3",
                  cameraAnimation === 'orbit' && "text-primary animate-pulse"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleApplyLayout}
                title="Optimize Layout"
              >
                <Wand2 className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 window-button cursor-pointer" 
                onClick={onMinimize}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 window-button cursor-pointer" 
                onClick={handleMaximize}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
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

          <div className="h-[calc(100%-36px)] w-full">
            <FlowCanvas3D animationMode={cameraAnimation} />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}