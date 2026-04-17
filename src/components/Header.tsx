import {
  AlignJustify,
  Clock,
  LogOut,
  KeyRound,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { employeeLogoutAPI } from "@/api/auth";
import { getShopStatusAPI, setShopStatusAPI } from "@/api/shop";
import { updatePasswordAPI, type PasswordEditDTO } from "@/api/employee";
import { toast } from "sonner";
import logoImage from "@/assets/imgs/logo.png";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const [shopStatus, setShopStatusState] = useState<number | null>(null); // null indicates not loaded
  const [statusLoading, setStatusLoading] = useState(true); // Loading state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Change password related state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFormErrors, setPasswordFormErrors] = useState<Record<string, string>>({});
  const [passwordFormTouched, setPasswordFormTouched] = useState<Record<string, boolean>>({}); // Track whether field has been touched
  const [passwordFormLoading, setPasswordFormLoading] = useState(false);
  
  // Fetch shop business status on component mount
  useEffect(() => {
    const fetchShopStatus = async () => {
      setStatusLoading(true);
      try {
        const status = await getShopStatusAPI();
        setShopStatusState(status);
      } catch (error) {
        console.error("Failed to fetch shop status:", error);
        setShopStatusState(1);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchShopStatus();
  }, []);

  const handleLogout = async () => {
    await employeeLogoutAPI();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  // Handle setting business status
  const handleSetStatus = async (status: number) => {
    setLoading(true);
    try {
      await setShopStatusAPI(status);
      setShopStatusState(status);
      setStatusDialogOpen(false);
      toast.success(`Shop is now ${status === 1 ? "open" : "closed"}`);
    } catch (error) {
      console.error("Failed to set shop status:", error);
      toast.error("Could not update shop status", {
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get current logged-in username and ID
  const userName = localStorage.getItem("userName");
  const userId = localStorage.getItem("userId");

  // Validate password field
  const validatePasswordField = (field: string, value: string, confirmValue?: string): string => {
    switch (field) {
      case "oldPassword":
        if (!value.trim()) {
          return "Current password is required";
        }
        return "";
      case "newPassword":
        if (!value.trim()) {
          return "New password is required";
        }
        if (value.length < 6 || value.length > 20) {
          return "Password must be 6–20 characters";
        }
        if (!/^[a-zA-Z0-9]+$/.test(value)) {
          return "Password may only contain letters and numbers";
        }
        return "";
      case "confirmPassword":
        if (!value.trim()) {
          return "Confirm your new password";
        }
        if (confirmValue && value !== confirmValue) {
          return "Passwords do not match";
        }
        return "";
      default:
        return "";
    }
  };

  // Handle field blur validation
  const handlePasswordFieldBlur = (field: string, value: string) => {
    // Mark field as touched
    setPasswordFormTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    
    // Perform validation
    let error = "";
    if (field === "confirmPassword") {
      error = validatePasswordField(field, value, passwordFormData.newPassword);
    } else {
      error = validatePasswordField(field, value);
    }
    setPasswordFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // Open change password dialog
  const handleOpenPasswordDialog = () => {
    setPasswordDialogOpen(true);
    setPasswordFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordFormErrors({});
    setPasswordFormTouched({}); // Reset touched state
  };

  // Submit password change
  const handleSubmitPassword = async () => {
    // Validate all fields
    const errors: Record<string, string> = {};
    errors.oldPassword = validatePasswordField("oldPassword", passwordFormData.oldPassword);
    errors.newPassword = validatePasswordField("newPassword", passwordFormData.newPassword);
    errors.confirmPassword = validatePasswordField(
      "confirmPassword",
      passwordFormData.confirmPassword,
      passwordFormData.newPassword
    );

    setPasswordFormErrors(errors);

    // Check for errors
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      // If there are errors, mark all fields as touched so error messages display
      setPasswordFormTouched({
        oldPassword: true,
        newPassword: true,
        confirmPassword: true,
      });
      toast.error("Validation failed", {
        description: "Please check all fields and try again.",
      });
      return;
    }

    setPasswordFormLoading(true);
    try {
      const passwordData: PasswordEditDTO = {
        empId: Number(userId),
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword,
      };
      await updatePasswordAPI(passwordData);
      toast.success("Password updated");
      setPasswordDialogOpen(false);
      setPasswordFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordFormErrors({});
      setPasswordFormTouched({}); // Reset touched state
    } catch (error) {
      console.error("Failed to change password:", error);
      let errorMessage = "Could not change password. Please try again.";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { msg?: string }; status?: number };
        };
        if (axiosError.response?.data?.msg) {
          errorMessage = axiosError.response.data.msg;
        }
      }
      toast.error("Could not change password", {
        description: errorMessage,
      });
    } finally {
      setPasswordFormLoading(false);
    }
  };

  return (
    <header className="h-16 w-full bg-[#ffc200] px-6 flex items-center justify-between text-[#333] shadow-md z-50 relative">
      {/* Left area */}
      <div className="flex items-center gap-4">
        {/* 1. Logo */}
        <div className="flex items-center gap-2 mr-4">
            <img 
                src={logoImage} 
                alt="Firmament"
                className="h-10"
            />
        </div>

        {/* 2. Collapse/expand sidebar button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="hover:bg-black/10 text-[#333]"
          onClick={onToggleSidebar}
        >
          <AlignJustify className="h-6 w-6" />
        </Button>

        {/* 3. Business status badge */}
        {statusLoading ? (
          <Skeleton className="h-6 w-16 ml-4" />
        ) : shopStatus !== null ? (
          <div className={`flex items-center justify-center text-white text-sm font-medium px-3 py-1 rounded-sm shadow-sm ml-4 ${
            shopStatus === 1 ? "bg-red-600" : "bg-gray-500"
          }`}>
            {shopStatus === 1 ? "Open" : "Closed"}
          </div>
        ) : null}
      </div>

      {/* Right area */}
      <div className="flex items-center gap-8">
        {/* 1. Business status setting */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setStatusDialogOpen(true)}
        >
          <Clock className="h-5 w-5" />
          <span className="text-sm font-medium">Business status</span>
        </div>

        {/* 2. Admin dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer outline-none">
              <span className="text-sm font-medium">{userName}</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={handleOpenPasswordDialog}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              <span>Change password</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Business status setting dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shop status</DialogTitle>
            <DialogDescription>
              Choose whether the shop is open for orders.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Button
              variant={shopStatus === 1 ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSetStatus(1)}
              disabled={loading || shopStatus === 1}
            >
              <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
              Open
            </Button>
            <Button
              variant={shopStatus === 0 ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSetStatus(0)}
              disabled={loading || shopStatus === 0}
            >
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              Closed
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="old-password">Current password</Label>
              <Input
                id="old-password"
                type="password"
                value={passwordFormData.oldPassword}
                autoFocus={false}
                onChange={(e) => {
                  setPasswordFormData({ ...passwordFormData, oldPassword: e.target.value });
                  if (passwordFormErrors.oldPassword) {
                    setPasswordFormErrors((prev) => ({ ...prev, oldPassword: "" }));
                  }
                }}
                onBlur={(e) => handlePasswordFieldBlur("oldPassword", e.target.value)}
                placeholder="Enter current password"
                disabled={passwordFormLoading}
                className={passwordFormErrors.oldPassword && passwordFormTouched.oldPassword ? "border-destructive" : ""}
              />
              {passwordFormErrors.oldPassword && passwordFormTouched.oldPassword && (
                <p className="text-sm text-destructive">
                  {passwordFormErrors.oldPassword}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordFormData.newPassword}
                autoFocus={false}
                onChange={(e) => {
                  const newPassValue = e.target.value;
                  setPasswordFormData({ ...passwordFormData, newPassword: newPassValue });
                  if (passwordFormErrors.newPassword) {
                    setPasswordFormErrors((prev) => ({ ...prev, newPassword: "" }));
                  }
                  if (passwordFormData.confirmPassword) {
                    // If confirm password has a value, re-validate it with the new password value
                    const error = validatePasswordField(
                        "confirmPassword",
                        passwordFormData.confirmPassword,
                        newPassValue
                    );

                    // Manually update confirmPassword error
                    setPasswordFormErrors(prev => ({...prev, confirmPassword: error}));
                  }
                }}
                onBlur={(e) => handlePasswordFieldBlur("newPassword", e.target.value)}
                placeholder="6–20 characters, letters and numbers, case-sensitive"
                disabled={passwordFormLoading}
                className={passwordFormErrors.newPassword && passwordFormTouched.newPassword ? "border-destructive" : ""}
              />
              {passwordFormErrors.newPassword && passwordFormTouched.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordFormErrors.newPassword}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordFormData.confirmPassword}
                autoFocus={false}
                onChange={(e) => {
                  setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value });
                  if (passwordFormErrors.confirmPassword) {
                    setPasswordFormErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                onBlur={(e) => handlePasswordFieldBlur("confirmPassword", e.target.value)}
                placeholder="Re-enter new password"
                disabled={passwordFormLoading}
                className={passwordFormErrors.confirmPassword && passwordFormTouched.confirmPassword ? "border-destructive" : ""}
              />
              {passwordFormErrors.confirmPassword && passwordFormTouched.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordFormErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={passwordFormLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPassword}
              disabled={passwordFormLoading}
              className="bg-[#ffc200] text-black hover:bg-[#ffc200]/90"
            >
              {passwordFormLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}