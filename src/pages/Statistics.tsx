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

// 预设日期范围类型
type DatePreset = "yesterday" | "thisWeek" | "thisMonth" | "7days" | "30days" | "custom";

const Statistics = () => {
  // 日期范围状态
  const [beginDate, setBeginDate] = useState<Date>(
    subDays(new Date(), 6) // 默认近7日
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [datePreset, setDatePreset] = useState<DatePreset>("7days");

  // 数据状态
  const [turnoverData, setTurnoverData] = useState<TurnoverReportVO | null>(null);
  const [userData, setUserData] = useState<UserReportVO | null>(null);
  const [orderData, setOrderData] = useState<OrderReportVO | null>(null);
  const [salesTop10Data, setSalesTop10Data] = useState<SalesTop10ReportVO | null>(null);
  const [loading, setLoading] = useState(false);


  // 格式化日期为 yyyy-MM-dd
  const formatDate = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // 解析逗号分隔的字符串为数组
  const parseStringList = (str: string): string[] => {
    if (!str) return [];
    return str.split(",").map((item) => item.trim()).filter(Boolean);
  };

  // 解析逗号分隔的数字字符串为数字数组
  const parseNumberList = (str: string): number[] => {
    if (!str) return [];
    return str.split(",").map((item) => parseFloat(item.trim())).filter((num) => !isNaN(num));
  };

  // 获取所有统计数据
  const fetchAllData = async () => {
    if (!beginDate || !endDate) {
      toast.error("请选择日期范围");
      return;
    }

    setLoading(true);
    try {
      const begin = formatDate(beginDate);
      const end = formatDate(endDate);

      // 并行请求所有数据
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
      console.error("获取统计数据失败:", error);
      toast.error("获取统计数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理预设日期范围
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let newBegin: Date;
    let newEnd: Date;

    switch (preset) {
      case "yesterday": {
        // 昨日：昨天 00:00:00 到昨天 23:59:59
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
        // 本周：本周一 00:00:00 到今天 23:59:59
        // 使用 { weekStartsOn: 1 } 表示周一开始（自然周）
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        weekStart.setHours(0, 0, 0, 0);
        newBegin = weekStart;
        newEnd = today;
        break;
      }
      case "thisMonth": {
        // 本月：本月1号 00:00:00 到今天 23:59:59
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
        // 保持当前日期，让用户自定义选择
        return;
    }

    // 更新日期
    setBeginDate(newBegin);
    setEndDate(newEnd);
    
    // 直接使用新日期查询数据
    const begin = formatDate(newBegin);
    const end = formatDate(newEnd);
    
    // 异步查询数据
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
        console.error("获取统计数据失败:", error);
        toast.error("获取统计数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    })();
  };

  // 处理日期范围变化
  const handleDateRangeChange = (begin: Date | undefined, end: Date | undefined) => {
    if (begin && end) {
      setBeginDate(begin);
      setEndDate(end);
      setDatePreset("custom");
    }
  };

  // 导出数据
  const handleExport = async () => {
    try {
      const blob = await exportReportAPI();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `运营数据报表_${formatDate(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("导出成功");
    } catch (error) {
      console.error("导出失败:", error);
      toast.error("导出失败，请稍后重试");
    }
  };

  // 初始化加载数据
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 营业额统计图表配置 - 使用 useMemo 避免重复渲染
  const turnoverChartOption = useMemo(() => ({
    title: {
      text: "营业额统计",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const param = Array.isArray(params) ? params[0] : params;
        if (param && typeof param === "object" && "name" in param && "value" in param) {
          return `${param.name}<br/>营业额: ${param.value}元`;
        }
        return "";
      },
    },
    xAxis: {
      type: "category",
      data: turnoverData ? parseStringList(turnoverData.dateList) : [],
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      name: "营业额(元)",
    },
    series: [
      {
        name: "营业额",
        type: "line",
        data: turnoverData ? parseNumberList(turnoverData.turnoverList) : [],
        smooth: true,
        itemStyle: {
          color: "#FFC107",
        },
        lineStyle: {
          color: "#FFC107",
        },
      },
    ],
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
  }), [turnoverData]);

  // 用户统计图表配置 - 使用 useMemo 避免重复渲染
  const userChartOption = useMemo(() => ({
    title: {
      text: "用户统计",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["用户总量", "新增用户"],
      bottom: 0,
    },
    xAxis: {
      type: "category",
      data: userData ? parseStringList(userData.dateList) : [],
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      name: "用户数(个)",
    },
    series: [
      {
        name: "用户总量",
        type: "line",
        data: userData ? parseNumberList(userData.totalUserList) : [],
        smooth: true,
        itemStyle: {
          color: "#FFC107",
        },
        lineStyle: {
          color: "#FFC107",
        },
      },
      {
        name: "新增用户",
        type: "line",
        data: userData ? parseNumberList(userData.newUserList) : [],
        smooth: true,
        itemStyle: {
          color: "#FF5722",
        },
        lineStyle: {
          color: "#FF5722",
        },
      },
    ],
    grid: {
      left: "3%",
      right: "4%",
      bottom: "20%",
      containLabel: true,
    },
  }), [userData]);

  // 订单统计图表配置 - 使用 useMemo 避免重复渲染
  const orderChartOption = useMemo(() => ({
    title: {
      text: "订单统计",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["订单总数", "有效订单数"],
      bottom: 0,
    },
    xAxis: {
      type: "category",
      data: orderData ? parseStringList(orderData.dateList) : [],
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      name: "订单数(个)",
    },
    series: [
      {
        name: "订单总数",
        type: "line",
        data: orderData ? parseNumberList(orderData.orderCountList) : [],
        smooth: true,
        itemStyle: {
          color: "#FFC107",
        },
        lineStyle: {
          color: "#FFC107",
        },
      },
      {
        name: "有效订单数",
        type: "line",
        data: orderData ? parseNumberList(orderData.validOrderCountList) : [],
        smooth: true,
        itemStyle: {
          color: "#FF5722",
        },
        lineStyle: {
          color: "#FF5722",
        },
      },
    ],
    grid: {
      left: "3%",
      right: "4%",
      bottom: "20%",
      containLabel: true,
    },
  }), [orderData]);

  // 销量TOP10图表配置 - 使用 useMemo 避免重复渲染
  const salesTop10ChartOption = useMemo(() => ({
    title: {
      text: "销量排名TOP10",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params: unknown) => {
        const param = Array.isArray(params) ? params[0] : params;
        if (param && typeof param === "object" && "name" in param && "value" in param) {
          return `${param.name}<br/>销量: ${param.value}份`;
        }
        return "";
      },
    },
    xAxis: {
      type: "value",
      name: "销量(份)",
    },
    yAxis: {
      type: "category",
      data: salesTop10Data ? parseStringList(salesTop10Data.nameList).reverse() : [],
      axisLabel: {
        interval: 0,
      },
    },
    series: [
      {
        name: "销量",
        type: "bar",
        data: salesTop10Data ? parseNumberList(salesTop10Data.numberList).reverse() : [],
        itemStyle: {
          color: "#4CAF50",
        },
      },
    ],
    grid: {
      left: "15%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
  }), [salesTop10Data]);

  return (
    <div className="p-6 space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={datePreset === "yesterday" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("yesterday")}
            >
              昨日
            </Button>
            <Button
              variant={datePreset === "thisWeek" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("thisWeek")}
            >
              本周
            </Button>
            <Button
              variant={datePreset === "thisMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("thisMonth")}
            >
              本月
            </Button>
            <Button
              variant={datePreset === "7days" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("7days")}
            >
              近7日
            </Button>
            <Button
              variant={datePreset === "30days" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("30days")}
            >
              近30日
            </Button>
            <Button
              variant={datePreset === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("custom")}
            >
              自定义
            </Button>
          </div>
          <DateRangePicker
            beginDate={beginDate}
            endDate={endDate}
            onDateChange={handleDateRangeChange}
          />
          <Button onClick={fetchAllData} disabled={loading}>
            查询
          </Button>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          数据导出
        </Button>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 营业额统计 */}
        <Card>
          <CardContent className="p-6">
            <ReactECharts
              option={turnoverChartOption}
              style={{ height: "400px", width: "100%" }}
              notMerge={true}
              lazyUpdate={true}
              opts={{ renderer: "canvas" }}
            />
          </CardContent>
        </Card>

        {/* 用户统计 */}
        <Card>
          <CardContent className="p-6">
            <ReactECharts
              option={userChartOption}
              style={{ height: "400px", width: "100%" }}
              notMerge={true}
              lazyUpdate={true}
              opts={{ renderer: "canvas" }}
            />
          </CardContent>
        </Card>

        {/* 订单统计 */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">订单完成率</div>
                <div className="text-2xl font-bold">
                  {orderData?.orderCompletionRate
                    ? `${(orderData.orderCompletionRate * 100).toFixed(1)}%`
                    : "-"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">有效订单</div>
                <div className="text-2xl font-bold">
                  {orderData?.validOrderCount ?? "-"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">订单总数</div>
                <div className="text-2xl font-bold">
                  {orderData?.totalOrderCount ?? "-"}
                </div>
              </div>
            </div>
            <ReactECharts
              option={orderChartOption}
              style={{ height: "350px", width: "100%" }}
              notMerge={true}
              lazyUpdate={true}
              opts={{ renderer: "canvas" }}
            />
          </CardContent>
        </Card>

        {/* 销量排名TOP10 */}
        <Card>
          <CardContent className="p-6">
            <ReactECharts
              option={salesTop10ChartOption}
              style={{ height: "400px", width: "100%" }}
              notMerge={true}
              lazyUpdate={true}
              opts={{ renderer: "canvas" }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
