import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowStore } from '../lib/windowStore';
import {
  Terminal, Package, Database, Code, GitBranch, Box, FileJson, ScrollText,
  Maximize2, Minus, X, Sparkles, Bot, Shield, AlertTriangle, Users
} from 'lucide-react';
import { TemplateLibrary } from './TemplateLibrary';
import { AdapterRegistry } from './AdapterRegistry';
import { AdaptersManager } from './AdaptersManager';
import { FlowWindow } from './FlowWindow';
import { Flow3DWindow } from './Flow3DWindow';
import { GateIn } from './GateIn';
import { GateOut } from './GateOut';
import { DSLEditor } from './DSLEditor';
import { GateLogs } from './GateLogs';
import { SecurityDashboard } from './SecurityDashboard';
import { SystemAlertsPanel } from './SystemAlertsPanel';
import { AgentTeamDashboard } from './AgentTeamDashboard';
import CopilotPanel from './CopilotPanel';
import { cn } from '../lib/utils';
import ErrorBoundary from './ErrorBoundary'; // ✅ FIXED: use default import

const WINDOW_ICONS = {
  terminal: Terminal,
  templates: Package,
  adapters: Database,
  gatePlayground: Code,
  flow: GitBranch,
  flow3D: Box,
  dslEditor: FileJson,
  gateLogs: ScrollText,
  copilot: Sparkles,
  autopilot: Bot,
  scout: Sparkles,
  teams: Users,
  security: Shield,
  alerts: AlertTriangle,
  agents: Bot
};

declare global {
  interface Window {
    adapterFlow?: {
      sourceCode: string;
      transcodedCode: string;
      dslOutput: string;
      setSourceCode: (code: string) => void;
      setTranscodedCode: (code: string) => void;
      setDslOutput: (dsl: string) => void;
    };
  }
}

interface WindowManagerProps {
  isInitialized: boolean;
}

