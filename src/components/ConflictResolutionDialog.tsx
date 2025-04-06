import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { GitMerge, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { format } from 'date-fns';
import { VersionConflict, WorkflowVersion } from '../lib/versionControl';
import { useToast } from './ui/toast';

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: VersionConflict;
  onResolve: (resolution: 'merge' | 'overwrite' | 'reload') => void;
}

export function ConflictResolutionDialog({
  isOpen,
  onClose,
  conflict,
  onResolve
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<'merge' | 'overwrite' | 'reload'>('merge');
  const { addToast } = useToast();

  const handleResolve = () => {
    try {
      onResolve(selectedResolution);
      addToast("Conflict Resolved - Successfully " + selectedResolution + "d changes", "success");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve conflict';
      addToast("Resolution Failed - " + message, "error");
    }
  };

  const formatVersion = (version: WorkflowVersion) => {
    return `Version from ${format(new Date(version.timestamp), 'MMM d, yyyy HH:mm:ss')} by ${version.userName}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="relative w-full max-w-2xl rounded-lg border bg-card shadow-lg"
          >
            <div className="flex items-center gap-2 p-6 border-b">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold">Version Conflict Detected</h2>
            </div>

            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                Changes have been made to this workflow from multiple sources. How would you like to proceed?
              </p>

              <div className="space-y-4">
                <button
                  className={`w-full p-4 rounded-lg border transition-colors ${
                    selectedResolution === 'merge'
                      ? 'bg-accent border-primary'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedResolution('merge')}
                >
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Merge Changes</p>
                      <p className="text-sm text-muted-foreground">
                        Combine both sets of changes where possible
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  className={`w-full p-4 rounded-lg border transition-colors ${
                    selectedResolution === 'overwrite'
                      ? 'bg-accent border-primary'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedResolution('overwrite')}
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Keep My Changes</p>
                      <p className="text-sm text-muted-foreground">
                        Overwrite with your current version
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  className={`w-full p-4 rounded-lg border transition-colors ${
                    selectedResolution === 'reload'
                      ? 'bg-accent border-primary'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedResolution('reload')}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Load Latest Version</p>
                      <p className="text-sm text-muted-foreground">
                        Discard local changes and load the latest version
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium mb-2">Version Details:</p>
                <ScrollArea className="h-32">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Your version: {formatVersion(conflict.currentVersion)}</p>
                    <p>Incoming version: {formatVersion(conflict.incomingVersion)}</p>
                    <p className="text-xs">
                      {conflict.differences.length} difference{conflict.differences.length !== 1 ? 's' : ''} detected
                    </p>
                  </div>
                </ScrollArea>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleResolve}>
                  Apply Resolution
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}