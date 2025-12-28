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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, ChevronDown, Upload } from "lucide-react";
import { useEffect, useState, useRef, Fragment } from "react";
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
  getSetmealList,
  deleteSetmeal,
  enableOrDisableSetmeal,
  getSetmealById,
  saveSetmeal,
  updateSetmeal,
  uploadImage,
  type Setmeal,
  type SetmealFormData,
} from "@/api/setmeal";
import { getCategoryListByType, type Category } from "@/api/category";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// 提取错误信息的辅助函数
const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { msg?: string }; status?: number } };
    if (axiosError.response?.data?.msg) {
      return axiosError.response.data.msg;
    }
    if (axiosError.response?.status) {
      return `请求失败 (${axiosError.response.status})`;
    }
  }
  
  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message?: string };
    if (err.message) {
      return err.message;
    }
  }
  
  return "操作失败，请稍后重试";
};

export default function Setmeal() {
  
  // 定义状态
  const [list, setList] = useState<Setmeal[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]); // 分类列表（用于下拉选择）
  const [setmealName, setSetmealName] = useState(""); // 搜索框绑定的值
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined); // 选中的分类ID
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined); // 选中的状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // 选中的套餐ID
  const [page, setPage] = useState(1); // 当前页码
  const [pageSize, setPageSize] = useState(10); // 每页条数
  const [total, setTotal] = useState(0); // 总条数
  const [loading, setLoading] = useState(false); // 加载状态
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // 确认对话框状态（启用/禁用）
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // 删除确认对话框状态
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false); // 批量删除确认对话框
  const [errorDialogOpen, setErrorDialogOpen] = useState(false); // 错误对话框状态
  const [currentSetmeal, setCurrentSetmeal] = useState<Setmeal | null>(null); // 当前操作的套餐
  const [errorMessage, setErrorMessage] = useState(""); // 错误信息
  const [formDialogOpen, setFormDialogOpen] = useState(false); // 表单对话框状态
  const [isEditMode, setIsEditMode] = useState(false); // 是否为编辑模式
  const [formData, setFormData] = useState<SetmealFormData>({
    name: "",
    categoryId: 0,
    price: 0,
    image: "",
    description: "",
    status: 1,
    setmealDishes: [],
  }); // 表单数据
  const [formLoading, setFormLoading] = useState(false); // 表单提交加载状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // 表单错误信息
  const [imagePreview, setImagePreview] = useState<string>(""); // 图片预览
  const [imageUploading, setImageUploading] = useState(false); // 图片上传中
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取分类列表（用于下拉选择）
  const fetchCategoryList = async () => {
    try {
      const categories = await getCategoryListByType({ type: 2 }); // 2: 套餐分类
      setCategoryList(categories);
    } catch (error) {
      console.error("获取分类列表失败:", error);
    }
  };

  // 获取数据的函数
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getSetmealList({
        page,
        pageSize,
        name: setmealName || undefined,
        categoryId: selectedCategoryId,
        status: selectedStatus,
      });
      setList(res.records);
      setTotal(Number(res.total));
      // 清空选中项
      setSelectedIds([]);
    } catch (error) {
      console.error("获取套餐列表失败:", error);
      setErrorMessage(getErrorMessage(error) || "获取套餐列表失败，请稍后重试");
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时自动触发一次
  useEffect(() => {
    fetchCategoryList();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]); // 当页码或每页条数变化时重新获取数据

  // 搜索功能
  const handleSearch = () => {
    setPage(1); // 搜索时重置到第一页
    fetchData();
  };

  // 分页处理
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 每页条数变化处理
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setPage(1); // 重置到第一页
  };

  // 处理单个复选框选择
  const handleSelectItem = (setmealId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, setmealId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== setmealId));
    }
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(list.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 打开确认对话框（启用/禁用）
  const handleOpenConfirmDialog = (setmeal: Setmeal) => {
    setCurrentSetmeal(setmeal);
    setConfirmDialogOpen(true);
  };

  // 确认启用/禁用套餐
  const handleConfirmToggleStatus = async () => {
    if (!currentSetmeal) return;

    const newStatus = currentSetmeal.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? "起售" : "停售";

    try {
      await enableOrDisableSetmeal(newStatus, currentSetmeal.id);
      setConfirmDialogOpen(false);
      setCurrentSetmeal(null);
      toast.success(`${action}套餐成功`);
      // 操作成功后刷新列表
      fetchData();
    } catch (error) {
      console.error(`${action}套餐失败:`, error);
      setConfirmDialogOpen(false);
      setErrorMessage(getErrorMessage(error) || `${action}套餐失败，请稍后重试`);
      setErrorDialogOpen(true);
    }
  };

  // 打开删除确认对话框
  const handleDelete = (setmeal: Setmeal) => {
    setCurrentSetmeal(setmeal);
    setDeleteDialogOpen(true);
  };

  // 确认删除套餐
  const handleConfirmDelete = async () => {
    if (!currentSetmeal) return;

    try {
      await deleteSetmeal([currentSetmeal.id]);
      setDeleteDialogOpen(false);
      setCurrentSetmeal(null);
      toast.success("删除套餐成功");
      // 操作成功后刷新列表
      fetchData();
    } catch (error) {
      console.error("删除套餐失败:", error);
      setDeleteDialogOpen(false);
      setErrorMessage(getErrorMessage(error) || "删除套餐失败，请稍后重试");
      setErrorDialogOpen(true);
    }
  };

  // 打开批量删除确认对话框
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      setErrorMessage("请至少选择一个套餐");
      setErrorDialogOpen(true);
      return;
    }
    setBatchDeleteDialogOpen(true);
  };

  // 确认批量删除
  const handleConfirmBatchDelete = async () => {
    try {
      await deleteSetmeal(selectedIds);
      setBatchDeleteDialogOpen(false);
      setSelectedIds([]);
      toast.success(`批量删除${selectedIds.length}个套餐成功`);
      // 操作成功后刷新列表
      fetchData();
    } catch (error) {
      console.error("批量删除套餐失败:", error);
      setBatchDeleteDialogOpen(false);
      setErrorMessage(getErrorMessage(error) || "批量删除套餐失败，请稍后重试");
      setErrorDialogOpen(true);
    }
  };

  // 校验单个字段
  const validateField = (field: string, value: string | number | undefined | null): string => {
    switch (field) {
      case "name":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "套餐名称不能为空";
        }
        return "";
      case "categoryId": {
        if (!value || value === 0) {
          return "套餐分类不能为空";
        }
        return "";
      }
      case "price": {
        if (value === undefined || value === null || value === "") {
          return "套餐价格不能为空";
        }
        const priceNum = Number(value);
        if (isNaN(priceNum) || priceNum <= 0) {
          return "套餐价格必须大于0";
        }
        return "";
      }
      case "image": {
        if (!value || (typeof value === "string" && !value.trim())) {
          return "套餐图片不能为空";
        }
        return "";
      }
      default:
        return "";
    }
  };

  // 处理字段失焦校验
  const handleFieldBlur = (field: string, value: string | number | undefined | null) => {
    const error = validateField(field, value);
    setFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // 打开新增套餐表单
  const handleAddSetmeal = () => {
    setIsEditMode(false);
    setFormData({
      name: "",
      categoryId: 0,
      price: 0,
      image: "",
      description: "",
      status: 1,
      setmealDishes: [],
    });
    setImagePreview("");
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // 打开修改表单
  const handleEdit = async (setmeal: Setmeal) => {
    setIsEditMode(true);
    setFormLoading(true);
    try {
      const setmealDetail = await getSetmealById(setmeal.id);
      setFormData({
        id: setmealDetail.id,
        name: setmealDetail.name,
        categoryId: Number(setmealDetail.categoryId),
        price: setmealDetail.price,
        image: setmealDetail.image || "",
        description: setmealDetail.description || "",
        status: setmealDetail.status,
        setmealDishes: setmealDetail.setmealDishes || [],
      });
      setImagePreview(setmealDetail.image || "");
      setFormErrors({});
      setFormDialogOpen(true);
    } catch (error) {
      console.error("获取套餐详情失败:", error);
      setErrorMessage(getErrorMessage(error) || "获取套餐详情失败，请稍后重试");
      setErrorDialogOpen(true);
    } finally {
      setFormLoading(false);
    }
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("仅能上传PNG、JPEG、JPG类型图片");
      setErrorDialogOpen(true);
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("图片大小不超过10M");
      setErrorDialogOpen(true);
      return;
    }

    setImageUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData({ ...formData, image: imageUrl });
      setImagePreview(imageUrl);
      if (formErrors.image) {
        setFormErrors((prev) => ({ ...prev, image: "" }));
      }
    } catch (error) {
      console.error("图片上传失败:", error);
      setErrorMessage(getErrorMessage(error) || "图片上传失败，请稍后重试");
      setErrorDialogOpen(true);
    } finally {
      setImageUploading(false);
    }
  };

  // 提交表单
  const handleSubmitForm = async () => {
    // 校验所有字段
    const errors: Record<string, string> = {};
    errors.name = validateField("name", formData.name);
    errors.categoryId = validateField("categoryId", formData.categoryId);
    errors.price = validateField("price", formData.price);
    errors.image = validateField("image", formData.image);

    setFormErrors(errors);

    // 检查是否有错误
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      setErrorMessage("请检查表单信息，确保所有必填字段填写正确");
      setErrorDialogOpen(true);
      return;
    }

    setFormLoading(true);
    try {
      if (isEditMode) {
        // 修改套餐
        await updateSetmeal({
          ...formData,
        });
        toast.success("修改套餐成功");
      } else {
        // 新增套餐 - 不发送 id
        const newSetmealData: Omit<SetmealFormData, "id"> = {
          name: formData.name,
          categoryId: formData.categoryId,
          price: formData.price,
          image: formData.image,
          description: formData.description,
          status: formData.status,
          setmealDishes: formData.setmealDishes || [],
        };
        await saveSetmeal(newSetmealData);
        toast.success("新增套餐成功");
      }
      setFormDialogOpen(false);
      // 操作成功后刷新列表
      fetchData();
    } catch (error) {
      console.error(`${isEditMode ? "修改" : "新增"}套餐失败:`, error);
      setErrorMessage(getErrorMessage(error) || `${isEditMode ? "修改" : "新增"}套餐失败，请稍后重试`);
      setErrorDialogOpen(true);
    } finally {
      setFormLoading(false);
    }
  };

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);
  const isAllSelected = list.length > 0 && selectedIds.length === list.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < list.length;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        {/* 左侧：搜索区域 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="setmeal-name" className="whitespace-nowrap text-sm">
              套餐名称：
            </Label>
            <Input
              id="setmeal-name"
              value={setmealName}
              onChange={(e) => setSetmealName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="请填写套餐名称"
              className="w-[200px] h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="setmeal-category" className="whitespace-nowrap text-sm">
              套餐分类：
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  id="setmeal-category"
                  className="w-[150px] justify-between h-8"
                >
                  {selectedCategoryId
                    ? categoryList.find((c) => c.id === selectedCategoryId.toString())?.name || "请选择"
                    : "请选择"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCategoryId(undefined);
                  }}
                >
                  全部
                </DropdownMenuItem>
                {categoryList.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => {
                      setSelectedCategoryId(Number(category.id));
                    }}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="setmeal-status" className="whitespace-nowrap text-sm">
              售卖状态：
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  id="setmeal-status"
                  className="w-[150px] justify-between h-8"
                >
                  {selectedStatus === undefined
                    ? "请选择"
                    : selectedStatus === 1
                    ? "起售"
                    : "停售"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStatus(undefined);
                  }}
                >
                  全部
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStatus(1);
                  }}
                >
                  起售
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStatus(0);
                  }}
                >
                  停售
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            onClick={handleSearch}
            size="sm"
            className="bg-gray-600 text-white hover:bg-gray-700 h-8"
          >
            <Search className="h-4 w-4" />
            查询
          </Button>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive/80 h-8"
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
          <Button
            size="sm"
            className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90 h-8"
            onClick={handleAddSetmeal}
          >
            <Plus className="h-4 w-4" />
            新建套餐
          </Button>
        </div>
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
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = isIndeterminate;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 cursor-pointer"
                        />
                      </TableHead>
                      <TableHead className="font-semibold">套餐名称</TableHead>
                      <TableHead className="font-semibold">图片</TableHead>
                      <TableHead className="font-semibold">套餐分类</TableHead>
                      <TableHead className="font-semibold">套餐价</TableHead>
                      <TableHead className="font-semibold">售卖状态</TableHead>
                      <TableHead className="font-semibold">最后操作时间</TableHead>
                      <TableHead className="font-semibold">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="text-muted-foreground">暂无数据</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      list.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onCheckedChange={(checked) =>
                                handleSelectItem(item.id, checked === true)
                              }
                              className="cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-12 w-12 object-cover rounded"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                无图片
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{item.categoryName || "-"}</TableCell>
                          <TableCell>¥{item.price?.toFixed(2) || "0.00"}</TableCell>
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
                                {item.status === 1 ? "起售" : "停售"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.updateTime || item.createTime || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-primary hover:text-primary/80 hover:underline text-sm font-medium cursor-pointer transition-colors"
                              >
                                修改
                              </button>
                              <Separator orientation="vertical" className="h-4" />
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-destructive hover:text-destructive/80 hover:underline text-sm font-medium cursor-pointer transition-colors"
                              >
                                删除
                              </button>
                              <Separator orientation="vertical" className="h-4" />
                              <button
                                onClick={() => handleOpenConfirmDialog(item)}
                                className={`${
                                  item.status === 1
                                    ? "text-destructive hover:text-destructive/80"
                                    : "text-green-600 hover:text-green-700"
                                } hover:underline text-sm font-medium cursor-pointer transition-colors`}
                              >
                                {item.status === 1 ? "停售" : "起售"}
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
                      共 {total} 条记录，第 {page} / {totalPages} 页
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="page-size" className="text-sm whitespace-nowrap">
                        每页显示：
                      </Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            id="page-size"
                            className="w-[100px] justify-between"
                          >
                            {pageSize}
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
                            if (page > 1) handlePageChange(page - 1);
                          }}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          return (
                            p === 1 ||
                            p === totalPages ||
                            (p >= page - 1 && p <= page + 1)
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
                                  isActive={p === page}
                                  className={
                                    p === page
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
                            if (page < totalPages) handlePageChange(page + 1);
                          }}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
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

      {/* 启用/禁用确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认操作</AlertDialogTitle>
            <AlertDialogDescription>
              {currentSetmeal && (
                <>
                  确定要
                  {currentSetmeal.status === 1 ? (
                    <span className="text-destructive font-semibold">停售</span>
                  ) : (
                    <span className="text-green-600 font-semibold">起售</span>
                  )}
                  套餐"<span className="font-semibold">{currentSetmeal.name}</span>"吗？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={
                currentSetmeal?.status === 1
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {currentSetmeal && (
                <>
                  确定要删除套餐"<span className="font-semibold">{currentSetmeal.name}</span>"吗？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认对话框 */}
      <AlertDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedIds.length} 个套餐吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 错误提示对话框 */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>操作失败</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 新增/修改套餐表单对话框 */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "修改套餐" : "新建套餐"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 套餐名称 */}
            <div className="grid gap-2">
              <Label htmlFor="form-name" className="text-sm">
                <span className="text-destructive">*</span> 套餐名称：
              </Label>
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
                placeholder="请输入套餐名称"
                disabled={formLoading}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* 套餐分类 */}
            <div className="grid gap-2">
              <Label htmlFor="form-category" className="text-sm">
                <span className="text-destructive">*</span> 套餐分类：
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    id="form-category"
                    className="w-full justify-between"
                    disabled={formLoading}
                  >
                    {formData.categoryId
                      ? categoryList.find((c) => c.id === formData.categoryId.toString())?.name || "请选择"
                      : "请选择"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-full">
                  {categoryList.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => {
                        setFormData({ ...formData, categoryId: Number(category.id) });
                        if (formErrors.categoryId) {
                          setFormErrors((prev) => ({ ...prev, categoryId: "" }));
                        }
                      }}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {formErrors.categoryId && (
                <p className="text-sm text-destructive">{formErrors.categoryId}</p>
              )}
            </div>

            {/* 套餐价格 */}
            <div className="grid gap-2">
              <Label htmlFor="form-price" className="text-sm">
                <span className="text-destructive">*</span> 套餐价格：
              </Label>
              <Input
                id="form-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number(e.target.value);
                  setFormData({ ...formData, price: value });
                  if (formErrors.price) {
                    setFormErrors((prev) => ({ ...prev, price: "" }));
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value === "" ? 0 : Number(e.target.value);
                  handleFieldBlur("price", value);
                }}
                placeholder="请输入套餐价格"
                disabled={formLoading}
                className={formErrors.price ? "border-destructive" : ""}
              />
              {formErrors.price && (
                <p className="text-sm text-destructive">{formErrors.price}</p>
              )}
            </div>

            {/* 套餐图片 */}
            <div className="grid gap-2">
              <Label className="text-sm">
                <span className="text-destructive">*</span> 套餐图片：
              </Label>
              <div className="flex items-start gap-4">
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-md w-32 h-32 flex items-center justify-center cursor-pointer hover:border-primary transition-colors relative overflow-hidden"
                  onClick={() => !imageUploading && fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="套餐图片"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-xs">点击上传</span>
                    </div>
                  )}
                  {imageUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm">上传中...</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={formLoading || imageUploading}
                />
                <div className="flex-1 text-sm text-muted-foreground space-y-1">
                  <p>图片大小不超过10M</p>
                  <p>仅能上传PNG JPEG JPG类型图片</p>
                  <p>建议上传方形图片</p>
                </div>
              </div>
              {formErrors.image && (
                <p className="text-sm text-destructive">{formErrors.image}</p>
              )}
            </div>

            {/* 套餐描述 */}
            <div className="grid gap-2">
              <Label htmlFor="form-description" className="text-sm">
                套餐描述：
              </Label>
              <Textarea
                id="form-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="请输入套餐描述"
                disabled={formLoading}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={formLoading || imageUploading}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={formLoading || imageUploading}
              className="bg-gray-600 text-white hover:bg-gray-700"
            >
              {formLoading ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
