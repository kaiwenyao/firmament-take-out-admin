import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Search, ChevronDown } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useEffect, useState, Fragment } from "react";
import {
  getOrderListAPI,
  getOrderStatisticsAPI,
  confirmOrderAPI,
  rejectOrderAPI,
  cancelOrderAPI,
  deliveryOrderAPI,
  completeOrderAPI,
  getOrderDetailsAPI,
  type Order,
  type OrderPageQuery,
  type OrderStatistics,
  type OrderDetail,
} from "@/api/order";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/DateTimePicker";

// Order status type
// According to DTO: 1 pending payment 2 pending acceptance 3 accepted 4 out for delivery 5 completed 6 cancelled 7 refunded
type OrderStatus = "all" | 2 | 3 | 4 | 5 | 6;

// Order status config
// According to backend DTO: 1 pending payment 2 pending acceptance 3 accepted 4 out for delivery 5 completed 6 cancelled 7 refunded
const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; status?: number; badge?: string }
> = {
  all: { label: "All orders", status: undefined },
  2: { label: "Pending acceptance", status: 2 }, // Pending acceptance
  3: { label: "Pending delivery", status: 3 }, // Accepted (pending dispatch)
  4: { label: "Out for delivery", status: 4 }, // Out for delivery
  5: { label: "Completed", status: 5 }, // Completed
  6: { label: "Cancelled", status: 6 }, // Cancelled
};

// Get order status display text
// According to DTO: 1 pending payment 2 pending acceptance 3 accepted 4 out for delivery 5 completed 6 cancelled 7 refunded
const getOrderStatusText = (status: number): string => {
  switch (status) {
    case 1:
      return "Pending payment";
    case 2:
      return "Pending acceptance";
    case 3:
      return "Accepted";
    case 4:
      return "Out for delivery";
    case 5:
      return "Completed";
    case 6:
      return "Cancelled";
    case 7:
      return "Refunded";
    default:
      return "Unknown";
  }
};

