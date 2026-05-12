"use client";

import { RefreshCw } from "lucide-react";

interface Props {
  onRefresh: () => void;
}

export default function AnalyticsHeader({
  onRefresh,
}: Props) {

  return (
    <div className="flex items-start justify-between">

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Analitik
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Monitoring smart classroom realtime
        </p>
      </div>

      <button
        onClick={onRefresh}
        className="
          flex items-center gap-2
          px-4 py-2 rounded-xl
          bg-blue-600 text-white
          text-sm font-bold
        "
      >
        <RefreshCw size={16} />
        Refresh
      </button>
    </div>
  );
}