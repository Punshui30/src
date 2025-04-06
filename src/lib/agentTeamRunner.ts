import { AgentTeam, TeamMessage, useAgentTeam } from './agentTeamStore';
import { useAgentStore } from './agentStore';
import { useAgentMemory } from './agentMemory';
import { AgentReasoning } from './agentReasoning';
import { apiClient } from './api';

class AgentTeamRunner {
  private store = useAgentTeam.getState();
  private agentStore = useAgentStore.getState();
  private memory = useAgentMemory.getState();

  async handleMessage(message: TeamMessage) {
    const team = this.store.teams.find(t => t.id === message.teamId);
    if (!team) return;

    const fromAgent = this.agentStore.agents.find(a => a.id === message.fromAgentId);
    if (!fromAgent) return;

    const fromMember = team.members.find(m => m.agentId === message.fromAgentId);
    if (!fromMember) return;

    // Initialize reasoning engine with team context
    const reasoning = new AgentReasoning(
      this.memory.summarizeMemory(message.fromAgentId)
    );

    switch (message.type) {
      case 'alert':
        // Find fixer agents
        const fixers = team.members.filter(m => m.role === 'fixer');
        
        for (const fixer of fixers) {
          const fixerAgent = this.agentStore.agents.find(a => a.id === fixer.agentId);
          if (!fixerAgent) continue;

          // Ask fixer to handle the alert
          this.store.sendMessage({
            teamId: team.id,
            fromAgentId: message.fromAgentId,
            toAgentId: fixer.agentId,
            type: 'request',
            content: `Please investigate and fix: ${message.content}`,
            priority: message.priority,
            metadata: message.metadata
          });
        }
        break;

      case 'request':
        if (!message.toAgentId) break;

        const toMember = team.members.find(m => m.agentId === message.toAgentId);
        if (!toMember) break;

        // Check if agent can handle request based on role
        const canHandle = await reasoning.canHandleRequest(
          message.content,
          toMember.role,
          message.metadata
        );

        if (canHandle) {
          // Send acknowledgment
          this.store.sendMessage({
            teamId: team.id,
            fromAgentId: message.toAgentId,
            toAgentId: message.fromAgentId,
            type: 'response',
            content: 'Working on your request...',
            priority: 'low'
          });

          // TODO: Handle request based on role
        } else {
          // Suggest alternative agent
          const suggestion = await reasoning.suggestAlternativeAgent(
            message.content,
            team.members
          );

          if (suggestion) {
            this.store.sendMessage({
              teamId: team.id,
              fromAgentId: message.toAgentId,
              toAgentId: message.fromAgentId,
              type: 'suggestion',
              content: `I cannot handle this request. Try asking ${suggestion.name} instead.`,
              priority: 'medium',
              metadata: { suggestedAgentId: suggestion.id }
            });
          }
        }
        break;

      case 'status':
        // Broadcast status to analyzers
        const analyzers = team.members.filter(m => m.role === 'analyzer');
        
        for (const analyzer of analyzers) {
          this.store.sendMessage({
            teamId: team.id,
            fromAgentId: message.fromAgentId,
            toAgentId: analyzer.agentId,
            type: 'status',
            content: message.content,
            priority: 'low',
            metadata: message.metadata
          });
        }
        break;

      case 'suggestion':
        // Record suggestion in memory
        this.memory.addMemory({
          agentId: message.fromAgentId,
          type: 'learning',
          content: message.content,
          importance: 0.7,
          context: {
            source: 'team_suggestion',
            metadata: message.metadata
          }
        });
        break;
    }
  }

  async broadcastStatus(team: AgentTeam, agent: AgentConfig, status: string) {
    this.store.sendMessage({
      teamId: team.id,
      fromAgentId: agent.id,
      type: 'status',
      content: status,
      priority: 'low'
    });
  }

  async reportError(team: AgentTeam, agent: AgentConfig, error: string) {
    this.store.sendMessage({
      teamId: team.id,
      fromAgentId: agent.id,
      type: 'alert',
      content: error,
      priority: 'high',
      metadata: { error }
    });
  }

  async suggestImprovement(
    team: AgentTeam,
    fromAgent: AgentConfig,
    toAgent: AgentConfig,
    suggestion: string
  ) {
    this.store.sendMessage({
      teamId: team.id,
      fromAgentId: fromAgent.id,
      toAgentId: toAgent.id,
      type: 'suggestion',
      content: suggestion,
      priority: 'medium'
    });
  }
}

export const agentTeamRunner = new AgentTeamRunner();