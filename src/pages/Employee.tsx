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

// Helper function to extract error messages
const getErrorMessage = (error: unknown): string => {
  // If it's a string, return directly
  if (typeof error === "string") {
    return error;
  }

  // If it's an Error object, check if it has response
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { data?: { msg?: string }; status?: number };
    };
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

  return "Something went wrong. Please try again.";
};

export default function Employee() {
  // State definitions
  const [list, setList] = useState<Employee[]>([]);
  const [name, setName] = useState(""); // Search input value
  const [total, setTotal] = useState(0); // Total count
  const [loading, setLoading] = useState(false); // Loading state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // Confirm dialog state
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null); // Currently operated employee
  const [formDialogOpen, setFormDialogOpen] = useState(false); // Form dialog state
  const [isEditMode, setIsEditMode] = useState(false); // Whether it's edit mode
  const [reqData, setReqData] = useState<EmployeePageQuery>({
    page: 1,
    pageSize: 10,
    name: undefined, // Initial no search term
  });
  const [formData, setFormData] = useState<EmployeeFormData>({
    id: "",
    username: "",
    name: "",
    phone: "",
    sex: "1",
    idNumber: "",
  }); // Form data
  const [formLoading, setFormLoading] = useState(false); // Form submission loading state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // Form error messages

  useEffect(() => {
    // Defined internally, no need for useCallback
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Sending request with params:", reqData);
        const res = await getEmployeeListAPI({
          ...reqData, // 1. First automatically destructure page and pageSize
          // 2. Manually override the name property, keeping the "null check" logic
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
    // 🔥 Core magic: only depend on reqData
    // Because reqData is an object, each setReqData({...reqData}) generates a new reference
    // React compares: old object reference !== new object reference -> triggers update!
  }, [reqData]);

  const reloadData = () => {
    // Create a copy with same content but different memory reference
    setReqData((prev) => ({ ...prev }));
  };

  const handleSearch = () => {
    setReqData((prev) => ({
      ...prev, // Keep pageSize and other parameters
      page: 1, // New search term, go back to first page
      name: name, // "Submit" the input value into reqData
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

  // Open confirm dialog
  const handleOpenConfirmDialog = (employee: Employee) => {
    setCurrentEmployee(employee);
    setConfirmDialogOpen(true);
  };

  // Confirm enable/disable employee account
  const handleConfirmToggleStatus = async () => {
    if (!currentEmployee) return;

    const newStatus = currentEmployee.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? "Enabled" : "Disabled";

    try {
      await enableOrDisableEmployeeAPI(newStatus, currentEmployee.id);
      setConfirmDialogOpen(false);
      setCurrentEmployee(null);
      toast.success(`Account ${action.toLowerCase()}`);
      // Refresh list after successful operation
      reloadData();
    } catch (error) {
      console.error(`${action} employee account failed:`, error);
      setConfirmDialogOpen(false);
      toast.error("Failed to update account", {
        description: getErrorMessage(error) || "Please try again",
      });
    }
  };

  // Open add employee form
  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setFormErrors({});
    setFormDialogOpen(true);

    // 🤔 Note: Add form is pure frontend operation, no need to fetch data from backend
    // So there's no need to set Loading or use setTimeout

    // Just reset data directly, this is done instantly
    setFormData({
      id: "",
      username: "",
      name: "",
      phone: "",
      sex: "1",
      idNumber: "",
    });
  };

  // Open edit employee form
  const handleOpenEditForm = async (employee: Employee) => {
    setIsEditMode(true);
    setFormErrors({});
    setFormDialogOpen(true); // ✅ Show dialog immediately
    setFormLoading(true); // ✅ Immediately show loading indicator

    try {
      const employeeDetail = await getEmployeeByIdAPI(employee.id);

      setFormData({
        id: employeeDetail.id,
        username: employeeDetail.username,
        name: employeeDetail.name,
        phone: employeeDetail.phone,
        // 🚨 Reminder: If the backend returns a number, remember to convert to string, otherwise Radio won't work
        sex: String(employeeDetail.sex),
        idNumber: employeeDetail.idNumber,
      });

      // ❌ No need to write setFormLoading(false) here
    } catch (error) {
      console.error("Failed to get employee details:", error);
      toast.error("Failed to load employee");
      setFormDialogOpen(false); // Closing dialog on failure is reasonable

      // ❌ No need to write setFormLoading(false) here either
    } finally {
      // ✅ Put it here!
      // As long as try or catch finishes executing, this line will definitely run
      setFormLoading(false);
    }
  };

  // Validate single field
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

  // Handle field blur validation
  const handleFieldBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // Submit form
  const handleSubmitForm = async () => {
    // Validate all fields
    const errors: Record<string, string> = {};
    errors.username = validateField("username", formData.username);
    errors.name = validateField("name", formData.name);
    errors.phone = validateField("phone", formData.phone);
    errors.idNumber = validateField("idNumber", formData.idNumber);

    setFormErrors(errors);

    // Check if there are errors
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
        // Update employee
        await updateEmployeeAPI(formData);
        toast.success("Employee updated");
      } else {
        // Add employee
        await saveEmployeeAPI(formData);
        toast.success("Employee added");
      }
      setFormDialogOpen(false);
      // Refresh list after successful operation
      reloadData();
    } catch (error) {
      console.error(`${isEditMode ? "Update" : "Add"} employee failed:`, error);
      toast.error(`${isEditMode ? "Failed to update" : "Failed to add"} employee`, {
        description: getErrorMessage(error) || "Please try again",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / reqData.pageSize);
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        {/* Left: Search area */}
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

        {/* Right: Add button */}
        <Button size="sm" className="h-8" onClick={handleOpenAddForm}>
          <Plus className="h-4 w-4" />
          Add employee
        </Button>
      </div>

      {/* Bottom table area */}
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

              {/* Pagination component */}
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

      {/* Confirm dialog */}
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

      {/* Add/Edit employee form dialog */}
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
                  // Clear error message for this field
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
