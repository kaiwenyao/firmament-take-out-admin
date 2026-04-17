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

  // Data state
  const [businessData, setBusinessData] = useState<BusinessDataVO | null>(null);
  const [orderOverView, setOrderOverView] = useState<OrderOverViewVO | null>(null);
  const [orderStatistics, setOrderStatistics] = useState<OrderStatistics | null>(null);
  const [dishOverView, setDishOverView] = useState<DishOverViewVO | null>(null);
  const [setmealOverView, setSetmealOverView] = useState<SetmealOverViewVO | null>(null);
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState<2 | 3>(2); // 2: Pending acceptance, 3: Pending delivery
  const [loading, setLoading] = useState(false);

  // Get today's data
  const fetchBusinessData = async () => {
    try {
      const data = await getBusinessDataAPI();
      setBusinessData(data);
    } catch (error) {
      console.error("Failed to load business data:", error);
      toast.error("Failed to load today’s data. Please try again.");
    }
  };

  // Get order overview
  const fetchOrderOverView = async () => {
    try {
      const data = await getOrderOverViewAPI();
      setOrderOverView(data);
    } catch (error) {
      console.error("Failed to load order overview:", error);
      toast.error("Failed to load order overview. Please try again.");
    }
  };

  // Get order statistics (pending acceptance, pending delivery)
  const fetchOrderStatistics = async () => {
    try {
      const data = await getOrderStatisticsAPI();
      setOrderStatistics(data);
    } catch (error) {
      console.error("Failed to load order statistics:", error);
      toast.error("Failed to load order statistics. Please try again.");
    }
  };

  // Get dish overview
  const fetchDishOverView = async () => {
    try {
      const data = await getDishOverViewAPI();
      setDishOverView(data);
    } catch (error) {
      console.error("Failed to load dish overview:", error);
      toast.error("Failed to load dish overview. Please try again.");
    }
  };

  // Get setmeal overview
  const fetchSetmealOverView = async () => {
    try {
      const data = await getSetmealOverViewAPI();
      setSetmealOverView(data);
    } catch (error) {
      console.error("Failed to load setmeal overview:", error);
      toast.error("Failed to load setmeal overview. Please try again.");
    }
  };

  // Get order list
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
      console.error("Failed to load order list:", error);
      toast.error("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  // Initial load of all data
  useEffect(() => {
    fetchBusinessData();
    fetchOrderOverView();
    fetchOrderStatistics();
    fetchDishOverView();
    fetchSetmealOverView();
  }, []);

  // Re-fetch order list when status changes (including first load)
  useEffect(() => {
    fetchOrderList();
  }, [activeStatus, fetchOrderList]);

  // Format amount
  const formatAmount = (amount: number): string => {
    return `¥${amount.toFixed(2)}`;
  };

  // Format order dishes info
  const formatOrderDishes = (dishes: string | undefined): string => {
    if (!dishes) return "-";
    // Parse order dishes string, format may be "dishName*quantity;dishName*quantity;"
    return dishes.split(";").filter(Boolean).join("; ");
  };

  return (
    <div className="space-y-6">
      {/* Today's data */}
      <Card>
        <CardContent className="px-6 pt-0 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today · {todayStr}</h2>
            <Link
              to="/statistics"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Revenue</div>
              <div className="text-2xl font-bold">
                {businessData ? formatAmount(businessData.turnover) : "¥0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Valid orders</div>
              <div className="text-2xl font-bold">
                {businessData?.validOrderCount ?? 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Completion rate</div>
              <div className="text-2xl font-bold">
                {businessData?.orderCompletionRate
                  ? `${(businessData.orderCompletionRate * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Avg. ticket</div>
              <div className="text-2xl font-bold">
                {businessData ? formatAmount(businessData.unitPrice) : "¥0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">New users</div>
              <div className="text-2xl font-bold">
                {businessData?.newUsers ?? 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order management */}
      <Card>
        <CardContent className="px-6 pt-0 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Orders · {todayStr}</h2>
            <Link
              to="/order"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              All orders <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Pending acceptance</div>
                <div className="text-xl font-bold">
                  {orderStatistics?.toBeConfirmed ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Pending delivery</div>
                <div className="text-xl font-bold">
                  {orderStatistics?.confirmed ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-xl font-bold">
                  {orderOverView?.completedOrders ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Cancelled</div>
                <div className="text-xl font-bold">
                  {orderOverView?.cancelledOrders ?? 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">All orders</div>
                <div className="text-xl font-bold">
                  {orderOverView?.allOrders ?? 0}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dish overview and setmeal overview */}
      <div className="grid grid-cols-2 gap-6">
        {/* Dish overview */}
        <Card>
          <CardContent className="px-6 pt-2 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Dishes</h2>
              <Link
                to="/dish"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Manage <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">On sale</span>
                </div>
                <span className="text-xl font-bold">
                  {dishOverView?.sold ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Off sale</span>
                </div>
                <span className="text-xl font-bold">
                  {dishOverView?.discontinued ?? 0}
                </span>
              </div>
              <Link to="/dish">
                <Button className="w-full bg-[#ffc200] hover:bg-[#ffb300] text-gray-900">
                  <Plus className="mr-2 h-4 w-4" />
                  Add dish
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Setmeal overview */}
        <Card>
          <CardContent className="px-6 pt-0 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Setmeals</h2>
              <Link
                to="/setmeal"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Manage <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">On sale</span>
                </div>
                <span className="text-xl font-bold">
                  {setmealOverView?.sold ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Off sale</span>
                </div>
                <span className="text-xl font-bold">
                  {setmealOverView?.discontinued ?? 0}
                </span>
              </div>
              <Link to="/setmeal">
                <Button className="w-full bg-[#ffc200] hover:bg-[#ffb300] text-gray-900">
                  <Plus className="mr-2 h-4 w-4" />
                  Add setmeal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order info */}
      <Card>
        <CardContent className="px-6 pt-0 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order queue</h2>
          </div>
          {/* Order status tabs */}
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
                Pending acceptance
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
                Pending delivery
                {orderStatistics && orderStatistics.confirmed > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {orderStatistics.confirmed}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Order table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Checkout time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : orderList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No orders
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
                            View
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
