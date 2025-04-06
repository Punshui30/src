import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { 
  Shield, X, Bot, GitBranch, Database, 
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Lock, Unlock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { 
  useSecurityStore, 
  SecurityAuditLog,
  Permission,
  SecurityLevel,
  SystemComponent
} from '../lib/securityCore';
import { format, formatDistanceToNow } from 'date-fns';

interface SecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPONENT_ICONS: Record<SystemComponent, typeof Shield> = {
  agent: Bot,
  flow: GitBranch,
  adapter: Database,
  gate: Database,
  autopilot: Bot,
  sandbox: Shield
};

const LEVEL_STYLES: Record<SecurityLevel, { icon: typeof Shield; className: string }> = {
  low: { 
    icon: CheckCircle2,
    className: "text-primary bg-primary/10"
  },
  medium: {
    icon: Clock,
    className: "text-yellow-500 bg-yellow-500/10"
  },
  high: {
    icon: AlertTriangle,
    className: "text-orange-500 bg-orange-500/10"
  },
  critical: {
    icon: XCircle,
    className: "text-destructive bg-destructive/10"
  }
};

export function SecurityDashboard({
  isOpen,
  onClose
}: SecurityDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'audit' | 'permissions' | 'sandbox'>('audit');
  const [selectedComponent, setSelectedComponent] = useState<SystemComponent | null>(null);
  const { 
    auditLogs,
    permissions,
    sandboxStatus,
    revokePermission,
    grantPermission
  } = useSecurityStore();
  const { addToast } = useToast();

  const handleRevoke = (permission: Permission) => {
    try {
      revokePermission(permission.id);
      addToast('Permission revoked successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke permission';
      addToast(message, 'error');
    }
  };

  const handleGrant = (component: SystemComponent) => {
    try {
      grantPermission({
        scope: 'execute',
        component,
        componentId: crypto.randomUUID(),
        grantedBy: 'user',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      });
      addToast('Permission granted successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to grant permission';
      addToast(message, 'error');
    }
  };

  if (!isOpen) return null;

  const filteredLogs = selectedComponent
    ? auditLogs.filter(log => log.component === selectedComponent)
    : auditLogs;

  const filteredPermissions = selectedComponent
    ? permissions.filter(p => p.component === selectedComponent)
    : permissions;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-[600px] bg-card border-l border-border shadow-2xl"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Security Dashboard</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 p-4 border-b bg-accent/30">
        <Button
          variant={selectedTab === 'audit' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('audit')}
          className="gap-2"
        >
          <Shield className="w-4 h-4" />
          Audit Logs
        </Button>
        <Button
          variant={selectedTab === 'permissions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('permissions')}
          className="gap-2"
        >
          <Lock className="w-4 h-4" />
          Permissions
        </Button>
        <Button
          variant={selectedTab === 'sandbox' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('sandbox')}
          className="gap-2"
        >
          <Database className="w-4 h-4" />
          Sandbox Status
        </Button>
      </div>

      <div className="flex items-center gap-2 p-2 border-b overflow-x-auto">
        <Button
          variant={selectedComponent === null ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedComponent(null)}
        >
          All
        </Button>
        {Object.entries(COMPONENT_ICONS).map(([component, Icon]) => (
          <Button
            key={component}
            variant={selectedComponent === component ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedComponent(component as SystemComponent)}
            className="gap-2 whitespace-nowrap"
          >
            <Icon className="w-4 h-4" />
            {component.charAt(0).toUpperCase() + component.slice(1)}
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1 h-[calc(100%-180px)]">
        <AnimatePresence mode="popLayout">
          {selectedTab === 'audit' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-2"
            >
              {filteredLogs.map((log) => {
                const Icon = LEVEL_STYLES[log.level].icon;
                const ComponentIcon = COMPONENT_ICONS[log.component];
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      log.success ? "bg-card/50" : "bg-destructive/5 border-destructive/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "p-1 rounded",
                          LEVEL_STYLES[log.level].className
                        )}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <ComponentIcon className="w-4 h-4 text-primary" />
                        <span className="font-medium">{log.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true
                        })}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Actor:</span>{' '}
                        {log.actor}
                      </p>
                      {log.error && (
                        <p className="text-destructive">{log.error}</p>
                      )}
                      {Object.keys(log.details).length > 0 && (
                        <pre className="mt-2 p-2 text-xs bg-accent/30 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {selectedTab === 'permissions' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Active Permissions</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGrant(selectedComponent || 'agent')}
                  className="gap-2"
                >
                  <Lock className="w-3 h-3" />
                  Grant Permission
                </Button>
              </div>

              <div className="space-y-2">
                {filteredPermissions.map((permission) => {
                  const ComponentIcon = COMPONENT_ICONS[permission.component];
                  const isExpired = permission.expiresAt && 
                    new Date(permission.expiresAt) < new Date();
                  
                  return (
                    <motion.div
                      key={permission.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={cn(
                        "p-4 rounded-lg border bg-card/50",
                        isExpired && "opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ComponentIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            {permission.scope} permission
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {permission.component}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(permission)}
                          className="gap-2"
                        >
                          <Unlock className="w-3 h-3" />
                          Revoke
                        </Button>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Granted by:</span>{' '}
                          {permission.grantedBy}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Granted:</span>{' '}
                          {formatDistanceToNow(new Date(permission.grantedAt), {
                            addSuffix: true
                          })}
                        </p>
                        {permission.expiresAt && (
                          <p>
                            <span className="text-muted-foreground">Expires:</span>{' '}
                            {formatDistanceToNow(new Date(permission.expiresAt), {
                              addSuffix: true
                            })}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {selectedTab === 'sandbox' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <h3 className="text-sm font-medium">Active Sandboxes</h3>

              <div className="space-y-2">
                {Array.from(sandboxStatus.entries()).map(([componentId, isActive]) => (
                  <motion.div
                    key={componentId}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "p-4 rounded-lg border bg-card/50",
                      isActive ? "border-emerald-500/30" : "border-destructive/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        <span className="font-medium">Sandbox {componentId}</span>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </motion.div>
  );
}