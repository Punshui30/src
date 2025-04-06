{/* Previous WorkflowBuilder.tsx content */}
// Add at the top of imports:
import { WorkflowSimulator } from './WorkflowSimulator';

// Add to WorkflowBuilder component state:
const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

// Add to JSX before the SaveTemplateDialog:
<WorkflowSimulator
  isOpen={isSimulatorOpen}
  onClose={() => setIsSimulatorOpen(false)}
  nodes={nodes}
  edges={edges}
  onLog={onLog}
/>

// Update WorkflowControls props:
<WorkflowControls
  onAddNode={() => {}}
  onExecute={executeWorkflow}
  onExport={handleExport}
  onImport={handleImport}
  onSaveTemplate={() => setIsSaveDialogOpen(true)}
  onSimulate={() => setIsSimulatorOpen(true)}
  isExecuting={isExecuting}
  isSimulating={isSimulatorOpen}
  onCreateSubFlow={handleCreateSubFlow}
  canCreateSubFlow={selectedNodes.length >= 2}
/>