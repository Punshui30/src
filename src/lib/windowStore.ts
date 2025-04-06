import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface SnapGuide {
  type: 'edge' | 'grid';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Window {
  id: string;
  type: string;
  title: string;
  icon?: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: WindowPosition;
  size: WindowSize;
  zIndex?: number;
  lastFocused?: number;
  velocity?: WindowPosition;
  isDragging?: boolean;
  snapGuides?: SnapGuide[];
  snapGuides?: SnapGuide[];
  data?: any;
}

export interface PhysicsConfig {
  mass: number;
  friction: number;
  elasticity: number;
  snapStrength: number;
  maxVelocity: number;
}

interface WindowState {
  windows: Window[];
  activeWindowId: string | null;
  maxZIndex: number;
  gridSize: number;
  snapThreshold: number;
  isGridEnabled: boolean;
  isSnapEnabled: boolean;
  windowSpacing: number;
  cascadeOffset: number;
  physics: PhysicsConfig;
  updateWindowPosition: (id: string, position: WindowPosition, velocity?: WindowPosition) => void;
  startDragging: (id: string) => void;
  stopDragging: (id: string) => void;
  applyPhysics: (id: string) => void;
  setPhysicsConfig: (config: Partial<PhysicsConfig>) => void;
  addWindow: (window: Window) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<Window>) => void;
  setActiveWindow: (id: string | null) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  constrainToBounds: (id: string, bounds: { width: number; height: number }) => void;
  setGridSize: (size: number) => void;
  setSnapThreshold: (threshold: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  calculateSnapGuides: (id: string, position: WindowPosition, bounds: { width: number; height: number }) => SnapGuide[];
  snapToGuides: (id: string, guides: SnapGuide[]) => void;
  clearWindows: () => void;
}

export const useWindowStore = create<WindowState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindowId: null,
      maxZIndex: 0,
      gridSize: 8,
      snapThreshold: 20,
      isGridEnabled: true,
      isSnapEnabled: true,
      windowSpacing: 20,
      cascadeOffset: 30,
      physics: {
        mass: 1,
        friction: 0.95,
        elasticity: 0.5,
        snapStrength: 0.3,
        maxVelocity: 1000
      },

      updateWindowPosition: (id, position, velocity) => set((state) => {
        const window = state.windows.find(w => w.id === id);
        if (!window) return state;

        // Calculate snap guides if snapping is enabled
        let finalPosition = { ...position };
        if (state.isSnapEnabled && !velocity) {
          const guides = state.calculateSnapGuides(id, position, {
            width: window.size.width,
            height: window.size.height
          });

          guides.forEach(guide => {
            if (guide.x !== undefined) {
              const distance = Math.abs(position.x - guide.x);
              if (distance < state.snapThreshold) {
                finalPosition.x = guide.x;
              }
            }
            if (guide.y !== undefined) {
              const distance = Math.abs(position.y - guide.y);
              if (distance < state.snapThreshold) {
                finalPosition.y = guide.y;
              }
            }
          });
        }

        return {
          windows: state.windows.map(w =>
            w.id === id ? {
              ...w,
              position: finalPosition,
              velocity: velocity || w.velocity,
              snapGuides: state.isSnapEnabled ? state.calculateSnapGuides(id, finalPosition, {
                width: w.size.width,
                height: w.size.height
              }) : undefined
            } : w
          )
        };
      }),

      startDragging: (id) => set((state) => ({
        windows: state.windows.map(w =>
          w.id === id ? { ...w, isDragging: true, velocity: { x: 0, y: 0 } } : w
        )
      })),

      stopDragging: (id) => set((state) => ({
        windows: state.windows.map(w =>
          w.id === id ? { ...w, isDragging: false } : w
        )
      })),

      applyPhysics: (id) => set((state) => {
        const window = state.windows.find(w => w.id === id);
        if (!window?.velocity || window.isDragging) return state;

        const { friction, maxVelocity } = state.physics;

        // Apply friction
        const newVelocity = {
          x: window.velocity.x * friction,
          y: window.velocity.y * friction
        };

        // Stop if velocity is very small
        if (Math.abs(newVelocity.x) < 0.1 && Math.abs(newVelocity.y) < 0.1) {
          return {
            windows: state.windows.map(w =>
              w.id === id ? { ...w, velocity: undefined } : w
            )
          };
        }

        // Calculate new position
        const newPosition = {
          x: window.position.x + newVelocity.x,
          y: window.position.y + newVelocity.y
        };

        return {
          windows: state.windows.map(w =>
            w.id === id ? {
              ...w,
              position: newPosition,
              velocity: newVelocity
            } : w
          )
        };
      }),

      setPhysicsConfig: (config) => set((state) => ({
        physics: { ...state.physics, ...config }
      })),

      addWindow: (window) => set((state) => {
        // Check if window with this id already exists
        const existingWindowIndex = state.windows.findIndex(w => w.id === window.id);
        
        // If window exists, just restore and bring it to front rather than creating a new one
        if (existingWindowIndex !== -1) {
          const maxZIndex = Math.max(state.maxZIndex, ...state.windows.map(w => w.zIndex || 0));
          
          return {
            windows: state.windows.map((w, index) => 
              index === existingWindowIndex 
                ? { ...w, isOpen: true, isMinimized: false, zIndex: maxZIndex + 1, lastFocused: Date.now() } 
                : w
            ),
            activeWindowId: window.id,
            maxZIndex: maxZIndex + 1
          };
        }
        
        // Otherwise create new window
        const maxZIndex = Math.max(state.maxZIndex, ...state.windows.map(w => w.zIndex || 0));

        const visibleWindows = state.windows.filter(w => w.isOpen && !w.isMinimized);
        const cascadePosition = {
          x: state.cascadeOffset * (visibleWindows.length % 5),
          y: state.cascadeOffset * (visibleWindows.length % 5)
        };

        const position = window.position || {
          x: Math.min(cascadePosition.x + state.windowSpacing, window.size.width),
          y: Math.min(cascadePosition.y + state.windowSpacing, window.size.height)
        };

        return {
          windows: [...state.windows, { 
            ...window, 
            isOpen: true,
            position,
            zIndex: maxZIndex + 1,
            lastFocused: Date.now()
          }],
          activeWindowId: window.id,
          maxZIndex: maxZIndex + 1
        };
      }),

      removeWindow: (id) => set((state) => ({
        windows: state.windows.filter(w => w.id !== id),
        activeWindowId: state.activeWindowId === id ? null : state.activeWindowId
      })),

      updateWindow: (id, updates) => set((state) => ({
        windows: state.windows.map(window =>
          window.id === id ? { ...window, ...updates } : window
        )
      })),

      setActiveWindow: (id) => set((state) => {
        if (!id) return { activeWindowId: null };
        const window = state.windows.find(w => w.id === id);
        if (!window) return state;
        return {
          activeWindowId: id,
          windows: state.windows.map(w => ({
            ...w,
            lastFocused: w.id === id ? Date.now() : w.lastFocused
          }))
        };
      }),

      minimizeWindow: (id) => set((state) => ({
        windows: state.windows.map(window =>
          window.id === id ? { 
            ...window, 
            isMinimized: true, 
            isMaximized: false,
            lastFocused: Date.now()
          } : window
        ),
        activeWindowId: state.activeWindowId === id ? null : state.activeWindowId
      })),

      maximizeWindow: (id) => set((state) => ({
        windows: state.windows.map(window =>
          window.id === id ? { 
            ...window, 
            isMaximized: true, 
            isMinimized: false,
            lastFocused: Date.now()
          } : window
        ),
        activeWindowId: id
      })),

      restoreWindow: (id) => set((state) => ({
        windows: state.windows.map(window =>
          window.id === id ? { 
            ...window, 
            isMaximized: false, 
            isMinimized: false,
            lastFocused: Date.now()
          } : window
        ),
        activeWindowId: id
      })),

      bringToFront: (id) => set((state) => {
        const maxZIndex = Math.max(state.maxZIndex, ...state.windows.map(w => w.zIndex || 0));
        return {
          windows: state.windows.map(window =>
            window.id === id ? { 
              ...window, 
              zIndex: maxZIndex + 1,
              lastFocused: Date.now()
            } : window
          ),
          activeWindowId: id,
          maxZIndex: maxZIndex + 1
        };
      }),

      constrainToBounds: (id, bounds) => set((state) => {
        const window = state.windows.find(w => w.id === id);
        if (!window) return state;
        
        // If window is completely outside bounds, reset to center
        let x = window.position.x;
        let y = window.position.y;
        
        if (x < -window.size.width || x > bounds.width || 
            y < -window.size.height || y > bounds.height) {
          x = (bounds.width - window.size.width) / 2;
          y = (bounds.height - window.size.height) / 2;
        } else {
          // Otherwise just constrain to bounds
          x = Math.max(0, Math.min(x, bounds.width - window.size.width));
          y = Math.max(0, Math.min(y, bounds.height - window.size.height));
        }

        return {
          windows: state.windows.map(w =>
            w.id === id ? { ...w, position: { x, y } } : w
          )
        };
      }),

      setGridSize: (size) => set({ gridSize: size }),
      setSnapThreshold: (threshold) => set({ snapThreshold: threshold }),
      toggleGrid: () => set((state) => ({ isGridEnabled: !state.isGridEnabled })),
      toggleSnap: () => set((state) => ({ isSnapEnabled: !state.isSnapEnabled })),

      calculateSnapGuides: (id, position, bounds) => {
        const state = get();
        const guides: SnapGuide[] = [];
        const window = state.windows.find(w => w.id === id);
        if (!window) return guides;

        if (state.isGridEnabled) {
          const gridX = Math.round(position.x / state.gridSize) * state.gridSize;
          const gridY = Math.round(position.y / state.gridSize) * state.gridSize;

          if (Math.abs(position.x - gridX) < state.snapThreshold) {
            guides.push({ type: 'grid', x: gridX });
          }
          if (Math.abs(position.y - gridY) < state.snapThreshold) {
            guides.push({ type: 'grid', y: gridY });
          }
        }

        if (state.isSnapEnabled) {
          if (position.x < state.snapThreshold) {
            guides.push({ type: 'edge', x: state.windowSpacing });
          }
          if (position.x + window.size.width > bounds.width - state.snapThreshold) {
            guides.push({ type: 'edge', x: bounds.width - window.size.width - state.windowSpacing });
          }
          if (position.y < state.snapThreshold) {
            guides.push({ type: 'edge', y: state.windowSpacing });
          }

          state.windows
            .filter(w => w.id !== id && !w.isMinimized)
            .forEach(other => {
              const snapPoints = [
                { x: other.position.x - window.size.width - state.windowSpacing },
                { x: other.position.x + other.size.width + state.windowSpacing },
                { y: other.position.y - window.size.height - state.windowSpacing },
                { y: other.position.y + other.size.height + state.windowSpacing }
              ];

              snapPoints.forEach(point => {
                if (point.x !== undefined && Math.abs(position.x - point.x) < state.snapThreshold) {
                  guides.push({ type: 'edge', x: point.x });
                }
                if (point.y !== undefined && Math.abs(position.y - point.y) < state.snapThreshold) {
                  guides.push({ type: 'edge', y: point.y });
                }
              });
            });
        }

        return guides;
      },

      snapToGuides: (id, guides) => set((state) => {
        const window = state.windows.find(w => w.id === id);
        if (!window) return state;

        const position = { ...window.position };

        guides.forEach(guide => {
          if (guide.x !== undefined) position.x = guide.x;
          if (guide.y !== undefined) position.y = guide.y;
        });

        return {
          windows: state.windows.map(w =>
            w.id === id ? { ...w, position, snapGuides: guides } : w
          )
        };
      }),

      clearWindows: () => set({ windows: [] })
    }),
    {
      name: 'window-storage',
      partialize: (state) => ({
        ...state,
        windows: []
      })
    }
  )
);