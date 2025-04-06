import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LogoConfig {
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

interface LogoState {
  currentLogo: LogoConfig;
  savedVariants: LogoConfig[];
  updateLogo: (config: LogoConfig) => void;
  saveVariant: (config: LogoConfig) => void;
  deleteVariant: (index: number) => void;
}

export const useLogoStore = create<LogoState>()(
  persist(
    (set) => ({
      currentLogo: {
        icon: 'hexagon',
        text: 'A.R.G.O.S.',
        tagline: 'Adaptive Rosetta Gate Operating System',
        primaryColor: '#00FFD0',
        secondaryColor: '#0D0F1A',
        fontWeight: 700,
        letterSpacing: 0.05,
        iconScale: 1,
        textCase: 'uppercase'
      },
      savedVariants: [],
      
      updateLogo: (config) => set({ currentLogo: config }),
      
      saveVariant: (config) => set((state) => ({
        savedVariants: [...state.savedVariants, config]
      })),
      
      deleteVariant: (index) => set((state) => ({
        savedVariants: state.savedVariants.filter((_, i) => i !== index)
      }))
    }),
    {
      name: 'logo-storage'
    }
  )
);