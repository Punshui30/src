import { Node, Edge } from 'reactflow';
import { AgentConfig } from './agentStore';
import { AutopilotDraft } from './autopilotStore';
import { GateLog } from './gateLogsStore';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';
export type PermissionScope = 'read' | 'write' | 'execute' | 'admin';
export type SystemComponent = 'agent' | 'autopilot' | 'adapter' | 'gate' | 'flow';

export interface Permission {
  id: string;
  scope: PermissionScope;
  component: SystemComponent;
  componentId: string;
  grantedAt: string;
  grantedBy: string;
  expiresAt?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  component: SystemComponent;
  componentId: string;
  action: string;
  actor: string;
  level: SecurityLevel;
  details: Record<string, any>;
  success: boolean;
  error?: string;
}

export interface FlowSignature {
  id: string;
  flowId: string;
  nodes: Node[];
  edges: Edge[];
  creator: {
    type: 'user' | 'agent' | 'copilot' | 'autopilot';
    id: string;
    name: string;
  };
  timestamp: string;
  hash: string;
}

interface SecurityState {
  permissions: Permission[];
  auditLogs: SecurityAuditLog[];
  flowSignatures: FlowSignature[];
  sandboxStatus: Map<string, boolean>;
  
  // Permission Management
  grantPermission: (permission: Omit<Permission, 'id' | 'grantedAt'>) => void;
  revokePermission: (id: string) => void;
  hasPermission: (componentId: string, scope: PermissionScope) => boolean;
  
  // Audit Logging
  logAudit: (log: Omit<SecurityAuditLog, 'id' | 'timestamp'>) => void;
  getAuditLogs: (component?: SystemComponent) => SecurityAuditLog[];
  
  // Flow Signing
  signFlow: (
    flowId: string,
    nodes: Node[],
    edges: Edge[],
    creator: FlowSignature['creator']
  ) => FlowSignature;
  verifyFlowSignature: (signature: FlowSignature) => boolean;
  
  // Sandbox Management
  createSandbox: (componentId: string) => Promise<void>;
  destroySandbox: (componentId: string) => Promise<void>;
  isSandboxActive: (componentId: string) => boolean;
}

class SecurityViolationError extends Error {
  constructor(message: string, public component: SystemComponent) {
    super(`Security Violation: ${message}`);
    this.name = 'SecurityViolationError';
  }
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      permissions: [],
      auditLogs: [],
      flowSignatures: [],
      sandboxStatus: new Map(),
      
      grantPermission: (permission) => set((state) => {
        const newPermission = {
          ...permission,
          id: crypto.randomUUID(),
          grantedAt: new Date().toISOString()
        };
        
        get().logAudit({
          component: 'agent',
          componentId: permission.componentId,
          action: 'grant_permission',
          actor: permission.grantedBy,
          level: 'high',
          details: { permission: newPermission },
          success: true
        });
        
        return {
          permissions: [...state.permissions, newPermission]
        };
      }),
      
      revokePermission: (id) => set((state) => {
        const permission = state.permissions.find(p => p.id === id);
        if (!permission) return state;
        
        get().logAudit({
          component: permission.component,
          componentId: permission.componentId,
          action: 'revoke_permission',
          actor: 'system',
          level: 'high',
          details: { permission },
          success: true
        });
        
        return {
          permissions: state.permissions.filter(p => p.id !== id)
        };
      }),
      
      hasPermission: (componentId, scope) => {
        const state = get();
        return state.permissions.some(p =>
          p.componentId === componentId &&
          p.scope === scope &&
          (!p.expiresAt || new Date(p.expiresAt) > new Date())
        );
      },
      
      logAudit: (log) => set((state) => ({
        auditLogs: [
          {
            ...log,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          },
          ...state.auditLogs
        ]
      })),
      
      getAuditLogs: (component) => {
        const state = get();
        return component
          ? state.auditLogs.filter(log => log.component === component)
          : state.auditLogs;
      },
      
      signFlow: (flowId, nodes, edges, creator) => {
        // Generate deterministic hash of flow content
        const content = JSON.stringify({ nodes, edges });
        const hashBuffer = new TextEncoder().encode(content);
        const hashArray = Array.from(hashBuffer);
        const hash = hashArray.reduce((h, b) => {
          h = ((h << 5) - h) + b;
          return h & h;
        }, 0).toString(36);
        
        const signature: FlowSignature = {
          id: crypto.randomUUID(),
          flowId,
          nodes,
          edges,
          creator,
          timestamp: new Date().toISOString(),
          hash
        };
        
        set((state) => ({
          flowSignatures: [...state.flowSignatures, signature]
        }));
        
        get().logAudit({
          component: 'flow',
          componentId: flowId,
          action: 'sign_flow',
          actor: `${creator.type}:${creator.id}`,
          level: 'medium',
          details: { signature },
          success: true
        });
        
        return signature;
      },
      
      verifyFlowSignature: (signature) => {
        // Regenerate hash and compare
        const content = JSON.stringify({
          nodes: signature.nodes,
          edges: signature.edges
        });
        const hashBuffer = new TextEncoder().encode(content);
        const hashArray = Array.from(hashBuffer);
        const hash = hashArray.reduce((h, b) => {
          h = ((h << 5) - h) + b;
          return h & h;
        }, 0).toString(36);
        
        return hash === signature.hash;
      },
      
