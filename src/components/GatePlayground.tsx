import { apiClient } from '../lib/api'; // or adjust the path if necessary
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Play, Code, ArrowRight, FileJson, List, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useWindowStore } from '../lib/windowStore';
import { TranscodeLogEntry } from './GateLogs';

interface GatePlaygroundProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  position?: { x: number; y: number };
  data?: {
    sourceCode?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };
}

export function GatePlayground({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false,
  position = { x: 100, y: 100 },
  data
}: GatePlaygroundProps) {
  const [sourceCode, setSourceCode] = useState<string>(
    data?.sourceCode || window.adapterFlow?.sourceCode ||
    '// Enter your source code (Language A) here\n// Example:\nfunction getUser(id) {\n  return db.users.findOne({ _id: id });\n}'
  );
  const [transcodedCode, setTranscodedCode] = useState<string>(
    window.adapterFlow?.transcodedCode || '// Transcoded code will appear here'
  );
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { addWindow } = useWindowStore();

  const sourceLanguage = data?.sourceLanguage || 'Language A';
  const targetLanguage = data?.targetLanguage || 'Language B';

  useEffect(() => {
    if (data?.sourceCode) {
      setSourceCode(data.sourceCode);
      if (window.adapterFlow) {
        window.adapterFlow.setSourceCode(data.sourceCode);
      }
    }
  }, [data]);

  const handleTranscode = async () => {
    if (!sourceCode.trim()) {
      addToast('Please enter some code to transcode', 'error');
      return;
    }

    setIsLoading(true);
    let logEntry: TranscodeLogEntry | null = null;

    try {
      // First check server health
      await apiClient.get('/health');
      
      // Then attempt transcoding
      const result = await apiClient.transcodeCode(sourceCode);
      if (!result || !result.output) {
        throw new Error('Invalid response from transcode service');
      }

      const output = result.output;
      const formattedOutput = [
        `# Transcoded from ${sourceLanguage} to ${targetLanguage}`,
        `# Timestamp: ${result.metadata?.timestamp || new Date().toISOString()}`,
        '',
        output
      ].join('\n');

      setTranscodedCode(formattedOutput);

      if (window.adapterFlow) {
        window.adapterFlow.setTranscodedCode(formattedOutput);
      }

      logEntry = {
        id: `transcode-${Date.now()}`,
        timestamp: new Date(),
        sourceCode,
        transcodedCode: formattedOutput,
        sourceLanguage,
        targetLanguage,
        adapter: 'Transcode Service',
        success: true
      };

      addToast('Code transcoded successfully', 'success');
      
    } catch (error) {
      let message = 'Failed to transcode code';
      
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          message = 'Network Error: Failed to connect to transcode service. Please ensure the server is running.';
        } else if (error.response.status === 400) {
          message = error.response.data?.error || 'Invalid request';
        } else {
          message = error.response?.data?.error || error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      console.error('Transcode Error:', message);
      addToast(message, 'error');
      setTranscodedCode([
        '// Error: Transcoding failed',
        '//',
        `// ${message}`
      ].join('\n'));
      
      logEntry = {
        id: `transcode-${Date.now()}`,
        timestamp: new Date(),
        sourceCode,
        transcodedCode: '',
        sourceLanguage,
        targetLanguage,
        adapter: 'Transcode Service',
        success: false,
        error: message
      };
      
    } finally {
      setIsLoading(false);
      if (logEntry && window.gateLogs) {
        window.gateLogs.addLog(logEntry);
      }
    }
  };

  const handleViewLogs = () => {
    addWindow({
      id: `gate-logs-${Date.now()}`,
      type: 'gateLogs',
      title: 'Gate Logs',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 400, y: 200 },
      size: { width: 900, height: 600 }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "w-full h-full rounded-lg overflow-hidden backdrop-blur"
      )}
      onBlur={onBlur}
    >
      <div 
        className="window-header flex items-center justify-between p-2 bg-muted/50 border-b cursor-move"
      >
        <div className="flex items-center gap-2 px-2">
          <Code className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Gate Playground</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            Transcoder
          </span>
        </div>
        <div className="flex items-center gap-1">
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
            onClick={onMaximize}
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

      <div className="h-[calc(100%-36px)] flex flex-col">
        <div className="flex items-center justify-between p-4 bg-accent/30 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{sourceLanguage}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewLogs}
              className="gap-1"
            >
              <List className="w-3 h-3" />
              View Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTranscode}
              disabled={isLoading}
              className="gap-1"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-3 h-3" />
                </motion.div>
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
              Transcode
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 divide-x">
          {/* Source Code Editor */}
          <div className="p-4 h-full flex flex-col">
            <textarea
              value={sourceCode}
              onChange={(e) => {
                setSourceCode(e.target.value);
                if (window.adapterFlow) {
                  window.adapterFlow.setSourceCode(e.target.value);
                }
              }}
              className="flex-1 bg-muted/20 border border-border rounded-md p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={`Enter ${sourceLanguage} code here...`}
              spellCheck="false"
            />
          </div>

          {/* Output */}
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{targetLanguage}</span>
            </div>
            <pre className="flex-1 bg-muted/20 border border-border rounded-md p-4 font-mono text-sm overflow-auto">
              {transcodedCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add a default export to fix potential import issues
export default GatePlayground;