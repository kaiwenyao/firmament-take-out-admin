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
  getDishListAPI,
  deleteDishAPI,
  enableOrDisableDishAPI,
  getDishByIdAPI,
  saveDishAPI,
  updateDishAPI,
  uploadImage,
  type Dish,
  type DishFormData,
  type DishFlavor,
  type DishPageQuery,
} from "@/api/dish";
import { getCategoryListByTypeAPI, type Category } from "@/api/category";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Helper function to extract error messages
const getErrorMessage = (error: unknown): string => {
  // If it's a string, return directly
  if (typeof error === "string") {
    return error;
  }
  
  // If it's an Error object, check if it has response
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { msg?: string }; status?: number } };
    // Backend error format: { code: 0, msg: "error message" }
    if (axiosError.response?.data?.msg) {
      return axiosError.response.data.msg;
    }
    // HTTP status code error
    if (axiosError.response?.status) {
      return `Request failed (${axiosError.response.status})`;
    }
  }
  
  // If it's an Error object, return message
  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message?: string };
    if (err.message) {
      return err.message;
    }
  }
  
  // Default error message
  return "Something went wrong. Please try again.";
};

// Flavor type definition
type FlavorType = "Temperature" | "Sweetness" | "Dietary Notes" | "Spice Level";

// Flavor type options mapping
const FLAVOR_OPTIONS: Record<FlavorType, string[]> = {
  Temperature: ["Hot", "Room Temp", "No Ice", "Less Ice", "Extra Ice"],
  Sweetness: ["No Sugar", "Less Sugar", "Half Sugar", "More Sugar", "Full Sugar"],
  "Dietary Notes": ["No Scallions", "No Garlic", "No Cilantro", "No Spice"],
  "Spice Level": ["Not Spicy", "Mild", "Medium", "Extra Spicy"],
};

// Extended flavor data type (includes type and removed options)
interface ExtendedFlavor {
  id?: string; // Flavor ID (used when editing)
  dishId?: string; // Dish ID (used when editing)
  type?: FlavorType; // Flavor type
  name: string; // Flavor name (for backend, corresponds to original name)
  value: string; // Flavor value (for backend, corresponds to original value, stores remaining options)
  removedOptions?: string[]; // List of removed options
}

