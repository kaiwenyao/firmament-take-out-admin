import { useEffect, useState, useMemo } from "react";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  getTurnoverStatisticsAPI,
  getUserStatisticsAPI,
  getOrdersStatisticsAPI,
  getSalesTop10API,
  exportReportAPI,
  type TurnoverReportVO,
  type UserReportVO,
  type OrderReportVO,
  type SalesTop10ReportVO,
} from "@/api/report";
import { toast } from "sonner";
import ReactECharts from "echarts-for-react";
import { Download } from "lucide-react";

type DatePreset = "yesterday" | "thisWeek" | "thisMonth" | "7days" | "30days" | "custom";

const Statistics = () => {
  const [beginDate, setBeginDate] = useState<Date>(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [datePreset, setDatePreset] = useState<DatePreset>("7days");

  const [turnoverData, setTurnoverData] = useState<TurnoverReportVO | null>(null);
  const [userData, setUserData] = useState<UserReportVO | null>(null);
  const [orderData, setOrderData] = useState<OrderReportVO | null>(null);
  const [salesTop10Data, setSalesTop10Data] = useState<SalesTop10ReportVO | null>(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date): string => format(date, "yyyy-MM-dd");

  const parseStringList = (str: string): string[] => {
    if (!str) return [];
    return str.split(",").map((item) => item.trim()).filter(Boolean);
  };

  const parseNumberList = (str: string): number[] => {
    if (!str) return [];
    return str.split(",").map((item) => parseFloat(item.trim())).filter((num) => !isNaN(num));
  };

  const fetchAllData = async () => {
    if (!beginDate || !endDate) {
      toast.error("Please select a date range");
      return;
    }

    setLoading(true);
    try {
      const begin = formatDate(beginDate);
      const end = formatDate(endDate);

      const [turnover, user, order, sales] = await Promise.all([
        getTurnoverStatisticsAPI(begin, end),
        getUserStatisticsAPI(begin, end),
        getOrdersStatisticsAPI(begin, end),
        getSalesTop10API(begin, end),
      ]);

      setTurnoverData(turnover);
      setUserData(user);
      setOrderData(order);
      setSalesTop10Data(sales);
    } catch (error) {
      console.error("Failed to load statistics:", error);
      toast.error("Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let newBegin: Date;
    let newEnd: Date;

    switch (preset) {
      case "yesterday": {
        const yesterday = subDays(today, 1);
        const yesterdayStart = new Date(yesterday);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        newBegin = yesterdayStart;
        newEnd = yesterdayEnd;
        break;
      }
      case "thisWeek": {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        weekStart.setHours(0, 0, 0, 0);
        newBegin = weekStart;
        newEnd = today;
        break;
      }
      case "thisMonth": {
        const monthStart = startOfMonth(today);
        monthStart.setHours(0, 0, 0, 0);
        newBegin = monthStart;
        newEnd = today;
        break;
      }
      case "7days":
        newBegin = subDays(today, 6);
        newEnd = today;
        break;
      case "30days":
        newBegin = subDays(today, 29);
        newEnd = today;
        break;
      case "custom":
        return;
    }

    setBeginDate(newBegin);
    setEndDate(newEnd);

    const begin = formatDate(newBegin);
    const end = formatDate(newEnd);

    (async () => {
      setLoading(true);
      try {
        const [turnover, user, order, sales] = await Promise.all([
          getTurnoverStatisticsAPI(begin, end),
          getUserStatisticsAPI(begin, end),
          getOrdersStatisticsAPI(begin, end),
          getSalesTop10API(begin, end),
        ]);

        setTurnoverData(turnover);
        setUserData(user);
        setOrderData(order);
        setSalesTop10Data(sales);
      } catch (error) {
        console.error("Failed to load statistics:", error);
        toast.error("Failed to load statistics. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleDateRangeChange = (begin: Date | undefined, end: Date | undefined) => {
    if (begin && end) {
      setBeginDate(begin);
      setEndDate(end);
      setDatePreset("custom");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportReportAPI();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `operations_report_${formatDate(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Export started");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const turnoverChartOption = useMemo(
    () => ({
      title: {
        text: "Revenue",
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "bold" },
      },
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const param = Array.isArray(params) ? params[0] : params;
          if (param && typeof param === "object" && "name" in param && "value" in param) {
            return `${param.name}<br/>Revenue: ¥${param.value}`;
          }
          return "";
        },
      },
      xAxis: {
        type: "category",
        data: turnoverData ? parseStringList(turnoverData.dateList) : [],
        axisLabel: { rotate: 45 },
      },
      yAxis: { type: "value", name: "Revenue (¥)" },
      series: [
        {
          name: "Revenue",
          type: "line",
          data: turnoverData ? parseNumberList(turnoverData.turnoverList) : [],
          smooth: true,
          itemStyle: { color: "#FFC107" },
          lineStyle: { color: "#FFC107" },
        },
      ],
      grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
    }),
    [turnoverData]
  );

  const userChartOption = useMemo(
    () => ({
      title: {
        text: "Users",
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "bold" },
      },
      tooltip: { trigger: "axis" },
      legend: { data: ["Total users", "New users"], bottom: 0 },
      xAxis: {
        type: "category",
        data: userData ? parseStringList(userData.dateList) : [],
        axisLabel: { rotate: 45 },
      },
      yAxis: { type: "value", name: "Users" },
      series: [
        {
          name: "Total users",
          type: "line",
          data: userData ? parseNumberList(userData.totalUserList) : [],
          smooth: true,
          itemStyle: { color: "#FFC107" },
          lineStyle: { color: "#FFC107" },
        },
        {
          name: "New users",
          type: "line",
          data: userData ? parseNumberList(userData.newUserList) : [],
          smooth: true,
          itemStyle: { color: "#FF5722" },
          lineStyle: { color: "#FF5722" },
        },
      ],
      grid: { left: "3%", right: "4%", bottom: "20%", containLabel: true },
    }),
    [userData]
  );

  const orderChartOption = useMemo(
    () => ({
      title: {
        text: "Orders",
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "bold" },
      },
      tooltip: { trigger: "axis" },
      legend: { data: ["All orders", "Valid orders"], bottom: 0 },
      xAxis: {
        type: "category",
        data: orderData ? parseStringList(orderData.dateList) : [],
        axisLabel: { rotate: 45 },
      },
      yAxis: { type: "value", name: "Orders" },
      series: [
        {
          name: "All orders",
          type: "line",
          data: orderData ? parseNumberList(orderData.orderCountList) : [],
          smooth: true,
          itemStyle: { color: "#FFC107" },
          lineStyle: { color: "#FFC107" },
        },
        {
          name: "Valid orders",
          type: "line",
          data: orderData ? parseNumberList(orderData.validOrderCountList) : [],
          smooth: true,
          itemStyle: { color: "#FF5722" },
          lineStyle: { color: "#FF5722" },
        },
      ],
      grid: { left: "3%", right: "4%", bottom: "20%", containLabel: true },
    }),
    [orderData]
  );

  const salesTop10ChartOption = useMemo(
    () => ({
      title: {
        text: "Top 10 by sales",
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "bold" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const param = Array.isArray(params) ? params[0] : params;
          if (param && typeof param === "object" && "name" in param && "value" in param) {
            return `${param.name}<br/>Sold: ${param.value}`;
          }
          return "";
        },
      },
      xAxis: { type: "value", name: "Units sold" },
      yAxis: {
        type: "category",
        data: salesTop10Data ? parseStringList(salesTop10Data.nameList).reverse() : [],
        axisLabel: { interval: 0 },
      },
      series: [
        {
          name: "Sales",
          type: "bar",
          data: salesTop10Data ? parseNumberList(salesTop10Data.numberList).reverse() : [],
          itemStyle: { color: "#4CAF50" },
        },
      ],
      grid: { left: "15%", right: "4%", bottom: "3%", containLabel: true },
    }),
    [salesTop10Data]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant={datePreset === "yesterday" ? "default" : "outline"} size="sm" onClick={() => handlePresetChange("yesterday")}>
              Yesterday
            </Button>
            <Button variant={datePreset === "thisWeek" ? "default" : "outline"} size="sm" onClick={() => handlePresetChange("thisWeek")}>
              This week
            </Button>
            <Button variant={datePreset === "thisMonth" ? "default" : "outline"} size="sm" onClick={() => handlePresetChange("thisMonth")}>
              This month
            </Button>
            <Button variant={datePreset === "7days" ? "default" : "outline"} size="sm" onClick={() => handlePresetChange("7days")}>
              Last 7 days
            </Button>
            <Button variant={datePreset === "30days" ? "default" : "outline"} size="sm" onClick={() => handlePresetChange("30days")}>
              Last 30 days
            </Button>
            <Button variant={datePreset === "custom" ? "default" : "outline"} size="sm" onClick={() => handlePresetChange("custom")}>
              Custom
            </Button>
          </div>
          <DateRangePicker beginDate={beginDate} endDate={endDate} onDateChange={handleDateRangeChange} />
          <Button onClick={fetchAllData} disabled={loading}>
            Search
          </Button>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <ReactECharts option={turnoverChartOption} style={{ height: "400px", width: "100%" }} notMerge={true} lazyUpdate={true} opts={{ renderer: "canvas" }} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <ReactECharts option={userChartOption} style={{ height: "400px", width: "100%" }} notMerge={true} lazyUpdate={true} opts={{ renderer: "canvas" }} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Completion rate</div>
                <div className="text-2xl font-bold">
                  {orderData?.orderCompletionRate ? `${(orderData.orderCompletionRate * 100).toFixed(1)}%` : "-"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Valid orders</div>
                <div className="text-2xl font-bold">{orderData?.validOrderCount ?? "-"}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total orders</div>
                <div className="text-2xl font-bold">{orderData?.totalOrderCount ?? "-"}</div>
              </div>
            </div>
            <ReactECharts option={orderChartOption} style={{ height: "350px", width: "100%" }} notMerge={true} lazyUpdate={true} opts={{ renderer: "canvas" }} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <ReactECharts option={salesTop10ChartOption} style={{ height: "400px", width: "100%" }} notMerge={true} lazyUpdate={true} opts={{ renderer: "canvas" }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
