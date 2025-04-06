import { useAutopilotStore } from './autopilotStore';
import { useInstalledApps } from './installedAppsStore';
import { useGateLogs } from './gateLogsStore';
import { apiClient } from './api';

class AutopilotRunner {
  private checkInterval: number | null = null;
  private store = useAutopilotStore.getState();
  private apps = useInstalledApps.getState();
  private logs = useGateLogs.getState();

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
      if (!this.store.isEnabled) return;

      // Run behavior analysis
      this.store.analyzeBehavior(
        this.apps.apps,
        this.logs.logs
      );

      // Get suggestions from Copilot
      const suggestions = await apiClient.askCopilot(
        'suggest workflow improvements',
        this.apps.apps.map(app => app.name).join(',')
      );

      if (suggestions.workflows) {
        suggestions.workflows.forEach(workflow => {
          this.store.addDraft({
            title: workflow.name,
            description: workflow.description,
            confidence: workflow.confidence,
            source: 'pattern',
            nodes: workflow.nodes,
            edges: workflow.edges,
            tools: workflow.tools,
            explanation: workflow.reasoning
          });
        });
      }

    } catch (error) {
      console.error('Autopilot analysis failed:', error);
    }
  }
}

export const autopilotRunner = new AutopilotRunner();