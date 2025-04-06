import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { X, Minus, Maximize2, Play, Code, ArrowRight, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useWindowStore } from '../lib/windowStore';

interface AdaptersManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  position?: { x: number; y: number };
}

// Define mock adapters
const mockAdapters = [
  {
    id: 'python',
    name: 'Python Adapter',
    description: 'Converts Python code to standardized API requests',
    codeSnippet: `def get_user(user_id):
    """Get user by ID"""
    return db.users.find_one({"_id": user_id})`,
    language: 'Python',
    targetLanguage: 'JavaScript'
  },
  {
    id: 'node',
    name: 'Node.js Adapter',
    description: 'Transpiles Node.js code to platform-agnostic format',
    codeSnippet: `async function getUser(id) {
  // Fetch user from database
  const user = await db.collection('users')
    .findOne({ _id: id });
  return user;
}`,
    language: 'JavaScript',
    targetLanguage: 'Python'
  },
  {
    id: 'graphql',
    name: 'GraphQL Adapter',
    description: 'Transforms GraphQL queries to REST API calls',
    codeSnippet: `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    roles
  }
}`,
    language: 'GraphQL',
    targetLanguage: 'REST'
  },
  {
    id: 'rest',
    name: 'REST API Adapter',
    description: 'Converts REST endpoints to GraphQL operations',
    codeSnippet: `// GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const user = getUserById(userId);
  res.json(user);
});`,
    language: 'JavaScript (Express)',
    targetLanguage: 'GraphQL'
  }
];

// Create a global state store for sharing data between components
// This is a simple implementation - in a real app, you might use Context or Redux
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

export function AdaptersManager({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false,
  position = { x: 100, y: 100 }
}: AdaptersManagerProps) {
  const { addToast } = useToast();
  const { addWindow } = useWindowStore();
  
  const openPlayground = (adapter) => {
    // Store the selected adapter's code in the shared state
    if (window.adapterFlow) {
      window.adapterFlow.setSourceCode(adapter.codeSnippet);
    }
    
    // Open GatePlayground with the adapter's code snippet
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
    
    // Show toast
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

      <div className="h-[calc(100%-36px)] overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Available Adapters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockAdapters.map((adapter) => (
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