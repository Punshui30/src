import { useState } from 'react';
import { BootSequence } from './components/BootSequence';
import { AstralBackground } from './components/AstralBackground';
import { WindowManager } from './components/panels/WindowManager';
import { Taskbar } from './components/Taskbar';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen'; // ✅ NEW
import { ToastProvider } from './components/ui/toast';
import { useToast } from './components/ui/toast';
import { serverMonitor } from './lib/serverMonitor';
import { useWindowStore } from './lib/windowStore'; // ✅ For checking open windows

export default function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const { addToast } = useToast();
  const { windows } = useWindowStore(); // ✅ Access current open windows

  const handleBoot = async () => {
    try {
      setIsServerReady(true);
      setIsBooted(true);
      addToast('D.A.N. OS initialized successfully', 'success');
      return true;
    } catch (error) {
      console.error('Boot sequence failed:', error);
      addToast('Error connecting to backend. Please retry.', 'error');
      return false;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground antialiased">
        {!isBooted ? (
          <BootSequence onComplete={handleBoot} logoSrc="/splash.png" />
        ) : (
          <>
            <AstralBackground />
            <div className="flex">
              <Sidebar className="fixed left-0 top-0 h-screen z-20" />
              <main className="flex-1 ml-[240px] relative z-10">
                <WindowManager isInitialized={isBooted && isServerReady} />
                {windows.length === 0 && <HomeScreen />} {/* ✅ Show default screen */}
              </main>
            </div>
            <Taskbar />
          </>
        )}
      </div>
    </ToastProvider>
  );
}
