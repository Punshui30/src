import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Database, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { useBootSound } from '../hooks/useBootSound';

interface BootSequenceProps {
  onComplete: () => Promise<boolean>;
  skipEnabled?: boolean;
}

interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning';
}

const bootLogs: LogEntry[] = [
  { id: 1, message: 'Initializing System Core...', type: 'info' },
  { id: 2, message: 'Loading Adapter Registry...', type: 'info' },
  { id: 3, message: 'Establishing Neural Sync...', type: 'info' },
  { id: 4, message: 'Verifying Secure Gate Access...', type: 'info' },
  { id: 5, message: 'System Status: OPERATIONAL', type: 'success' }
];

export default function BootSequence({ onComplete, skipEnabled = true }: BootSequenceProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const { playBootSound } = useBootSound();

  const bootComplete = useRef(false);
  const userInteractedRef = useRef(false);

  const handleUserInteraction = () => {
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
      playBootSound().catch(console.warn);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  const withTimeout = (promise: Promise<any>, ms: number) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);

  const handleBootComplete = async () => {
    if (bootComplete.current) return;
    bootComplete.current = true;
    try {
      const success = await withTimeout(onComplete(), 5000);
      if (!success) {
        setError('Failed to initialize system. Please check server logs.');
      }
    } catch (err) {
      console.error('Boot failed:', err);
      setError('Failed to initialize system. Please check server logs.');
    }
  };

  useEffect(() => {
    let index = 0;
    let isCancelled = false;

    const step = async () => {
      if (isCancelled || index >= bootLogs.length) {
        await handleBootComplete();
        return;
      }

      const log = bootLogs[index];
      setLogs(prev => [...prev, log]);
      setProgress(((index + 1) / bootLogs.length) * 100);
      index++;

      setTimeout(step, 1500);
    };

    step();

    return () => {
      isCancelled = true;
    };
  }, [onComplete]);

  const handleSkip = async () => {
    if (!skipEnabled || bootComplete.current || isCompleting) return;
    setIsCompleting(true);
    await handleBootComplete();
    setIsCompleting(false);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg max-w-md">
          <h2 className="font-semibold mb-2">Boot Sequence Error</h2>
          <p className="text-sm">{error}</p>
          <div className="flex gap-2 mt-4">
            <Button variant="destructive" onClick={() => window.location.reload()}>
              Retry Boot
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      {/* Fullscreen Boot Video */}
      <video
        src="/boot.mp4"
        autoPlay
        muted
        playsInline
        loop
        className="absolute inset-0 w-full h-full object-contain z-0 bg-black"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-2xl w-full space-y-8 p-8 text-white"
      >
        {/* Boot Logs */}
        <div className="space-y-4">
          <div className="h-[200px] bg-black/70 border border-white/20 rounded-lg p-4 font-mono text-sm overflow-hidden backdrop-blur-sm">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 py-1"
              >
                <span className="text-primary/70">{log.message}</span>
              </motion.div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="relative h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0 bg-white/30"
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          </div>

          {/* Skip Button */}
          {skipEnabled && (
            <div className="absolute bottom-8 right-8">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isCompleting}
                className="text-white/50 hover:text-white transition-colors"
              >
                {isCompleting ? 'Starting...' : 'Skip Boot Sequence'}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export { BootSequence };
