import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 🔥 Removed duplicate InstalledApps import
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { 
  Plus, Search, Settings, Trash2, Play,
  CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useWindowStore } from '../lib/windowStore';
import { useToast } from './ui/toast';
import { useInstalledApps, InstalledApp } from '../lib/installedAppsStore'; // ✅ Correct store import

interface InstalledAppsProps {
  isCollapsed?: boolean;
}

export function InstalledApps({ isCollapsed = false }: InstalledAppsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { apps, removeApp } = useInstalledApps();
  const { addWindow } = useWindowStore();
  const { addToast } = useToast();

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRunApp = (app: InstalledApp) => {
    if (app.status === 'needs_setup') {
      addToast('App needs to be configured first', 'error');
      return;
    }

    addWindow({
      id: `gate-${app.id}`,
      type: 'gateIn',
      title: `Gate In - ${app.name}`,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 300, y: 200 },
      size: { width: 600, height: 300 },
      data: {
        target: app.name
      }
    });
  };

  const handleConfigureApp = (app: InstalledApp) => {
    addWindow({
      id: `config-${app.id}`,
      type: 'appConfig',
      title: `Configure ${app.name}`,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 350, y: 150 },
      size: { width: 500, height: 400 },
      data: { app }
    });
  };

  const handleRemoveApp = (app: InstalledApp) => {
    removeApp(app.id);
    addToast(`${app.name} has been removed`, 'info');
  };

  const handleAddApp = () => {
    addWindow({
      id: `gate-${Date.now()}`,
      type: 'gateIn',
      title: 'Gate In',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 300, y: 200 },
      size: { width: 600, height: 300 }
    });
  };

  if (isCollapsed) {
    return (
      <div className="py-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-10 flex items-center justify-center"
          onClick={handleAddApp}
        >
          <Plus className="w-4 h-4 text-primary" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium px-2">Installed Apps</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleAddApp}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            className="w-full bg-muted/50 rounded-md pl-9 pr-4 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <ScrollArea className="h-[300px] -mx-2 px-2">
        <AnimatePresence mode="popLayout">
          {filteredApps.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2"
            >
              <div className={cn(
                "p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors",
                app.status === 'connected' && "border-emerald-500/30",
                app.status === 'needs_setup' && "border-yellow-500/30",
                app.status === 'error' && "border-destructive/30"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {app.icon ? (
                      <img src={app.icon} alt="" className="w-6 h-6 rounded" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {app.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="font-medium">{app.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {app.status === 'connected' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {app.status === 'needs_setup' && (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    {app.status === 'error' && (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleRunApp(app)}
                  >
                    <Play className="w-3 h-3" />
                    Run
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleConfigureApp(app)}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRemoveApp(app)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredApps.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-8"
            >
              {searchQuery ? 'No apps found' : 'No apps installed yet'}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
