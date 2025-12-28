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
import { Search, Plus, ChevronDown, X, Upload } from "lucide-react";
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
  getDishList,
  deleteDish,
  enableOrDisableDish,
  getDishById,
  saveDish,
  updateDish,
  uploadImage,
  type Dish,
  type DishFormData,
  type DishFlavor,
  type DishPageQuery,
} from "@/api/dish";
import { getCategoryListByType, type Category } from "@/api/category";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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

// 口味类型定义
type FlavorType = "温度" | "甜味" | "忌口" | "辣度";

// 口味类型选项映射
const FLAVOR_OPTIONS: Record<FlavorType, string[]> = {
  温度: ["热饮", "常温", "去冰", "少冰", "多冰"],
  甜味: ["无糖", "少糖", "半糖", "多糖", "全糖"],
  忌口: ["不要葱", "不要蒜", "不要香菜", "不要辣"],
  辣度: ["不辣", "微辣", "中辣", "重辣"],
};

// 扩展的口味数据类型（包含类型和已删除的选项）
interface ExtendedFlavor {
  type?: FlavorType; // 口味类型
  name: string; // 口味名称（用于后端，对应原来的name）
  value: string; // 口味值（用于后端，对应原来的value，存储剩余的选项）
  removedOptions?: string[]; // 已删除的选项列表
}

