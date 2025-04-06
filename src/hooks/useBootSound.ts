import { useEffect, useRef } from 'react';

interface BootSoundOptions {
  volume?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  baseFrequency?: number;
  overtoneFrequency?: number;
  duration?: number;
}

export function useBootSound({
  volume = 0.3,
  fadeInDuration = 1000,
  fadeOutDuration = 1000,
  baseFrequency = 120,
  overtoneFrequency = 123,
  duration = 4
}: BootSoundOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const isMounted = useRef(true);
  const hasStartedPlaying = useRef(false);

  const cleanup = () => {
    if (!isMounted.current) return;

    if (osc1Ref.current) {
      try {
        osc1Ref.current.stop();
      } catch (e) {}
      osc1Ref.current.disconnect();
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      try {
        osc2Ref.current.stop();
      } catch (e) {}
      osc2Ref.current.disconnect();
      osc2Ref.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  };

  const initAudioContext = async () => {
    // Only create AudioContext on user interaction
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.warn('Failed to initialize AudioContext:', error);
      }
    }
  };

  const playBootSound = async () => {
    if (!isMounted.current) return;
    if (hasStartedPlaying.current) return;

    try {
      // Initialize context on first play attempt
      if (!audioContextRef.current) {
        await initAudioContext();
      }

      const ctx = audioContextRef.current;
      if (!ctx) {
        console.warn('Audio Context not available');
        return;
      }

      cleanup();

      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
      gainNodeRef.current.gain.setValueAtTime(0, ctx.currentTime);

      osc1Ref.current = ctx.createOscillator();
      osc1Ref.current.type = 'sine';
      osc1Ref.current.frequency.setValueAtTime(baseFrequency, ctx.currentTime);
      osc1Ref.current.connect(gainNodeRef.current);

      osc2Ref.current = ctx.createOscillator();
      osc2Ref.current.type = 'sine';
      osc2Ref.current.frequency.setValueAtTime(overtoneFrequency, ctx.currentTime);
      osc2Ref.current.connect(gainNodeRef.current);

      const now = ctx.currentTime;
      gainNodeRef.current.gain.linearRampToValueAtTime(volume, now + fadeInDuration / 1000);
      gainNodeRef.current.gain.setValueAtTime(volume, now + duration - fadeOutDuration / 1000);
      gainNodeRef.current.gain.linearRampToValueAtTime(0, now + duration);

      osc1Ref.current.start();
      osc2Ref.current.start();

      osc1Ref.current.stop(now + duration);
      osc2Ref.current.stop(now + duration);

      hasStartedPlaying.current = true;

      // Auto-cleanup after sound completes
      setTimeout(() => {
        if (isMounted.current) {
          cleanup();
          hasStartedPlaying.current = false;
        }
      }, duration * 1000 + 100);
    } catch (error) {
      console.warn('Boot sound playback failed:', error);
      cleanup();
      hasStartedPlaying.current = false;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, []);

  return { playBootSound };
}