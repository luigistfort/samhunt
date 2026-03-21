// src/components/ui/toaster.tsx
'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Simple global toast store (no external dep)
const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notify(listeners: Array<(t: Toast[]) => void>, t: Toast[]) {
  listeners.forEach(fn => fn(t));
}

export const toast = {
  success: (message: string) => {
    const t: Toast = { id: Math.random().toString(36), message, type: 'success' };
    toasts = [...toasts, t];
    notify(listeners, toasts);
    setTimeout(() => {
      toasts = toasts.filter(x => x.id !== t.id);
      notify(listeners, toasts);
    }, 4000);
  },
  error: (message: string) => {
    const t: Toast = { id: Math.random().toString(36), message, type: 'error' };
    toasts = [...toasts, t];
    notify(listeners, toasts);
    setTimeout(() => {
      toasts = toasts.filter(x => x.id !== t.id);
      notify(listeners, toasts);
    }, 5000);
  },
  info: (message: string) => {
    const t: Toast = { id: Math.random().toString(36), message, type: 'info' };
    toasts = [...toasts, t];
    notify(listeners, toasts);
    setTimeout(() => {
      toasts = toasts.filter(x => x.id !== t.id);
      notify(listeners, toasts);
    }, 3500);
  },
};

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const fn = (t: Toast[]) => setItems([...t]);
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-400" />,
    error: <XCircle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
  };

  const colors = {
    success: 'border-green-500/30 bg-green-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm fade-in',
            colors[item.type]
          )}
        >
          {icons[item.type]}
          <p className="text-sm text-zinc-200 flex-1">{item.message}</p>
          <button
            onClick={() => {
              toasts = toasts.filter(x => x.id !== item.id);
              notify(listeners, toasts);
            }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
