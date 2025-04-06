import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowStore } from '../lib/windowStore';
import { NotificationPopover } from './NotificationPopover';
import { Button } from './ui/button';
import { UserPresence } from './UserPresence';
import { cn } from '../lib/utils';
import { Terminal, Package, Database, Code, GitBranch, Box, FileJson, ScrollText, X } from 'lucide-react';

const WINDOW_ICONS = {
  terminal: Terminal,
  templates: Package,
  adapters: Database,
  gatePlayground: Code,
  flow: GitBranch,
  flow3D: Box, // Using Box instead of Cube
  dslEditor: FileJson,
  gateLogs: ScrollText,
};

export function Taskbar() {
  const { 
    windows, 
    activeWindowId, 
    setActiveWindow,
    removeWindow,
    minimizeWindow,
    restoreWindow,
    bringToFront 
  } = useWindowStore();

  const handleClose = (id: string) => {
    removeWindow(id);
  };

  const handleWindowClick = (windowId: string) => {
    console.log("Taskbar: clicked window", windowId);
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    if (window.isMinimized) {
      console.log("Taskbar: restoring minimized window");
      restoreWindow(windowId);
      bringToFront(windowId);
    } else if (activeWindowId === windowId) {
      console.log("Taskbar: minimizing active window");
      minimizeWindow(windowId);
    } else {
      console.log("Taskbar: bringing window to front");
      bringToFront(windowId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 h-12 bg-card/90 border-t border-border backdrop-blur-lg flex items-center justify-between px-4"
    >
      <div className="flex items-center gap-2">
        <AnimatePresence mode="popLayout">
          {windows
            .filter(w => w.isOpen) // Only show windows that are open
            .sort((a, b) => (b.lastFocused || 0) - (a.lastFocused || 0))
            .map((window) => {
              const Icon = WINDOW_ICONS[window.type as keyof typeof WINDOW_ICONS] || Package;
              
              return (
                <motion.button
                  key={window.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center justify-between px-3 py-1.5 rounded-md transition-colors group",
                    "hover:bg-accent",
                    window.isMinimized && "opacity-50",
                    activeWindowId === window.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <div 
                    className="flex items-center gap-2 cursor-pointer" 
                    onClick={() => handleWindowClick(window.id)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{window.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose(window.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </motion.button>
              );
            })}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <UserPresence />
        <NotificationPopover />
      </div>
    </motion.div>
  );
}