export default function Dish() {
  
  // 定义状态
  const [list, setList] = useState<Dish[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]); // 分类列表（用于下拉选择）
  const [dishName, setDishName] = useState(""); // 搜索框绑定的值
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined); // 选中的分类ID
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined); // 选中的状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // 选中的菜品ID
  const [total, setTotal] = useState(0); // 总条数
  const [loading, setLoading] = useState(false); // 加载状态
  const [reqData, setReqData] = useState<DishPageQuery>({
    page: 1,
    pageSize: 10,
    name: undefined,
    categoryId: undefined,
    status: undefined,
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // 确认对话框状态（启用/禁用）
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // 删除确认对话框状态
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false); // 批量删除确认对话框
  const [currentDish, setCurrentDish] = useState<Dish | null>(null); // 当前操作的菜品
  const [formDialogOpen, setFormDialogOpen] = useState(false); // 表单对话框状态
  const [isEditMode, setIsEditMode] = useState(false); // 是否为编辑模式
  const [formData, setFormData] = useState<DishFormData>({
    name: "",
    categoryId: 0,
    price: 0,
    image: "",
    description: "",
    status: 1,
    flavors: [],
  }); // 表单数据
  const [extendedFlavors, setExtendedFlavors] = useState<ExtendedFlavor[]>([]); // 扩展的口味数据（用于UI显示）
  const [formLoading, setFormLoading] = useState(false); // 表单提交加载状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // 表单错误信息
  const [imagePreview, setImagePreview] = useState<string>(""); // 图片预览
  const [imageUploading, setImageUploading] = useState(false); // 图片上传中
  const fileInputRef = useRef<HTMLInputElement>(null);


  // 获取分类列表（用于下拉选择）
  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        const categories = await getCategoryListByType({ type: 1 }); // 1: 菜品分类
        setCategoryList(categories);
      } catch (error) {
        console.error("获取分类列表失败:", error);
      }
    };
    fetchCategoryList();
  }, []);

  useEffect(() => {
    // 定义在内部，无需 useCallback
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("发起请求，参数:", reqData);
        const res = await getDishList({
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
        toast.error("获取菜品列表失败", {
          description: getErrorMessage(error) || "请稍后重试"
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
      name: dishName || undefined,
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
  const handleSelectItem = (dishId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, dishId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== dishId));
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
  const handleOpenConfirmDialog = (dish: Dish) => {
    setCurrentDish(dish);
    setConfirmDialogOpen(true);
  };

  // 确认启用/禁用菜品
  const handleConfirmToggleStatus = async () => {
    if (!currentDish) return;

    const newStatus = currentDish.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? "起售" : "停售";

    try {
      await enableOrDisableDish(newStatus, currentDish.id);
      setConfirmDialogOpen(false);
      setCurrentDish(null);
      toast.success(`${action}菜品成功`);
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error(`${action}菜品失败:`, error);
      setConfirmDialogOpen(false);
      toast.error(`${action}菜品失败`, {
        description: getErrorMessage(error) || "请稍后重试"
      });
    }
  };

  // 打开删除确认对话框
  const handleDelete = (dish: Dish) => {
    setCurrentDish(dish);
    setDeleteDialogOpen(true);
  };

  // 确认删除菜品
  const handleConfirmDelete = async () => {
    if (!currentDish) return;

    try {
      await deleteDish([currentDish.id]);
      setDeleteDialogOpen(false);
      setCurrentDish(null);
      toast.success("删除菜品成功");
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error("删除菜品失败:", error);
      setDeleteDialogOpen(false);
      toast.error("删除菜品失败", {
        description: getErrorMessage(error) || "请稍后重试"
      });
    }
  };

  // 打开批量删除确认对话框
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("批量删除失败", {
        description: "请至少选择一个菜品"
      });
      return;
    }
    setBatchDeleteDialogOpen(true);
  };

  // 确认批量删除
  const handleConfirmBatchDelete = async () => {
    try {
      await deleteDish(selectedIds);
      setBatchDeleteDialogOpen(false);
      setSelectedIds([]);
      toast.success(`批量删除${selectedIds.length}个菜品成功`);
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error("批量删除菜品失败:", error);
      setBatchDeleteDialogOpen(false);
      toast.error("批量删除菜品失败", {
        description: getErrorMessage(error) || "请稍后重试"
      });
    }
  };

  // 校验单个字段
  const validateField = (field: string, value: string | number | undefined | null): string => {
    switch (field) {
      case "name":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "菜品名称不能为空";
        }
        return "";
      case "categoryId": {
        if (!value || value === 0) {
          return "菜品分类不能为空";
        }
        return "";
      }
      case "price": {
        if (value === undefined || value === null || value === "") {
          return "菜品价格不能为空";
        }
        const priceNum = Number(value);
        if (isNaN(priceNum) || priceNum <= 0) {
          return "菜品价格必须大于0";
        }
        return "";
      }
      case "image": {
        if (!value || (typeof value === "string" && !value.trim())) {
          return "菜品图片不能为空";
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

  // 将后端格式的口味转换为扩展格式
  const convertFlavorsToExtended = (flavors: DishFlavor[]): ExtendedFlavor[] => {
    if (!flavors || flavors.length === 0) {
      return [];
    }
    
    return flavors.map((flavor) => {
      const type = flavor.name as FlavorType;
      // 验证类型是否有效
      if (!FLAVOR_OPTIONS[type]) {
        return null;
      }
      
      // 解析 value（JSON 字符串）为选项数组
      let currentOptions: string[] = [];
      try {
        if (flavor.value) {
          // value 可能是 JSON 字符串，需要解析
          currentOptions = JSON.parse(flavor.value);
        }
      } catch (e) {
        // 如果解析失败，可能是旧格式（逗号分隔），尝试兼容
        currentOptions = flavor.value.split(",").filter(Boolean);
      }
      
      // 计算已删除的选项
      const allOptions = FLAVOR_OPTIONS[type] || [];
      const removedOptions = allOptions.filter(
        (opt) => !currentOptions.includes(opt)
      );
      
      return {
        id: flavor.id, // 保留 id（编辑时使用）
        dishId: flavor.dishId, // 保留 dishId（编辑时使用）
        type,
        name: flavor.name,
        value: flavor.value, // 保留原始 value（JSON 字符串）
        removedOptions,
      };
    }).filter((item): item is ExtendedFlavor => item !== null);
  };

  // 将扩展格式的口味转换为后端格式
  const convertExtendedToFlavors = (extended: ExtendedFlavor[]): DishFlavor[] => {
    const flavors: DishFlavor[] = [];
    
    extended.forEach((item) => {
      if (item.type && item.name) {
        // 获取当前剩余的选项
        const allOptions = FLAVOR_OPTIONS[item.type] || [];
        const currentOptions = allOptions.filter(
          (opt) => !(item.removedOptions || []).includes(opt)
        );
        
        // 将选项数组转换为 JSON 字符串
        const valueJsonString = JSON.stringify(currentOptions);
        
        // 每个口味类型只创建一个条目，value 是 JSON 字符串
        flavors.push({
          id: item.id, // 如果有 id，保留它（编辑时）
          dishId: item.dishId, // 如果有 dishId，保留它（编辑时）
          name: item.name,
          value: valueJsonString, // JSON 字符串格式：'["无糖","少糖","半糖","多糖","全糖"]'
        });
      }
    });
    
    return flavors;
  };

  // 打开新增菜品表单
  const handleAddDish = () => {
    setIsEditMode(false);
    setFormData({
      name: "",
      categoryId: 0,
      price: 0,
      image: "",
      description: "",
      status: 1,
      flavors: [],
    });
    setExtendedFlavors([]);
    setImagePreview("");
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // 打开修改表单
  const handleEdit = async (dish: Dish) => {
    setIsEditMode(true);
    setFormErrors({});
    setFormDialogOpen(true); // ✅ 立即弹窗
    setFormLoading(true); // ✅ 立即显示骨架屏/转圈

    try {
      const dishDetail = await getDishById(dish.id);
      const flavors = dishDetail.flavors || [];
      setFormData({
        id: dishDetail.id,
        name: dishDetail.name,
        categoryId: Number(dishDetail.categoryId),
        price: dishDetail.price,
        image: dishDetail.image || "",
        description: dishDetail.description || "",
        status: dishDetail.status,
        flavors: flavors,
      });
      // 转换口味数据（保留 id 和 dishId）
      const extendedFlavors = convertFlavorsToExtended(flavors);
      // 将 id 和 dishId 也传递到扩展格式中
      extendedFlavors.forEach((extended, index) => {
        if (flavors[index]) {
          extended.id = flavors[index].id;
          extended.dishId = flavors[index].dishId;
        }
      });
      setExtendedFlavors(extendedFlavors);
      setImagePreview(dishDetail.image || "");
    } catch (error) {
      console.error("获取菜品详情失败:", error);
      toast.error("获取菜品详情失败", {
        description: getErrorMessage(error) || "请稍后重试"
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
      toast.error("图片格式错误", {
        description: "仅能上传PNG、JPEG、JPG类型图片"
      });
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片大小超限", {
        description: "图片大小不超过10M"
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
      toast.error("图片上传失败", {
        description: getErrorMessage(error) || "请稍后重试"
      });
    } finally {
      setImageUploading(false);
    }
  };

  // 添加口味
  const handleAddFlavor = () => {
    if (extendedFlavors.length >= 4) {
      toast.error("口味数量超限", {
        description: "最多只能添加4个口味"
      });
      return;
    }
    setExtendedFlavors([
      ...extendedFlavors,
      {
        type: undefined,
        name: "",
        value: "",
        removedOptions: [],
      },
    ]);
  };

  // 删除口味
  const handleRemoveFlavor = (index: number) => {
    const newFlavors = [...extendedFlavors];
    newFlavors.splice(index, 1);
    setExtendedFlavors(newFlavors);
    // 同步更新formData
    setFormData({
      ...formData,
      flavors: convertExtendedToFlavors(newFlavors),
    });
  };

  // 更新口味类型
  const handleUpdateFlavorType = (index: number, type: FlavorType) => {
    const newFlavors = [...extendedFlavors];
    newFlavors[index] = {
      type,
      name: type,
      value: "",
      removedOptions: [], // 初始时所有选项都显示
    };
    setExtendedFlavors(newFlavors);
    // 同步更新formData
    setFormData({
      ...formData,
      flavors: convertExtendedToFlavors(newFlavors),
    });
  };

  // 删除口味选项（点击选项删除）
  const handleRemoveFlavorOption = (flavorIndex: number, option: string) => {
    const newFlavors = [...extendedFlavors];
    const flavor = newFlavors[flavorIndex];
    if (!flavor.removedOptions) {
      flavor.removedOptions = [];
    }
    flavor.removedOptions.push(option);
    setExtendedFlavors(newFlavors);
    // 同步更新formData
    setFormData({
      ...formData,
      flavors: convertExtendedToFlavors(newFlavors),
    });
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
      toast.error("表单校验失败", {
        description: "请检查表单信息，确保所有必填字段填写正确"
      });
      return;
    }

    setFormLoading(true);
    try {
      // 将扩展格式的口味转换为后端格式
      const flavors = convertExtendedToFlavors(extendedFlavors);
      
      if (isEditMode) {
        // 修改菜品
        await updateDish({
          ...formData,
          flavors,
        });
        toast.success("修改菜品成功");
      } else {
        // 新增菜品 - 不发送 id
        const newDishData: Omit<DishFormData, "id"> = {
          name: formData.name,
          categoryId: formData.categoryId,
          price: formData.price,
          image: formData.image,
          description: formData.description,
          status: formData.status,
          flavors: flavors,
        };
        await saveDish(newDishData);
        toast.success("新增菜品成功");
      }
      setFormDialogOpen(false);
      // 操作成功后刷新列表
      reloadData();
    } catch (error) {
      console.error(`${isEditMode ? "修改" : "新增"}菜品失败:`, error);
      toast.error(`${isEditMode ? "修改" : "新增"}菜品失败`, {
        description: getErrorMessage(error) || "请稍后重试"
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
            <Label htmlFor="dish-name" className="whitespace-nowrap text-sm">
              菜品名称：
            </Label>
            <Input
              id="dish-name"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="请填写菜品名称"
              className="w-[200px] h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dish-category" className="whitespace-nowrap text-sm">
              菜品分类：
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  id="dish-category"
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
            <Label htmlFor="dish-status" className="whitespace-nowrap text-sm">
              售卖状态：
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  id="dish-status"
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
            onClick={handleAddDish}
          >
            <Plus className="h-4 w-4" />
            新建菜品
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
                      <TableHead className="font-semibold">菜品名称</TableHead>
                      <TableHead className="font-semibold">图片</TableHead>
                      <TableHead className="font-semibold">菜品分类</TableHead>
                      <TableHead className="font-semibold">售价</TableHead>
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
                      共 {total} 条记录，第 {reqData.page} / {totalPages} 页
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
            <AlertDialogTitle>确认操作</AlertDialogTitle>
            <AlertDialogDescription>
              {currentDish && (
                <>
                  确定要
                  {currentDish.status === 1 ? (
                    <span className="text-destructive font-semibold">停售</span>
                  ) : (
                    <span className="text-green-600 font-semibold">起售</span>
                  )}
                  菜品"<span className="font-semibold">{currentDish.name}</span>"吗？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              className={
                currentDish?.status === 1
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
              {currentDish && (
                <>
                  确定要删除菜品"<span className="font-semibold">{currentDish.name}</span>"吗？
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
              确定要删除选中的 {selectedIds.length} 个菜品吗？
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

      {/* 新增/修改菜品表单对话框 */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "修改菜品" : "新建菜品"}</DialogTitle>
          </DialogHeader>
          {formLoading ? (
            <div className="grid gap-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="grid gap-4 py-4">
            {/* 菜品名称 */}
            <div className="grid gap-2">
              <Label htmlFor="form-name" className="text-sm">
                <span className="text-destructive">*</span> 菜品名称：
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
                placeholder="请输入菜品名称"
                disabled={formLoading}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* 菜品分类 */}
            <div className="grid gap-2">
              <Label htmlFor="form-category" className="text-sm">
                <span className="text-destructive">*</span> 菜品分类：
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

            {/* 菜品价格 */}
            <div className="grid gap-2">
              <Label htmlFor="form-price" className="text-sm">
                <span className="text-destructive">*</span> 菜品价格：
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
                placeholder="请输入菜品价格"
                disabled={formLoading}
                className={formErrors.price ? "border-destructive" : ""}
              />
              {formErrors.price && (
                <p className="text-sm text-destructive">{formErrors.price}</p>
              )}
            </div>

            {/* 口味做法配置 */}
            <div className="grid gap-2">
              <Label className="text-sm">口味做法配置：</Label>
              <Button
                type="button"
                onClick={handleAddFlavor}
                disabled={formLoading || extendedFlavors.length >= 4}
                className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90 w-fit"
              >
                <Plus className="h-4 w-4" />
                添加口味
              </Button>
              {extendedFlavors.length > 0 && (
                <div className="space-y-4 mt-2">
                  {extendedFlavors.map((flavor, index) => {
                    // 获取已选择的类型（排除当前项）
                    const selectedTypes = extendedFlavors
                      .map((f, i) => (i !== index && f.type ? f.type : null))
                      .filter((t): t is FlavorType => t !== null);
                    
                    // 获取可选的类型（排除已选择的）
                    const availableTypes = Object.keys(FLAVOR_OPTIONS).filter(
                      (type) => !selectedTypes.includes(type as FlavorType)
                    ) as FlavorType[];

                    return (
                      <div key={index} className="border rounded-md p-4 space-y-3">
                        {/* 口味类型选择 */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">
                            口味名：
                          </Label>
                          {flavor.type ? (
                            <Badge variant="outline" className="px-3 py-1">
                              {flavor.type}
                            </Badge>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={formLoading || availableTypes.length === 0}
                                  className="w-[150px] justify-between"
                                >
                                  请选择口味
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {availableTypes.length > 0 ? (
                                  availableTypes.map((type) => (
                                    <DropdownMenuItem
                                      key={type}
                                      onClick={() =>
                                        handleUpdateFlavorType(
                                          index,
                                          type
                                        )
                                      }
                                    >
                                      {type}
                                    </DropdownMenuItem>
                                  ))
                                ) : (
                                  <DropdownMenuItem disabled>
                                    无可用类型
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFlavor(index)}
                            disabled={formLoading}
                            className="text-destructive hover:text-destructive/80 ml-auto"
                          >
                            删除
                          </Button>
                        </div>

                        {/* 口味选项 */}
                        {flavor.type && (
                          <div className="flex flex-wrap gap-2">
                            {FLAVOR_OPTIONS[flavor.type]
                              .filter(
                                (option) =>
                                  !(flavor.removedOptions || []).includes(option)
                              )
                              .map((option) => (
                                <Badge
                                  key={option}
                                  variant="secondary"
                                  className="bg-[#ffc200]/20 text-foreground hover:bg-[#ffc200]/30 cursor-pointer px-3 py-1 flex items-center gap-1"
                                  onClick={() =>
                                    handleRemoveFlavorOption(index, option)
                                  }
                                >
                                  {option}
                                  <X className="h-3 w-3" />
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 菜品图片 */}
            <div className="grid gap-2">
              <Label className="text-sm">
                <span className="text-destructive">*</span> 菜品图片：
              </Label>
              <div className="flex items-start gap-4">
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-md w-32 h-32 flex items-center justify-center cursor-pointer hover:border-primary transition-colors relative overflow-hidden"
                  onClick={() => !imageUploading && fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="菜品图片"
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

            {/* 菜品描述 */}
            <div className="grid gap-2">
              <Label htmlFor="form-description" className="text-sm">
                菜品描述：
              </Label>
              <Textarea
                id="form-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="请输入菜品描述"
                disabled={formLoading}
                className="min-h-[100px]"
              />
            </div>
          </div>
          )}
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
