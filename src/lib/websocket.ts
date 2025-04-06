import { Node, Edge } from 'reactflow';
import { useNotificationStore } from './notificationStore';
import { usePresenceStore, OnlineUser } from './presenceStore';

export type WebSocketMessage = {
  type: 'node_update' | 'edge_update' | 'node_lock' | 'node_unlock' | 'sync_request' | 'sync_response' | 'notification' | 'presence_update';
  payload: any;
  userId: string;
  workspaceId: string;
  timestamp: number;
};

export type NodeLock = {
  nodeId: string;
  userId: string;
  timestamp: number;
};

class CollaborationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private locks: Map<string, NodeLock> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private presenceInterval: number | null = null;
  private handlers: {
    onNodeUpdate?: (nodeId: string, updates: Partial<Node>) => void;
    onEdgeUpdate?: (edgeId: string, updates: Partial<Edge>) => void;
    onNodeLock?: (nodeId: string, userId: string) => void;
    onNodeUnlock?: (nodeId: string) => void;
    onSyncRequest?: () => { nodes: Node[]; edges: Edge[] };
    onSyncResponse?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  } = {};

  constructor(private userId: string, private workspaceId: string) {}

  connect(url: string = 'ws://localhost:8000/ws') {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.processMessageQueue();
      this.startPresenceUpdates();
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.stopPresenceUpdates();
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
  }

  private startPresenceUpdates() {
    // Send initial presence
    this.updatePresence('online');

    // Update presence every 30 seconds
    this.presenceInterval = window.setInterval(() => {
      this.updatePresence('online');
    }, 30000);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private stopPresenceUpdates() {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.updatePresence('idle');
    } else {
      this.updatePresence('online');
    }
  };

  private updatePresence(status: 'online' | 'idle') {
    this.sendMessage({
      type: 'presence_update',
      payload: { status },
      userId: this.userId,
      workspaceId: this.workspaceId,
      timestamp: Date.now()
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms...`);
    setTimeout(() => this.connect(), delay);
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.userId === this.userId) return; // Ignore own messages

    switch (message.type) {
      case 'node_update':
        this.handlers.onNodeUpdate?.(
          message.payload.nodeId,
          message.payload.updates
        );
        break;

      case 'edge_update':
        this.handlers.onEdgeUpdate?.(
          message.payload.edgeId,
          message.payload.updates
        );
        break;

      case 'node_lock':
        this.locks.set(message.payload.nodeId, {
          nodeId: message.payload.nodeId,
          userId: message.userId,
          timestamp: message.timestamp
        });
        this.handlers.onNodeLock?.(message.payload.nodeId, message.userId);
        break;

      case 'node_unlock':
        this.locks.delete(message.payload.nodeId);
        this.handlers.onNodeUnlock?.(message.payload.nodeId);
        break;

      case 'sync_request':
        if (this.handlers.onSyncRequest) {
          const state = this.handlers.onSyncRequest();
          this.sendMessage({
            type: 'sync_response',
            payload: state,
            userId: this.userId,
            workspaceId: this.workspaceId,
            timestamp: Date.now()
          });
        }
        break;

      case 'sync_response':
        this.handlers.onSyncResponse?.(message.payload);
        break;

      case 'notification':
        const { addNotification } = useNotificationStore.getState();
        addNotification(message.payload);
        break;

      case 'presence_update':
        const { setUserOnline, updateUserStatus } = usePresenceStore.getState();
        if (message.payload.status === 'offline') {
          usePresenceStore.getState().setUserOffline(message.userId);
        } else {
          setUserOnline({
            id: message.userId,
            workspaceId: message.workspaceId,
            status: message.payload.status,
            lastSeen: new Date().toISOString(),
            ...message.payload.user
          });
        }
        break;
    }
  }

  private sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) this.sendMessage(message);
    }
  }

  sendNotification(notification: {
    type: 'info' | 'success' | 'error' | 'warning';
    title: string;
    message: string;
    userId: string;
    userName: string;
  }) {
    this.sendMessage({
      type: 'notification',
      payload: {
        ...notification,
        workspaceId: this.workspaceId
      },
      userId: this.userId,
      workspaceId: this.workspaceId,
      timestamp: Date.now()
    });
  }

  updateNode(nodeId: string, updates: Partial<Node>) {
    this.sendMessage({
      type: 'node_update',
      payload: { nodeId, updates },
      userId: this.userId,
      workspaceId: this.workspaceId,
      timestamp: Date.now()
    });
  }

  updateEdge(edgeId: string, updates: Partial<Edge>) {
    this.sendMessage({
      type: 'edge_update',
      payload: { edgeId, updates },
      userId: this.userId,
      workspaceId: this.workspaceId,
      timestamp: Date.now()
    });
  }

  lockNode(nodeId: string) {
    if (this.isNodeLocked(nodeId)) return false;

    const lock: NodeLock = {
      nodeId,
      userId: this.userId,
      timestamp: Date.now()
    };

    this.locks.set(nodeId, lock);
    this.sendMessage({
      type: 'node_lock',
      payload: { nodeId },
      userId: this.userId,
      workspaceId: this.workspaceId,
      timestamp: lock.timestamp
    });

    return true;
  }

  unlockNode(nodeId: string) {
    const lock = this.locks.get(nodeId);
    if (lock?.userId !== this.userId) return false;

    this.locks.delete(nodeId);
    this.sendMessage({
      type: 'node_unlock',
      payload: { nodeId },
      userId: this.userId,
      workspaceId: this.workspaceId,
      timestamp: Date.now()
    });

    return true;
  }

  isNodeLocked(nodeId: string): boolean {
    const lock = this.locks.get(nodeId);
    if (!lock) return false;

    // Auto-release locks after 30 seconds
    if (Date.now() - lock.timestamp > 30000) {
      this.locks.delete(nodeId);
      return false;
    }

    return true;
  }

  requestSync() {
    this.sendMessage({
      type: 'sync_request',
      payload: null,
      userId: this.userId,
      workspaceId: this.workspaceId,
      timestamp: Date.now()
    });
  }

  setHandlers(handlers: typeof this.handlers) {
    this.handlers = handlers;
  }

  disconnect() {
    this.stopPresenceUpdates();
    if (this.ws) {
      this.updatePresence('offline');
      this.ws.close();
      this.ws = null;
    }
  }
}

export default CollaborationWebSocket;