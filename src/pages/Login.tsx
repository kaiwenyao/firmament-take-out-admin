import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Lock } from "lucide-react";
import { employeeLoginAPI, type EmployeeLoginDTO } from "@/api/auth";
import { toast } from "sonner";
import loginImage from "@/assets/imgs/login.png";

export default function Login() {
  const navigate = useNavigate();
  
  // 如果已登录，自动跳转到首页
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
      toast.error("请输入用户名");
      return;
    }
    
    if (!formData.password.trim()) {
      toast.error("请输入密码");
      return;
    }

    setLoading(true);
    try {
      const response = await employeeLoginAPI(formData);
      
      // 保存 token 到 localStorage
      if (response.token) {
        localStorage.setItem("token", response.token);
        // 可以保存其他用户信息
        localStorage.setItem("userName", response.userName);
        localStorage.setItem("name", response.name);
        localStorage.setItem("userId", response.id.toString());
        
        toast.success("登录成功");
        // 跳转到首页
        navigate("/dashboard", { replace: true });
      } else {
        toast.error("登录失败，未获取到 token");
      }
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error instanceof Error
          ? error.message
          : "登录失败，请检查用户名和密码";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl flex">
        {/* 左侧图片 */}
        <div className="hidden md:block w-1/2 relative">
          <img
            src={loginImage}
            alt="登录背景"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 右侧登录表单 */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-12">
          <div className="mb-8">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">苍</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">苍穹外卖</h1>
            </div>
            <p className="text-sm text-gray-500 ml-[52px]">THE SKY TAKE-OUT</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名输入框 */}
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="用户名"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="pl-10 h-12 text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 密码输入框 */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="密码"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 h-12 text-base"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#ffc200] hover:bg-[#e6af00] text-white font-medium text-base rounded-lg transition-colors"
            >
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

