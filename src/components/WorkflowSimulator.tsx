import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Play, X, AlertCircle, CheckCircle2, Timer } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { cn } from '../lib/utils';

interface SimulationStep {
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input?: any;
  output?: any;
  error?: string;
  duration?: number;
}

interface WorkflowSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  onLog: (message: string, level: 'info' | 'error' | 'success') => void;
}

export function WorkflowSimulator({
  isOpen,
  onClose,
  nodes,
  edges,
  onLog
}: WorkflowSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [activeEdges, setActiveEdges] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setIsSimulating(false);
      setCurrentStep(0);
      setSteps([]);
      setActiveEdges([]);
    }
  }, [isOpen]);

  const validateWorkflow = (): string | null => {
    // Check for empty workflow
    if (nodes.length === 0) {
      return 'Workflow is empty';
    }

    // Check for disconnected nodes
    const connectedNodes = new Set(edges.flatMap(e => [e.source, e.target]));
    const disconnectedNodes = nodes.filter(n => !connectedNodes.has(n.id));
    
    if (disconnectedNodes.length > 0) {
      return `Found ${disconnectedNodes.length} disconnected node(s)`;
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function hasCycle(nodeId: string): boolean {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycle(edge.target)) return true;
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    }

    const startNodes = nodes.filter(n => !edges.some(e => e.target === n.id));
    for (const node of startNodes) {
      if (hasCycle(node.id)) {
        return 'Workflow contains circular dependencies';
      }
    }

    return null;
  };

  const simulateNodeExecution = async (node: Node): Promise<any> => {
    const delay = Math.random() * 1000 + 500; // Random delay between 500-1500ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate different node behaviors
    switch (node.data.sourceTool) {
      case 'gpt-4':
        return {
          text: "This is a simulated GPT-4 response",
          tokens: Math.floor(Math.random() * 100) + 50
        };
      
      case 'stable_diffusion':
        return {
          imageUrl: "https://example.com/simulated-image.png",
          seed: Math.floor(Math.random() * 1000000)
        };
      
      case 'webhook':
        if (Math.random() > 0.8) { // 20% chance of failure
          throw new Error('Webhook request failed');
        }
        return {
          status: 200,
          response: { success: true }
        };
      
      default:
        return {
          result: `Simulated output for ${node.data.sourceTool}`
        };
    }
  };

  const startSimulation = async () => {
    const error = validateWorkflow();
    if (error) {
      onLog(error, 'error');
      return;
    }

    setIsSimulating(true);
    setSteps(nodes.map(node => ({
      nodeId: node.id,
      status: 'pending'
    })));

    // Find start nodes (nodes with no incoming edges)
    const startNodes = nodes.filter(n => !edges.some(e => e.target === n.id));
    
    try {
      for (const startNode of startNodes) {
        await executeNode(startNode);
      }
      
      onLog('Simulation completed successfully', 'success');
    } catch (error) {
      onLog(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const executeNode = async (node: Node) => {
    // Update step status
    setSteps(prev => prev.map(step =>
      step.nodeId === node.id ? { ...step, status: 'running' } : step
    ));
    
    const startTime = Date.now();

    try {
      // Simulate node execution
      const output = await simulateNodeExecution(node);

      // Update step with success
      setSteps(prev => prev.map(step =>
        step.nodeId === node.id ? {
          ...step,
          status: 'success',
          output,
          duration: Date.now() - startTime
        } : step
      ));

      onLog(`Node ${node.data.sourceTool} executed successfully`, 'success');

      // Find and execute next nodes
      const outgoingEdges = edges.filter(e => e.source === node.id);
      
      for (const edge of outgoingEdges) {
        // Animate data flow along edge
        setActiveEdges(prev => [...prev, edge.id]);
        await new Promise(resolve => setTimeout(resolve, 500));
        setActiveEdges(prev => prev.filter(id => id !== edge.id));

        const nextNode = nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await executeNode(nextNode);
        }
      }

    } catch (error) {
      // Update step with error
      setSteps(prev => prev.map(step =>
        step.nodeId === node.id ? {
          ...step,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        } : step
      ));

      onLog(`Node ${node.data.sourceTool} failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      throw error;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4"
        >
          <div className="max-w-4xl mx-auto bg-card border rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Workflow Simulator</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  disabled={isSimulating}
                  onClick={startSimulation}
                  className="gap-2"
                >
                  {isSimulating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Timer className="w-4 h-4" />
                      </motion.div>
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Simulation
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="p-4 space-y-2">
                {steps.map((step, index) => {
                  const node = nodes.find(n => n.id === step.nodeId);
                  if (!node) return null;

                  return (
                    <motion.div
                      key={step.nodeId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-3 rounded-lg border",
                        step.status === 'pending' && "bg-card border-border",
                        step.status === 'running' && "bg-primary/5 border-primary/30",
                        step.status === 'success' && "bg-emerald-500/5 border-emerald-500/30",
                        step.status === 'error' && "bg-destructive/5 border-destructive/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {step.status === 'pending' && (
                            <Timer className="w-4 h-4 text-muted-foreground" />
                          )}
                          {step.status === 'running' && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Timer className="w-4 h-4 text-primary" />
                            </motion.div>
                          )}
                          {step.status === 'success' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                          {step.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="font-medium">{node.data.sourceTool}</span>
                        </div>
                        {step.duration && (
                          <span className="text-xs text-muted-foreground">
                            {(step.duration / 1000).toFixed(2)}s
                          </span>
                        )}
                      </div>

                      {(step.status === 'success' || step.status === 'error') && (
                        <div className="mt-2 text-sm">
                          {step.error ? (
                            <p className="text-destructive">{step.error}</p>
                          ) : (
                            <pre className="bg-accent/50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}