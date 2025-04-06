import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Check, Code, FileJson, Save, Download, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useWindowStore } from '../lib/windowStore';

interface DSLEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  position?: { x: number; y: number };
  data?: {
    initialContent?: string;
  };
}

// Example DSL schema with some typical fields
const exampleDSL = {
  "schema": "dsl-1.0",
  "metadata": {
    "name": "Example DSL",
    "description": "A sample DSL configuration",
    "version": "1.0.0",
    "author": "System"
  },
  "definitions": {
    "endpoints": [
      {
        "name": "getUserProfile",
        "path": "/users/:id",
        "method": "GET",
        "parameters": {
          "id": {
            "type": "string",
            "required": true
          }
        },
        "response": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "email": { "type": "string" }
          }
        }
      }
    ],
    "models": [
      {
        "name": "User",
        "properties": {
          "id": { "type": "string", "primary": true },
          "name": { "type": "string" },
          "email": { "type": "string" }
        }
      }
    ]
  }
};

export function DSLEditor({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false,
  position = { x: 100, y: 100 },
  data
}: DSLEditorProps) {
  // Initialize content:
  // 1. First try to use data.initialContent if provided
  // 2. Then try to use any content from the global adapterFlow state
  // 3. Finally fall back to the example DSL
  const getInitialContent = () => {
    if (data?.initialContent) {
      return data.initialContent;
    } 
    if (window.adapterFlow?.dslOutput) {
      return window.adapterFlow.dslOutput;
    }
    return JSON.stringify(exampleDSL, null, 2);
  };

  const [content, setContent] = useState<string>(getInitialContent());
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { addToast } = useToast();
  const { addWindow } = useWindowStore();

  // Update content if props change
  useEffect(() => {
    if (data?.initialContent) {
      setContent(data.initialContent);
      validateJSON(data.initialContent);
    }
  }, [data?.initialContent]);

  // Check initial content validity
  useEffect(() => {
    validateJSON(content);
  }, []);

  const validateJSON = (jsonString: string): boolean => {
    try {
      if (!jsonString.trim()) {
        setIsValid(false);
        setValidationMessage('JSON cannot be empty');
        return false;
      }
      
      // Parse as JSON to check validity
      const parsed = JSON.parse(jsonString);
      
      // Basic schema validation - check if it has required top-level fields
      if (!parsed.schema) {
        setIsValid(false);
        setValidationMessage('Valid JSON but missing "schema" property');
        return false;
      }
      
      // If we got here, it's valid JSON with the basic schema structure
      setIsValid(true);
      setValidationMessage('Valid DSL schema');
      return true;
    } catch (error) {
      setIsValid(false);
      setValidationMessage(error instanceof Error ? error.message : 'Invalid JSON');
      return false;
    }
  };

  const handleValidate = () => {
    const isValidJson = validateJSON(content);
    
    if (isValidJson) {
      addToast('JSON is valid and follows DSL schema', 'success');
    } else {
      addToast('Validation failed: ' + validationMessage, 'error');
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Update global state
    if (window.adapterFlow) {
      window.adapterFlow.setDslOutput(newContent);
    }
    
    // Clear validation state when content changes
    setIsValid(null);
    setValidationMessage('');
  };

  const loadToPlayground = () => {
    try {
      // First validate to make sure it's valid
      if (!validateJSON(content)) {
        addToast('Cannot load invalid DSL to playground', 'error');
        return;
      }
      
      // Open the GatePlayground with this DSL content
      addWindow({
        id: `gate-dsl-${Date.now()}`,
        type: 'gatePlayground',
        title: 'DSL Playground',
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        position: { x: 300, y: 200 },
        size: { width: 900, height: 600 }
      });
      
      addToast('DSL loaded to playground', 'success');
    } catch (error) {
      addToast(
        'Failed to load DSL to playground: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    }
  };

  const saveDSL = () => {
    try {
      // First validate to make sure it's valid
      if (!validateJSON(content)) {
        addToast('Cannot save invalid DSL schema', 'error');
        return;
      }
      
      setIsSaving(true);
      
      // Simulate a save operation with a delay
      setTimeout(() => {
        // Create a download link
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Parse the JSON to get a filename from the metadata if possible
        let filename = 'dsl-schema.json';
        try {
          const parsed = JSON.parse(content);
          if (parsed.metadata?.name) {
            // Convert name to filename-friendly format
            filename = parsed.metadata.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '') + '.dsl.json';
          }
        } catch (e) {
          // Ignore errors here, just use the default filename
        }
        
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        addToast('DSL schema saved successfully', 'success');
        setIsSaving(false);
      }, 500);
    } catch (error) {
      addToast(
        'Failed to save DSL: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
      setIsSaving(false);
    }
  };

  const loadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setContent(content);
        validateJSON(content);
        addToast('DSL loaded from file successfully', 'success');
        
        // Update global state
        if (window.adapterFlow) {
          window.adapterFlow.setDslOutput(content);
        }
      } catch (error) {
        addToast(
          'Failed to load DSL: ' + (error instanceof Error ? error.message : 'Unknown error'),
          'error'
        );
      }
    };
    reader.readAsText(file);
    
    // Reset the input value so the same file can be loaded again
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "w-full h-full rounded-lg overflow-hidden backdrop-blur",
            isFocused ? "bg-card/95 border-primary" : "bg-card/80 border-border"
          )}
          onBlur={onBlur}
        >
          <div className="window-header flex items-center justify-between p-2 bg-muted/50 border-b cursor-move">
            <div className="flex items-center gap-2 px-2">
              <FileJson className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">DSL Editor</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                Schema
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
            {/* Action Buttons */}
            <div className="flex justify-between items-center p-4 bg-accent/30 border-b">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleValidate} 
                  className="gap-1"
                >
                  <Check className="w-3 h-3" />
                  Validate
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadToPlayground}
                  className="gap-1"
                >
                  <Code className="w-3 h-3" />
                  Load to Playground
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveDSL}
                  disabled={isSaving}
                  className="gap-1"
                >
                  <Save className="w-3 h-3" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => document.getElementById('dsl-file-input')?.click()}
                >
                  <Upload className="w-3 h-3" />
                  Load
                </Button>
                <input 
                  id="dsl-file-input"
                  type="file"
                  accept=".json,.dsl,.dsl.json"
                  className="hidden"
                  onChange={loadFromFile}
                />
              </div>
            </div>
            
            {/* Validation Status */}
            {isValid !== null && (
              <div className={cn(
                "px-4 py-2 text-sm flex items-center gap-2",
                isValid ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
              )}>
                {isValid ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                {validationMessage}
              </div>
            )}
            
            {/* Editor */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  className="w-full h-full p-4 bg-muted/20 border border-border rounded-md font-mono text-sm resize-none premium-scrollbar focus:ring-1 focus:ring-primary/50 focus:outline-none min-h-[500px]"
                  spellCheck="false"
                  placeholder="Enter JSON-based DSL here..."
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}