export default function Dish() {
  
  // Define state
  const [list, setList] = useState<Dish[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]); // Category list (for dropdown selection)
  const [dishName, setDishName] = useState(""); // Search input bound value
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined); // Selected category ID
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined); // Selected status
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // Selected dish IDs
  const [total, setTotal] = useState(0); // Total count
  const [loading, setLoading] = useState(false); // Loading state
  const [reqData, setReqData] = useState<DishPageQuery>({
    page: 1,
    pageSize: 10,
    name: undefined,
    categoryId: undefined,
    status: undefined,
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // Confirm dialog state (enable/disable)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Delete confirm dialog state
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false); // Batch delete confirm dialog
  const [currentDish, setCurrentDish] = useState<Dish | null>(null); // Currently operating on dish
  const [formDialogOpen, setFormDialogOpen] = useState(false); // Form dialog state
  const [isEditMode, setIsEditMode] = useState(false); // Whether in edit mode
  const [formData, setFormData] = useState<DishFormData>({
    name: "",
    categoryId: 0,
    price: 0,
    image: "",
    description: "",
    status: 1,
    flavors: [],
  }); // Form data
  const [extendedFlavors, setExtendedFlavors] = useState<ExtendedFlavor[]>([]); // Extended flavors data (for UI display)
  const [formLoading, setFormLoading] = useState(false); // Form submission loading state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // Form error messages
  const [imagePreview, setImagePreview] = useState<string>(""); // Image preview
  const [imageUploading, setImageUploading] = useState(false); // Image uploading
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Get category list (for dropdown selection)
  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        const categories = await getCategoryListByTypeAPI({ type: 1 }); // 1: Dish category
        setCategoryList(categories);
      } catch (error) {
        console.error("Failed to get category list:", error);
        toast.error("Failed to load categories", {
          description: getErrorMessage(error) || "Please try again"
        });
      }
    };
    fetchCategoryList();
  }, []);

  useEffect(() => {
    // Defined inside, no need for useCallback
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Sending request with params:", reqData);
        const res = await getDishListAPI({
          ...reqData,
          name: reqData.name || undefined,
          categoryId: reqData.categoryId,
          status: reqData.status,
        });
        setList(res.records);
        setTotal(Number(res.total));
        // Clear selected items
        setSelectedIds([]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dishes", {
          description: getErrorMessage(error) || "Please try again"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // 🔥 Key trick: only depend on reqData
  }, [reqData]);

  const reloadData = () => {
    // Copy self, same content but different memory address
    setReqData((prev) => ({ ...prev }));
  };

  // Search function
  const handleSearch = () => {
    setReqData((prev) => ({
      ...prev,
      page: 1, // New search term, return to first page
      name: dishName || undefined,
      categoryId: selectedCategoryId,
      status: selectedStatus,
    }));
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

  // Handle single checkbox selection
  const handleSelectItem = (dishId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, dishId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== dishId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(list.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Open confirm dialog (enable/disable)
  const handleOpenConfirmDialog = (dish: Dish) => {
    setCurrentDish(dish);
    setConfirmDialogOpen(true);
  };

  // Confirm enable/disable dish
  const handleConfirmToggleStatus = async () => {
    if (!currentDish) return;

    const newStatus = currentDish.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? "listed" : "delisted";

    try {
      await enableOrDisableDishAPI(newStatus, currentDish.id);
      setConfirmDialogOpen(false);
      setCurrentDish(null);
      toast.success(`Dish ${action}`);
      // Refresh list after successful operation
      reloadData();
    } catch (error) {
      console.error(`${action} dish failed:`, error);
      setConfirmDialogOpen(false);
      toast.error("Failed to update dish status", {
        description: getErrorMessage(error) || "Please try again"
      });
    }
  };

  // Open delete confirm dialog
  const handleDelete = (dish: Dish) => {
    setCurrentDish(dish);
    setDeleteDialogOpen(true);
  };

  // Confirm delete dish
  const handleConfirmDelete = async () => {
    if (!currentDish) return;

    try {
      await deleteDishAPI([currentDish.id]);
      setDeleteDialogOpen(false);
      setCurrentDish(null);
      toast.success("Dish deleted");
      // Refresh list after successful operation
      reloadData();
    } catch (error) {
      console.error("Delete dish failed:", error);
      setDeleteDialogOpen(false);
      toast.error("Failed to delete dish", {
        description: getErrorMessage(error) || "Please try again"
      });
    }
  };

  // Open batch delete confirm dialog
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Nothing selected", {
        description: "Select at least one dish"
      });
      return;
    }
    setBatchDeleteDialogOpen(true);
  };

  // Confirm batch delete
  const handleConfirmBatchDelete = async () => {
    try {
      await deleteDishAPI(selectedIds);
      setBatchDeleteDialogOpen(false);
      setSelectedIds([]);
      toast.success(`Deleted ${selectedIds.length} dish(es)`);
      // Refresh list after successful operation
      reloadData();
    } catch (error) {
      console.error("Batch delete dish failed:", error);
      setBatchDeleteDialogOpen(false);
      toast.error("Batch delete failed", {
        description: getErrorMessage(error) || "Please try again"
      });
    }
  };

  // Validate single field
  const validateField = (field: string, value: string | number | undefined | null): string => {
    switch (field) {
      case "name":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "Dish name is required";
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

  // Handle field blur validation
  const handleFieldBlur = (field: string, value: string | number | undefined | null) => {
    const error = validateField(field, value);
    setFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // Convert backend flavor format to extended format
  const convertFlavorsToExtended = (flavors: DishFlavor[]): ExtendedFlavor[] => {
    if (!flavors || flavors.length === 0) {
      return [];
    }
    
    return flavors.map((flavor) => {
      const type = flavor.name as FlavorType;
      // Verify if type is valid
      if (!FLAVOR_OPTIONS[type]) {
        return null;
      }
      
      // Parse value (JSON string) to options array
      let currentOptions: string[] = [];
      try {
        if (flavor.value) {
          // value may be JSON string, need to parse
          currentOptions = JSON.parse(flavor.value);
        }
      } catch {
        // If parsing fails, may be old format (comma-separated), try compatibility
        currentOptions = flavor.value.split(",").filter(Boolean);
      }
      
      // Calculate removed options
      const allOptions = FLAVOR_OPTIONS[type] || [];
      const removedOptions = allOptions.filter(
        (opt) => !currentOptions.includes(opt)
      );
      
      return {
        id: flavor.id, // Keep id (used when editing)
        dishId: flavor.dishId, // Keep dishId (used when editing)
        type,
        name: flavor.name,
        value: flavor.value, // Keep original value (JSON string)
        removedOptions,
      } as ExtendedFlavor;
    }).filter((item): item is ExtendedFlavor => item !== null);
  };

  // Convert extended format flavors to backend format
  const convertExtendedToFlavors = (extended: ExtendedFlavor[]): DishFlavor[] => {
    const flavors: DishFlavor[] = [];
    
    extended.forEach((item) => {
      if (item.type && item.name) {
        // Get current remaining options
        const allOptions = FLAVOR_OPTIONS[item.type] || [];
        const currentOptions = allOptions.filter(
          (opt) => !(item.removedOptions || []).includes(opt)
        );
        
        // Convert options array to JSON string
        const valueJsonString = JSON.stringify(currentOptions);
        
        // Create only one entry per flavor type, value is JSON string
        flavors.push({
          id: item.id, // If has id, keep it (when editing)
          dishId: item.dishId, // If has dishId, keep it (when editing)
          name: item.name,
          value: valueJsonString, // JSON string format: '["No Sugar","Less Sugar","Half Sugar","More Sugar","Full Sugar"]'
        });
      }
    });
    
    return flavors;
  };

  // Open add dish form
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

  // Open edit form
  const handleEdit = async (dish: Dish) => {
    setIsEditMode(true);
    setFormErrors({});
    setFormDialogOpen(true); // ✅ Show dialog immediately
    setFormLoading(true); // ✅ Show skeleton/spinner immediately

    try {
      const dishDetail = await getDishByIdAPI(dish.id);
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
      // Convert flavor data (keep id and dishId)
      const extendedFlavors = convertFlavorsToExtended(flavors);
      // Also pass id and dishId to extended format
      extendedFlavors.forEach((extended, index) => {
        if (flavors[index]) {
          extended.id = flavors[index].id;
          extended.dishId = flavors[index].dishId;
        }
      });
      setExtendedFlavors(extendedFlavors);
      setImagePreview(dishDetail.image || "");
    } catch (error) {
      console.error("Failed to get dish details:", error);
      toast.error("Failed to load dish", {
        description: getErrorMessage(error) || "Please try again"
      });
      setFormDialogOpen(false); // Closing dialog on failure is reasonable
    } finally {
      // ✅ Put it here!
      setFormLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid image type", {
        description: "Only PNG, JPEG, or JPG images are allowed"
      });
      return;
    }

    // Validate file size (10MB)
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
      console.error("Image upload failed:", error);
      toast.error("Upload failed", {
        description: getErrorMessage(error) || "Please try again"
      });
    } finally {
      setImageUploading(false);
    }
  };

  // Add flavor
  const handleAddFlavor = () => {
    if (extendedFlavors.length >= 4) {
      toast.error("Too many flavor groups", {
        description: "You can add up to 4 flavor groups"
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

  // Remove flavor
  const handleRemoveFlavor = (index: number) => {
    const newFlavors = [...extendedFlavors];
    newFlavors.splice(index, 1);
    setExtendedFlavors(newFlavors);
    // Sync update formData
    setFormData({
      ...formData,
      flavors: convertExtendedToFlavors(newFlavors),
    });
  };

  // Update flavor type
  const handleUpdateFlavorType = (index: number, type: FlavorType) => {
    const newFlavors = [...extendedFlavors];
    newFlavors[index] = {
      type,
      name: type,
      value: "",
      removedOptions: [], // All options shown initially
    };
    setExtendedFlavors(newFlavors);
    // Sync update formData
    setFormData({
      ...formData,
      flavors: convertExtendedToFlavors(newFlavors),
    });
  };

  // Remove flavor option (click option to remove)
  const handleRemoveFlavorOption = (flavorIndex: number, option: string) => {
    const newFlavors = [...extendedFlavors];
    const flavor = newFlavors[flavorIndex];
    if (!flavor.removedOptions) {
      flavor.removedOptions = [];
    }
    flavor.removedOptions.push(option);
    setExtendedFlavors(newFlavors);
    // Sync update formData
    setFormData({
      ...formData,
      flavors: convertExtendedToFlavors(newFlavors),
    });
  };

  // Submit form
  const handleSubmitForm = async () => {
    // Validate all fields
    const errors: Record<string, string> = {};
    errors.name = validateField("name", formData.name);
    errors.categoryId = validateField("categoryId", formData.categoryId);
    errors.price = validateField("price", formData.price);
    errors.image = validateField("image", formData.image);

    setFormErrors(errors);

    // Check if there are errors
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      toast.error("Validation failed", {
        description: "Please fill in all required fields"
      });
      return;
    }

    setFormLoading(true);
    try {
      // Convert extended format flavors to backend format
      const flavors = convertExtendedToFlavors(extendedFlavors);
      
      if (isEditMode) {
        // Update dish
        await updateDishAPI({
          ...formData,
          flavors,
        });
        toast.success("Dish updated");
      } else {
        // Add dish - don't send id
        const newDishData: Omit<DishFormData, "id"> = {
          name: formData.name,
          categoryId: formData.categoryId,
          price: formData.price,
          image: formData.image,
          description: formData.description,
          status: formData.status,
          flavors: flavors,
        };
        await saveDishAPI(newDishData);
        toast.success("Dish created");
      }
      setFormDialogOpen(false);
      // Refresh list after successful operation
      reloadData();
    } catch (error) {
      console.error(`${isEditMode ? "Update" : "Add"} dish failed:`, error);
      toast.error(`${isEditMode ? "Failed to update" : "Failed to create"} dish`, {
        description: getErrorMessage(error) || "Please try again"
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / reqData.pageSize);
  const isAllSelected = list.length > 0 && selectedIds.length === list.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < list.length;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        {/* Left: search area */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="dish-name" className="whitespace-nowrap text-sm">
              Name:
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
              placeholder="Dish name"
              className="w-[200px] h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dish-category" className="whitespace-nowrap text-sm">
              Category:
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
            <Label htmlFor="dish-status" className="whitespace-nowrap text-sm">
              Sale status:
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

        {/* Right: action buttons */}
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
            onClick={handleAddDish}
          >
            <Plus className="h-4 w-4" />
            New dish
          </Button>
        </div>
      </div>

      {/* Table area below */}
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

      {/* Enable/disable confirm dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>
              {currentDish && (
                <>
                  {currentDish.status === 1 ? (
                    <>Disable <span className="font-semibold">{currentDish.name}</span>?</>
                  ) : (
                    <>Enable <span className="font-semibold">{currentDish.name}</span>?</>
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
                currentDish?.status === 1
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dish</AlertDialogTitle>
            <AlertDialogDescription>
              {currentDish && (
                <>
                  Delete <span className="font-semibold">{currentDish.name}</span>? This cannot be undone.
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

      {/* Batch delete confirm dialog */}
      <AlertDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batch delete</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {selectedIds.length} selected dish(es)? This cannot be undone.
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

      {/* Add/edit dish form dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit dish" : "New dish"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Dish name */}
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
                placeholder="Dish name"
                disabled={formLoading}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Dish category */}
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

            {/* Dish price */}
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

            {/* Flavor configuration */}
            <div className="grid gap-2">
              <Label className="text-sm">Flavors & options</Label>
              <Button
                type="button"
                onClick={handleAddFlavor}
                disabled={formLoading || extendedFlavors.length >= 4}
                className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90 w-fit"
              >
                <Plus className="h-4 w-4" />
                Add flavor group
              </Button>
              {extendedFlavors.length > 0 && (
                <div className="space-y-4 mt-2">
                  {extendedFlavors.map((flavor, index) => {
                    // Get selected types (excluding current item)
                    const selectedTypes = extendedFlavors
                      .map((f, i) => (i !== index && f.type ? f.type : null))
                      .filter((t): t is FlavorType => t !== null);
                    
                    // Get available types (excluding already selected)
                    const availableTypes = Object.keys(FLAVOR_OPTIONS).filter(
                      (type) => !selectedTypes.includes(type as FlavorType)
                    ) as FlavorType[];

                    return (
                      <div key={index} className="border rounded-md p-4 space-y-3">
                        {/* Flavor type selection */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">
                            Type:
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
                                  Select type
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
                                    No types left
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
                            Remove
                          </Button>
                        </div>

                        {/* Flavor options */}
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
                                  className={`bg-[#ffc200]/20 text-foreground px-3 py-1 flex items-center gap-1 ${
                                    formLoading
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:bg-[#ffc200]/30 cursor-pointer"
                                  }`}
                                  onClick={() => {
                                    if (!formLoading) {
                                      handleRemoveFlavorOption(index, option);
                                    }
                                  }}
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

            {/* Dish image */}
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
                      alt="Dish"
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

            {/* Dish description */}
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
    </div>
  );
}
