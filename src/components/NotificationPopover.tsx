import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useNotificationStore, Notification } from '../lib/notificationStore';
import { useWorkspaceStore } from '../lib/store';
import { formatDistanceToNow } from 'date-fns';

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentWorkspace } = useWorkspaceStore();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getWorkspaceNotifications
  } = useNotificationStore();

  const workspaceNotifications = currentWorkspace
    ? getWorkspaceNotifications(currentWorkspace.id)
    : [];

  useEffect(() => {
    // Animate bell when new notifications arrive
    if (unreadCount > 0) {
      const bell = document.getElementById('notification-bell');
      if (bell) {
        bell.classList.add('animate-shake');
        setTimeout(() => bell.classList.remove('animate-shake'), 1000);
      }
    }
  }, [unreadCount]);

  const handleMarkAllRead = () => {
    if (currentWorkspace) {
      markAllAsRead(currentWorkspace.id);
    }
  };

  const handleClear = () => {
    if (currentWorkspace) {
      clearNotifications(currentWorkspace.id);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open notifications"
        >
          <Bell id="notification-bell" className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-96 bg-card border rounded-lg shadow-lg"
          align="end"
          sideOffset={5}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleMarkAllRead}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleClear}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <AnimatePresence>
                {workspaceNotifications.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {workspaceNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={markAsRead}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No notifications
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function NotificationItem({
  notification,
  onMarkRead
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-3 rounded-lg border ${
        notification.read
          ? 'bg-card border-border'
          : 'bg-accent/50 border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{notification.title}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{notification.userName}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(notification.timestamp), {
                addSuffix: true
              })}
            </span>
          </div>
        </div>
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onMarkRead(notification.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}