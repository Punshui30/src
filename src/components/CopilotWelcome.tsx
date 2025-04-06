import { motion } from 'framer-motion';
import { Sparkles, Wand2, GitBranch, Code } from 'lucide-react';

export function CopilotWelcome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">AI Copilot</h2>
          <p className="text-sm text-muted-foreground">Your intelligent workflow assistant</p>
        </div>
      </div>

      <div className="bg-accent/50 border rounded-lg p-4 space-y-4">
        <p className="text-sm">I can help you with:</p>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Wand2 className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Generate Workflows</p>
              <p className="text-xs text-muted-foreground">
                "Create a workflow for processing user uploads"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <GitBranch className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Optimize Flows</p>
              <p className="text-xs text-muted-foreground">
                "How can I improve this workflow's efficiency?"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Code className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Code Assistance</p>
              <p className="text-xs text-muted-foreground">
                "Help me debug this adapter configuration"
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Try asking me something above!
      </p>
    </motion.div>
  );
}