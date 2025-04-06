import { AgentConfig, AgentExecution, useAgentStore } from './agentStore';
import { useInstalledApps } from './installedAppsStore';
import { apiClient } from './api';
import { useGateOut } from './gateOutStore';
import { useGateLogs } from './gateLogsStore';
import { useAgentMemory } from './agentMemory';
import { AgentReasoning } from './agentReasoning';

class AgentRunner {
  private intervals: Map<string, number> = new Map();
  private store = useAgentStore.getState();
  private apps = useInstalledApps.getState();
  private gateOut = useGateOut.getState();
  private gateLogs = useGateLogs.getState();
  private memory = useAgentMemory.getState();

  async start(agent: AgentConfig) {
    if (this.intervals.has(agent.id)) {
      return;
    }

    const execute = async () => {
      // Start new execution
      const execution: Omit<AgentExecution, 'id'> = {
        agentId: agent.id,
        startTime: new Date().toISOString(),
        status: 'running'
      };
      
      this.store.addExecution(execution);
      const execId = this.store.executions[this.store.executions.length - 1].id;

      // Initialize reasoning engine with agent's memory
      const reasoning = new AgentReasoning(
        this.memory.summarizeMemory(agent.id)
      );

      try {
        // Check required tools
        const missingTools = agent.tools.filter(toolId => 
          !this.apps.apps.find(app => app.id === toolId)
        );
        
        if (missingTools.length > 0) {
          throw new Error(`Missing required tools: ${missingTools.join(', ')}`);
        }

        let attempts = 0;

        // Execute workflow steps
        if (agent.workflow) {
          for (const step of agent.workflow) {
            attempts = 0;
            let success = false;

            while (!success && attempts < 3) {
              try {
                // Get tool recommendation
                const toolDecision = await reasoning.decideTool(
                  step.data.action || 'process data',
                  agent.tools,
                  {
                    currentTask: step.data.action,
                    previousOutcome: attempts > 0 ? 'failure' : undefined
                  }
                );

                const app = this.apps.apps.find(a => a.id === toolDecision.decision);
                if (!app) continue;

                // Send through Gate Out
                await this.gateOut.sendPayload(step.data, app.name);

                // Log success
                this.gateLogs.addLog({
                  id: crypto.randomUUID(),
                  timestamp: new Date().toISOString(),
                  input: JSON.stringify(step.data),
                  target: app.name,
                  output: 'Step completed successfully',
                  status: 'success'
                });

                // Record success in memory
                this.memory.addMemory({
                  agentId: agent.id,
                  type: 'task',
                  content: `Successfully used ${app.name} for ${step.data.action}`,
                  importance: 0.7,
                  context: {
                    tool: app.name,
                    action: step.data.action,
                    outcome: 'success'
                  }
                });

                // Generate reflection
                const reflection = await reasoning.reflectOnOutcome(
                  step.data.action,
                  app.name,
                  'success'
                );

                this.memory.addMemory({
                  agentId: agent.id,
                  type: 'learning',
                  content: reflection,
                  importance: 0.8,
                  context: { source: 'reflection' }
                });

                success = true;

              } catch (error) {
                attempts++;
                const message = error instanceof Error ? error.message : 'Unknown error';

                // Record failure in memory
                this.memory.addMemory({
                  agentId: agent.id,
                  type: 'error',
                  content: message,
                  importance: 0.9,
                  context: {
                    tool: step.source_tool,
                    action: step.data.action,
                    attempt: attempts
                  }
                });

                // Generate reflection
                const reflection = await reasoning.reflectOnOutcome(
                  step.data.action,
                  step.source_tool,
                  'failure',
                  message
                );

                this.memory.addMemory({
                  agentId: agent.id,
                  type: 'learning',
                  content: reflection,
                  importance: 0.8,
                  context: { source: 'reflection' }
                });

                // Check if we should retry
                if (!reasoning.shouldRetry(message, attempts)) {
                  // Try fallback strategy
                  const fallback = reasoning.getFallbackStrategy(step.source_tool);
                  if (fallback) {
                    this.memory.addMemory({
                      agentId: agent.id,
                      type: 'learning',
                      content: `Switching to fallback tool: ${fallback}`,
                      importance: 0.9,
                      context: { source: 'fallback_decision' }
                    });
                    step.source_tool = fallback;
                    attempts = 0; // Reset attempts for new tool
                    continue;
                  }
                  throw new Error(`Failed after ${attempts} attempts: ${message}`);
                }
              }
            }
          }
        }

        // Prune old memories periodically
        this.memory.pruneMemories(agent.id);

        // Update execution status
        this.store.updateExecution(execId, {
          status: 'success',
          endTime: new Date().toISOString()
        });

        // Update agent last run
        this.store.updateAgent(agent.id, {
          lastRun: new Date().toISOString(),
          lastError: undefined
        });

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        
        // Update execution status
        this.store.updateExecution(execId, {
          status: 'error',
          error: message,
          endTime: new Date().toISOString()
        });

        // Update agent error
        this.store.updateAgent(agent.id, {
          lastError: message
        });
      }
    };

    // Initial execution
    await execute();

    // Set up interval if configured
    if (agent.schedule.type === 'interval') {
      const interval = window.setInterval(
        execute,
        parseInt(agent.schedule.value)
      );
      this.intervals.set(agent.id, interval);
    }
    // TODO: Add cron schedule support
  }

  stop(agentId: string) {
    const interval = this.intervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(agentId);
    }
  }

  stopAll() {
    for (const [agentId, interval] of this.intervals) {
      clearInterval(interval);
      this.intervals.delete(agentId);
    }
  }
}

export const agentRunner = new AgentRunner();