"use client";

import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

const TOAST_CFG = {
  success: { icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-200", icon_color: "text-emerald-600", title_color: "text-emerald-800" },
  warning: { icon: AlertTriangle, bg: "bg-orange-50 border-orange-200",  icon_color: "text-orange-500",  title_color: "text-orange-800" },
  info:    { icon: Info,          bg: "bg-blue-50 border-blue-200",       icon_color: "text-blue-500",    title_color: "text-blue-800" },
  error:   { icon: XCircle,       bg: "bg-red-50 border-red-200",         icon_color: "text-red-500",     title_color: "text-red-800" },
};

export function ToastContainer() {
  const { toasts, removeToast } = useBooking();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => {
        const cfg  = TOAST_CFG[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg max-w-xs pointer-events-auto anim-scale-in ${cfg.bg}`}
          >
            <Icon size={16} className={`${cfg.icon_color} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black ${cfg.title_color}`}>{toast.title}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors pointer-events-auto"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