      createSandbox: async (componentId) => {
        try {
          // In browser environment, use iframe sandbox
          const sandbox = document.createElement('iframe');
          sandbox.sandbox.add('allow-scripts');
          sandbox.style.display = 'none';
          document.body.appendChild(sandbox);
          
          set((state) => {
            const sandboxStatus = new Map(state.sandboxStatus);
            sandboxStatus.set(componentId, true);
            return { sandboxStatus };
          });
          
          get().logAudit({
            component: 'sandbox',
            componentId,
            action: 'create_sandbox',
            actor: 'system',
            level: 'high',
            details: {},
            success: true
          });
          
        } catch (error) {
          get().logAudit({
            component: 'sandbox',
            componentId,
            action: 'create_sandbox',
            actor: 'system',
            level: 'critical',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
            success: false
          });
          throw error;
        }
      },
      
      destroySandbox: async (componentId) => {
        try {
          // Remove sandbox iframe
          const sandbox = document.querySelector(`iframe[data-component-id="${componentId}"]`);
          if (sandbox) {
            sandbox.remove();
          }
          
          set((state) => {
            const sandboxStatus = new Map(state.sandboxStatus);
            sandboxStatus.delete(componentId);
            return { sandboxStatus };
          });
          
          get().logAudit({
            component: 'sandbox',
            componentId,
            action: 'destroy_sandbox',
            actor: 'system',
            level: 'high',
            details: {},
            success: true
          });
          
        } catch (error) {
          get().logAudit({
            component: 'sandbox',
            componentId,
            action: 'destroy_sandbox',
            actor: 'system',
            level: 'critical',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
            success: false
          });
          throw error;
        }
      },
      
      isSandboxActive: (componentId) => {
        return get().sandboxStatus.get(componentId) || false;
      }
    }),
    {
      name: 'security-storage'
    }
  )
);

// Security Core API
export const securityCore = {
  // Source Code Protection
  async validateSourceAccess(
    componentId: string,
    operation: 'read' | 'write'
  ): Promise<void> {
    const security = useSecurityStore.getState();
    
    if (!security.hasPermission(componentId, operation)) {
      throw new SecurityViolationError(
        `Unauthorized source code ${operation} attempt`,
        'adapter'
      );
    }
    
    security.logAudit({
      component: 'adapter',
      componentId,
      action: `source_${operation}`,
      actor: 'system',
      level: 'high',
      details: {},
      success: true
    });
  },
  
  // Sandbox Management
  async runInSandbox<T>(
    componentId: string,
    code: string,
    context: Record<string, any> = {}
  ): Promise<T> {
    const security = useSecurityStore.getState();
    
    if (!security.isSandboxActive(componentId)) {
      await security.createSandbox(componentId);
    }
    
    try {
      // Execute in sandbox iframe
      const sandbox = document.querySelector(
        `iframe[data-component-id="${componentId}"]`
      ) as HTMLIFrameElement;
      
      if (!sandbox?.contentWindow) {
        throw new Error('Sandbox not found');
      }
      
      // Create safe execution context
      const safeContext = {
        ...context,
        console: sandbox.contentWindow.console,
        setTimeout: sandbox.contentWindow.setTimeout,
        clearTimeout: sandbox.contentWindow.clearTimeout
      };
      
      const result = await new Promise<T>((resolve, reject) => {
        try {
          const fn = new sandbox.contentWindow!.Function(
            ...Object.keys(safeContext),
            code
          );
          resolve(fn.apply(null, Object.values(safeContext)));
        } catch (error) {
          reject(error);
        }
      });
      
      security.logAudit({
        component: 'sandbox',
        componentId,
        action: 'execute_code',
        actor: 'system',
        level: 'medium',
        details: {},
        success: true
      });
      
      return result;
      
    } catch (error) {
      security.logAudit({
        component: 'sandbox',
        componentId,
        action: 'execute_code',
        actor: 'system',
        level: 'high',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        success: false
      });
      throw error;
    }
  },
  
  // Flow Security
  async validateFlow(
    flow: { nodes: Node[]; edges: Edge[] },
    creator: FlowSignature['creator']
  ): Promise<void> {
    const security = useSecurityStore.getState();
    
    // Validate creator permissions
    if (creator.type !== 'user' && !security.hasPermission(creator.id, 'execute')) {
      throw new SecurityViolationError(
        'Unauthorized flow deployment attempt',
        'flow'
      );
    }
    
    // Sign flow
    const signature = security.signFlow(
      crypto.randomUUID(),
      flow.nodes,
      flow.edges,
      creator
    );
    
    // Verify signature
    if (!security.verifyFlowSignature(signature)) {
      throw new SecurityViolationError(
        'Flow signature verification failed',
        'flow'
      );
    }
  },
  
  // Agent Security
  async validateAgentAction(
    agent: AgentConfig,
    action: string,
    data: any
  ): Promise<void> {
    const security = useSecurityStore.getState();
    
    // Check agent permissions
    if (!security.hasPermission(agent.id, 'execute')) {
      throw new SecurityViolationError(
        'Agent lacks required permissions',
        'agent'
      );
    }
    
    // Log action
    security.logAudit({
      component: 'agent',
      componentId: agent.id,
      action,
      actor: `agent:${agent.id}`,
      level: 'medium',
      details: { data },
      success: true
    });
  },
  
  // Autopilot Security
  async validateAutopilotAction(
    draft: AutopilotDraft,
    action: 'create' | 'deploy'
  ): Promise<void> {
    const security = useSecurityStore.getState();
    
    // Validate action
    if (action === 'deploy' && !security.hasPermission('autopilot', 'execute')) {
      throw new SecurityViolationError(
        'Unauthorized autopilot deployment',
        'autopilot'
      );
    }
    
    security.logAudit({
      component: 'autopilot',
      componentId: draft.id,
      action: `autopilot_${action}`,
      actor: 'autopilot',
      level: 'high',
      details: { draft },
      success: true
    });
  }
};