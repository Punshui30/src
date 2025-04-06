import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Package, Plus, X } from 'lucide-react';
import { useTemplateStore } from '../lib/templateStore';
import { useWorkspaceStore } from '../lib/store';
import { useToast } from './ui/toast';
import { WorkflowStep } from '../lib/workflowGenerator';

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowStep[];
}

export function SaveTemplateDialog({
  isOpen,
  onClose,
  workflow
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const { currentWorkspace, currentUser } = useWorkspaceStore();
  const { addTemplate } = useTemplateStore();
  const { addToast } = useToast();

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim()) {
      addToast("Validation Error - Template name is required", "error");
      return;
    }

    if (!currentWorkspace || !currentUser) {
      addToast("Error - No active workspace or user", "error");
      return;
    }

    try {
      addTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        workflow,
        workspaceId: currentWorkspace.id,
        createdBy: {
          id: currentUser.id,
          name: currentUser.name
        },
        tags
      });

      addToast("Template Saved - Successfully saved template to library", "success");

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save template';
      addToast("Save Failed - " + message, "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-lg rounded-lg border bg-card shadow-lg"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Save as Template</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name..."
              className="mt-1 w-full px-3 py-2 rounded-md border bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description..."
              className="mt-1 w-full px-3 py-2 rounded-md border bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none h-24"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag..."
                  className="px-3 py-1 rounded-full border bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleAddTag}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Template
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}