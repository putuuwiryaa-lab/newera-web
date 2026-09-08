import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex items-center space-x-2.5 px-4 py-2 rounded-full bg-slate-900/95 border border-white/[0.14] text-white shadow-2xl backdrop-blur-xl text-xs font-medium">
        {toast.type === 'info' ? (
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span className="tracking-wide text-slate-100">{toast.message}</span>
      </div>
    </div>
  );
};
