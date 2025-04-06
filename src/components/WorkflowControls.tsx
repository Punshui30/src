import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Plus, Play, GitBranch, FolderOpen, Timer, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { validateWorkflowData, WorkflowData } from '../lib/workflowStorage';
import { ExportDialog } from './ExportDialog';

interface WorkflowControlsProps {
  onAddNode: (type: 'custom' | 'conditional') => void;
  onExecute: () => void;
  onExport: () => void;
  onImport: (workflow: WorkflowData) => void;
  onCreateSubFlow: () => void;
  onSimulate: () => void;
  isExecuting: boolean;
  isSimulating?: boolean;
  canCreateSubFlow: boolean;
  nodes: Node[];
  edges: Edge[];
  metadata: Partial<WorkflowData['metadata']>;
}

export function WorkflowControls({
  onAddNode,
  onExecute,
  onExport,
  onImport,
  onCreateSubFlow,
  onSimulate,
  isExecuting,
  isSimulating,
  canCreateSubFlow,
  nodes,
  edges,
  metadata
}: WorkflowControlsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const { toast } = useToast();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsImporting(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      const data = file.name.endsWith('.yaml') || file.name.endsWith('.yml')
        ? yaml.parse(text)
        : JSON.parse(text);

      if (!validateWorkflowData(data)) {
        throw new Error('Invalid workflow file format');
      }

      onImport(data);
      
      toast({
        title: 'Workflow Imported',
        description: `Successfully imported workflow: ${data.metadata.name}`,
        variant: 'success'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import workflow';
      toast({
        title: 'Import Failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        <Button
          onClick={() => onAddNode('custom')}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <Plus size={16} />
          Add Node
        </Button>
        
        <Button
          onClick={() => onAddNode('conditional')}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <GitBranch size={16} />
          Add Condition
        </Button>

        {canCreateSubFlow && (
          <Button
            onClick={onCreateSubFlow}
            variant="outline"
            className="gap-2"
            size="sm"
          >
            <FolderOpen size={16} />
            Create Sub-Flow
          </Button>
        )}

        <Button
          onClick={() => setIsExportOpen(true)}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <Share2 size={16} />
          Export
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            className="gap-2"
            size="sm"
            disabled={isImporting}
            onClick={() => document.getElementById('workflow-import')?.click()}
          >
            <Upload size={16} />
            Import
          </Button>
          <input
            id="workflow-import"
            type="file"
            accept=".json,.yaml,.yml,.workflow.json"
            className="hidden"
            onChange={handleImport}
            disabled={isImporting}
          />
        </div>

        <Button
          onClick={onSimulate}
          variant="outline"
          className="gap-2"
          size="sm"
          disabled={isSimulating}
        >
          <Timer size={16} />
          Test Run
        </Button>

        <Button
          onClick={onExecute}
          variant="default"
          className="gap-2"
          size="sm"
          disabled={isExecuting}
        >
          <AnimatePresence mode="wait">
            {isExecuting ? (
              <motion.div
                key="executing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Play size={16} />
                </motion.div>
                Running...
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Play size={16} />
                Run Workflow
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        nodes={nodes}
        edges={edges}
        metadata={metadata}
      />
    </>
  );
}