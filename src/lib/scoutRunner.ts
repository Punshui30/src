import { useScoutStore } from './scoutStore';
import { useInstalledApps } from './installedAppsStore';
import { useGateLogs } from './gateLogsStore';
import { useAgentStore } from './agentStore';
import { apiClient } from './api';

class ScoutRunner {
  private checkInterval: number | null = null;
  private store = useScoutStore.getState();
  private apps = useInstalledApps.getState();
  private logs = useGateLogs.getState();
  private agents = useAgentStore.getState();

  start() {
    if (this.checkInterval) return;

    // Run analysis every 5 minutes
    this.checkInterval = window.setInterval(() => {
      this.analyze();
    }, 300000);

    // Initial analysis
    this.analyze();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async analyze() {
    try {
      // Run behavior analysis
      this.store.analyzeBehavior(
        this.apps.apps,
        this.logs.logs,
        this.agents.agents
      );

      // Get suggestions from Copilot
      const suggestions = await apiClient.askCopilot(
        'suggest workflow improvements',
        this.apps.apps.map(app => app.name).join(',')
      );

      if (suggestions.workflows) {
        suggestions.workflows.forEach(workflow => {
          this.store.addSuggestion({
            type: 'workflow',
            title: workflow.name,
            description: workflow.description,
            confidence: workflow.confidence,
            source: 'copilot',
            tools: workflow.tools,
            workflow: workflow.definition,
            explanation: workflow.reasoning
          });
        });
      }

    } catch (error) {
      console.error('Scout analysis failed:', error);
    }
  }
}

export const scoutRunner = new ScoutRunner();