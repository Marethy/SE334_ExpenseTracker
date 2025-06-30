import { useState, useRef } from "react";
import {
  AreaChart,
  BarChart3,
  FileSearch,
  LineChart,
  Loader2,
  Download,
  FileText,
} from "lucide-react";

import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

import { Skeleton } from "@/components/ui/skeleton";
import { BarVariant } from "@/components/bar-variant";
import { AreaVariant } from "@/components/area-variant";
import { LineVariant } from "@/components/line-variant";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toPng } from "html-to-image";
import jsPDF from "jspdf";

type Props = {
  data?: {
    date: string;
    income: number;
    expenses: number;
  }[];
};

export const Chart = ({ data = [] }: Props) => {
  const [chartType, setChartType] = useState("area");
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldBlock, triggerPaywall } = usePaywall();

  const exportAsPng = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current);
      const link = document.createElement("a");
      link.download = "chart.png";
      link.href = dataUrl;
      link.click();
      toast.success("Exported as PNG");
    } catch {
      toast.error("Failed to export chart");
    }
  };

  const exportAsPdf = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current);
      const pdf = new jsPDF({ orientation: "landscape" });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("chart.pdf");
      toast.success("Exported as PDF");
    } catch {
      toast.error("Failed to export chart");
    }
  };

  const onTypeChange = (type: string) => {
    if (type !== "area" && shouldBlock) {
      triggerPaywall();
      return;
    }
    setChartType(type);
  };

  return (
    <Card ref={containerRef} className="border-none drop-shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <CardTitle className="text-xl line-clamp-1">Transactions</CardTitle>
        <div className="flex items-center gap-2">
          <Select defaultValue={chartType} onValueChange={onTypeChange}>
            <SelectTrigger className="lg:w-auto h-9 rounded-md px-3">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="area">
                <div className="flex items-center">
                  <AreaChart className="size-4 mr-2 shrink-0" />
                  <p className="line-clamp-1">Area Chart</p>
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center">
                  <LineChart className="size-4 mr-2 shrink-0" />
                  <p className="line-clamp-1">Line Chart {shouldBlock && "🔒"}</p>
                </div>
              </SelectItem>
              <SelectItem value="bar">
                <div className="flex items-center">
                  <BarChart3 className="size-4 mr-2 shrink-0" />
                  <p className="line-clamp-1">Bar Chart {shouldBlock && "🔒"}</p>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="size-4 mr-1" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsPng}>
                <Download className="size-4 mr-2" /> PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsPdf}>
                <FileText className="size-4 mr-2" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col gap-y-4 items-center justify-center h-[350px] w-full">
            <FileSearch className="size-6 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              No data for this period
            </p>
          </div>
        ) : (
          <>
            {chartType === "area" && <AreaVariant data={data} />}
            {chartType === "line" && <LineVariant data={data} />}
            {chartType === "bar" && <BarVariant data={data} />}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const ChartLoading = () => {
  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 lg:w-[120px] w-full" />
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
        </div>
      </CardContent>
    </Card>
  );
};
