import { useState } from "react";
import { FileSearch, Loader2, PieChart, Radar, Target } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { PieVariant } from "@/components/pie-variant";
import { RadarVariant } from "@/components/radar-variant";
import { RadialVariant } from "@/components/radial-variant";
import { CHART_PALETTES, PaletteName } from "@/components/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  data?: {
    name: string;
    value: number;
  }[];
};

export const SpendingPie = ({ data = [] }: Props) => {
  const [chartType, setChartType] = useState("pie");
  const [palette, setPalette] = useState<PaletteName>("default");

  const onTypeChange = (type: string) => {
    setChartType(type);
  };

  const onPaletteChange = (value: string) => {
    setPalette(value as PaletteName);
  };

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex flex-col space-y-2 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <CardTitle className="text-xl line-clamp-1">Categories</CardTitle>
        <div className="flex gap-2">
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

          <Select defaultValue={palette} onValueChange={onPaletteChange}>
            <SelectTrigger className="lg:w-auto h-9 rounded-md px-3">
              <SelectValue placeholder="Palette" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHART_PALETTES).map(([key, colors]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {colors.map((c) => (
                        <span
                          key={c}
                          className="w-3 h-3 rounded-full mr-1 last:mr-0"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span className="capitalize">{key}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {chartType === "pie" && (
              <PieVariant data={data} colors={CHART_PALETTES[palette]} />
            )}
            {chartType === "radar" && (
              <RadarVariant data={data} color={CHART_PALETTES[palette][0]} />
            )}
            {chartType === "radial" && (
              <RadialVariant data={data} colors={CHART_PALETTES[palette]} />
            )}
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