function WindowManager({ isInitialized }: WindowManagerProps) {
  const {
    windows,
    removeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    bringToFront,
    activeWindowId,
    updateWindowPosition,
    startDragging,
    stopDragging,
    applyPhysics,
    constrainToBounds
  } = useWindowStore();

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const updatePhysics = () => {
      windows.forEach(window => {
        if (window.velocity && containerRef.current) {
          applyPhysics(window.id);
          constrainToBounds(window.id, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
          });
        }
      });
      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [windows, applyPhysics]);

  const handleMouseDown = useCallback((event: React.MouseEvent, window: Window) => {
    if (!(event.target instanceof HTMLElement) ||
      !event.target.closest('.window-header') ||
      event.target.closest('.window-button')) {
      return;
    }

    event.preventDefault();
    bringToFront(window.id);
    startDragging(window.id);

    dragStartPos.current = {
      x: event.clientX - window.position.x,
      y: event.clientY - window.position.y
    };

    lastMousePos.current = {
      x: event.clientX,
      y: event.clientY
    };
  }, [bringToFront, startDragging]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const draggedWindow = windows.find(w => w.isDragging);
    if (!draggedWindow || !dragStartPos.current || !lastMousePos.current || !containerRef.current) return;

    const newPosition = {
      x: event.clientX - dragStartPos.current.x,
      y: event.clientY - dragStartPos.current.y
    };

    const bounds = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    };

    const constrainedPosition = {
      x: Math.max(0, Math.min(newPosition.x, bounds.width - draggedWindow.size.width)),
      y: Math.max(0, Math.min(newPosition.y, bounds.height - draggedWindow.size.height))
    };

    const velocity = {
      x: event.clientX - lastMousePos.current.x,
      y: event.clientY - lastMousePos.current.y
    };

    updateWindowPosition(draggedWindow.id, constrainedPosition, velocity);
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  }, [windows, updateWindowPosition]);

  const handleMouseUp = useCallback(() => {
    const draggedWindow = windows.find(w => w.isDragging);
    if (draggedWindow) {
      stopDragging(draggedWindow.id);
    }
    dragStartPos.current = null;
    lastMousePos.current = null;
  }, [windows, stopDragging]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    console.log('WindowManager: Current windows state', windows);
  }, [windows]);

  const handleMinimize = (id: string) => {
    console.log('WindowManager: minimizing window', id);
    minimizeWindow(id);
  };

  const handleMaximize = (id: string) => {
    console.log('WindowManager: maximizing window', id);
    maximizeWindow(id);
  };

  const handleRestore = (id: string) => restoreWindow(id);
  const handleClose = (id: string) => {
    console.log('WindowManager: closing window', id);
    removeWindow(id);
  };

  if (!isInitialized) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <AnimatePresence>
        {windows.map((window) => {
          if (!window.isOpen || window.isMinimized) return null;

          const windowStyle = {
            top: window.isMaximized ? 0 : window.position.y,
            left: window.isMaximized ? 0 : window.position.x,
            width: window.isMaximized ? '100%' : `${window.size.width}px`,
            height: window.isMaximized ? '100%' : `${window.size.height}px`,
            zIndex: window.zIndex || 10,
          };

          let windowComponent = null;
          const commonProps = {
            isOpen: true,
            onClose: () => handleClose(window.id),
            onMinimize: () => handleMinimize(window.id),
            onMaximize: () => handleMaximize(window.id),
            onBlur: () => bringToFront(window.id),
            isFocused: window.id === activeWindowId,
            position: window.position,
            data: window.data
          };

          switch (window.type) {
            case 'templates':
              windowComponent = <TemplateLibrary {...commonProps} onUseTemplate={() => {}} />;
              break;
            case 'adapters':
              windowComponent = <AdaptersManager {...commonProps} />;
              break;
            case 'flow':
              windowComponent = <FlowWindow {...commonProps} />;
              break;
            case 'flow3D':
              windowComponent = <Flow3DWindow {...commonProps} />;
              break;
            case 'gateIn':
              windowComponent = <GateIn {...commonProps} />;
              break;
            case 'gateOut':
              windowComponent = <GateOut {...commonProps} />;
              break;
            case 'dslEditor':
              windowComponent = <DSLEditor {...commonProps} />;
              break;
            case 'gateLogs':
              windowComponent = <GateLogs {...commonProps} />;
              break;
            case 'copilot':
              windowComponent = <CopilotPanel {...commonProps} messages={window.data?.messages || []} onSendMessage={window.data?.onSendMessage} />;
              break;
            case 'autopilot':
              windowComponent = <AgentDashboard {...commonProps} />;
              break;
            case 'scout':
              windowComponent = <SystemAlertsPanel {...commonProps} />;
              break;
            case 'teams':
              windowComponent = <AgentTeamDashboard {...commonProps} />;
              break;
            case 'security':
              windowComponent = <SecurityDashboard {...commonProps} />;
              break;
            case 'alerts':
              windowComponent = <SystemAlertsPanel {...commonProps} />;
              break;
            case 'agents':
              windowComponent = <AgentDashboard {...commonProps} />;
              break;
            default:
              console.warn(`No component found for window type: ${window.type}`);
          }

          if (!windowComponent) return null;

          return (
            <motion.div
              key={window.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute pointer-events-auto border rounded-lg overflow-hidden shadow-lg",
                window.id === activeWindowId ? "border-primary/50" : "border-border"
              )}
              style={windowStyle}
              onMouseDown={(e) => handleMouseDown(e, window)}
            >
              <ErrorBoundary>
                {windowComponent}
              </ErrorBoundary>
              {window.isDragging && window.snapGuides?.map((guide, i) => (
                <div
                  key={i}
                  className="absolute bg-primary/30"
                  style={{
                    left: guide.x !== undefined ? guide.x : 0,
                    top: guide.y !== undefined ? guide.y : 0,
                    width: guide.x !== undefined ? '2px' : '100%',
                    height: guide.y !== undefined ? '2px' : '100%',
                    pointerEvents: 'none'
                  }}
                />
              ))}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export { WindowManager };
