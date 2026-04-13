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
import { Search, Plus, ChevronDown, Upload, X } from "lucide-react";
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
  getSetmealListAPI,
  deleteSetmealAPI,
  enableOrDisableSetmealAPI,
  getSetmealByIdAPI,
  saveSetmealAPI,
  updateSetmealAPI,
  uploadImage,
  type Setmeal,
  type SetmealFormData,
  type SetmealPageQuery,
} from "@/api/setmeal";
import { getCategoryListByTypeAPI, type Category } from "@/api/category";
import { getDishListAPI, type Dish } from "@/api/dish";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { SetmealDish } from "@/api/setmeal";

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
      return `Request failed (${axiosError.response.status})`;
    }
  }
  
  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message?: string };
    if (err.message) {
      return err.message;
    }
  }
  
  return "Something went wrong. Please try again.";
};

export default function Setmeal() {
  
  // 定义状态
  const [list, setList] = useState<Setmeal[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]); // 分类列表（用于下拉选择）
  const [setmealName, setSetmealName] = useState(""); // 搜索框绑定的值
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined); // 选中的分类ID
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined); // 选中的状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // 选中的套餐ID
  const [total, setTotal] = useState(0); // 总条数
  const [loading, setLoading] = useState(false); // 加载状态
  const [reqData, setReqData] = useState<SetmealPageQuery>({
    page: 1,
    pageSize: 10,
    name: undefined,
    categoryId: undefined,
    status: undefined,
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // 确认对话框状态（启用/禁用）
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // 删除确认对话框状态
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false); // 批量删除确认对话框
  const [currentSetmeal, setCurrentSetmeal] = useState<Setmeal | null>(null); // 当前操作的套餐
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
  
  // 添加菜品对话框相关状态
  const [dishDialogOpen, setDishDialogOpen] = useState(false); // 添加菜品对话框状态
  const [dishCategories, setDishCategories] = useState<Category[]>([]); // 菜品分类列表
  const [selectedDishCategoryId, setSelectedDishCategoryId] = useState<string | null>(null); // 选中的菜品分类ID
  const [dishList, setDishList] = useState<Dish[]>([]); // 菜品列表（当前分类）
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set()); // 临时选中的菜品ID（用于对话框）
  const [selectedDishesInfo, setSelectedDishesInfo] = useState<Map<string, Dish>>(new Map()); // 已选菜品的完整信息（用于右侧显示）
  const [dishListLoading, setDishListLoading] = useState(false); // 菜品列表加载状态

  // 获取分类列表（用于下拉选择）
  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        const categories = await getCategoryListByTypeAPI({ type: 2 }); // 2: 套餐分类
        setCategoryList(categories);
      } catch (error) {
        console.error("获取分类列表失败:", error);
        toast.error("Failed to load categories", {
          description: getErrorMessage(error) || "Please try again"
        });
      }
    };
    fetchCategoryList();
  }, []);

  // 获取菜品分类列表（用于添加菜品对话框）
  useEffect(() => {
    const fetchDishCategories = async () => {
      try {
        const categories = await getCategoryListByTypeAPI({ type: 1 }); // 1: 菜品分类
        setDishCategories(categories);
        // 默认选中第一个分类
        if (categories.length > 0) {
          setSelectedDishCategoryId(categories[0].id);
        }
      } catch (error) {
        console.error("获取菜品分类列表失败:", error);
        toast.error("Failed to load dish categories", {
          description: getErrorMessage(error) || "Please try again"
        });
      }
    };
    if (dishDialogOpen) {
      fetchDishCategories();
    }
  }, [dishDialogOpen]);

  // 根据分类获取菜品列表
  useEffect(() => {
    const fetchDishList = async () => {
      if (!selectedDishCategoryId || !dishDialogOpen) return;
      
      setDishListLoading(true);
      try {
        const res = await getDishListAPI({
          categoryId: Number(selectedDishCategoryId),
          status: 1, // 只查询起售的菜品
          page: 1,
          pageSize: 1000, // 获取所有菜品
        });
        setDishList(res.records);
      } catch (error) {
        console.error("获取菜品列表失败:", error);
        toast.error("Failed to load dishes", {
          description: getErrorMessage(error) || "Please try again"
        });
      } finally {
        setDishListLoading(false);
      }
    };
    fetchDishList();
  }, [selectedDishCategoryId, dishDialogOpen]);

  useEffect(() => {
    // 定义在内部，无需 useCallback
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("发起请求，参数:", reqData);
        const res = await getSetmealListAPI({
          ...reqData,
          name: reqData.name || undefined,
          categoryId: reqData.categoryId,
          status: reqData.status,
        });
        setList(res.records);
        setTotal(Number(res.total));
        // 清空选中项
        setSelectedIds([]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load setmeals", {
          description: getErrorMessage(error) || "Please try again"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // 🔥 核心魔法：只依赖 reqData
  }, [reqData]);

  const reloadData = () => {
    // 复制一份自己，内容一样，但内存地址变了
    setReqData((prev) => ({ ...prev }));
  };

  // 搜索功能
  const handleSearch = () => {
    setReqData((prev) => ({
      ...prev,
      page: 1, // 搜索新词，回到第一页
      name: setmealName || undefined,
      categoryId: selectedCategoryId,
      status: selectedStatus,
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
    const action = newStatus === 1 ? "listed" : "delisted";

    try {
      await enableOrDisableSetmealAPI(newStatus, currentSetmeal.id);
      setConfirmDialogOpen(false);
      setCurrentSetmeal(null);
      toast.success(`Setmeal ${action}`);
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error(`${action}套餐失败:`, error);
      setConfirmDialogOpen(false);
      toast.error("Failed to update setmeal status", {
        description: getErrorMessage(error) || "Please try again"
      });
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
      await deleteSetmealAPI([currentSetmeal.id]);
      setDeleteDialogOpen(false);
      setCurrentSetmeal(null);
      toast.success("Setmeal deleted");
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error("删除套餐失败:", error);
      setDeleteDialogOpen(false);
      toast.error("Failed to delete setmeal", {
        description: getErrorMessage(error) || "Please try again"
      });
    }
  };

  // 打开批量删除确认对话框
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Nothing selected", {
        description: "Select at least one setmeal"
      });
      return;
    }
    setBatchDeleteDialogOpen(true);
  };

  // 确认批量删除
  const handleConfirmBatchDelete = async () => {
    try {
      await deleteSetmealAPI(selectedIds);
      setBatchDeleteDialogOpen(false);
      setSelectedIds([]);
      toast.success(`Deleted ${selectedIds.length} setmeal(s)`);
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error("批量删除套餐失败:", error);
      setBatchDeleteDialogOpen(false);
      toast.error("Batch delete failed", {
        description: getErrorMessage(error) || "Please try again"
      });
    }
  };

  // 校验单个字段
  const validateField = (field: string, value: string | number | undefined | null): string => {
    switch (field) {
      case "name":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "Setmeal name is required";
        }
        return "";
      case "categoryId": {
        if (!value || value === 0) {
          return "Category is required";
        }
        return "";
      }
      case "price": {
        if (value === undefined || value === null || value === "") {
          return "Price is required";
        }
        const priceNum = Number(value);
        if (isNaN(priceNum) || priceNum <= 0) {
          return "Price must be greater than 0";
        }
        return "";
      }
      case "image": {
        if (!value || (typeof value === "string" && !value.trim())) {
          return "Image is required";
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

  // 打开添加菜品对话框
  const handleOpenDishDialog = async () => {
    // 初始化已选菜品ID（从formData.setmealDishes中获取）
    const existingDishIds = new Set(
      (formData.setmealDishes || []).map((dish) => dish.dishId)
    );
    setSelectedDishIds(existingDishIds);
    setDishDialogOpen(true);
    
    // 如果有已选菜品，需要加载它们的完整信息到selectedDishesInfo中
    if (existingDishIds.size > 0) {
      try {
        // 获取所有已选菜品的详细信息（不限制分类）
        const allDishesRes = await getDishListAPI({
          status: 1,
          page: 1,
          pageSize: 1000,
        });
        // 将已选菜品信息存储到Map中，用于右侧显示
        const dishesMap = new Map<string, Dish>();
        allDishesRes.records.forEach((dish) => {
          if (existingDishIds.has(dish.id)) {
            dishesMap.set(dish.id, dish);
          }
        });
        setSelectedDishesInfo(dishesMap);
      } catch (error) {
        console.error("加载已选菜品信息失败:", error);
        toast.error("Failed to load selected dishes", {
          description: getErrorMessage(error) || "Please try again"
        });
      }
    } else {
      // 如果没有已选菜品，清空Map
      setSelectedDishesInfo(new Map());
    }
  };

  // 处理菜品选择
  const handleDishSelect = (dishId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedDishIds);
    if (checked) {
      newSelectedIds.add(dishId);
      // 将选中的菜品信息添加到selectedDishesInfo中
      const dish = dishList.find((d) => d.id === dishId);
      if (dish) {
        setSelectedDishesInfo((prev) => {
          const newMap = new Map(prev);
          newMap.set(dishId, dish);
          return newMap;
        });
      }
    } else {
      newSelectedIds.delete(dishId);
      // 从selectedDishesInfo中移除
      setSelectedDishesInfo((prev) => {
        const newMap = new Map(prev);
        newMap.delete(dishId);
        return newMap;
      });
    }
    setSelectedDishIds(newSelectedIds);
  };

  // 确认添加菜品
  const handleConfirmAddDishes = async () => {
    // 获取已选中的菜品信息
    const selectedDishes: SetmealDish[] = [];
    
    for (const dishId of selectedDishIds) {
      // 检查是否已经存在于formData中
      const existingDish = formData.setmealDishes?.find((d) => d.dishId === dishId);
      if (existingDish) {
        selectedDishes.push(existingDish); // 保留原有的份数等信息
      } else {
        // 从dishList中查找，如果找不到则从API获取
        let dish = dishList.find((d) => d.id === dishId);
        if (!dish) {
          try {
            // 如果不在当前列表中，尝试获取单个菜品信息
            const allDishesRes = await getDishListAPI({
              status: 1,
              page: 1,
              pageSize: 1000,
            });
            dish = allDishesRes.records.find((d) => d.id === dishId);
          } catch (error) {
            console.error("获取菜品信息失败:", error);
          }
        }
        selectedDishes.push({
          dishId,
          name: dish?.name || "",
          price: dish?.price || 0,
          copies: 1, // 默认份数为1
        });
      }
    }

    // 更新formData
    setFormData({
      ...formData,
      setmealDishes: selectedDishes,
    });

    setDishDialogOpen(false);
    toast.success("Dishes updated");
  };

  // 删除已选菜品
  const handleRemoveDish = (dishId: string) => {
    const newSetmealDishes = (formData.setmealDishes || []).filter(
      (dish) => dish.dishId !== dishId
    );
    setFormData({
      ...formData,
      setmealDishes: newSetmealDishes,
    });
  };

  // 更新菜品份数
  const handleUpdateDishCopies = (dishId: string, copies: number) => {
    if (copies < 1) return;
    const newSetmealDishes = (formData.setmealDishes || []).map((dish) =>
      dish.dishId === dishId ? { ...dish, copies } : dish
    );
    setFormData({
      ...formData,
      setmealDishes: newSetmealDishes,
    });
  };

  // 打开修改表单
  const handleEdit = async (setmeal: Setmeal) => {
    setIsEditMode(true);
    setFormErrors({});
    setFormDialogOpen(true); // ✅ 立即弹窗
    setFormLoading(true); // ✅ 立即显示骨架屏/转圈

    try {
      const setmealDetail = await getSetmealByIdAPI(setmeal.id);
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
    } catch (error) {
      console.error("获取套餐详情失败:", error);
      toast.error("Failed to load setmeal", {
        description: getErrorMessage(error) || "Please try again"
      });
      setFormDialogOpen(false); // 失败了关掉弹窗是合理的
    } finally {
      // ✅ 放在这里！
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
      toast.error("Invalid image type", {
        description: "Only PNG, JPEG, or JPG images are allowed"
      });
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Image must be 10MB or smaller"
      });
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
      toast.error("Upload failed", {
        description: getErrorMessage(error) || "Please try again"
      });
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
      toast.error("Validation failed", {
        description: "Please fill in all required fields"
      });
      return;
    }

    setFormLoading(true);
    try {
      if (isEditMode) {
        // 修改套餐
        await updateSetmealAPI({
          ...formData,
        });
        toast.success("Setmeal updated");
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
        await saveSetmealAPI(newSetmealData);
        toast.success("Setmeal created");
      }
      setFormDialogOpen(false);
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error(`${isEditMode ? "修改" : "新增"}套餐失败:`, error);
      toast.error(`${isEditMode ? "Failed to update" : "Failed to create"} setmeal`, {
        description: getErrorMessage(error) || "Please try again"
      });
    } finally {
      setFormLoading(false);
    }
  };

  // 计算总页数
  const totalPages = Math.ceil(total / reqData.pageSize);
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
              Name:
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
                            className="w-[200px] h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="setmeal-category" className="whitespace-nowrap text-sm">
              Category:
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
                    ? categoryList.find((c) => c.id === selectedCategoryId.toString())?.name || "Select"
                    : "Select"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCategoryId(undefined);
                  }}
                >
                  All
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
              Sale status:
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
                    ? "Select"
                    : selectedStatus === 1
                    ? "On sale"
                    : "Off sale"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStatus(undefined);
                  }}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStatus(1);
                  }}
                >
                  On sale
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStatus(0);
                  }}
                >
                  Off sale
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
            Search
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
            Batch delete
          </Button>
          <Button
            size="sm"
            className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90 h-8"
            onClick={handleAddSetmeal}
          >
            <Plus className="h-4 w-4" />
            New setmeal
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
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Image</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold">Sale status</TableHead>
                      <TableHead className="font-semibold">Last updated</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="text-muted-foreground">No data</div>
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
                                No image
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
                                {item.status === 1 ? "On sale" : "Off sale"}
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
                                Edit
                              </button>
                              <Separator orientation="vertical" className="h-4" />
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-destructive hover:text-destructive/80 hover:underline text-sm font-medium cursor-pointer transition-colors"
                              >
                                Delete
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
                                {item.status === 1 ? "Disable" : "Enable"}
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

      {/* 启用/禁用确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>
              {currentSetmeal && (
                <>
                  {currentSetmeal.status === 1 ? (
                    <>Disable <span className="font-semibold">{currentSetmeal.name}</span>?</>
                  ) : (
                    <>Enable <span className="font-semibold">{currentSetmeal.name}</span>?</>
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
                currentSetmeal?.status === 1
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete setmeal</AlertDialogTitle>
            <AlertDialogDescription>
              {currentSetmeal && (
                <>
                  Delete <span className="font-semibold">{currentSetmeal.name}</span>? This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
            <AlertDialogTitle>Batch delete</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {selectedIds.length} selected setmeal(s)? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 新增/修改套餐表单对话框 */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit setmeal" : "New setmeal"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 套餐名称 */}
            <div className="grid gap-2">
              <Label htmlFor="form-name" className="text-sm">
                <span className="text-destructive">*</span> Name:
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
                <span className="text-destructive">*</span> Category:
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
                      ? categoryList.find((c) => c.id === formData.categoryId.toString())?.name || "Select"
                      : "Select"}
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
                <span className="text-destructive">*</span> Price:
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
                placeholder="Price"
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
                <span className="text-destructive">*</span> Image:
              </Label>
              <div className="flex items-start gap-4">
                <div
                  className={`border-2 border-dashed border-muted-foreground/25 rounded-md w-32 h-32 flex items-center justify-center relative overflow-hidden ${
                    formLoading || imageUploading
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:border-primary transition-colors"
                  }`}
                  onClick={() => {
                    if (!formLoading && !imageUploading) {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Setmeal"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                  {imageUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm">Uploading…</span>
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
                  <p>Max file size 10MB</p>
                  <p>PNG, JPEG, or JPG only</p>
                  <p>Square images work best</p>
                </div>
              </div>
              {formErrors.image && (
                <p className="text-sm text-destructive">{formErrors.image}</p>
              )}
            </div>

            {/* 套餐菜品 */}
            <div className="grid gap-2">
              <Label className="text-sm">
                <span className="text-destructive">*</span> Dishes:
              </Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleOpenDishDialog}
                  disabled={formLoading}
                  className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90 w-fit"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add dishes
                </Button>
                {/* 已选菜品列表 */}
                {formData.setmealDishes && formData.setmealDishes.length > 0 && (
                  <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                    {formData.setmealDishes.map((dish) => (
                      <div
                        key={dish.dishId}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{dish.name || "Unknown dish"}</div>
                          <div className="text-sm text-muted-foreground">
                            ¥{dish.price?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">Qty:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={dish.copies}
                            onChange={(e) =>
                              handleUpdateDishCopies(
                                dish.dishId,
                                parseInt(e.target.value) || 1
                              )
                            }
                            disabled={formLoading}
                            className="w-16 h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDish(dish.dishId)}
                            disabled={formLoading}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 套餐描述 */}
            <div className="grid gap-2">
              <Label htmlFor="form-description" className="text-sm">
                Description:
              </Label>
              <Textarea
                id="form-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
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
              Cancel
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={formLoading || imageUploading}
              className="bg-gray-600 text-white hover:bg-gray-700"
            >
              {formLoading ? "Loading…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加菜品对话框 */}
      <Dialog open={dishDialogOpen} onOpenChange={setDishDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add dishes</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex gap-4 min-h-[500px]">
            {/* 左侧：分类列表 */}
            <div className="w-48 border-r pr-4 overflow-y-auto">
              <div className="space-y-1">
                {dishCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedDishCategoryId(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedDishCategoryId === category.id
                        ? "bg-[#ffc200] text-black font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 中间：菜品列表 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 菜品列表 */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {dishListLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading…</div>
                  </div>
                ) : dishList.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">No dishes</div>
                  </div>
                ) : (
                  dishList.map((dish) => (
                      <div
                        key={dish.id}
                        className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedDishIds.has(dish.id)}
                          onCheckedChange={(checked) =>
                            handleDishSelect(dish.id, checked === true)
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium">{dish.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{dish.status === 1 ? "On sale" : "Off sale"}</span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>¥{dish.price?.toFixed(2) || "0.00"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* 右侧：已选菜品 */}
            <div className="w-64 border-l pl-4 flex flex-col overflow-hidden">
              <div className="font-semibold mb-3">
                Selected ({selectedDishIds.size})
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {Array.from(selectedDishIds).length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No dishes selected
                  </div>
                ) : (
                  Array.from(selectedDishIds).map((dishId) => {
                    // 优先从selectedDishesInfo中获取完整信息
                    let dish = selectedDishesInfo.get(dishId);
                    
                    // 如果selectedDishesInfo中没有，尝试从当前dishList中查找
                    if (!dish) {
                      dish = dishList.find((d) => d.id === dishId);
                      // 如果找到了，更新到selectedDishesInfo中
                      if (dish) {
                        setSelectedDishesInfo((prev) => {
                          const newMap = new Map(prev);
                          newMap.set(dishId, dish!);
                          return newMap;
                        });
                      }
                    }
                    
                    // 如果还是找不到，从formData中查找（作为后备方案）
                    if (!dish) {
                      const existingDish = formData.setmealDishes?.find(
                        (d) => d.dishId === dishId
                      );
                      if (existingDish) {
                        dish = {
                          id: dishId,
                          name: existingDish.name || "",
                          price: existingDish.price || 0,
                        } as Dish;
                      }
                    }
                    
                    if (!dish) return null;
                    return (
                      <div
                        key={dishId}
                        className="p-2 border rounded-md bg-muted/30"
                      >
                        <div className="font-medium text-sm">{dish.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ¥{dish.price?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDishDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAddDishes}
              className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90"
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
