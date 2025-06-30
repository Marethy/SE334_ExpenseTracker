// components/date-filter.tsx
"use client";

import qs from "query-string";
import { useState, useEffect } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatDateRange } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";

export const DateFilter = () => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathName = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  const accountId = params.get("accountId");
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const defaultTo = new Date();
  const defaultFrom = subDays(defaultTo, 30);

  const paramState = {
    from: from ? new Date(from) : defaultFrom,
    to: to ? new Date(to) : defaultTo,
  };

  const [date, setDate] = useState<DateRange | undefined>(paramState);

  const pushToUrl = (dateRange: DateRange | undefined) => {
    if (!mounted) return;

    const query = {
      from: format(dateRange?.from || defaultFrom, "yyyy-MM-dd"),
      to: format(dateRange?.to || defaultTo, "yyyy-MM-dd"),
      accountId,
    };

    const url = qs.stringifyUrl(
      {
        url: pathName,
        query,
      },
      { skipEmptyString: true, skipNull: true },
    );

    router.push(url);
  };

  const applyPreset = (preset: "this" | "last") => {
    const now = new Date();
    const base = preset === "this" ? now : subMonths(now, 1);
    const range = { from: startOfMonth(base), to: endOfMonth(base) };
    setDate(range);
    pushToUrl(range);
  };

  const onReset = () => {
    setDate(undefined);
    pushToUrl(undefined);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        disabled={true}
        size="sm"
        variant="outline"
        className="lg:w-auto w-full h-9 rounded-md px-3 font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus:ring-offset-0 focus:ring-transparent outline-none text-white focus:bg-white/30 trasnsition"
      >
        <span>{formatDateRange(paramState)}</span>
        <ChevronDown className="mr-2 size-4 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={false}
          size="sm"
          variant="outline"
          className="lg:w-auto w-full h-9 rounded-md px-3 font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus:ring-offset-0 focus:ring-transparent outline-none text-white focus:bg-white/30 trasnsition"
        >
          <span>{formatDateRange(paramState)}</span>
          <ChevronDown className="mr-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="lg:w-auto w-full p-0" align="start">
        <div className="p-4 w-full flex gap-x-2">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => applyPreset("this")}
          >
            This month
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => applyPreset("last")}
          >
            Last month
          </Button>
        </div>
        <Calendar
          disabled={false}
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
        />
        <div className="p-4 w-full flex items-center gap-x-2">
          <PopoverClose asChild>
            <Button
              onClick={onReset}
              disabled={!date?.from || !date?.to}
              className="w-full"
              variant="outline"
            >
              Reset
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button
              onClick={() => pushToUrl(date)}
              disabled={!date?.from || !date?.to}
              className="w-full"
            >
              Apply
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
};
