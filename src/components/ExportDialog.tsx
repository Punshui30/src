import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Download, Copy, Link, FileJson, FileCode, X, Check, Share2 } from 'lucide-react';
import { useToast } from './ui/toast';
import { Node, Edge } from 'reactflow';
import {
  WorkflowData,
  generateWorkflowExport,
  downloadWorkflow,
  generateShareableLink
} from '../lib/workflowStorage';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  metadata: Partial<WorkflowData['metadata']>;
}

export function ExportDialog({
  isOpen,
  onClose,
  nodes,
  edges,
  metadata
}: ExportDialogProps) {
  const [format, setFormat] = useState<'json' | 'yaml'>('json');
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleExport = () => {
    try {
      const workflow: WorkflowData = {
        nodes,
        edges,
        metadata: {
          name: metadata.name || 'Untitled Workflow',
          description: metadata.description,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          version: '1.0',
          tags: metadata.tags,
          author: metadata.author
        }
      };

      const exportData = generateWorkflowExport(workflow, format);
      downloadWorkflow(exportData);

      addToast("Workflow Exported - Successfully exported workflow as " + format.toUpperCase(), "success");
    } catch (error) {
      addToast("Export Failed - " + (error instanceof Error ? error.message : 'Failed to export workflow'), "error");
    }
  };

  const handleGenerateLink = () => {
    try {
      const workflow: WorkflowData = {
        nodes,
        edges,
        metadata: {
          name: metadata.name || 'Untitled Workflow',
          description: metadata.description,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          version: '1.0',
          tags: metadata.tags,
          author: metadata.author
        }
      };

      const link = generateShareableLink(workflow);
      setShareLink(link);

      addToast("Share Link Generated - Workflow share link has been generated", "success");
    } catch (error) {
      addToast("Link Generation Failed - " + (error instanceof Error ? error.message : 'Failed to generate share link'), "error");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      addToast("Link Copied - Share link copied to clipboard", "success");
    } catch (error) {
      addToast("Copy Failed - Failed to copy link to clipboard", "error");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="relative w-full max-w-lg rounded-lg border bg-card shadow-lg"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Export Workflow</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Export Format Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Export Format</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormat('json')}
                    className={`flex-1 p-4 rounded-lg border transition-colors ${
                      format === 'json'
                        ? 'bg-accent border-primary'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">JSON</p>
                        <p className="text-xs text-muted-foreground">
                          Standard format, widely supported
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setFormat('yaml')}
                    className={`flex-1 p-4 rounded-lg border transition-colors ${
                      format === 'yaml'
                        ? 'bg-accent border-primary'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">YAML</p>
                        <p className="text-xs text-muted-foreground">
                          Human-readable format
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Share Link Generation */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Share Link</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleGenerateLink}
                  >
                    <Link className="w-4 h-4" />
                    Generate Share Link
                  </Button>
                  {shareLink && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy
                    </Button>
                  )}
                </div>
                {shareLink && (
                  <div className="p-3 bg-accent/50 rounded-lg border">
                    <p className="text-sm font-mono break-all">{shareLink}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export as {format.toUpperCase()}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}