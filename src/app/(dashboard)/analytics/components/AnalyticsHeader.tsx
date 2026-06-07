"use client";

import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  onRefresh: () => Promise<any> | void;
}

export default function AnalyticsHeader({
  onRefresh,
}: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleClick = async () => {
    try {
      setRefreshing(true);
      await onRefresh();
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex items-start justify-between">

      <div>
        <h1 className="text-3xl font-black text-slate-800">Analitik</h1>

        <p className="text-sm text-slate-500 mt-1">Monitoring smart classroom realtime</p>
      </div>

      <button
        onClick={handleClick}
        disabled={refreshing}
        aria-pressed={refreshing}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
          refreshing ? "bg-slate-300 text-slate-700" : "bg-blue-600 text-white"
        }`}
      >
        {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}