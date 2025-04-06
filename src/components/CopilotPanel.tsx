import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useInstalledApps } from '../lib/installedAppsStore';
import { sendCopilotMessage
import { sendCopilotMessage } from '../api';

const [messages, setMessages] = useState([]);

  const sendMessage = async (text: string) => {
    const response = await sendCopilotMessage(text);
    if (response) setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
  };

 } from '../lib/workflowParser';
import { parseWorkflowEdit, WorkflowContext } from '../lib/workflowEditor';
import { useWindowStore } from '../lib/windowStore';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { CopilotWelcome } from './CopilotWelcome';
import { CopilotMessageBubble } from './CopilotMessageBubble';
import { CopilotMessage } from '../types';

interface CopilotPanelProps {
  className?: string;
  messages: CopilotMessage[];
  onSendMessage: (messages: CopilotMessage[]) => void;
  onClose?: () => void; // Added close handler
}

export default function CopilotPanel({ className, messages, onSendMessage, onClose }: CopilotPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWorkflowMode, setIsWorkflowMode] = useState(false);
  const [detectedTools, setDetectedTools] = useState<string[]>([]);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const { addToast } = useToast();
  const { apps } = useInstalledApps();
  const { addWindow, windows, updateWindow } = useWindowStore();

  // Detect tools as user types
  useEffect(() => {
    const detectTools = async () => {
      const toolPatterns = [
        'Typeform', 'Notion', 'Slack', 'Airtable', 'Google Sheets',
        'Gmail', 'Discord', 'Trello', 'Jira', 'GitHub'
      ].map(tool => ({
        name: tool.toLowerCase(),
        regex: new RegExp(`\\b${tool}\\b`, 'i')
      }));

      const found = toolPatterns
        .filter(pattern => pattern.regex.test(input))
        .map(pattern => pattern.name);

      // Only update if we found new tools
      if (found.length > 0 && !found.every(tool => detectedTools.includes(tool))) {
        setDetectedTools(found);
      }
    };

    detectTools();
  }, [input]);

  const handleGateIn = (tool: string) => {
    addWindow({
      id: `gate-${Date.now()}`,
      type: 'gateIn',
      title: 'Gate In',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 300, y: 200 },
      size: { width: 600, height: 300 },
      data: { target: tool }
    });
  };

  // Get active workflow context
  const getActiveWorkflow = (): WorkflowContext | null => {
    const activeFlow = windows.find(w => 
      (w.type === 'flow' || w.type === 'dslEditor') && w.isOpen && !w.isMinimized
    );
    
    if (!activeFlow?.data?.nodes) return null;
    
    return {
      nodes: activeFlow.data.nodes,
      edges: activeFlow.data.edges,
      activeNodeId: activeFlow.data.activeNodeId
    };
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsLoading(true);

    const newMessage: CopilotMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    onSendMessage([...messages, newMessage]);
    setInput('');

    try {
      const activeWorkflow = getActiveWorkflow();
      
      if (isEditingWorkflow && activeWorkflow) {
        // Parse workflow edit instruction
        const edit = await parseWorkflowEdit(input, activeWorkflow);
        
        // Apply changes to active workflow
        const flowWindow = windows.find(w => 
          (w.type === 'flow' || w.type === 'dslEditor') && 
          w.isOpen && !w.isMinimized
        );
        
        if (flowWindow) {
          updateWindow(flowWindow.id, {
            data: {
              ...flowWindow.data,
              nodes: edit.changes.updateNodes 
                ? flowWindow.data.nodes.map(node => {
                    const update = edit.changes.updateNodes?.find(u => u.id === node.id);
                    return update ? { ...node, ...update.updates } : node;
                  })
                : [...flowWindow.data.nodes, ...(edit.changes.nodes || [])],
              edges: [...flowWindow.data.edges, ...(edit.changes.edges || [])]
            }
          });
          
          const response: CopilotMessage = {
            role: 'assistant',
            content: `I've updated the workflow: ${edit.description}. Let me know if you'd like to make any other changes.`,
            timestamp: new Date().toISOString(),
            metadata: { type: 'workflow_edit', edit }
          };
          onSendMessage([...messages, newMessage, response]);
        }
      } else if (isWorkflowMode) {
        // Parse workflow request
        const workflowPlan = await sendCopilotMessage
import { sendCopilotMessage } from '../api';

const [messages, setMessages] = useState([]);

  const sendMessage = async (text: string) => {
    const response = await sendCopilotMessage(text);
    if (response) setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
  };

(input, apps);
        
        // Check for missing tools
        const uninstalledTools = workflowPlan.tools.filter(t => !t.isInstalled);
        
        if (uninstalledTools.length > 0) {
          // Suggest installing missing tools
          const response: CopilotMessage = {
            role: 'assistant',
            content: `I'll help you create this workflow, but first we need to set up these tools:\n\n${
              uninstalledTools.map(t => `• ${t.name} (not installed)`).join('\n')
            }\n\nWould you like me to help you install them?`,
            timestamp: new Date().toISOString(),
            metadata: {
              type: 'workflow_setup',
              uninstalledTools
            }
          };
          onSendMessage([...messages, newMessage, response]);
        } else {
          // Open Flow Editor with generated workflow
          addWindow({
            id: `flow-${Date.now()}`,
            type: 'flow',
            title: 'Generated Workflow',
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: { x: 200, y: 100 },
            size: { width: 800, height: 600 },
            data: {
              nodes: workflowPlan.nodes,
              edges: workflowPlan.edges
            }
          });

          const response: CopilotMessage = {
            role: 'assistant',
            content: `I've created a workflow based on your request:\n\n${
              workflowPlan.description
            }\n\nI've opened it in the Flow Editor where you can customize it further.`,
            timestamp: new Date().toISOString(),
            metadata: {
              type: 'workflow_created',
              workflow: workflowPlan
            }
          };
          onSendMessage([...messages, newMessage, response]);
        }
      } else {
        // Regular chat mode
        const response = await apiClient.sendCopilotMessage(input);
        onSendMessage([...messages, newMessage, {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString()
        }]);
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process request';
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-card/90 border-l border-border flex flex-col h-[calc(100vh-60px)] max-h-[calc(100vh-60px)]", // Fixed height
        className
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" size={18} />
          <div>
            <h2 className="font-semibold">AI Copilot</h2>
            {isEditingWorkflow && (
              <p className="text-xs text-primary">Editing Active Workflow</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getActiveWorkflow() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingWorkflow(!isEditingWorkflow)}
              className={cn(
                "text-xs gap-1",
                isEditingWorkflow && "text-primary"
              )}
            >
              <Sparkles className="w-3 h-3" />
              {isEditingWorkflow ? 'Stop Editing' : 'Edit Workflow'}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence>
          {messages.length === 0 ? (
            <CopilotWelcome />
          ) : (
            messages.map((msg, i) => (
              <CopilotMessageBubble key={i} message={msg} />
            ))
          )}
        </AnimatePresence>
      </ScrollArea>
      
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border mt-auto" // Added mt-auto to push to bottom
      > 
        <div className="flex items-center justify-between mb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsWorkflowMode(!isWorkflowMode)}
            className={cn(
              "text-xs gap-1",
              isWorkflowMode && "text-primary"
            )}
          >
            <Sparkles className="w-3 h-3" />
            {isWorkflowMode ? 'Workflow Mode' : 'Chat Mode'}
          </Button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isEditingWorkflow
                ? 'Tell me what changes to make to the workflow...'
                : isWorkflowMode
                ? 'Describe your workflow (e.g., "When someone submits a Typeform...")'
                : 'Ask me anything...'
            }
            className="flex-1 bg-background/50 rounded-md px-3 py-2 text-sm border border-input focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={isLoading}
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <Send size={16} />
          </Button>
        </div>

        {/* Tool Detection Suggestions */}
        {detectedTools.length > 0 && !isLoading && (
          <div className="mt-2 space-y-2">
            {detectedTools.map(tool => {
              const isInstalled = apps.some(
                app => app.name.toLowerCase() === tool.toLowerCase()
              );
              
              if (isInstalled) return null;
              
              return (
                <motion.div
                  key={tool}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between"
                >
                  <span className="text-sm">
                    {tool} isn't gated in yet. Want me to connect it?
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGateIn(tool)}
                    className="gap-1"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Gate In
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
}