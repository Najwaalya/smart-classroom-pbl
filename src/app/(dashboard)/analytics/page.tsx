"use client";

import AnalyticsHeader from "./components/AnalyticsHeader";
import KPICards from "./components/KPICards";
import OccupancyChart from "./components/OccupancyCharts";
import RoomTable from "./components/RoomTable";

import { useAnalytics } from "./hooks/useAnalytics";

export default function AnalyticsPage() {

  const {
    data,
    isLoading,
    mutate,
  } = useAnalytics();

  if (isLoading) {

    return (
      <div className="page-wrapper">
        Loading...
      </div>
    );
  }

  return (
    <div className="page-wrapper">

      <div className="flex flex-col gap-6 pb-12">

        <AnalyticsHeader
          onRefresh={() => mutate()}
        />

        <KPICards
          sensors={data?.sensors || []}
        />

        <OccupancyChart
          data={data?.hourly || []}
        />

        <RoomTable
          rooms={data?.sensors || []}
        />

      </div>

    </div>
  );
}