// Get order status color
const getOrderStatusColor = (status: number): string => {
  switch (status) {
    case 1:
      return "bg-yellow-100 text-yellow-800"; // Pending payment
    case 2:
      return "bg-orange-100 text-orange-800"; // Pending acceptance
    case 3:
      return "bg-blue-100 text-blue-800"; // Accepted (pending dispatch)
    case 4:
      return "bg-purple-100 text-purple-800"; // Out for delivery
    case 5:
      return "bg-green-100 text-green-800"; // Completed
    case 6:
      return "bg-gray-100 text-gray-800"; // Cancelled
    case 7:
      return "bg-red-100 text-red-800"; // Refunded
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Get payment method text
const getPayMethodText = (payMethod?: number): string => {
  switch (payMethod) {
    case 1:
      return "WeChat Pay";
    case 2:
      return "Alipay";
    default:
      return "-";
  }
};

export default function Order() {
  // State definitions
  const [list, setList] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("all"); // Current selected order status
  const [orderNumber, setOrderNumber] = useState(""); // Order number
  const [phone, setPhone] = useState(""); // Phone number
  const [beginTime, setBeginTime] = useState(""); // Start time
  const [endTime, setEndTime] = useState(""); // End time
  const [total, setTotal] = useState(0); // Total count
  const [loading, setLoading] = useState(false); // Loading state
  const [reqData, setReqData] = useState<OrderPageQuery>({
    page: 1,
    pageSize: 10,
    number: undefined,
    phone: undefined,
    status: undefined,
    beginTime: undefined,
    endTime: undefined,
  });
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null); // Order statistics
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null); // Current operated order
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // Accept order confirm dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false); // Reject order dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false); // Cancel order dialog
  const [rejectionReason, setRejectionReason] = useState(""); // Rejection reason
  const [cancelReason, setCancelReason] = useState(""); // Cancel reason
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>(""); // Selected cancel reason type
  const [customCancelReason, setCustomCancelReason] = useState(""); // Custom cancel reason
  const [actionLoading, setActionLoading] = useState(false); // Action loading state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false); // Order detail dialog
  const [orderDetail, setOrderDetail] = useState<Order | null>(null); // Order detail data
  const [detailLoading, setDetailLoading] = useState(false); // Detail loading state

  const CUSTOM_CANCEL_REASON = "Custom reason";

  // Cancel reason options list
  const CANCEL_REASON_OPTIONS = [
    "High order volume — cannot accept orders right now",
    "Items sold out — cannot accept orders right now",
    "Not enough riders for delivery",
    "Customer cancelled by phone",
    CUSTOM_CANCEL_REASON,
  ];

  // Get order statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const stats = await getOrderStatisticsAPI();
        setStatistics(stats);
      } catch (error) {
        console.error("Failed to get order statistics:", error);
        toast.error("Failed to load order statistics. Please try again.");
      }
    };
    fetchStatistics();
  }, []);

  useEffect(() => {
    // Defined internally, no need for useCallback
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Sending request with params:", reqData);
        const res = await getOrderListAPI({
          ...reqData,
          number: reqData.number || undefined,
          phone: reqData.phone || undefined,
          status: reqData.status,
          beginTime: reqData.beginTime || undefined,
          endTime: reqData.endTime || undefined,
        });
        setList(res.records);
        setTotal(Number(res.total));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // 🔥 Core magic: only depend on reqData
  }, [reqData]);

  const reloadData = () => {
    // Create a copy with same content but different memory reference
    setReqData((prev) => ({ ...prev }));
  };

  // Search function
  const handleSearch = () => {
    const statusConfig = ORDER_STATUS_CONFIG[activeStatus];
    setReqData((prev) => ({
      ...prev,
      page: 1, // New search term, go back to first page
      number: orderNumber || undefined,
      phone: phone || undefined,
      status: statusConfig.status,
      beginTime: beginTime || undefined,
      endTime: endTime || undefined,
    }));
  };

  // Reset search
  const handleReset = () => {
    setOrderNumber("");
    setPhone("");
    setBeginTime("");
    setEndTime("");
    const statusConfig = ORDER_STATUS_CONFIG[activeStatus];
    setReqData({
      page: 1,
      pageSize: reqData.pageSize,
      number: undefined,
      phone: undefined,
      status: statusConfig.status,
      beginTime: undefined,
      endTime: undefined,
    });
  };

  // Pagination handling
  const handlePageChange = (newPage: number) => {
    setReqData((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Page size change handling
  const handlePageSizeChange = (newPageSize: string) => {
    setReqData((prev) => ({
      ...prev,
      pageSize: Number(newPageSize),
      page: 1, // Reset to first page
    }));
  };

  // Switch order status
  const handleStatusChange = (status: OrderStatus) => {
    setActiveStatus(status);
    const statusConfig = ORDER_STATUS_CONFIG[status];
    setReqData((prev) => ({
      ...prev,
      page: 1, // Reset to first page when switching status
      status: statusConfig.status,
    }));
  };

  // Convert OrderStatus to string (for Tabs value)
  const statusToString = (status: OrderStatus): string => {
    return status === "all" ? "all" : status.toString();
  };

  // Convert string to OrderStatus (for Tabs onChange)
  const stringToStatus = (value: string): OrderStatus => {
    if (value === "all") return "all";
    const num = parseInt(value, 10);
    return num as OrderStatus;
  };

  // Get order count for status
  // According to OrderStatisticsVO: toBeConfirmed(pending acceptance-status 2), confirmed(pending dispatch-status 3), deliveryInProgress(delivering-status 4)
  const getStatusCount = (status: OrderStatus): number => {
    if (!statistics) return 0;
    switch (status) {
      case 2:
        return statistics.toBeConfirmed || 0; // Pending acceptance
      case 3:
        return statistics.confirmed || 0; // Accepted (pending dispatch)
      case 4:
        return statistics.deliveryInProgress || 0; // Out for delivery
      default:
        return 0;
    }
  };

  // Open accept order confirm dialog
  const handleOpenConfirmDialog = (order: Order) => {
    setCurrentOrder(order);
    setConfirmDialogOpen(true);
  };

  // Confirm accept order
  // According to DTO: from status 2 (pending acceptance) to status 3 (accepted)
  const handleConfirmOrder = async () => {
    if (!currentOrder) return;
    setActionLoading(true);
    try {
      await confirmOrderAPI({
        id: currentOrder.id,
        status: 3, // After acceptance status becomes 3 (accepted/pending dispatch)
      });
      toast.success("Order accepted");
      setConfirmDialogOpen(false);
      setCurrentOrder(null);
      reloadData();
      // Refresh statistics
      const stats = await getOrderStatisticsAPI();
      setStatistics(stats);
    } catch (error) {
      console.error("Accept order failed:", error);
      toast.error("Failed to accept order. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open reject order dialog
  const handleOpenRejectDialog = (order: Order) => {
    setCurrentOrder(order);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  // Confirm reject order
  const handleRejectOrder = async () => {
    if (!currentOrder || !rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      await rejectOrderAPI({
        id: currentOrder.id,
        rejectionReason: rejectionReason.trim(),
      });
      toast.success("Order rejected");
      setRejectDialogOpen(false);
      setCurrentOrder(null);
      setRejectionReason("");
      reloadData();
      // Refresh statistics
      const stats = await getOrderStatisticsAPI();
      setStatistics(stats);
    } catch (error) {
      console.error("Reject order failed:", error);
      toast.error("Failed to reject order. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open cancel order dialog
  const handleOpenCancelDialog = (order: Order) => {
    setCurrentOrder(order);
    setCancelReason("");
    setSelectedCancelReason("");
    setCustomCancelReason("");
    setCancelDialogOpen(true);
  };

  // Handle cancel reason selection
  const handleCancelReasonSelect = (reason: string) => {
    setSelectedCancelReason(reason);
    if (reason !== CUSTOM_CANCEL_REASON) {
      setCancelReason(reason);
      setCustomCancelReason("");
    } else {
      setCancelReason("");
    }
  };

  // Handle custom reason input
  const handleCustomCancelReasonChange = (value: string) => {
    setCustomCancelReason(value);
    setCancelReason(value);
  };

  // Confirm cancel order
  const handleCancelOrder = async () => {
    if (!currentOrder) {
      toast.error("Invalid order");
      return;
    }
    
    // Validate cancel reason
    if (!selectedCancelReason) {
      toast.error("Please select a cancellation reason");
      return;
    }
    
    if (selectedCancelReason === CUSTOM_CANCEL_REASON && !customCancelReason.trim()) {
      toast.error("Please enter your custom cancellation reason");
      return;
    }
    
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }
    
    setActionLoading(true);
    try {
      await cancelOrderAPI({
        id: currentOrder.id,
        cancelReason: cancelReason.trim(),
      });
      toast.success("Order cancelled");
      setCancelDialogOpen(false);
      setCurrentOrder(null);
      setCancelReason("");
      setSelectedCancelReason("");
      setCustomCancelReason("");
      reloadData();
      // Refresh statistics
      const stats = await getOrderStatisticsAPI();
      setStatistics(stats);
    } catch (error) {
      console.error("Cancel order failed:", error);
      toast.error("Failed to cancel order. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatch order
  const handleDeliveryOrder = async (order: Order) => {
    setActionLoading(true);
    try {
      await deliveryOrderAPI(order.id);
      toast.success("Order marked as out for delivery");
      reloadData();
      // Refresh statistics
      const stats = await getOrderStatisticsAPI();
      setStatistics(stats);
    } catch (error) {
      console.error("Dispatch order failed:", error);
      toast.error("Failed to update delivery status. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Complete order
  const handleCompleteOrder = async (order: Order) => {
    setActionLoading(true);
    try {
      await completeOrderAPI(order.id);
      toast.success("Order completed");
      reloadData();
      // Refresh statistics
      const stats = await getOrderStatisticsAPI();
      setStatistics(stats);
    } catch (error) {
      console.error("Complete order failed:", error);
      toast.error("Failed to complete order. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open order detail dialog
  const handleOpenDetailDialog = async (order: Order) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setOrderDetail(null);
    try {
      const detail = await getOrderDetailsAPI(order.id);
      setOrderDetail(detail);
    } catch (error) {
      console.error("Failed to get order details:", error);
      toast.error("Failed to load order details. Please try again.");
      setDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };


  // Calculate total pages
  const totalPages = Math.ceil(total / reqData.pageSize);

  // Define tabs display order (according to image order)
  // According to backend status: all orders, pending acceptance(2), pending dispatch(3), out for delivery(4), completed(5), cancelled(6)
  const ORDER_STATUS_ORDER: OrderStatus[] = ["all", 2, 3, 4, 5, 6];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Filter Tabs */}
      <Tabs
        value={statusToString(activeStatus)}
        onValueChange={(value) => handleStatusChange(stringToStatus(value))}
        className="w-full"
      >
        <div className="bg-white border-b border-gray-200 rounded-t-lg rounded-b-none border-r border-gray-200 w-full overflow-x-auto">
          <TabsList className="h-auto p-0 bg-transparent w-full max-w-none flex flex-nowrap min-w-full md:min-w-0">
            {ORDER_STATUS_ORDER.map((status) => {
              const config = ORDER_STATUS_CONFIG[status];
              const count = getStatusCount(status);
              // Only show badge for pending acceptance(2), pending dispatch(3), out for delivery(4), show regardless of selection
              const showBadge = (status === 2 || status === 3 || status === 4) && count > 0;
              
              return (
                <TabsTrigger
                  key={status}
                  value={statusToString(status)}
                  className={`
                    relative flex-1 min-w-[112px] sm:min-w-0 shrink-0 sm:shrink px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium rounded-none border-r border-gray-200
                    whitespace-normal text-center leading-snug
                    data-[state=active]:bg-[#ffc200] data-[state=active]:text-gray-900
                    data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700
                    hover:bg-gray-50
                  `}
                >
                  {config.label}
                  {/* Show red dot badge (only for pending acceptance(2), pending dispatch(3), out for delivery(4)) */}
                  {showBadge && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white px-1">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      {/* Search area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="order-number" className="whitespace-nowrap text-sm">
                Order no.:
              </Label>
              <Input
                id="order-number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Enter order number"
                className="w-[200px] h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="phone" className="whitespace-nowrap text-sm">
                Phone:
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Enter phone number"
                className="w-[200px] h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="begin-time" className="whitespace-nowrap text-sm">
                Start time:
              </Label>
              <DateTimePicker
                value={beginTime}
                onChange={(value) => setBeginTime(value)}
                placeholder="Select start time"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-time" className="whitespace-nowrap text-sm">
                End time:
              </Label>
              <DateTimePicker
                value={endTime}
                onChange={(value) => setEndTime(value)}
                placeholder="Select end time"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSearch}
                size="sm"
                className="bg-gray-600 text-white hover:bg-gray-700 h-8"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button
                onClick={handleReset}
                size="sm"
                variant="outline"
                className="h-8"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table area */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col gap-4 flex-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="flex-1 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Order no.</TableHead>
                      <TableHead className="font-semibold">Items</TableHead>
                      <TableHead className="font-semibold">Ordered at</TableHead>
                      <TableHead className="font-semibold">Paid at</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Payment</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Address</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-12">
                          <div className="text-muted-foreground">No data</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      list.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {item.number}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="truncate" title={item.orderDishes || "-"}>
                              {item.orderDishes || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.orderTime || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.checkoutTime || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getOrderStatusColor(item.status)}
                            >
                              {getOrderStatusText(item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            ¥{item.amount?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>
                            {getPayMethodText(item.payMethod)}
                          </TableCell>
                          <TableCell>{item.userName || "-"}</TableCell>
                          <TableCell>{item.phone || "-"}</TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate" title={item.address || "-"}>
                              {item.address || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/* View details button - shown for all statuses */}
                              <button
                                onClick={() => handleOpenDetailDialog(item)}
                                className="text-primary hover:text-primary/80 hover:underline text-sm font-medium cursor-pointer transition-colors"
                              >
                                View details
                              </button>
                              {/* Show different action buttons based on order status */}
                              {/* Status 2: Pending acceptance - can accept or reject */}
                              {item.status === 2 && (
                                <>
                                  <Separator orientation="vertical" className="h-4" />
                                  <button
                                    onClick={() => handleOpenConfirmDialog(item)}
                                    disabled={actionLoading}
                                    className="text-primary hover:text-primary/80 hover:underline text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    Accept
                                  </button>
                                  <Separator orientation="vertical" className="h-4" />
                                  <button
                                    onClick={() => handleOpenRejectDialog(item)}
                                    disabled={actionLoading}
                                    className="text-destructive hover:text-destructive/80 hover:underline text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {/* Status 3: Accepted (pending dispatch) - can dispatch or cancel */}
                              {item.status === 3 && (
                                <>
                                  <Separator orientation="vertical" className="h-4" />
                                  <button
                                    onClick={() => handleDeliveryOrder(item)}
                                    disabled={actionLoading}
                                    className="text-primary hover:text-primary/80 hover:underline text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    Dispatch
                                  </button>
                                  <Separator orientation="vertical" className="h-4" />
                                  <button
                                    onClick={() => handleOpenCancelDialog(item)}
                                    disabled={actionLoading}
                                    className="text-destructive hover:text-destructive/80 hover:underline text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {/* Status 4: Out for delivery - can complete */}
                              {item.status === 4 && (
                                <>
                                  <Separator orientation="vertical" className="h-4" />
                                  <button
                                    onClick={() => handleCompleteOrder(item)}
                                    disabled={actionLoading}
                                    className="text-primary hover:text-primary/80 hover:underline text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    Complete
                                  </button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination component */}
              {total > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 flex-shrink-0 min-w-fit">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} total · Page {reqData.page} / {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="page-size" className="text-sm whitespace-nowrap">
                        Per page:
                      </Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            id="page-size"
                            className="w-[100px] justify-between"
                          >
                            {reqData.pageSize}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => handlePageSizeChange("5")}
                          >
                            5
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePageSizeChange("10")}
                          >
                            10
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePageSizeChange("15")}
                          >
                            15
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePageSizeChange("30")}
                          >
                            30
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (reqData.page > 1)
                              handlePageChange(reqData.page - 1);
                          }}
                          className={
                            reqData.page === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          return (
                            p === 1 ||
                            p === totalPages ||
                            (p >= reqData.page - 1 && p <= reqData.page + 1)
                          );
                        })
                        .map((p, index, array) => {
                          const prev = array[index - 1];
                          const showEllipsis = prev && p - prev > 1;
                          return (
                            <Fragment key={p}>
                              {showEllipsis && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(p);
                                  }}
                                  isActive={p === reqData.page}
                                  className={
                                    p === reqData.page
                                      ? "bg-[#ffc200] text-black hover:bg-[#ffc200]/90"
                                      : ""
                                  }
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            </Fragment>
                          );
                        })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (reqData.page < totalPages)
                              handlePageChange(reqData.page + 1);
                          }}
                          className={
                            reqData.page === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Accept order confirm dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept order</AlertDialogTitle>
            <AlertDialogDescription>
              {currentOrder && (
                <>
                  Accept order <span className="font-semibold">{currentOrder.number}</span>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOrder}
              disabled={actionLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {actionLoading ? "Working…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject order dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject order</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="text-sm">
              Reason:
            </Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason"
              disabled={actionLoading}
              className="mt-2 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectOrder}
              disabled={actionLoading || !rejectionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel order dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel order</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="cancel-reason" className="text-sm">
                Reason:
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative mt-2">
                    <Input
                      id="cancel-reason"
                      value={selectedCancelReason}
                      readOnly
                      placeholder="Select a reason"
                      disabled={actionLoading}
                      className="w-full pr-8 cursor-pointer"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                  {CANCEL_REASON_OPTIONS.map((reason) => (
                    <DropdownMenuItem
                      key={reason}
                      onClick={() => handleCancelReasonSelect(reason)}
                      className={selectedCancelReason === reason ? "bg-accent" : ""}
                    >
                      {reason}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Custom reason input */}
            {selectedCancelReason === CUSTOM_CANCEL_REASON && (
              <div>
                <Label htmlFor="custom-cancel-reason" className="text-sm">
                  Custom reason:
                </Label>
                <Textarea
                  id="custom-cancel-reason"
                  value={customCancelReason}
                  onChange={(e) => handleCustomCancelReasonChange(e.target.value)}
                  placeholder="Enter cancellation reason"
                  disabled={actionLoading}
                  className="mt-2 min-h-[100px]"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setSelectedCancelReason("");
                setCustomCancelReason("");
                setCancelReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancelOrder}
              disabled={
                actionLoading ||
                !selectedCancelReason ||
                (selectedCancelReason === CUSTOM_CANCEL_REASON && !customCancelReason.trim())
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order detail dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
            </div>
          ) : orderDetail ? (
            <div className="space-y-6 py-4">
              {/* User info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">Customer</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <div className="text-base font-medium">{orderDetail.userName || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    <div className="text-base font-medium">{orderDetail.phone || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-muted-foreground">Recipient</Label>
                    <div className="text-base font-medium">{orderDetail.consignee || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-muted-foreground">Delivery address</Label>
                    <div className="text-base font-medium">{orderDetail.address || "-"}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">Order</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Order no.</Label>
                    <div className="text-base font-medium">{orderDetail.number || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div>
                      <Badge className={getOrderStatusColor(orderDetail.status)}>
                        {getOrderStatusText(orderDetail.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Ordered at</Label>
                    <div className="text-base font-medium">{orderDetail.orderTime || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Paid at</Label>
                    <div className="text-base font-medium">{orderDetail.checkoutTime || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Payment method</Label>
                    <div className="text-base font-medium">{getPayMethodText(orderDetail.payMethod)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Amount received</Label>
                    <div className="text-base font-semibold text-primary">
                      ¥{orderDetail.amount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  {orderDetail.remark && (
                    <div className="col-span-2">
                      <Label className="text-sm text-muted-foreground">Note</Label>
                      <div className="text-base font-medium">{orderDetail.remark}</div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Dish info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">Line items</h3>
                {orderDetail.orderDetailList && orderDetail.orderDetailList.length > 0 ? (
                  <div className="space-y-3">
                    {orderDetail.orderDetailList.map((detail: OrderDetail, index: number) => (
                      <div
                        key={detail.id || index}
                        className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        {detail.image && (
                          <img
                            src={detail.image}
                            alt={detail.name || "Dish"}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-base mb-1">
                            {detail.name || "Unknown item"}
                          </div>
                          {detail.dishFlavor && (
                            <div className="text-sm text-muted-foreground mb-2">
                              Flavor: {detail.dishFlavor}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Qty: {detail.number} × ¥{detail.amount?.toFixed(2) || "0.00"}
                            </div>
                            <div className="font-semibold text-primary">
                              ¥{((detail.number || 0) * (detail.amount || 0)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No line items</div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Failed to load. Please try again.
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
