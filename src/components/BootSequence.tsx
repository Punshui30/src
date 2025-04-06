import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Database, Zap, Shield, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useBootSound } from '../hooks/useBootSound';

interface BootSequenceProps {
  onComplete: () => Promise<boolean>;
  skipEnabled?: boolean;
  logoSrc?: string;
}

interface LogEntry {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning';
  icon?: typeof Cpu;
}

const bootLogs: LogEntry[] = [
  { id: 1, message: 'Initializing System Core...', type: 'info', icon: Cpu },
  { id: 2, message: 'Loading Adapter Registry...', type: 'info', icon: Database },
  { id: 3, message: 'Establishing Neural Sync...', type: 'info', icon: Zap },
  { id: 4, message: 'Verifying Secure Gate Access...', type: 'info', icon: Shield },
  { id: 5, message: 'System Status: OPERATIONAL', type: 'success', icon: CheckCircle2 }
];

export default function BootSequence({
  onComplete,
  skipEnabled = true,
  logoSrc
}: BootSequenceProps) {
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

  useEffect(() => {
    let index = 0;
    let isCancelled = false;

    const step = async () => {
      if (isCancelled || index >= bootLogs.length) {
        if (!bootComplete.current) {
          try {
            const success = await withTimeout(onComplete(), 5000);
            bootComplete.current = success;
            if (!success) {
              setError('Failed to initialize system. Please check server logs.');
            }
          } catch (err) {
            console.error('Boot failed:', err);
            setError('Failed to initialize system. Please check server logs.');
          }
        }
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
    try {
      const success = await withTimeout(onComplete(), 5000);
      bootComplete.current = success;
      if (!success) {
        setError('Failed to initialize system. Please check server logs.');
      }
    } catch (error) {
      console.error('Boot completion failed:', error);
      setError('Failed to initialize system. Please check server logs.');
    }
    setIsCompleting(false);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg max-w-md">
          <h2 className="font-semibold mb-2">Boot Sequence Error</h2>
          <p className="text-sm">{error}</p>
          <div className="flex gap-2 mt-20">
            <Button variant="destructive" onClick={() => window.location.reload()}>
              Retry Boot
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full flex items-center justify-center relative overflow-hidden"
      >
        {/* Background visuals */}
        <div className="absolute inset-0 bg-background overflow-hidden">
          <div className="absolute inset-0" style={{
            background: `radial-gradient(circle at 50% 50%, rgba(0, 255, 208, 0.1) 0%, rgba(0, 255, 208, 0.05) 25%, rgba(0, 255, 208, 0) 50%)`
          }} />
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-primary/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: 0
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: [0, 1, 0],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 2
              }}
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                filter: 'blur(40px)'
              }}
            />
          ))}
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 max-w-2xl w-full space-y-8 p-8">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-card/30 border-2 border-primary/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
              {logoSrc ? (
                <motion.img
                  src={logoSrc}
                  alt="OS Logo"
                  className="w-24 h-24 object-contain mix-blend-screen"
                  initial={{ scale: 0.8, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              ) : (
                <Sparkles className="w-16 h-16 text-primary" />
              )}
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              A.R.G.O.S.
            </h1>
            <p className="text-xl text-primary/70 font-medium tracking-wide">
              Adaptive Rosetta Gate Operating System
            </p>
          </div>

          {/* Boot Logs */}
          <div className="space-y-4">
            <div className="h-[200px] bg-card/30 border border-primary/20 rounded-lg p-4 font-mono text-sm overflow-hidden backdrop-blur-sm">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 py-2"
                >
                  {log.icon && (
                    <log.icon
                      className={cn(
                        "w-4 h-4",
                        log.type === 'success' ? "text-emerald-500" : "text-primary"
                      )}
                    />
                  )}
                  <span className={cn(
                    log.type === 'success' && 'text-emerald-500',
                    log.type === 'warning' && 'text-yellow-500'
                  )}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/50"
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            </div>
          </div>

          {/* Skip Button */}
          {skipEnabled && (
            <div className="absolute bottom-8 right-8">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isCompleting}
                className="text-primary/50 hover:text-primary transition-colors"
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
