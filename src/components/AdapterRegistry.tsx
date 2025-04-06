import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, FileCode, ChevronRight, Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { apiClient } from '../lib/api';
import { format } from 'date-fns';

interface AdapterRegistryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggestUpdate: (adapterName: string, currentCode: string) => void;
}

interface AdapterInfo {
  name: string;
  version: number;
  file_path: string;
  last_updated: string;
  status: string;
  code?: string;
}

export function AdapterRegistry({ isOpen, onClose, onSuggestUpdate }: AdapterRegistryProps) {
  const [adapters, setAdapters] = useState<Record<string, AdapterInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAdapter, setCheckingAdapter] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchAdapters = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getAdapters();
      setAdapters(response.adapters);
      
      addToast("Registry Updated - Adapter registry has been refreshed", "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addToast("Failed to Load Registry - " + errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckForUpdates = async (adapterName: string) => {
    try {
      setCheckingAdapter(adapterName);
      
      // Fetch the current adapter code
      const response = await apiClient.getAdapters();
      const currentCode = response.adapters[adapterName]?.code;
      
      if (!currentCode) {
        throw new Error('Failed to fetch adapter code');
      }
      
      // Trigger the suggestion process
      onSuggestUpdate(adapterName, currentCode);
      
      addToast("Checking Updates - Analyzing adapter: " + adapterName, "info");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addToast("Update Check Failed - " + errorMessage, "error");
    } finally {
      setCheckingAdapter(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdapters();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", damping: 20 }}
          className={cn(
            "fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl",
            "flex flex-col z-50"
          )}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="text-primary" size={20} />
              <h2 className="font-semibold text-lg">Adapter Registry</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchAdapters}
                disabled={isLoading}
                className={cn("transition-all", isLoading && "animate-spin")}
              >
                <RefreshCw size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {Object.entries(adapters).map(([name, info]) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-accent/50 rounded-lg p-4 border border-border backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-primary flex items-center gap-2">
                        <ChevronRight size={16} className="text-muted-foreground" />
                        {name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Version {info.version}
                      </p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      info.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                    )}>
                      {info.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Path: </span>
                      <code className="text-xs bg-background/50 px-1 py-0.5 rounded">
                        {info.file_path.split('/').pop()}
                      </code>
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Last Updated: </span>
                      {format(new Date(info.last_updated), 'MMM d, yyyy HH:mm:ss')}
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleCheckForUpdates(name)}
                        disabled={checkingAdapter === name}
                      >
                        <Wand2 size={14} className={cn(
                          "transition-all",
                          checkingAdapter === name && "animate-spin"
                        )} />
                        {checkingAdapter === name ? 'Checking...' : 'Check for Updates'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {Object.keys(adapters).length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground p-8"
                >
                  No adapters registered yet
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground p-8"
                >
                  Loading adapters...
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}