"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  value?: string; // datetime-local 格式的字符串，如 "2024-01-01T12:00"
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [time, setTime] = React.useState<string>(
    value
      ? format(new Date(value), "HH:mm")
      : format(new Date(), "HH:mm")
  );
  const [open, setOpen] = React.useState(false);

  // 当外部 value 变化时，更新内部状态
  React.useEffect(() => {
    if (value) {
      const dateValue = new Date(value);
      setDate(dateValue);
      setTime(format(dateValue, "HH:mm"));
    } else {
      setDate(undefined);
      setTime(format(new Date(), "HH:mm"));
    }
  }, [value]);

  // 处理日期选择
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      onChange?.("");
      return;
    }

    // 如果已经选择了时间，合并日期和时间
    const [hours, minutes] = time.split(":").map(Number);
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(hours, minutes, 0, 0);

    setDate(selectedDate);
    // 格式化为 datetime-local 格式: "YYYY-MM-DDTHH:mm"
    const formatted = format(newDateTime, "yyyy-MM-dd'T'HH:mm");
    onChange?.(formatted);
  };

  // 处理时间变化
  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    
    // 只有在选择了日期的情况下才触发 onChange
    if (date) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDateTime = new Date(date);
      newDateTime.setHours(hours, minutes, 0, 0);
      
      // 格式化为 datetime-local 格式
      const formatted = format(newDateTime, "yyyy-MM-dd'T'HH:mm");
      onChange?.(formatted);
    }
  };

  // 显示文本
  const displayText = date
    ? `${format(date, "yyyy-MM-dd")} ${time}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[200px] justify-start text-left font-normal h-8",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="border-t p-3 space-y-2">
            <Label className="text-sm">Time</Label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

