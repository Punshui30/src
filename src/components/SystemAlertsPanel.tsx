import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { 
  AlertTriangle, CheckCircle2, X, RefreshCw, 
  EyeOff, ArrowRight, Bot, Database, GitBranch, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useSystemWatcher, SystemAlert, SystemComponentType } from '../lib/systemWatcherStore';
import { systemWatcher } from '../lib/systemWatcher';
import { format, formatDistanceToNow } from 'date-fns';

interface SystemAlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPONENT_ICONS: Record<SystemComponentType, typeof AlertTriangle> = {
  adapter: Database,
  agent: Bot,
  workflow: GitBranch,
  copilot: Sparkles
};

export function SystemAlertsPanel({
  isOpen,
  onClose
}: SystemAlertsPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const { alerts, markAsFixed, markAsIgnored } = useSystemWatcher();
  const { addToast } = useToast();

  const handleAutoFix = async (alert: SystemAlert) => {
    setIsFixing(true);
    try {
      const success = await systemWatcher.attemptFix(alert);
      if (success) {
        markAsFixed(alert.id);
        addToast('Issue fixed automatically', 'success');
      } else {
        addToast('Auto-fix failed, manual intervention required', 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fix issue';
      addToast(message, 'error');
    } finally {
      setIsFixing(false);
    }
  };

  const handleIgnore = (alert: SystemAlert) => {
    markAsIgnored(alert.id);
    addToast('Alert ignored', 'info');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">System Alerts</h2>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            {alerts.filter(a => a.status === 'pending').length} Active
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {alerts.map((alert) => {
              const Icon = COMPONENT_ICONS[alert.component];
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setSelectedAlert(
                    selectedAlert === alert.id ? null : alert.id
                  )}
                  className={cn(
                    "p-4 rounded-lg border bg-card/50 cursor-pointer",
                    alert.status === 'pending' && alert.severity === 'critical' && "border-destructive/50",
                    alert.status === 'pending' && alert.severity === 'high' && "border-yellow-500/50",
                    alert.status === 'fixed' && "border-emerald-500/50",
                    alert.status === 'ignored' && "border-muted opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn(
                        "w-4 h-4",
                        alert.severity === 'critical' && "text-destructive",
                        alert.severity === 'high' && "text-yellow-500",
                        alert.severity === 'medium' && "text-primary",
                        alert.status === 'fixed' && "text-emerald-500"
                      )} />
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {alert.status === 'pending' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Active
                        </span>
                      )}
                      {alert.status === 'fixed' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {alert.status === 'ignored' && (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>
                        {formatDistanceToNow(new Date(alert.timestamp), {
                          addSuffix: true
                        })}
                      </span>
                      {alert.fixAttempts > 0 && (
                        <span>
                          {alert.fixAttempts} fix attempts
                        </span>
                      )}
                    </div>
                    {alert.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        {alert.autoFixAvailable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAutoFix(alert);
                            }}
                            disabled={isFixing}
                            className="h-7 px-2 gap-1"
                          >
                            {isFixing ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </motion.div>
                            ) : (
                              <ArrowRight className="w-3 h-3" />
                            )}
                            Auto-Fix
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIgnore(alert);
                          }}
                          className="h-7 px-2"
                        >
                          Ignore
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedAlert === alert.id && alert.error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 text-xs font-mono bg-muted/30 rounded border-t"
                    >
                      {alert.error}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {alerts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                No system alerts
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  );
}