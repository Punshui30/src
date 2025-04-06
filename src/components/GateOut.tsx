import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, ArrowRight, Code, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useGateLogs } from '../lib/gateLogsStore';
import { useGateOut } from '../lib/gateOutStore';

interface GateOutProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  data?: {
    payload?: any;
    target?: string;
    onSuccess?: () => void;
    onFailure?: () => void;
  };
}

export function GateOut({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false,
  data
}: GateOutProps) {
  const [isVerbose, setIsVerbose] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { addLog } = useGateLogs();
  const { sendPayload, lastResponse, lastError } = useGateOut();

  const handleSend = async () => {
    if (!data?.payload) {
      addToast('No payload to send', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendPayload(data.payload, data.target);
      
      // Add success log
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        input: JSON.stringify(data.payload),
        target: data.target || 'unknown',
        output: JSON.stringify(response),
        status: 'success'
      });

      addToast('Payload sent successfully', 'success');
      data.onSuccess?.();

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send payload';
      
      // Add error log
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        input: JSON.stringify(data.payload),
        target: data.target || 'unknown',
        output: message,
        status: 'error'
      });

      addToast(message, 'error');
      data.onFailure?.();

    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "w-full h-full rounded-lg overflow-hidden backdrop-blur",
        isFocused ? "bg-card/95 border-primary" : "bg-card/80 border-border"
      )}
      onBlur={onBlur}
    >
      <div className="window-header flex items-center justify-between p-2 bg-muted/50 border-b cursor-move">
        <div className="flex items-center gap-2 px-2">
          <Code className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Gate Out</span>
          {data?.target && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
              {data.target}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsVerbose(!isVerbose)}
            title={isVerbose ? 'Hide Details' : 'Show Details'}
          >
            {isVerbose ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onMinimize}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onMaximize}
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-36px)]">
        <div className="p-4 space-y-4">
          {/* Payload Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Payload</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSend}
                disabled={isLoading || !data?.payload}
                className="gap-2"
              >
                <ArrowRight className="w-3 h-3" />
                Send
              </Button>
            </div>
            <pre className="bg-muted/20 border rounded-lg p-4 text-xs font-mono overflow-auto">
              {JSON.stringify(data?.payload || {}, null, 2)}
            </pre>
          </div>

          {/* Status Section */}
          {(lastResponse || lastError) && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Status</h3>
              <div className={cn(
                "p-4 rounded-lg border flex items-start gap-3",
                lastError
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-emerald-500/10 border-emerald-500/30"
              )}>
                {lastError ? (
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {lastError ? 'Failed to send payload' : 'Payload sent successfully'}
                  </p>
                  {isVerbose && (
                    <pre className="text-xs font-mono mt-2 overflow-auto">
                      {JSON.stringify(lastError || lastResponse, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}