import { useSystemWatcher } from "./systemWatcherStore";
import { useAgentStore } from './agentStore';
import { useGateLogs } from './gateLogsStore';
import { apiClient } from './api';

class SystemWatcher {
  private checkInterval: number | null = null;
  private store = useSystemWatcher.getState();
  private agentStore = useAgentStore.getState();
  private gateLogs = useGateLogs.getState();

  start() {
    if (this.checkInterval) return;

    // Run checks every 30 seconds
    this.checkInterval = window.setInterval(() => {
      this.checkAdapters();
      this.checkAgents();
      this.checkWorkflows();
      this.checkCopilot();
    }, 30000);

    // Initial check
    this.checkAdapters();
    this.checkAgents();
    this.checkWorkflows();
    this.checkCopilot();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkAdapters() {
    try {
      const { adapters } = await apiClient.getAdapters();
      
      // Check for failing adapters
      for (const adapter of adapters) {
        if (adapter.status === 'error') {
          this.store.addAlert({
            component: 'adapter',
            componentId: adapter.id,
            title: `Adapter ${adapter.name} is failing`,
            message: `The adapter ${adapter.name} is reporting errors. This may affect workflow execution.`,
            severity: 'high',
            autoFixAvailable: true
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.store.addAlert({
        component: 'adapter',
        title: 'Adapter Registry Error',
        message: `Failed to check adapters: ${message}`,
        severity: 'critical',
        error: message,
        autoFixAvailable: false
      });
    }
  }

  private checkAgents() {
    const agents = this.agentStore.agents;
    
    // Check for stalled agents
    for (const agent of agents) {
      if (!agent.isActive) continue;

      // Check last run time
      if (agent.lastRun) {
        const lastRunTime = new Date(agent.lastRun).getTime();
        const now = Date.now();
        const threshold = agent.schedule.type === 'interval'
          ? parseInt(agent.schedule.value) * 2 // 2x the interval
          : 3600000; // 1 hour for cron jobs

        if (now - lastRunTime > threshold) {
          this.store.addAlert({
            component: 'agent',
            componentId: agent.id,
            title: `Agent ${agent.name} is stalled`,
            message: `Agent hasn't run in ${Math.round((now - lastRunTime) / 60000)} minutes`,
            severity: 'medium',
            autoFixAvailable: true
          });
        }
      }

      // Check for repeated errors
      if (agent.lastError) {
        const executions = this.agentStore.executions
          .filter(e => e.agentId === agent.id)
          .slice(0, 5);

        const failureCount = executions.filter(e => e.status === 'error').length;
        if (failureCount >= 3) {
          this.store.addAlert({
            component: 'agent',
            componentId: agent.id,
            title: `Agent ${agent.name} is failing`,
            message: `Agent has failed ${failureCount} times in a row: ${agent.lastError}`,
            severity: 'high',
            error: agent.lastError,
            autoFixAvailable: true
          });
        }
      }
    }
  }

  private checkWorkflows() {
    const logs = this.gateLogs.logs;
    
    // Check for patterns of failures
    const recentLogs = logs.slice(0, 10);
    const failureCount = recentLogs.filter(log => log.status === 'error').length;
    
    if (failureCount >= 5) {
      this.store.addAlert({
        component: 'workflow',
        title: 'High Workflow Failure Rate',
        message: `${failureCount} out of last 10 operations failed`,
        severity: 'high',
        autoFixAvailable: false
      });
    }

    // Check for infinite retry loops
    const uniqueErrors = new Set(
      recentLogs
        .filter(log => log.status === 'error')
        .map(log => log.output)
    );

    if (uniqueErrors.size === 1 && failureCount >= 3) {
      this.store.addAlert({
        component: 'workflow',
        title: 'Possible Retry Loop',
        message: 'Same error occurring repeatedly, possible infinite retry loop',
        severity: 'medium',
        error: Array.from(uniqueErrors)[0],
        autoFixAvailable: true
      });
    }
  }

  private async checkCopilot() {
    try {
      // Send test message to check Copilot
      await apiClient.sendCopilotMessage('test');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.store.addAlert({
        component: 'copilot',
        title: 'Copilot Connection Error',
        message: `Failed to communicate with Copilot: ${message}`,
        severity: 'high',
        error: message,
        autoFixAvailable: true
      });
    }
  }

  async attemptFix(alert: SystemAlert): Promise<boolean> {
    try {
      switch (alert.component) {
        case 'adapter':
          if (alert.componentId) {
            await apiClient.reloadAdapters();
            const { adapters } = await apiClient.getAdapters();
            const adapter = adapters.find(a => a.id === alert.componentId);
            return adapter?.status === 'active';
          }
          break;

        case 'agent':
          if (alert.componentId) {
            const agent = this.agentStore.agents.find(a => a.id === alert.componentId);
            if (agent) {
              // Stop and restart the agent
              this.agentStore.toggleAgent(agent.id); // Stop
              await new Promise(resolve => setTimeout(resolve, 1000));
              this.agentStore.toggleAgent(agent.id); // Start
              return true;
            }
          }
          break;

        case 'workflow':
          // For retry loops, add a delay
          if (alert.message.includes('retry loop')) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            return true;
          }
          break;

        case 'copilot':
          // Attempt to reconnect
          await apiClient.sendCopilotMessage('reconnect');
          return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }
}

export const systemWatcher = new SystemWatcher();