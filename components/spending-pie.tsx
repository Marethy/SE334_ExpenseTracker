import { useState, useRef } from "react";
import { FileSearch, Loader2, PieChart, Radar, Target, Download, FileText } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { PieVariant } from "@/components/pie-variant";
import { RadarVariant } from "@/components/radar-variant";
import { RadialVariant } from "@/components/radial-variant";
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
    name: string;
    value: number;
  }[];
};

export const SpendingPie = ({ data = [] }: Props) => {
  const [chartType, setChartType] = useState("pie");
  const containerRef = useRef<HTMLDivElement>(null);

  const onTypeChange = (type: string) => {
    setChartType(type);
  };

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

  return (
    <Card ref={containerRef} className="border-none drop-shadow-sm">
      <CardHeader className="flex space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <CardTitle className="text-xl line-clamp-1">Categories</CardTitle>
        <div className="flex items-center gap-2">
          <Select defaultValue={chartType} onValueChange={onTypeChange}>
            <SelectTrigger className="lg:w-auto h-9 rounded-md px-3">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="pie">
                <div className="flex items-center">
                  <PieChart className="size-4 mr-2 shrink-0" />
                  <p className="line-clamp-1">Pie Chart</p>
                </div>
              </SelectItem>
              <SelectItem value="radar">
                <div className="flex items-center">
                  <Radar className="size-4 mr-2 shrink-0" />
                  <p className="line-clamp-1">Radar Chart</p>
                </div>
              </SelectItem>
              <SelectItem value="radial">
                <div className="flex items-center">
                  <Target className="size-4 mr-2 shrink-0" />
                  <p className="line-clamp-1">Radial Chart</p>
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
            {chartType === "pie" && <PieVariant data={data} />}
            {chartType === "radar" && <RadarVariant data={data} />}
            {chartType === "radial" && <RadialVariant data={data} />}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const SpendingPieLoading = () => {
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
