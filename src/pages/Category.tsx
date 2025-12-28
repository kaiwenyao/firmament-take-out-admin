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
  getCategoryList,
  enableOrDisableCategory,
  saveCategory,
  updateCategory,
  deleteCategory,
  type Category,
  type CategoryFormData,
} from "@/api/category";
import { toast } from "sonner";

// 类型转换：数字转中文
const getCategoryTypeText = (type: number): string => {
  return type === 1 ? "菜品分类" : "套餐分类";
};

// 类型转换：中文转数字
const getCategoryTypeNumber = (type: string): number | undefined => {
  if (type === "菜品分类") return 1;
  if (type === "套餐分类") return 2;
  return undefined;
};

// 提取错误信息的辅助函数
const getErrorMessage = (error: unknown): string => {
  // 如果是字符串，直接返回
  if (typeof error === "string") {
    return error;
  }
  
  // 如果是 Error 对象，检查是否有 response
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { msg?: string }; status?: number } };
    // 后端返回的错误格式：{ code: 0, msg: "错误信息" }
    if (axiosError.response?.data?.msg) {
      return axiosError.response.data.msg;
    }
    // HTTP 状态码错误
    if (axiosError.response?.status) {
      return `请求失败 (${axiosError.response.status})`;
    }
  }
  
  // 如果是 Error 对象，返回 message
  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message?: string };
    if (err.message) {
      return err.message;
    }
  }
  
  // 默认错误信息
  return "操作失败，请稍后重试";
};

