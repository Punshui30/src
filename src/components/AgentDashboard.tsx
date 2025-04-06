import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { 
  Bot, Plus, Play, Pause, Settings, Trash2, 
  Clock, AlertTriangle, CheckCircle2, ScrollText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useAgentStore, AgentConfig } from '../lib/agentStore';
import { agentRunner } from '../lib/agentRunner';
import { format, formatDistanceToNow } from 'date-fns';
import { useAgentMemory } from '../lib/agentMemory';

interface AgentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
}

export function AgentDashboard({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false
}: AgentDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { agents, executions, toggleAgent, removeAgent } = useAgentStore();
  const { getAgentMemories, summarizeMemory } = useAgentMemory();
  const { addToast } = useToast();

  const handleToggleAgent = async (agent: AgentConfig) => {
    try {
      if (agent.isActive) {
        agentRunner.stop(agent.id);
        addToast(`Agent "${agent.name}" stopped`, 'info');
      } else {
        await agentRunner.start(agent);
        addToast(`Agent "${agent.name}" started`, 'success');
      }
      toggleAgent(agent.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle agent';
      addToast(message, 'error');
    }
  };

  const handleRemoveAgent = (agent: AgentConfig) => {
    agentRunner.stop(agent.id);
    removeAgent(agent.id);
    addToast(`Agent "${agent.name}" removed`, 'info');
  };

  const getAgentStatus = (agent: AgentConfig) => {
    if (!agent.isActive) return 'stopped';
    if (agent.lastError) return 'error';
    return 'running';
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "w-full h-full rounded-lg overflow-hidden backdrop-blur",
        isFocused ? "bg-card/95 border-primary" : "bg-card/80 border-border"
      )}
      onBlur={onBlur}
    >
      <div className="window-header flex items-center justify-between p-2 bg-muted/50 border-b cursor-move">
        <div className="flex items-center gap-2 px-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Autonomous Agents</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            {agents.length} Active
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="h-6 px-2 text-xs gap-1"
          >
            <Plus className="w-3 h-3" />
            New Agent
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onMinimize}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onMaximize}
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 h-[calc(100%-36px)]">
        {/* Agent List */}
        <div className="border-r">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {agents.map((agent) => {
                  const status = getAgentStatus(agent);
                  const lastExecution = executions
                    .filter(e => e.agentId === agent.id)
                    .sort((a, b) => 
                      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                    )[0];

                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={cn(
                        "p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer",
                        selectedAgent === agent.id && "border-primary",
                        status === 'running' && "border-emerald-500/30",
                        status === 'error' && "border-destructive/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-primary" />
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {status === 'running' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                          {status === 'error' && (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {agent.goal}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {agent.lastRun
                            ? formatDistanceToNow(new Date(agent.lastRun), { addSuffix: true })
                            : 'Never run'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAgent(agent);
                            }}
                          >
                            {agent.isActive ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAgent(agent);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {agents.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-muted-foreground py-8"
                  >
                    No agents configured
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Agent Details */}
        <div>
          <ScrollArea className="h-full">
            {selectedAgent ? (
              <div className="p-4">
                <AgentDetails agentId={selectedAgent} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bot className="w-8 h-8 mb-2 opacity-50" />
                <p>Select an agent to view details</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function AgentDetails({ agentId }: { agentId: string }) {
  const agent = useAgentStore(state => 
    state.agents.find(a => a.id === agentId)
  );
  const memories = useAgentMemory(state => state.getAgentMemories(agentId));
  const memory = useAgentMemory(state => state.summarizeMemory(agentId));
  const executions = useAgentStore(state => 
    state.executions
      .filter(e => e.agentId === agentId)
      .sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
  );

  if (!agent) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{agent.name}</h2>
        <p className="text-muted-foreground">{agent.goal}</p>

        {/* Memory Section */}
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Learnings</h3>
            <div className="space-y-2">
              {memory.learnings.slice(0, 3).map((learning, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-accent/30 border text-sm"
                >
                  <p>{learning.insight}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(learning.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tool Preferences</h3>
            <div className="space-y-2">
              {memory.toolPreferences.map((tool, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border"
                >
                  <span className="text-sm">{tool.tool}</span>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {Math.round(tool.confidence * 100)}% confidence
                    </div>
                    <div className="w-20 h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${tool.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {memory.recentFailures.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Recent Issues</h3>
              <div className="space-y-2">
                {memory.recentFailures.slice(0, 3).map((failure, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-destructive/10 border-destructive/30 border text-sm"
                  >
                    <p className="text-destructive">{failure.error}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(failure.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Schedule</h3>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          {agent.schedule.type === 'interval'
            ? `Every ${parseInt(agent.schedule.value) / 1000} seconds`
            : agent.schedule.value}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Execution History</h3>
        <div className="space-y-2">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className={cn(
                "p-3 rounded-lg border text-sm",
                execution.status === 'running' && "bg-primary/5 border-primary/30",
                execution.status === 'success' && "bg-emerald-500/5 border-emerald-500/30",
                execution.status === 'error' && "bg-destructive/5 border-destructive/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {execution.status === 'running' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-3 h-3 text-primary" />
                    </motion.div>
                  )}
                  {execution.status === 'success' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  )}
                  {execution.status === 'error' && (
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                  )}
                  <span>
                    {format(new Date(execution.startTime), 'MMM d, HH:mm:ss')}
                  </span>
                </div>
                {execution.endTime && (
                  <span className="text-xs text-muted-foreground">
                    Duration: {
                      formatDistanceToNow(new Date(execution.startTime), {
                        includeSeconds: true
                      })
                    }
                  </span>
                )}
              </div>

              {execution.error && (
                <p className="text-xs text-destructive mt-1">
                  {execution.error}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}