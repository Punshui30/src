import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, Plus, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useWorkspaceStore, Workspace } from '../lib/store';
import { cn } from '../lib/utils';

interface WorkspaceSwitcherProps {
  className?: string;
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    hasPermission
  } = useWorkspaceStore();

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span className="font-medium truncate">
            {currentWorkspace?.name || 'Select Workspace'}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 z-50"
          >
            <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              <ScrollArea className="max-h-[300px]">
                <div className="p-2 space-y-1">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleSelectWorkspace(workspace)}
                      className={cn(
                        "w-full px-3 py-2 rounded-md text-sm text-left transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                        workspace.id === currentWorkspace?.id && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span className="font-medium">{workspace.name}</span>
                      </div>
                      {workspace.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {workspace.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-2 border-t border-border bg-muted/50">
                <div className="space-y-1">
                  {hasPermission('create') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <Plus size={14} />
                      New Workspace
                    </Button>
                  )}
                  {hasPermission('edit') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <Settings size={14} />
                      Workspace Settings
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  >
                    <LogOut size={14} />
                    Leave Workspace
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}