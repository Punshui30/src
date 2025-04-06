import { WindowManager } from './components/WindowManager';
import { Taskbar } from './components/Taskbar';
import { AstralBackground } from './components/AstralBackground';
import { BootSequence } from './components/BootSequence';
import { useState } from 'react';
import { ToastProvider } from './components/ui/toast';
import Sidebar from './components/Sidebar';
import { serverMonitor } from './lib/serverMonitor';
import { useToast } from './components/ui/toast';

export default function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const { addToast } = useToast();

  const handleBoot = async () => {
    try {
      setIsServerReady(true);
      setIsBooted(true);
      addToast('System initialized successfully', 'success');
      return true;
    } catch (error) {
      console.error('Failed to start server during boot:', error);
      setIsServerReady(false);
      addToast('Server connection error. Please check if the server is running.', 'error');
      return false;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground antialiased">
        {!isBooted ? (
          <BootSequence onComplete={handleBoot} />
        ) : (
          <>
            <AstralBackground />
            <div className="flex">
              <Sidebar className="fixed left-0 top-0 h-screen" />
              <main className="flex-1 ml-[240px]">
                <WindowManager isInitialized={isBooted && isServerReady} />
              </main>
            </div>
            <Taskbar />
          </>
        )}
      </div>
    </ToastProvider>
  );
}