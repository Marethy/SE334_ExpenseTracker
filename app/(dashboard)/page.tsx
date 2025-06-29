import { DataGrid } from "@/components/data-grid";
import { DataCharts } from "@/components/data-charts";
import { DebugUser } from "@/components/debug-user";
import { DebugData } from "@/components/debug-data";

export default function DashboardPage() {
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24 space-y-6">
      <DataGrid />
      <DataCharts />
    </div>
  );
}
