import { Sparkles, Box, Settings2, RefreshCcw } from 'lucide-react'; // ✅ all icons safe
import { useWindowStore } from '../lib/windowStore';
import { cn } from '../lib/utils';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { addWindow } = useWindowStore();

  return (
    <aside className={cn("w-60 bg-background/90 text-white p-4 space-y-4 border-r border-border", className)}>
      <button
        onClick={() =>
          addWindow({
            id: `copilot-${Date.now()}`,
            type: 'copilot',
            title: 'D.A.N.',
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: { x: 120, y: 100 },
            size: { width: 680, height: 540 }
          })
        }
        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-accent/30 transition-colors text-left w-full"
      >
        <Sparkles size={16} />
        <span>D.A.N.</span>
      </button>

      <button
        onClick={() =>
          addWindow({
            id: `adapters-${Date.now()}`,
            type: 'adapters',
            title: 'Adapter Manager',
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: { x: 180, y: 160 },
            size: { width: 900, height: 600 }
          })
        }
        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-accent/30 transition-colors text-left w-full"
      >
        <Box size={16} />
        <span>Adapter Manager</span>
      </button>

      <button
        onClick={() =>
          addWindow({
            id: `flow3d-${Date.now()}`,
            type: 'flow3d',
            title: '3D Flow',
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: { x: 240, y: 180 },
            size: { width: 1000, height: 700 }
          })
        }
        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-accent/30 transition-colors text-left w-full"
      >
        <Settings2 size={16} /> {/* ✅ Swapped Cube for Settings2 */}
        <span>3D Flow</span>
      </button>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-accent/30 transition-colors text-left w-full"
      >
        <RefreshCcw size={16} />
        <span>Reset Context</span>
      </button>
    </aside>
  );
}
