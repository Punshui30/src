import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import { Search, Sparkles, Package, Settings, Play, RefreshCw, Database } from 'lucide-react';
import { useWindowStore } from '../lib/windowStore';
import { useTemplateStore } from '../lib/templateStore';
import { useWorkspaceStore } from '../lib/store';
import { cn } from '../lib/utils';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: typeof Search;
  shortcut?: string[];
  action: () => void;
  section: 'actions' | 'templates' | 'copilot' | 'settings';
}

export function CommandBar({ isOpen, onClose }: CommandBarProps) {
  const [search, setSearch] = useState('');
  const [copilotSuggestions, setCopilotSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { currentWorkspace } = useWorkspaceStore();
  const { windows, addWindow, bringToFront, setActiveWindow } = useWindowStore();
  const { templates } = useTemplateStore();

  const workspaceTemplates = currentWorkspace
    ? templates.filter(t => t.workspaceId === currentWorkspace.id)
    : [];

  useEffect(() => {
    // Simulate Copilot suggestions based on search
    if (search.toLowerCase().includes('generate') || search.toLowerCase().includes('create')) {
      setCopilotSuggestions([
        'Generate a workflow for processing images',
        'Create a data validation pipeline',
        'Build an API integration workflow'
      ]);
    } else {
      setCopilotSuggestions([]);
    }
  }, [search]);

  const commands: CommandItem[] = [
    {
      id: 'run-workflow',
      label: 'Run Current Workflow',
      icon: Play,
      shortcut: ['⌘', 'R'],
      action: () => {
        // Trigger workflow execution
        onClose();
      },
      section: 'actions'
    },
    {
      id: 'reload-adapters',
      label: 'Reload Adapters',
      icon: RefreshCw,
      shortcut: ['⌘', 'Shift', 'R'],
      action: () => {
        // Reload adapters
        onClose();
      },
      section: 'actions'
    },
    {
      id: 'open-templates',
      label: 'Open Template Library',
      icon: Package,
      shortcut: ['⌘', 'T'],
      action: () => {
        addWindow({
          id: 'templates',
          type: 'templates',
          title: 'Template Library',
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 }
        });
        onClose();
      },
      section: 'actions'
    },
    {
      id: 'open-adapters',
      label: 'View Adapters',
      icon: Database,
      shortcut: ['⌘', 'A'],
      action: () => {
        addWindow({
          id: 'adapters',
          type: 'adapters',
          title: 'Adapter Registry',
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 }
        });
        onClose();
      },
      section: 'actions'
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      icon: Settings,
      shortcut: ['⌘', ','],
      action: () => {
        // Open settings
        onClose();
      },
      section: 'settings'
    }
  ];

  // Add template commands
  const templateCommands: CommandItem[] = workspaceTemplates.map(template => ({
    id: `template-${template.id}`,
    label: template.name,
    icon: Package,
    action: () => {
      // Use template
      onClose();
    },
    section: 'templates'
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        >
          <div className="fixed inset-0 flex items-start justify-center pt-[20vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl"
            >
              <Command
                label="Command Menu"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Command.Input
                    ref={inputRef}
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search commands, templates, or ask Copilot..."
                    className="w-full bg-background border rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <Command.List className="mt-4 bg-card border rounded-lg overflow-hidden">
                  {/* Quick Actions */}
                  <Command.Group heading="Quick Actions">
                    {commands
                      .filter(cmd => cmd.section === 'actions')
                      .map(command => (
                        <Command.Item
                          key={command.id}
                          onSelect={command.action}
                          className="px-4 py-2 aria-selected:bg-accent flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <command.icon className="w-4 h-4" />
                            <span>{command.label}</span>
                          </div>
                          {command.shortcut && (
                            <div className="flex items-center gap-1">
                              {command.shortcut.map((key, i) => (
                                <kbd
                                  key={i}
                                  className="px-2 py-0.5 text-xs bg-muted rounded"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          )}
                        </Command.Item>
                      ))}
                  </Command.Group>

                  {/* Templates */}
                  {templateCommands.length > 0 && (
                    <Command.Group heading="Templates">
                      {templateCommands.map(command => (
                        <Command.Item
                          key={command.id}
                          onSelect={command.action}
                          className="px-4 py-2 aria-selected:bg-accent flex items-center gap-2 cursor-pointer"
                        >
                          <Package className="w-4 h-4" />
                          <span>{command.label}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {/* Copilot Suggestions */}
                  {copilotSuggestions.length > 0 && (
                    <Command.Group heading="AI Copilot Suggestions">
                      {copilotSuggestions.map((suggestion, index) => (
                        <Command.Item
                          key={index}
                          onSelect={() => {
                            // Handle Copilot suggestion
                            onClose();
                          }}
                          className="px-4 py-2 aria-selected:bg-accent flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>{suggestion}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {/* Settings */}
                  <Command.Group heading="Settings">
                    {commands
                      .filter(cmd => cmd.section === 'settings')
                      .map(command => (
                        <Command.Item
                          key={command.id}
                          onSelect={command.action}
                          className="px-4 py-2 aria-selected:bg-accent flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <command.icon className="w-4 h-4" />
                            <span>{command.label}</span>
                          </div>
                          {command.shortcut && (
                            <div className="flex items-center gap-1">
                              {command.shortcut.map((key, i) => (
                                <kbd
                                  key={i}
                                  className="px-2 py-0.5 text-xs bg-muted rounded"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          )}
                        </Command.Item>
                      ))}
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}