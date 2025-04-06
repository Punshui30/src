import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Code, Sparkles, Zap, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useGateLogs } from '../lib/gateLogsStore';
import { apiClient } from '../lib/api';

interface GateInProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  data?: {
    input?: string;
    target?: string;
  };
}

interface CopilotSuggestion {
  message: string;
  suggestedInput?: string;
  suggestedTarget?: string;
}

export function GateIn({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false,
  data
}: GateInProps) {
  const [input, setInput] = useState(data?.input || '');
  const [target, setTarget] = useState(data?.target || '');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<CopilotSuggestion | null>(null);
  const { addToast } = useToast();
  const [examples] = useState([
    { text: "Convert blog to video using Runway", target: "Runway" },
    { text: "Send data to Google Sheets", target: "Google Sheets" },
    { text: "Generate image with Leonardo AI", target: "Leonardo" },
    { text: "Sync tasks to Notion", target: "Notion" }
  ]);
  const { addLog } = useGateLogs();

  useEffect(() => {
    if (data?.input) setInput(data.input);
    if (data?.target) setTarget(data.target);
  }, [data]);

  const handleTranscode = async (useAdapter?: boolean) => {
    if (!input.trim()) {
      addToast('Please enter some input to transcode', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutput(null);
    setSuggestion(null);

    try {
      const response = await apiClient.transcodeCode(input, {
        mode: isAdvancedMode ? 'manual' : 'smart',
        target: isAdvancedMode ? target : undefined
      });

      setOutput(response.output);
      
      // Add success log
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        input,
        target: response.tool || target,
        action: response.action,
        output: response.output,
        status: 'success'
      });
      
      addToast('Gate transcoded input successfully', 'success');

    } catch (error) {
      let message = 'Failed to transcode input';
      
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          message = 'Network Error: Failed to connect to server. Please ensure the server is running.';
        } else if (error.response.status === 400) {
          message = error.response.data?.error || 'Invalid request';
        } else {
          message = error.response.data?.error || error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      setError(message);
      
      // Add error log
      addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        input,
        target,
        output: message,
        status: 'error'
      });

      // Get Copilot suggestion
      try {
        const copilotResponse = await apiClient.askCopilot(input, target, message);
        setSuggestion({
          message: copilotResponse.suggestion,
          suggestedInput: copilotResponse.input,
          suggestedTarget: copilotResponse.target
        });
      } catch (copilotError) {
        const copilotMessage = axios.isAxiosError(copilotError)
          ? 'Network Error: Failed to reach Copilot service'
          : 'Failed to get Copilot suggestion';
        console.error(copilotMessage, copilotError);
      }
      
      addToast('Gate failed to transcode input', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    if (suggestion.suggestedInput) setInput(suggestion.suggestedInput);
    if (suggestion.suggestedTarget) setTarget(suggestion.suggestedTarget);
    handleTranscode(false); // Retry without adapter to avoid loop
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
          <span className="text-sm font-medium">Gate In</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className="text-xs gap-1"
          >
            <Code className="w-3 h-3" />
            {isAdvancedMode ? 'Simple Mode' : 'Advanced Mode'}
          </Button>
        </div>
        <div className="flex items-center gap-1">
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

      <div className="p-4 space-y-4">
        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAdvancedMode ? "Enter input..." : "Describe what you want to do..."}
              className="flex-1 bg-background/50 rounded-md px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            {isAdvancedMode && (
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target Tool / API"
                className="w-48 bg-background/50 rounded-md px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
              />
            )}
            <Button
              onClick={() => handleTranscode()}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Transcode
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Example Suggestions */}
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((example, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(example.text);
                setTarget(example.target);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-accent/50 hover:bg-accent/70 transition-colors"
            >
              {example.text}
            </button>
          ))}
        </div>

        {/* Output Section */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Output</div>
          <div className={cn(
            "min-h-[100px] p-4 rounded-lg border font-mono text-sm overflow-auto",
            error 
              ? "bg-destructive/10 border-destructive/30 text-destructive" 
              : output 
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-muted/20 border-border"
          )}>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
                Running Gate...
              </div>
            ) : error ? (
              error
            ) : output ? (
              <pre className="whitespace-pre-wrap">
                {(() => {
                  try {
                    // Try to parse and pretty print JSON
                    const parsed = JSON.parse(output);
                    return JSON.stringify(parsed, null, 2);
                  } catch {
                    // If not JSON, return as-is
                    return output;
                  }
                })()}
              </pre>
            ) : (
              <span className="text-muted-foreground">
                Transcoded output will appear here
              </span>
            )}
          </div>
        </div>

        {/* Copilot Suggestion */}
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border border-primary/30 bg-primary/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium">Copilot Suggestion</span>
            </div>
            <p className="text-sm mb-3">{suggestion.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={applySuggestion}
              className="gap-2"
            >
              <ArrowRight className="w-3 h-3" />
              Retry with Suggestion
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}