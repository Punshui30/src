import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { 
  Users, Plus, Settings, Trash2, MessageSquare,
  Bot, AlertTriangle, CheckCircle2, ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { useAgentTeam, AgentTeam, TeamMessage } from '../lib/agentTeamStore';
import { useAgentStore } from '../lib/agentStore';
import { format, formatDistanceToNow } from 'date-fns';

interface AgentTeamDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
}

export function AgentTeamDashboard({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  isFocused = false
}: AgentTeamDashboardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const { teams, messages, getTeamMessages } = useAgentTeam();
  const { agents } = useAgentStore();
  const { addToast } = useToast();

  const handleCreateTeam = () => {
    // TODO: Open team creation modal
  };

  const handleRemoveTeam = (team: AgentTeam) => {
    // TODO: Add confirmation dialog
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
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Agent Teams</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            {teams.length} Teams
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateTeam}
            className="h-6 px-2 text-xs gap-1"
          >
            <Plus className="w-3 h-3" />
            New Team
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
        {/* Team List */}
        <div className="border-r">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {teams.map((team) => {
                  const teamMessages = getTeamMessages(team.id);
                  const unreadCount = teamMessages.filter(m => 
                    m.priority === 'high' && 
                    new Date(m.timestamp).getTime() > Date.now() - 3600000 // 1 hour
                  ).length;

                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={() => setSelectedTeam(team.id)}
                      className={cn(
                        "p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer",
                        selectedTeam === team.id && "border-primary"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="font-medium">{team.name}</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTeam(team);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {team.goal}
                      </p>

                      <div className="flex items-center gap-2">
                        {team.members.slice(0, 3).map((member) => {
                          const agent = agents.find(a => a.id === member.agentId);
                          if (!agent) return null;

                          return (
                            <div
                              key={member.agentId}
                              className="flex items-center gap-1 text-xs bg-accent/50 px-2 py-1 rounded-full"
                            >
                              <Bot className="w-3 h-3" />
                              <span>{agent.name}</span>
                            </div>
                          );
                        })}
                        {team.members.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{team.members.length - 3} more
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {teams.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-muted-foreground py-8"
                  >
                    No teams configured
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Team Details */}
        <div>
          <ScrollArea className="h-full">
            {selectedTeam ? (
              <div className="p-4">
                <TeamDetails teamId={selectedTeam} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <p>Select a team to view details</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function TeamDetails({ teamId }: { teamId: string }) {
  const team = useAgentTeam(state => 
    state.teams.find(t => t.id === teamId)
  );
  const messages = useAgentTeam(state => 
    state.getTeamMessages(teamId)
  );
  const agents = useAgentStore(state => state.agents);

  if (!team) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{team.name}</h2>
        <p className="text-muted-foreground">{team.goal}</p>

        {/* Team Members */}
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium">Team Members</h3>
          <div className="space-y-2">
            {team.members.map((member) => {
              const agent = agents.find(a => a.id === member.agentId);
              if (!agent) return null;

              return (
                <div
                  key={member.agentId}
                  className="p-3 rounded-lg bg-accent/30 border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10">
                      {member.role}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {agent.goal}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Communication */}
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium">Communication</h3>
          <div className="space-y-2">
            {messages.map((message) => {
              const fromAgent = agents.find(a => a.id === message.fromAgentId);
              const toAgent = message.toAgentId 
                ? agents.find(a => a.id === message.toAgentId)
                : null;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    message.type === 'alert' && "bg-destructive/10 border-destructive/30",
                    message.type === 'status' && "bg-emerald-500/10 border-emerald-500/30",
                    message.type === 'suggestion' && "bg-primary/10 border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Bot className="w-3 h-3" />
                      <span className="text-sm font-medium">
                        {fromAgent?.name}
                      </span>
                      {toAgent && (
                        <>
                          <ArrowRight className="w-3 h-3" />
                          <span className="text-sm">{toAgent.name}</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.timestamp), {
                        addSuffix: true
                      })}
                    </span>
                  </div>

                  <p className="text-sm">{message.content}</p>

                  {message.metadata && (
                    <pre className="mt-2 text-xs bg-muted/30 p-2 rounded overflow-x-auto">
                      {JSON.stringify(message.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}