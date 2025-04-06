import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Search, Package, Plus, Tags, X, Download, Trash2 } from 'lucide-react';
import { useTemplateStore, SubFlowTemplate } from '../lib/templateStore';
import { useWorkspaceStore } from '../lib/store';
import { useToast } from './ui/toast';
import { format } from 'date-fns';

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: SubFlowTemplate) => void;
}

export function TemplateLibrary({
  isOpen,
  onClose,
  onUseTemplate
}: TemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { currentWorkspace, currentUser } = useWorkspaceStore();
  const { templates, deleteTemplate } = useTemplateStore();
  const { addToast } = useToast();

  const workspaceTemplates = currentWorkspace
    ? useTemplateStore.getState().getWorkspaceTemplates(currentWorkspace.id)
    : [];

  const filteredTemplates = workspaceTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => template.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(
    workspaceTemplates.flatMap(template => template.tags)
  ));

  const handleDelete = (template: SubFlowTemplate) => {
    try {
      deleteTemplate(template.id);
      addToast("Template Deleted - Successfully deleted template: " + template.name, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete template';
      addToast("Delete Failed - " + message, "error");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-4xl rounded-lg border bg-card shadow-lg"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Template Library</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full pl-9 pr-4 py-2 rounded-md border bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Template
                </Button>
              </div>

              {allTags.length > 0 && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                  <Tags className="w-4 h-4 text-muted-foreground shrink-0" />
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground hover:bg-accent/70'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(template)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUseTemplate(template)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        {template.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {template.workflow.length} step{template.workflow.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          Updated {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {filteredTemplates.length === 0 && (
                    <div className="col-span-2 text-center text-muted-foreground py-8">
                      No templates found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}