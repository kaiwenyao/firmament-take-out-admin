import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, ChevronDown } from "lucide-react";
import { useEffect, useState, Fragment } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getEmployeeListAPI,
  enableOrDisableEmployeeAPI,
  getEmployeeByIdAPI,
  saveEmployeeAPI,
  updateEmployeeAPI,
  type Employee,
  type EmployeeFormData,
  type EmployeePageQuery,
} from "@/api/employee";
import { toast } from "sonner";

// 提取错误信息的辅助函数
const getErrorMessage = (error: unknown): string => {
  // 如果是字符串，直接返回
  if (typeof error === "string") {
    return error;
  }

  // 如果是 Error 对象，检查是否有 response
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { data?: { msg?: string }; status?: number };
    };
    // 后端返回的错误格式：{ code: 0, msg: "错误信息" }
    if (axiosError.response?.data?.msg) {
      return axiosError.response.data.msg;
    }
    // HTTP 状态码错误
    if (axiosError.response?.status) {
      return `Request failed (${axiosError.response.status})`;
    }
  }

  // 如果是 Error 对象，返回 message
  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message?: string };
    if (err.message) {
      return err.message;
    }
  }

  return "Something went wrong. Please try again.";
};

export default function Employee() {
  // 定义状态
  const [list, setList] = useState<Employee[]>([]);
  const [name, setName] = useState(""); // 搜索框绑定的值
  const [total, setTotal] = useState(0); // 总条数
  const [loading, setLoading] = useState(false); // 加载状态
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // 确认对话框状态
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null); // 当前操作的员工
  const [formDialogOpen, setFormDialogOpen] = useState(false); // 表单对话框状态
  const [isEditMode, setIsEditMode] = useState(false); // 是否为编辑模式
  const [reqData, setReqData] = useState<EmployeePageQuery>({
    page: 1,
    pageSize: 10,
    name: undefined, // 初始没有搜索词
  });
  const [formData, setFormData] = useState<EmployeeFormData>({
    id: "",
    username: "",
    name: "",
    phone: "",
    sex: "1",
    idNumber: "",
  }); // 表单数据
  const [formLoading, setFormLoading] = useState(false); // 表单提交加载状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // 表单错误信息

  useEffect(() => {
    // 定义在内部，无需 useCallback
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("发起请求，参数:", reqData);
        const res = await getEmployeeListAPI({
          ...reqData, // 1. 先把 page, pageSize 自动解构进去
          // 2. 手动覆盖 name 属性，保留你的"判空"逻辑
          name: reqData.name || undefined,
        });
        setList(res.records);
        setTotal(Number(res.total));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load employees");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // 🔥 核心魔法：只依赖 reqData
    // 因为 reqData 是对象，每次 setReqData({...reqData}) 都会生成新地址
    // React 比较：旧对象地址 !== 新对象地址 -> 触发！
  }, [reqData]);

  const reloadData = () => {
    // 复制一份自己，内容一样，但内存地址变了
    setReqData((prev) => ({ ...prev }));
  };

  const handleSearch = () => {
    setReqData((prev) => ({
      ...prev, // 保留 pageSize 等其他参数
      page: 1, // 搜索新词，回到第一页
      name: name, // 把输入框的值“提交”进 reqData
    }));
  };

  // 分页处理
  const handlePageChange = (newPage: number) => {
    setReqData((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // 每页条数变化处理
  const handlePageSizeChange = (newPageSize: string) => {
    setReqData((prev) => ({
      ...prev,
      pageSize: Number(newPageSize),
      page: 1, // 重置到第一页
    }));
  };

  // 打开确认对话框
  const handleOpenConfirmDialog = (employee: Employee) => {
    setCurrentEmployee(employee);
    setConfirmDialogOpen(true);
  };

  // 确认启用/禁用员工账号
  const handleConfirmToggleStatus = async () => {
    if (!currentEmployee) return;

    const newStatus = currentEmployee.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? "Enabled" : "Disabled";

    try {
      await enableOrDisableEmployeeAPI(newStatus, currentEmployee.id);
      setConfirmDialogOpen(false);
      setCurrentEmployee(null);
      toast.success(`Account ${action.toLowerCase()}`);
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error(`${action}员工账号失败:`, error);
      setConfirmDialogOpen(false);
      toast.error("Failed to update account", {
        description: getErrorMessage(error) || "Please try again",
      });
    }
  };

  // 打开添加员工表单
  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setFormErrors({});
    setFormDialogOpen(true);

    // 🤔 思考：添加表单是纯前端操作，不需要去后端拿数据
    // 所以根本不需要设置 Loading，也不需要 setTimeout

    // 直接重置数据即可，这是瞬间完成的
    setFormData({
      id: "",
      username: "",
      name: "",
      phone: "",
      sex: "1",
      idNumber: "",
    });
  };

  // 打开修改员工表单
  const handleOpenEditForm = async (employee: Employee) => {
    setIsEditMode(true);
    setFormErrors({});
    setFormDialogOpen(true); // ✅ 立即弹窗
    setFormLoading(true); // ✅ 立即显示骨架屏/转圈

    try {
      const employeeDetail = await getEmployeeByIdAPI(employee.id);

      setFormData({
        id: employeeDetail.id,
        username: employeeDetail.username,
        name: employeeDetail.name,
        phone: employeeDetail.phone,
        // 🚨 再次提醒：如果后端返回数字，这里记得转字符串，否则 Radio 选不中
        sex: String(employeeDetail.sex),
        idNumber: employeeDetail.idNumber,
      });

      // ❌ 这里不用写 setFormLoading(false) 了
    } catch (error) {
      console.error("获取员工详情失败:", error);
      toast.error("Failed to load employee");
      setFormDialogOpen(false); // 失败了关掉弹窗是合理的

      // ❌ 这里也不用写 setFormLoading(false) 了
    } finally {
      // ✅ 放在这里！
      // 只要 try 跑完了，或者 catch 跑完了，这一行一定会执行
      setFormLoading(false);
    }
  };

  // 校验单个字段
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "username":
        if (!value.trim()) {
          return "Username is required";
        }
        if (value.trim().length < 3) {
          return "Username must be at least 3 characters";
        }
        return "";
      case "name":
        if (!value.trim()) {
          return "Name is required";
        }
        return "";
      case "phone":
        if (!value.trim()) {
          return "Phone number is required";
        }
        if (!/^1[3-9]\d{9}$/.test(value.trim())) {
          return "Enter a valid mobile number";
        }
        return "";
      case "idNumber":
        if (!value.trim()) {
          return "ID number is required";
        }
        if (
          !/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(
            value.trim()
          )
        ) {
          return "Enter a valid Chinese ID number";
        }
        return "";
      default:
        return "";
    }
  };

  // 处理字段失焦校验
  const handleFieldBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // 提交表单
  const handleSubmitForm = async () => {
    // 校验所有字段
    const errors: Record<string, string> = {};
    errors.username = validateField("username", formData.username);
    errors.name = validateField("name", formData.name);
    errors.phone = validateField("phone", formData.phone);
    errors.idNumber = validateField("idNumber", formData.idNumber);

    setFormErrors(errors);

    // 检查是否有错误
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      toast.error("Validation failed", {
        description: "Please check all required fields",
      });
      return;
    }

    setFormLoading(true);
    try {
      if (isEditMode) {
        // 修改员工
        await updateEmployeeAPI(formData);
        toast.success("Employee updated");
      } else {
        // 添加员工
        await saveEmployeeAPI(formData);
        toast.success("Employee added");
      }
      setFormDialogOpen(false);
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error(`${isEditMode ? "修改" : "添加"}员工失败:`, error);
      toast.error(`${isEditMode ? "Failed to update" : "Failed to add"} employee`, {
        description: getErrorMessage(error) || "Please try again",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // 计算总页数
  const totalPages = Math.ceil(total / reqData.pageSize);
  return (
    <div className="h-full flex flex-col gap-3">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        {/* 左侧：搜索区域 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="employee-name"
              className="whitespace-nowrap text-sm"
            >
              Name:
            </Label>
            <Input
              id="employee-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Employee name"
              className="w-[200px] h-8"
            />
          </div>
          <Button
            onClick={handleSearch}
            size="sm"
            className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90 h-8"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        {/* 右侧：添加按钮 */}
        <Button size="sm" className="h-8" onClick={handleOpenAddForm}>
          <Plus className="h-4 w-4" />
          Add employee
        </Button>
      </div>

      {/* 下方表格区域 */}
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
              {/* 表格 */}
              <div className="flex-1 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Username</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">
                        Last updated
                      </TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
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
                            {item.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.username}
                          </TableCell>
                          <TableCell>{item.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  item.status === 1
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              />
                              <span className="text-sm font-medium">
                                {item.status === 1 ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.updateTime}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditForm(item)}
                                className="text-primary hover:text-primary/80 hover:underline text-sm font-medium cursor-pointer transition-colors"
                              >
                                Edit
                              </button>
                              <Separator
                                orientation="vertical"
                                className="h-4"
                              />
                              <button
                                onClick={() => handleOpenConfirmDialog(item)}
                                className={`${
                                  item.status === 1
                                    ? "text-destructive hover:text-destructive/80"
                                    : "text-green-600 hover:text-green-700"
                                } hover:underline text-sm font-medium cursor-pointer transition-colors`}
                              >
                                {item.status === 1 ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* 分页组件 */}
              {total > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 flex-shrink-0 min-w-fit">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} total · Page {reqData.page} / {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="page-size"
                        className="text-sm whitespace-nowrap"
                      >
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

      {/* 确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>
              {currentEmployee && (
                <>
                  {currentEmployee.status === 1 ? (
                    <>Deactivate account for <span className="font-semibold">{currentEmployee.name}</span>?</>
                  ) : (
                    <>Activate account for <span className="font-semibold">{currentEmployee.name}</span>?</>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={
                currentEmployee?.status === 1
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加/修改员工表单对话框 */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit employee" : "Add employee"}</DialogTitle>
            <DialogDescription>
              All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="form-username">Username</Label>
              <Input
                id="form-username"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  // 清除该字段的错误信息
                  if (formErrors.username) {
                    setFormErrors((prev) => ({ ...prev, username: "" }));
                  }
                }}
                onBlur={(e) => handleFieldBlur("username", e.target.value)}
                placeholder="Username"
                disabled={formLoading}
                className={formErrors.username ? "border-destructive" : ""}
              />
              {formErrors.username && (
                <p className="text-sm text-destructive">
                  {formErrors.username}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="form-name">Name</Label>
              <Input
                id="form-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) {
                    setFormErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                onBlur={(e) => handleFieldBlur("name", e.target.value)}
                placeholder="Full name"
                disabled={formLoading}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="form-phone">Phone</Label>
              <Input
                id="form-phone"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (formErrors.phone) {
                    setFormErrors((prev) => ({ ...prev, phone: "" }));
                  }
                }}
                onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                placeholder="Mobile number"
                disabled={formLoading}
                className={formErrors.phone ? "border-destructive" : ""}
              />
              {formErrors.phone && (
                <p className="text-sm text-destructive">{formErrors.phone}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="form-sex">Gender</Label>
              <RadioGroup
                value={formData.sex}
                onValueChange={(value) =>
                  setFormData({ ...formData, sex: value })
                }
                disabled={formLoading}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="1" id="sex-male" />
                  <Label htmlFor="sex-male" className="cursor-pointer">
                    Male
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="0" id="sex-female" />
                  <Label htmlFor="sex-female" className="cursor-pointer">
                    Female
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="form-idNumber">ID Number</Label>
              <Input
                id="form-idNumber"
                value={formData.idNumber}
                onChange={(e) => {
                  setFormData({ ...formData, idNumber: e.target.value });
                  if (formErrors.idNumber) {
                    setFormErrors((prev) => ({ ...prev, idNumber: "" }));
                  }
                }}
                onBlur={(e) => handleFieldBlur("idNumber", e.target.value)}
                placeholder="ID card number"
                disabled={formLoading}
                className={formErrors.idNumber ? "border-destructive" : ""}
              />
              {formErrors.idNumber && (
                <p className="text-sm text-destructive">
                  {formErrors.idNumber}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitForm} disabled={formLoading}>
              {formLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
