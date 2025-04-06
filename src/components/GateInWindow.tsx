import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { useToast } from './ui/toast';
import { Loader2, ShieldCheck, ExternalLink } from 'lucide-react';

interface GateInWindowProps {
  isOpen: boolean;
  isFocused?: boolean;
  position?: { x: number; y: number };
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBlur?: () => void;
  data: {
    target: string;
  };
  enableOAuth?: boolean;
  enableHandshake?: boolean;
  allowToolConfig?: boolean;
}

export function GateInWindow({
  isOpen,
  isFocused = false,
  position = { x: 120, y: 120 },
  onClose,
  onMinimize,
  onMaximize,
  onBlur,
  data,
  enableOAuth = true,
  enableHandshake = true,
  allowToolConfig = true
}: GateInWindowProps) {
  const [step, setStep] = useState<'idle' | 'authenticating' | 'connected'>('idle');
  const [config, setConfig] = useState({ apiKey: '', webhookUrl: '' });
  const { addToast } = useToast();

  useEffect(() => {
    if (!data?.target) return;
    console.log(`Gate In initialized for ${data.target}`);
  }, [data]);

  const handleOAuth = async () => {
    try {
      setStep('authenticating');

      const authWindow = window.open(
        `/auth/${data.target.toLowerCase()}`,
        '_blank',
        'width=500,height=600'
      );

      const checkInterval = setInterval(() => {
        try {
          const success = authWindow?.location.href.includes('callback');
          if (success) {
            clearInterval(checkInterval);
            authWindow?.close();
            setStep('connected');
            addToast(`${data.target} successfully gated in.`, 'success');
          }
        } catch (err) {
          // Cross-origin block until redirected to same origin
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      addToast(`Failed to authenticate with ${data.target}`, 'error');
      setStep('idle');
    }
  };

  const handleConfigSave = async () => {
    try {
      const res = await fetch(`/api/tools/${data.target.toLowerCase()}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!res.ok) throw new Error('Config save failed');
      addToast('Configuration saved', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to save configuration', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'w-full h-full rounded-lg overflow-hidden backdrop-blur bg-card/90 border',
        isFocused ? 'border-primary' : 'border-border'
      )}
      onBlur={onBlur}
    >
      <div className="window-header flex items-center justify-between p-2 bg-muted/50 border-b cursor-move">
        <div className="flex items-center gap-2 px-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Gate In</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
            {data.target}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
            –
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMaximize}>
            ◻
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {enableOAuth && (
          <div>
            <h2 className="text-sm font-semibold mb-1">OAuth Authentication</h2>
            <Button
              variant="outline"
              onClick={handleOAuth}
              className="gap-2 text-sm"
              disabled={step !== 'idle'}
            >
              {step === 'authenticating' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {step === 'connected'
                ? `${data.target} Connected`
                : `Authenticate ${data.target}`}
            </Button>
          </div>
        )}

        {enableHandshake && (
          <div>
            <h2 className="text-sm font-semibold mb-1">Handshake Info</h2>
            <p className="text-xs text-muted-foreground">
              Once authenticated, the system will establish a secure API connection with the external tool.
            </p>
          </div>
        )}

        {allowToolConfig && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Tool Configuration</h2>
            <Input
              placeholder="API Key"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            />
            <Input
              placeholder="Webhook URL"
              value={config.webhookUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
            />
            <Button onClick={handleConfigSave} size="sm">
              Save Configuration
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
