import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { X, Minus, Maximize2, Play, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useWindowStore } from '../lib/windowStore';

interface Adapter {
  id: string;
  name: string;
  description: string;
  language: string;
  targetLanguage: string;
  codeSnippet: string;
}

interface AdaptersManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  position?: { x: number; y: number };
}

export function AdaptersManager({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false,
  position = { x: 100, y: 100 }
}: AdaptersManagerProps) {
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const { addToast } = useToast();
  const { addWindow } = useWindowStore();

  useEffect(() => {
    fetch('/adapters')
      .then(res => res.json())
      .then(data => setAdapters(data))
      .catch(() => addToast('Failed to fetch adapters', 'error'));
  }, []);

  if (typeof window !== 'undefined' && !window.adapterFlow) {
    window.adapterFlow = {
      sourceCode: '',
      transcodedCode: '',
      dslOutput: '',
      setSourceCode: (code: string) => { window.adapterFlow.sourceCode = code; },
      setTranscodedCode: (code: string) => { window.adapterFlow.transcodedCode = code; },
      setDslOutput: (dsl: string) => { window.adapterFlow.dslOutput = dsl; }
    };
  }

  const openPlayground = (adapter: Adapter) => {
    if (window.adapterFlow) {
      window.adapterFlow.setSourceCode(adapter.codeSnippet);
    }

    const windowId = `gate-${Date.now()}`;
    addWindow({
      id: windowId,
      type: 'gatePlayground',
      title: `Transcode ${adapter.name}`,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 300, y: 200 },
      size: { width: 900, height: 600 },
      data: {
        sourceCode: adapter.codeSnippet,
        sourceLanguage: adapter.language,
        targetLanguage: adapter.targetLanguage
      }
    });

    addToast(`Opened playground for ${adapter.name}`, 'info');
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
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Adapters Manager</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            Transcoder
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
              <Minus className="w-3 h-3" />
            </Button>
          )}
          {onMaximize && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMaximize}>
              <Maximize2 className="w-3 h-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="h-[calc(100%-36px)] overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Available Adapters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adapters.map((adapter) => (
                <div
                  key={adapter.id}
                  className="bg-accent/30 border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium">{adapter.name}</h3>
                      <p className="text-sm text-muted-foreground">{adapter.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPlayground(adapter)}
                      className="gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Transcode
                    </Button>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{adapter.language}</span>
                      <div className="flex items-center gap-1">
                        <span>→</span>
                        <span className="text-primary">{adapter.targetLanguage}</span>
                      </div>
                    </div>
                    <pre className="bg-card p-3 rounded border border-border text-xs overflow-x-auto">
                      <code>{adapter.codeSnippet}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

