import { useEffect } from 'react';
import { useWindowStore } from '../../lib/windowStore';
import CopilotPanel from '../CopilotPanel';
import AdaptersManager from '../AdaptersManager';
import Flow3DWindow from '../Flow3DWindow';
import { FlowEditorWindow } from '../FlowEditorWindow';
import { GateInWindow } from '../GateInWindow'; // ✅ FIXED: use named import

interface WindowManagerProps {
  isInitialized: boolean;
}

export function WindowManager({ isInitialized }: WindowManagerProps) {
  const {
    windows,
    minimizeWindow,
    maximizeWindow,
    removeWindow,
    setActiveWindow,
  } = useWindowStore();

  useEffect(() => {
    console.log('WindowManager: Current windows state', windows);
  }, [windows]);

  if (!isInitialized) return null;

  return (
    <>
      {windows.map((window) => {
        if (!window.isOpen || window.isMinimized) return null;

        const sharedProps = {
          key: window.id,
          isOpen: window.isOpen,
          isFocused: window.id === windows.at(-1)?.id,
          position: window.position,
          onClose: () => removeWindow(window.id),
          onMinimize: () => minimizeWindow(window.id),
          onMaximize: () => maximizeWindow(window.id),
          onBlur: () => setActiveWindow(window.id),
        };

        switch (window.type) {
          case 'copilot':
            return <CopilotPanel {...sharedProps} />;
          case 'adapters':
            return <AdaptersManager {...sharedProps} />;
          case 'flow3d':
            return <Flow3DWindow {...sharedProps} animationMode="none" />;
          case 'flow':
            return (
              <FlowEditorWindow
                {...sharedProps}
                data={window.data}
                allowNodeEditing={true}
                allowEdgeEditing={true}
                enableDslActions={true}
              />
            );
          case 'gateIn':
            return (
              <GateInWindow
                {...sharedProps}
                data={window.data}
                enableOAuth={true}
                enableHandshake={true}
                allowToolConfig={true}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
