import { useEffect, useState } from 'react';
import { Sparkles, History, Bot, PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { sendToCopilot } from '../../lib/api';
import { useToast } from '../ui/toast';

export default function NewPairOfGlasses() {
  const LOCAL_KEY = 'dan_context_log';

  const { addToast } = useToast();
  const [log, setLog] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 🔁 Load persisted log
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
      setLog(JSON.parse(stored));
    } else {
      setLog([
        "D.A.N. loaded Gate: Zapier Connector",
        "Adapter added: /gpt-schema-transform",
        "User initiated custom snippet injection"
      ]);
    }
  }, []);

  // 💾 Save log to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(log));
  }, [log]);

  const handleAddNote = () => {
    if (!note.trim()) return;
    setLog((prev) => [...prev, `📝 ${note.trim()}`]);
    setNote('');
    addToast('Checkpoint added to memory', 'success');
  };

  const handleRefocus = async () => {
    setRefreshing(true);
    const contextSummary = log.slice(-5).join('\n');
    try {
      const response = await sendToCopilot(
        `🕶️ You've been handed a new pair of glasses.\n\nPlease reassess the situation using this summary:\n${contextSummary}\n\nSuggest a new direction if needed.`
      );

      setLog((prev) => [...prev, `🕶️ D.A.N. recalibrated: ${response.slice(0, 100)}...`]);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(log));
      addToast('🕶️ D.A.N. is recalibrating perspective...', 'success');

      // 🧠 Pass message into CopilotPanel next (coming in Part 2)
      window.dispatchEvent(
        new CustomEvent('dan-refocus', { detail: response })
      );
    } catch (err) {
      console.error('Refocus failed:', err);
      addToast('Failed to reset focus', 'error');
    }
    setRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold">
        <History className="w-5 h-5" />
        Context Checkpoints
      </div>

      <ul className="text-sm bg-card/30 p-3 rounded-md border border-border backdrop-blur max-h-48 overflow-y-auto">
        {log.map((entry, i) => (
          <li key={i} className="mb-1">• {entry}</li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 px-3 py-1 rounded-md border border-muted bg-background text-foreground text-sm"
          placeholder="Add your own checkpoint"
        />
        <Button onClick={handleAddNote} variant="secondary">
          <PlusCircle className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Button variant="default" onClick={handleRefocus} disabled={refreshing}>
          <Sparkles className="w-4 h-4 mr-2" />
          {refreshing ? 'Refocusing...' : 'New Pair of Glasses'}
        </Button>
      </div>
    </div>
  );
}
