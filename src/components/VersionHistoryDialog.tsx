import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Clock, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { WorkflowVersion } from '../lib/versionControl';
import { useToast } from './ui/toast';

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  versions: WorkflowVersion[];
  onRestoreVersion: (version: WorkflowVersion) => void;
  currentVersionId?: string;
}

export function VersionHistoryDialog({
  isOpen,
  onClose,
  versions,
  onRestoreVersion,
  currentVersionId
}: VersionHistoryDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersion | null>(null);
  const { addToast } = useToast();

  const handleRestore = (version: WorkflowVersion) => {
    try {
      onRestoreVersion(version);
      addToast("Version Restored - Restored workflow to version from " + format(new Date(version.timestamp), 'MMM d, yyyy HH:mm:ss'), "success");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore version';
      addToast("Restore Failed - " + message, "error");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="relative w-full max-w-2xl rounded-lg border bg-card shadow-lg"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Version History</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="p-6 h-[400px]">
              <div className="space-y-4">
                {versions.map((version) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      version.id === currentVersionId
                        ? 'bg-accent border-primary'
                        : 'bg-card hover:bg-accent/50'
                    } cursor-pointer transition-colors`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {format(new Date(version.timestamp), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created by {version.userName}
                        </p>
                      </div>
                      {version.id === currentVersionId && (
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          Current
                        </span>
                      )}
                    </div>

                    {selectedVersion?.id === version.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 pt-4 border-t flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="w-4 h-4" />
                          Restore this version?
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVersion(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(version);
                            }}
                          >
                            <Check className="w-4 h-4" />
                            Restore
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {versions.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No versions found
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}