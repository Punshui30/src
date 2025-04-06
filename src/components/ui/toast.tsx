import * as React from "react";
import { createContext, useContext, useState } from "react";

// Toast component
export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-full duration-300 ${
            toast.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500" 
              : toast.type === "error" 
                ? "bg-red-500/10 border-red-500/40 text-red-500" 
                : "bg-primary/10 border-primary/40 text-primary"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

// Context setup
const ToastContext = createContext<{
  addToast: (message: string, type: "success" | "error" | "info") => void;
  toasts: Array<{
    id: number;
    message: string;
    type: "success" | "error" | "info";
  }>;
}>({
  addToast: () => {},
  toasts: []
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{
    id: number;
    message: string;
    type: "success" | "error" | "info";
  }>>([]);

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const newToast = {
      id: Date.now(),
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ addToast, toasts }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

// Hook export
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
