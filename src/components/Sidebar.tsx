
import {
  Settings, RefreshCcw, Send, Database, ChevronRight, ChevronLeft, Package,
  Terminal, GitBranch, Box, Code, FileJson, ScrollText, Sparkles,
  AlertTriangle, Users, Bot, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { cn } from '../lib/utils';
import { useWorkspaceStore } from '../lib/store';
import { useToast } from './ui/toast';
import { apiClient } from '../lib/api';
import { useWindowStore } from '../lib/windowStore';
import { useScoutStore } from '../lib/scoutStore';
import { useSystemWatcher } from '../lib/systemWatcherStore';
import { systemWatcher } from '../lib/systemWatcher';
import { useAutopilotStore } from '../lib/autopilotStore';
import { InstalledApps } from './InstalledApps';

export interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, hasPermission } = useWorkspaceStore();
  const { addToast } = useToast();
  const { addWindow } = useWindowStore();
  const { alerts } = useSystemWatcher();
  const { drafts } = useAutopilotStore();
  const { suggestions } = useScoutStore();
  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending').length;
  const pendingDrafts = drafts.filter(d => d.status === 'draft').length;

  useEffect(() => {
    systemWatcher.start();
    return () => systemWatcher.stop();
  }, []);

  const handleReloadAdapters = async () => {
    try {
      setIsLoading(true);
      await apiClient.reloadAdapters();
      addToast("Adapters Reloaded - Successfully refreshed adapter registry", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reload adapters';
      addToast("Reload Failed - " + message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWindow = (type, title, width = 800, height = 600) => {
    addWindow({
      id: `${type}-${Date.now()}`,
      type,
      title,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 300, y: 150 },
      size: { width, height }
    });
  };

  return (
    <motion.div
      initial={{ width: 240 }}
      animate={{ width: isCollapsed ? 60 : 240 }}
      className={cn(
        "bg-card/90 border-r border-border flex flex-col backdrop-blur-lg h-screen overflow-hidden",
        "transition-colors hover:bg-card/95",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="py-4 flex justify-center shrink-0"
      >
        <img
          src="https://i.imgur.com/CtupzkO.png"
          alt="ARGOS Logo"
          className="h-[90px] w-auto object-scale-down mix-blend-screen"
        />
      </motion.div>

      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-wide text-white">ARGOS</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0 transition-transform hover:scale-105 active:scale-95">
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="p-2 shrink-0">
          <WorkspaceSwitcher />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-2 space-y-1">
          <InstalledApps isCollapsed={isCollapsed} />

          <div className="h-px bg-border/50 my-4" />

          {hasPermission('edit') && (
            <Button variant="ghost" onClick={() => handleOpenWindow('gateIn', 'Gate In')}>
              <Send size={16} className="text-primary" />
              {!isCollapsed && <span>Send Request</span>}
            </Button>
          )}

          {hasPermission('edit') && (
            <Button variant="ghost" onClick={handleReloadAdapters} disabled={isLoading}>
              <RefreshCcw size={16} className={cn("text-primary", isLoading && "animate-spin")} />
              {!isCollapsed && <span>Reload Adapters</span>}
            </Button>
          )}

          <Button variant="ghost" onClick={() => handleOpenWindow('adapters', 'Adapters Manager')}>
            <Database size={16} className="text-primary" />
            {!isCollapsed && <span>Adapters Manager</span>}
          </Button>

          <Button variant="ghost" onClick={() => handleOpenWindow('flow', 'Visual Flow')}>
            <GitBranch size={16} className="text-primary" />
            {!isCollapsed && <span>Visual Flow</span>}
          </Button>

          <Button variant="ghost" onClick={() => handleOpenWindow('flow3D', '3D Flow View')}>
            <Box size={16} className="text-primary" />
            {!isCollapsed && <span>3D Flow View</span>}
          </Button>

          <Button variant="ghost" onClick={() => handleOpenWindow('dslEditor', 'DSL Editor')}>
            <FileJson size={16} className="text-primary" />
            {!isCollapsed && <span>DSL Editor</span>}
          </Button>

          <Button variant="ghost" onClick={() => handleOpenWindow('gateLogs', 'Gate Logs')}>
            <ScrollText size={16} className="text-primary" />
            {!isCollapsed && <span>Gate Logs</span>}
          </Button>

          <Button variant="ghost" onClick={() => handleOpenWindow('terminal', 'Terminal', 600, 400)}>
            <Terminal size={16} className="text-primary" />
            {!isCollapsed && <span>Terminal</span>}
          </Button>

          <Button variant="ghost" onClick={() => handleOpenWindow('copilot', 'AI Copilot', 400, 600)}>
            <Sparkles size={16} className="text-primary" />
            {!isCollapsed && <span>AI Copilot</span>}
          </Button>
        </div>
      </div>

      {currentUser && !isCollapsed && (
        <div className="p-4 border-t border-border bg-accent/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full ring-2 ring-border" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium tracking-tight truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      )}

      <Button variant="ghost" className="m-2 justify-start gap-3 font-medium shrink-0">
        <Settings size={16} className="text-primary" />
        {!isCollapsed && <span>Settings</span>}
      </Button>
    </motion.div>
  );
}
