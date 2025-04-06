import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as HoverCard from '@radix-ui/react-hover-card';
import * as Avatar from '@radix-ui/react-avatar';
import { Users } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useWorkspaceStore } from '../lib/store';
import { usePresenceStore } from '../lib/presenceStore';
import { cn } from '../lib/utils';

export function UserPresence() {
  const { currentWorkspace } = useWorkspaceStore();
  const { onlineUsers } = usePresenceStore();

  const workspaceUsers = currentWorkspace
    ? onlineUsers.filter(user => user.workspaceId === currentWorkspace.id)
    : [];

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/50 hover:bg-accent transition-colors">
          <Users size={16} className="text-primary" />
          <span className="text-sm">
            {workspaceUsers.length} online
          </span>
        </button>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          align="end"
          className="w-64 p-2 rounded-lg border bg-card shadow-lg"
          sideOffset={5}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {workspaceUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50"
                  >
                    <div className="relative">
                      <Avatar.Root>
                        <Avatar.Image
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <Avatar.Fallback className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          {user.name.charAt(0)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                        user.status === 'online' ? 'bg-emerald-500' : 'bg-yellow-500'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.role}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {workspaceUsers.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No users online
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}