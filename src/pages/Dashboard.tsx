import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getBusinessDataAPI,
  getOrderOverViewAPI,
  getDishOverViewAPI,
  getSetmealOverViewAPI,
  type BusinessDataVO,
  type OrderOverViewVO,
  type DishOverViewVO,
  type SetmealOverViewVO,
} from "@/api/dashboard";
import { getOrderListAPI, getOrderStatisticsAPI, type Order, type OrderPageQuery, type OrderStatistics } from "@/api/order";
import { Link } from "react-router-dom";
import { Plus, Eye, EyeOff, FileText, Truck, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const today = new Date();
  const todayStr = format(today, "yyyy.MM.dd");

  // 数据状态
  const [businessData, setBusinessData] = useState<BusinessDataVO | null>(null);
  const [orderOverView, setOrderOverView] = useState<OrderOverViewVO | null>(null);
  const [orderStatistics, setOrderStatistics] = useState<OrderStatistics | null>(null);
  const [dishOverView, setDishOverView] = useState<DishOverViewVO | null>(null);
  const [setmealOverView, setSetmealOverView] = useState<SetmealOverViewVO | null>(null);
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState<2 | 3>(2); // 2: 待接单, 3: 待派送
  const [loading, setLoading] = useState(false);

  // 获取今日数据
  const fetchBusinessData = async () => {
    try {
      const data = await getBusinessDataAPI();
      setBusinessData(data);
    } catch (error) {
      console.error("获取今日数据失败:", error);
      toast.error("获取今日数据失败，请稍后重试");
    }
  };

  // 获取订单概览
  const fetchOrderOverView = async () => {
    try {
      const data = await getOrderOverViewAPI();
      setOrderOverView(data);
    } catch (error) {
      console.error("获取订单概览失败:", error);
      toast.error("获取订单概览失败，请稍后重试");
    }
  };

  // 获取订单统计数据（待接单、待派送）
  const fetchOrderStatistics = async () => {
    try {
      const data = await getOrderStatisticsAPI();
      setOrderStatistics(data);
    } catch (error) {
      console.error("获取订单统计数据失败:", error);
      toast.error("获取订单统计数据失败，请稍后重试");
    }
  };

  // 获取菜品总览
  const fetchDishOverView = async () => {
    try {
      const data = await getDishOverViewAPI();
      setDishOverView(data);
    } catch (error) {
      console.error("获取菜品总览失败:", error);
      toast.error("获取菜品总览失败，请稍后重试");
    }
  };

  // 获取套餐总览
  const fetchSetmealOverView = async () => {
    try {
      const data = await getSetmealOverViewAPI();
      setSetmealOverView(data);
    } catch (error) {
      console.error("获取套餐总览失败:", error);
      toast.error("获取套餐总览失败，请稍后重试");
    }
  };

  // 获取订单列表
  const fetchOrderList = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: OrderPageQuery = {
        page: 1,
        pageSize: 10,
        status: activeStatus,
      };
      const res = await getOrderListAPI(queryParams);
      setOrderList(res.records);
    } catch (error) {
      console.error("获取订单列表失败:", error);
      toast.error("获取订单列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  // 初始化加载所有数据
  useEffect(() => {
    fetchBusinessData();
    fetchOrderOverView();
    fetchOrderStatistics();
    fetchDishOverView();
    fetchSetmealOverView();
  }, []);

  // 当订单状态切换时重新获取订单列表（包括首次加载）
  useEffect(() => {
    fetchOrderList();
  }, [activeStatus, fetchOrderList]);

  // 格式化金额
  const formatAmount = (amount: number): string => {
    return `¥${amount.toFixed(2)}`;
  };

  // 格式化订单菜品信息
  const formatOrderDishes = (dishes: string | undefined): string => {
    if (!dishes) return "-";
    // 解析订单菜品字符串，格式可能是 "菜品名*数量;菜品名*数量;"
    return dishes.split(";").filter(Boolean).join("; ");
  };

  return (
    <div className="space-y-6">
      {/* 今日数据 */}
      <Card>
        <CardContent className="px-6 pt-0 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">今日数据 {todayStr}</h2>
            <Link
              to="/statistics"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              详细数据 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">营业额</div>
              <div className="text-2xl font-bold">
                {businessData ? formatAmount(businessData.turnover) : "¥0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">有效订单</div>
              <div className="text-2xl font-bold">
                {businessData?.validOrderCount ?? 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">订单完成率</div>
              <div className="text-2xl font-bold">
                {businessData?.orderCompletionRate
                  ? `${(businessData.orderCompletionRate * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">平均客单价</div>
              <div className="text-2xl font-bold">
                {businessData ? formatAmount(businessData.unitPrice) : "¥0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">新增用户</div>
              <div className="text-2xl font-bold">
                {businessData?.newUsers ?? 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订单管理 */}
      <Card>
        <CardContent className="px-6 pt-0 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">订单管理 {todayStr}</h2>
            <Link
              to="/order"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              订单明细 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">待接单</div>
                <div className="text-xl font-bold">
                  {orderStatistics?.toBeConfirmed ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">待派送</div>
                <div className="text-xl font-bold">
                  {orderStatistics?.confirmed ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">已完成</div>
                <div className="text-xl font-bold">
                  {orderOverView?.completedOrders ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">已取消</div>
                <div className="text-xl font-bold">
                  {orderOverView?.cancelledOrders ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">全部订单</div>
                <div className="text-xl font-bold">
                  {orderOverView?.allOrders ?? 0}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 菜品总览和套餐总览 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 菜品总览 */}
        <Card>
          <CardContent className="px-6 pt-2 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">菜品总览</h2>
              <Link
                to="/dish"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                菜品管理 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">已启售</span>
                </div>
                <span className="text-xl font-bold">
                  {dishOverView?.sold ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">已停售</span>
                </div>
                <span className="text-xl font-bold">
                  {dishOverView?.discontinued ?? 0}
                </span>
              </div>
              <Link to="/dish">
                <Button className="w-full bg-[#ffc200] hover:bg-[#ffb300] text-gray-900">
                  <Plus className="mr-2 h-4 w-4" />
                  新增菜品
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 套餐总览 */}
        <Card>
          <CardContent className="px-6 pt-0 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">套餐总览</h2>
              <Link
                to="/setmeal"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                套餐管理 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">已启售</span>
                </div>
                <span className="text-xl font-bold">
                  {setmealOverView?.sold ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">已停售</span>
                </div>
                <span className="text-xl font-bold">
                  {setmealOverView?.discontinued ?? 0}
                </span>
              </div>
              <Link to="/setmeal">
                <Button className="w-full bg-[#ffc200] hover:bg-[#ffb300] text-gray-900">
                  <Plus className="mr-2 h-4 w-4" />
                  新增套餐
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 订单信息 */}
      <Card>
        <CardContent className="px-6 pt-0 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">订单信息</h2>
          </div>
          {/* 订单状态标签 */}
          <Tabs
            value={activeStatus.toString()}
            onValueChange={(value) => setActiveStatus(parseInt(value, 10) as 2 | 3)}
            className="w-full"
          >
            <TabsList className="h-auto p-0 bg-transparent border-b border-gray-200 rounded-none w-fit mb-4">
              <TabsTrigger
                value="2"
                className="px-4 py-2 text-sm font-medium relative rounded-none border-b-2 border-transparent data-[state=active]:border-[#ffc200] data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
              >
                待接单
                {orderStatistics && orderStatistics.toBeConfirmed > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {orderStatistics.toBeConfirmed}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="3"
                className="px-4 py-2 text-sm font-medium relative rounded-none border-b-2 border-transparent data-[state=active]:border-[#ffc200] data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
              >
                待派送
                {orderStatistics && orderStatistics.confirmed > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {orderStatistics.confirmed}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 订单表格 */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>订单菜品</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>预计送达时间</TableHead>
                  <TableHead>实收金额</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : orderList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      暂无订单数据
                    </TableCell>
                  </TableRow>
                ) : (
                  orderList.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.number}</TableCell>
                      <TableCell>{formatOrderDishes(order.orderDishes)}</TableCell>
                      <TableCell>{order.address || "-"}</TableCell>
                      <TableCell>
                        {order.checkoutTime
                          ? format(new Date(order.checkoutTime), "yyyy-MM-dd HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatAmount(order.amount)}
                      </TableCell>
                      <TableCell>{order.remark || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/order?status=${activeStatus}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