export default function Category() {
  
  // 定义状态
  const [list, setList] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState(""); // 搜索框绑定的值
  const [categoryType, setCategoryType] = useState<string>(""); // 搜索类型（中文）
  const [page, setPage] = useState(1); // 当前页码
  const [pageSize, setPageSize] = useState(10); // 每页条数
  const [total, setTotal] = useState(0); // 总条数
  const [loading, setLoading] = useState(false); // 加载状态
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // 确认对话框状态（启用/禁用）
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // 删除确认对话框状态
  const [errorDialogOpen, setErrorDialogOpen] = useState(false); // 错误对话框状态
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null); // 当前操作的分类
  const [errorMessage, setErrorMessage] = useState(""); // 错误信息
  const [formDialogOpen, setFormDialogOpen] = useState(false); // 表单对话框状态
  const [isEditMode, setIsEditMode] = useState(false); // 是否为编辑模式
  const [formType, setFormType] = useState<number>(1); // 表单类型：1-菜品分类，2-套餐分类
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: 1,
    sort: 0,
  }); // 表单数据
  const [formLoading, setFormLoading] = useState(false); // 表单提交加载状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // 表单错误信息

  // 获取数据的函数
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCategoryList({
        page,
        pageSize,
        name: categoryName || undefined,
        type: getCategoryTypeNumber(categoryType) || undefined,
      });
      setList(res.records);
      setTotal(Number(res.total));
    } catch (error) {
      console.error("获取分类列表失败:", error);
      setErrorMessage(getErrorMessage(error) || "获取分类列表失败，请稍后重试");
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时自动触发一次
  useEffect(() => {
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

  // 打开确认对话框
  const handleOpenConfirmDialog = (category: Category) => {
    setCurrentCategory(category);
    setConfirmDialogOpen(true);
  };

  // 确认启用/禁用分类
  const handleConfirmToggleStatus = async () => {
    if (!currentCategory) return;

    const newStatus = currentCategory.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? "启用" : "禁用";

    try {
      await enableOrDisableCategory(newStatus, currentCategory.id);
      setConfirmDialogOpen(false);
      setCurrentCategory(null);
      toast.success(`${action}分类成功`);
      // 操作成功后刷新列表
      fetchData();
    } catch (error) {
      console.error(`${action}分类失败:`, error);
      setConfirmDialogOpen(false);
      setErrorMessage(getErrorMessage(error) || `${action}分类失败，请稍后重试`);
      setErrorDialogOpen(true);
    }
  };

  // 校验单个字段
  const validateField = (field: string, value: string | number): string => {
    switch (field) {
      case "name":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "分类名称不能为空";
        }
        return "";
      case "sort": {
        if (value === undefined || value === null || value === "") {
          return "排序不能为空";
        }
        const sortNum = Number(value);
        if (isNaN(sortNum) || sortNum < 0) {
          return "排序必须为非负整数";
        }
        return "";
      }
      default:
        return "";
    }
  };

  // 处理字段失焦校验
  const handleFieldBlur = (field: string, value: string | number) => {
    const error = validateField(field, value);
    setFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // 打开新增菜品分类表单
  const handleAddDishCategory = () => {
    setIsEditMode(false);
    setFormType(1);
    setFormData({
      name: "",
      type: 1,
      sort: 0,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // 打开新增套餐分类表单
  const handleAddComboCategory = () => {
    setIsEditMode(false);
    setFormType(2);
    setFormData({
      name: "",
      type: 2,
      sort: 0,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // 打开修改表单
  const handleEdit = (category: Category) => {
    setIsEditMode(true);
    setFormType(category.type);
    setFormData({
      id: category.id,
      name: category.name,
      type: category.type,
      sort: category.sort,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // 打开删除确认对话框
  const handleDelete = (category: Category) => {
    setCurrentCategory(category);
    setDeleteDialogOpen(true);
  };

  // 确认删除分类
  const handleConfirmDelete = async () => {
    if (!currentCategory) return;

    try {
      await deleteCategory(currentCategory.id);
      setDeleteDialogOpen(false);
      setCurrentCategory(null);
      toast.success("删除分类成功");
      // 操作成功后刷新列表
      fetchData();
    } catch (error) {
      console.error("删除分类失败:", error);
      setDeleteDialogOpen(false);
      setErrorMessage(getErrorMessage(error) || "删除分类失败，请稍后重试");
      setErrorDialogOpen(true);
    }
  };

  // 提交表单
  const handleSubmitForm = async (continueAdd: boolean = false) => {
    // 校验所有字段
    const errors: Record<string, string> = {};
    errors.name = validateField("name", formData.name);
    errors.sort = validateField("sort", formData.sort);

    setFormErrors(errors);

    // 检查是否有错误
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      setErrorMessage("请检查表单信息，确保所有字段填写正确");
      setErrorDialogOpen(true);
      return;
    }

    setFormLoading(true);
    try {
      if (isEditMode) {
        // 修改分类
        await updateCategory(formData);
        toast.success("修改分类成功");
      } else {
        // 新增分类 - 不发送 id
        const newCategoryData: Omit<CategoryFormData, "id"> = {
          name: formData.name,
          type: formData.type,
          sort: formData.sort,
        };
        await saveCategory(newCategoryData);
        toast.success("新增分类成功");
      }
      
      if (continueAdd) {
        // 保存并继续添加：重置表单，保持对话框打开
        setFormData({
          name: "",
          type: formType,
          sort: 0,
        });
        setFormErrors({});
        // 刷新列表
        fetchData();
      } else {
        // 普通保存：关闭对话框
        setFormDialogOpen(false);
        // 刷新列表
        fetchData();
      }
    } catch (error) {
      console.error(`${isEditMode ? "修改" : "新增"}分类失败:`, error);
      setErrorMessage(getErrorMessage(error) || `${isEditMode ? "修改" : "新增"}分类失败，请稍后重试`);
      setErrorDialogOpen(true);
    } finally {
      setFormLoading(false);
    }
  };

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        {/* 左侧：搜索区域 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="category-name" className="whitespace-nowrap text-sm">
              分类名称：
            </Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="请填写分类名称"
              className="w-[200px] h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="category-type" className="whitespace-nowrap text-sm">
              分类类型：
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  id="category-type"
                  className="w-[150px] justify-between h-8"
                >
                  {categoryType || "请选择"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setCategoryType("菜品分类");
                  }}
                >
                  菜品分类
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCategoryType("套餐分类");
                  }}
                >
                  套餐分类
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCategoryType("");
                  }}
                >
                  全部
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

        {/* 右侧：添加按钮 */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-gray-600 text-white hover:bg-gray-700 h-8"
            onClick={handleAddDishCategory}
          >
            <Plus className="h-4 w-4" />
            新增菜品分类
          </Button>
          <Button
            size="sm"
            className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90 h-8"
            onClick={handleAddComboCategory}
          >
            <Plus className="h-4 w-4" />
            新增套餐分类
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
                      <TableHead className="font-semibold">分类名称</TableHead>
                      <TableHead className="font-semibold">分类类型</TableHead>
                      <TableHead className="font-semibold">排序</TableHead>
                      <TableHead className="font-semibold">状态</TableHead>
                      <TableHead className="font-semibold">操作时间</TableHead>
                      <TableHead className="font-semibold">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="text-muted-foreground">暂无数据</div>
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
                          <TableCell>{getCategoryTypeText(item.type)}</TableCell>
                          <TableCell>{item.sort}</TableCell>
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
                                {item.status === 1 ? "启用" : "禁用"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.updateTime || item.createTime}
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
                                {item.status === 1 ? "禁用" : "启用"}
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

      {/* 确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认操作</AlertDialogTitle>
            <AlertDialogDescription>
              {currentCategory && (
                <>
                  确定要
                  {currentCategory.status === 1 ? (
                    <span className="text-destructive font-semibold">禁用</span>
                  ) : (
                    <span className="text-green-600 font-semibold">启用</span>
                  )}
                  分类"<span className="font-semibold">{currentCategory.name}</span>"吗？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={
                currentCategory?.status === 1
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
              {currentCategory && (
                <>
                  确定要删除分类"<span className="font-semibold">{currentCategory.name}</span>"吗？
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

      {/* 新增/修改分类表单对话框 */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? "修改分类"
                : formType === 1
                ? "新增菜品分类"
                : "新增套餐分类"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="form-name" className="text-sm">
                <span className="text-destructive">*</span> 分类名称：
              </Label>
              <Input
                id="form-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  // 清除该字段的错误信息
                  if (formErrors.name) {
                    setFormErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                onBlur={(e) => handleFieldBlur("name", e.target.value)}
                placeholder="请输入分类名称"
                disabled={formLoading}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="form-sort" className="text-sm">
                <span className="text-destructive">*</span> 排序：
              </Label>
              <Input
                id="form-sort"
                type="number"
                value={formData.sort}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number(e.target.value);
                  setFormData({ ...formData, sort: value });
                  // 清除该字段的错误信息
                  if (formErrors.sort) {
                    setFormErrors((prev) => ({ ...prev, sort: "" }));
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value === "" ? 0 : Number(e.target.value);
                  handleFieldBlur("sort", value);
                }}
                placeholder="请输入排序"
                disabled={formLoading}
                className={formErrors.sort ? "border-destructive" : ""}
              />
              {formErrors.sort && (
                <p className="text-sm text-destructive">{formErrors.sort}</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={formLoading}
            >
              取消
            </Button>
            <Button
              onClick={() => handleSubmitForm(false)}
              disabled={formLoading}
              className="bg-gray-600 text-white hover:bg-gray-700"
            >
              {formLoading ? "提交中..." : "确定"}
            </Button>
            {!isEditMode && (
              <Button
                onClick={() => handleSubmitForm(true)}
                disabled={formLoading}
                className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90"
              >
                {formLoading ? "提交中..." : "保存并继续添加"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}