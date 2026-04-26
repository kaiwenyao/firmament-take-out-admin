import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Lock, Github } from "lucide-react";
import { employeeLoginAPI, type EmployeeLoginDTO } from "@/api/auth";
import { toast } from "sonner";
import loginImage from "@/assets/imgs/login.png";
import logoImage from "@/assets/imgs/logo.png";

export default function Login() {
  const navigate = useNavigate();
  
  // If already logged in, auto redirect to home
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);
  const [formData, setFormData] = useState<EmployeeLoginDTO>({
    username: "admin",
    password: "123456",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      toast.error("Please enter your username");
      return;
    }
    
    if (!formData.password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const response = await employeeLoginAPI(formData);
      
      // Save token to localStorage
      if (response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken);  // ⭐ Save Refresh Token
        // Can save other user info
        localStorage.setItem("userName", response.userName);
        localStorage.setItem("name", response.name);
        localStorage.setItem("userId", response.id.toString());

        toast.success("Signed in successfully");
        // Navigate to home page
        navigate("/dashboard", { replace: true });
      } else {
        toast.error("Sign-in failed: no token received");
      }
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error instanceof Error
          ? error.message
          : "Sign-in failed. Check your username and password.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl flex">
        {/* Left side image */}
        <div className="hidden md:block w-1/2 relative">
          <img
            src={loginImage}
            alt="Sign-in"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side login form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-12">
          <div className="mb-8 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-2">
              <img 
                src={logoImage} 
                alt="Firmament"
                className="h-20"
              />
            </div>
            <p className="text-sm text-gray-500">Firmament Take-Out</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username input */}
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="pl-10 h-12 text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 h-12 text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Sign in button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#ffc200] hover:bg-[#e6af00] text-white font-medium text-base rounded-lg transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex justify-center">
            <a
              href="https://github.com/kaiwenyao/firmament-take-out-admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm"
            >
              <Github className="h-4 w-4" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

