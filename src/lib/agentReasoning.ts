import { AgentMemory, MemoryEntry } from './agentMemory';
import { apiClient } from './api';

export interface ReasoningContext {
  currentTask?: string;
  previousOutcome?: string;
  toolHistory?: Array<{
    tool: string;
    success: boolean;
    timestamp: string;
  }>;
  constraints?: string[];
}

export interface ReasoningResult {
  decision: string;
  confidence: number;
  explanation: string;
  alternatives?: string[];
}

export class AgentReasoning {
  constructor(private memory: AgentMemory) {}

  async decideTool(
    task: string,
    availableTools: string[],
    context?: ReasoningContext
  ): Promise<ReasoningResult> {
    // Consider tool preferences from memory
    const toolPrefs = this.memory.toolPreferences;
    
    // Find tools that have worked well for similar tasks
    const bestTool = toolPrefs
      .filter(t => availableTools.includes(t.tool))
      .sort((a, b) => {
        // Weight recent success more heavily
        const recencyScore = (t: typeof toolPrefs[0]) =>
          t.lastSuccess
            ? (new Date().getTime() - new Date(t.lastSuccess).getTime()) / 86400000
            : 0;
        
        // Consider both confidence and recency
        const scoreA = a.confidence * (1 - recencyScore(a) * 0.1);
        const scoreB = b.confidence * (1 - recencyScore(b) * 0.1);
        
        return scoreB - scoreA;
      })[0];

    if (bestTool && bestTool.confidence > 0.7) {
      return {
        decision: bestTool.tool,
        confidence: bestTool.confidence,
        explanation: `Choosing ${bestTool.tool} based on past success (${Math.round(bestTool.confidence * 100)}% confidence)`,
        alternatives: toolPrefs
          .filter(t => t !== bestTool && t.confidence > 0.5)
          .map(t => t.tool)
      };
    }

    // If no clear preference, ask Copilot
    try {
      const suggestion = await apiClient.askCopilot(
        task,
        availableTools.join(','),
        context?.previousOutcome
      );

      return {
        decision: suggestion.tool,
        confidence: 0.6,
        explanation: suggestion.explanation,
        alternatives: suggestion.alternatives
      };
    } catch (error) {
      // Fallback to random selection with low confidence
      const randomTool = availableTools[
        Math.floor(Math.random() * availableTools.length)
      ];

      return {
        decision: randomTool,
        confidence: 0.3,
        explanation: 'Selecting randomly due to lack of historical data',
        alternatives: availableTools.filter(t => t !== randomTool)
      };
    }
  }

  async reflectOnOutcome(
    task: string,
    tool: string,
    outcome: 'success' | 'failure',
    error?: string
  ): Promise<string> {
    try {
      // Get relevant memories
      const recentFailures = this.memory.recentFailures
        .filter(f => f.context.tool === tool)
        .slice(0, 3);

      const toolPref = this.memory.toolPreferences
        .find(t => t.tool === tool);

      // Generate reflection using Copilot
      const reflection = await apiClient.askCopilot(
        `Reflect on ${outcome} using ${tool} for "${task}"`,
        tool,
        error
      );

      return reflection.suggestion;
    } catch (error) {
      // Fallback to basic reflection
      return outcome === 'success'
        ? `Successfully used ${tool} for task`
        : `Failed to use ${tool}: ${error}`;
    }
  }

  shouldRetry(error: string, attempts: number): boolean {
    // Check recent failures
    const similarFailures = this.memory.recentFailures
      .filter(f => f.error.includes(error))
      .length;

    // Avoid retrying if we've seen this error multiple times
    if (similarFailures >= 3) {
      return false;
    }

    // Consider tool-specific failure patterns
    const toolFailures = this.memory.toolPreferences
      .find(t => t.tool === error)
      ?.failureCount || 0;

    return attempts < 3 && toolFailures < 5;
  }

  getFallbackStrategy(failedTool: string): string | null {
    // Check if we have a successful alternative in memory
    const alternatives = this.memory.toolPreferences
      .filter(t => t.tool !== failedTool && t.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence);

    if (alternatives.length > 0) {
      return alternatives[0].tool;
    }

    // Check learnings for fallback patterns
    const relevantLearning = this.memory.learnings
      .find(l => 
        l.insight.includes(failedTool) && 
        l.insight.toLowerCase().includes('fallback')
      );

    if (relevantLearning) {
      const match = relevantLearning.insight.match(/use (\w+) instead/i);
      if (match) return match[1];
    }

    return null;
  }
}