"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  beginDate?: Date;
  endDate?: Date;
  onDateChange?: (begin: Date | undefined, end: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  beginDate,
  endDate,
  onDateChange,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      onDateChange?.(undefined, undefined);
      return;
    }
    // If only start date is selected, wait for end date selection
    if (range.from && !range.to) {
      return;
    }
    onDateChange?.(range.from, range.to);
  };

  const displayText = React.useMemo(() => {
    if (beginDate && endDate) {
      return `${format(beginDate, "yyyy-MM-dd")} – ${format(endDate, "yyyy-MM-dd")}`;
    }
    if (beginDate) {
      return format(beginDate, "yyyy-MM-dd");
    }
    return "Select date range";
  }, [beginDate, endDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[280px] justify-start text-left font-normal h-8",
            !beginDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from: beginDate, to: endDate }}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

