import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { 
  X, Download, Hexagon, Star, Activity, 
  Circle, Square, Triangle, Save, Wand2 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (logo: LogoConfig) => void;
}

interface LogoConfig {
  icon: string;
  text: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  fontWeight: number;
  letterSpacing: number;
  iconScale: number;
  textCase: 'uppercase' | 'lowercase' | 'capitalize';
}

const ICON_OPTIONS = [
  { id: 'hexagon', icon: Hexagon, label: 'Hexagon' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'biotech', icon: Activity, label: 'Biotech' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'square', icon: Square, label: 'Square' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' }
];

export function LogoEditor({ isOpen, onClose, onSave }: LogoEditorProps) {
  const [config, setConfig] = useState<LogoConfig>({
    icon: 'hexagon',
    text: 'A.R.G.O.S.',
    tagline: 'Adaptive Rosetta Gate Operating System',
    primaryColor: '#00FFD0',
    secondaryColor: '#0D0F1A',
    fontWeight: 700,
    letterSpacing: 0.05,
    iconScale: 1,
    textCase: 'uppercase'
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setPreviewScale(Math.min(width / 300, height / 200));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleExport = () => {
    if (!svgRef.current) return;

    // Create a clone of the SVG for export
    const clone = svgRef.current.cloneNode(true) as SVGElement;
    clone.setAttribute('width', '1200');
    clone.setAttribute('height', '800');

    // Convert to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);

    // Create download link
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dan-logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRandomize = () => {
    const randomIcon = ICON_OPTIONS[Math.floor(Math.random() * ICON_OPTIONS.length)].id;
    const randomPrimaryHue = Math.floor(Math.random() * 360);
    const randomSecondaryHue = (randomPrimaryHue + 180) % 360;

    setConfig({
      ...config,
      icon: randomIcon,
      primaryColor: `hsl(${randomPrimaryHue}, 100%, 50%)`,
      secondaryColor: `hsl(${randomSecondaryHue}, 80%, 20%)`,
      fontWeight: Math.floor(Math.random() * 300) + 500,
      letterSpacing: Math.random() * 0.2,
      iconScale: 0.8 + Math.random() * 0.4
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="relative w-full max-w-4xl rounded-lg border bg-card shadow-lg"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Logo Editor</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRandomize}
                >
                  <Wand2 className="w-4 h-4" />
                  Randomize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4" />
                  Export SVG
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-6">
              {/* Preview */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium">Preview</h3>
                <div className="aspect-video bg-accent/50 rounded-lg border flex items-center justify-center p-8">
                  <svg
                    ref={svgRef}
                    viewBox="0 0 300 200"
                    className="w-full h-full"
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <defs>
                      <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: config.primaryColor, stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: config.secondaryColor, stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    
                    <g transform={`translate(150, 100) scale(${config.iconScale})`}>
                      {ICON_OPTIONS.find(i => i.id === config.icon)?.icon({
                        size: 48,
                        className: "fill-current text-primary",
                        style: { fill: 'url(#iconGradient)' }
                      })}
                    </g>
                    
                    <text
                      x="150"
                      y="120"
                      textAnchor="middle"
                      style={{
                        fill: config.primaryColor,
                        fontFamily: 'Space Grotesk',
                        fontSize: '24px',
                        fontWeight: config.fontWeight,
                        letterSpacing: `${config.letterSpacing}em`,
                        textTransform: config.textCase
                      }}
                    >
                      {config.text}
                    </text>
                    
                    {config.tagline && (
                      <text
                        x="150"
                        y="145"
                        textAnchor="middle"
                        style={{
                          fill: config.secondaryColor,
                          fontFamily: 'Inter',
                          fontSize: '12px',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {config.tagline}
                      </text>
                    )}
                  </svg>
                </div>
              </div>

              {/* Controls */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-6 pr-4">
                  {/* Icon Selection */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Icon Style</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {ICON_OPTIONS.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setConfig({ ...config, icon: option.id })}
                          className={cn(
                            "p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors",
                            config.icon === option.id
                              ? "bg-accent border-primary"
                              : "hover:bg-accent/50"
                          )}
                        >
                          <option.icon className="w-6 h-6 text-primary" />
                          <span className="text-xs">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Controls */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Text</h3>
                    <input
                      type="text"
                      value={config.text}
                      onChange={e => setConfig({ ...config, text: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border bg-background/50"
                      placeholder="Enter logo text"
                    />
                  </div>

                  {/* Tagline */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Tagline</h3>
                    <input
                      type="text"
                      value={config.tagline}
                      onChange={e => setConfig({ ...config, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border bg-background/50"
                      placeholder="Enter tagline (optional)"
                    />
                  </div>

                  {/* Colors */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Colors</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Primary</label>
                        <input
                          type="color"
                          value={config.primaryColor}
                          onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
                          className="w-full h-10 rounded-md cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Secondary</label>
                        <input
                          type="color"
                          value={config.secondaryColor}
                          onChange={e => setConfig({ ...config, secondaryColor: e.target.value })}
                          className="w-full h-10 rounded-md cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Typography</h3>
                    
                    <div>
                      <label className="text-xs text-muted-foreground">Font Weight</label>
                      <input
                        type="range"
                        min="400"
                        max="900"
                        step="100"
                        value={config.fontWeight}
                        onChange={e => setConfig({ ...config, fontWeight: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Letter Spacing</label>
                      <input
                        type="range"
                        min="0"
                        max="0.2"
                        step="0.01"
                        value={config.letterSpacing}
                        onChange={e => setConfig({ ...config, letterSpacing: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Icon Scale</label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={config.iconScale}
                        onChange={e => setConfig({ ...config, iconScale: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Text Case</label>
                      <select
                        value={config.textCase}
                        onChange={e => setConfig({ ...config, textCase: e.target.value as LogoConfig['textCase'] })}
                        className="w-full px-3 py-2 rounded-md border bg-background/50 mt-1"
                      >
                        <option value="uppercase">Uppercase</option>
                        <option value="lowercase">Lowercase</option>
                        <option value="capitalize">Title Case</option>
                      </select>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 border-t">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => onSave(config)} className="gap-2">
                <Save className="w-4 h-4" />
                Save Logo
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}