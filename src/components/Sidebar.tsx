import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Package,
  UtensilsCrossed,
  FolderTree,
  Users,
  Github,
  Store,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  // Address of the customer-facing app. Override with VITE_USER_CLIENT_URL
  // when the user frontend is deployed on another host or port.
  const userAppUrl =
    import.meta.env.VITE_USER_CLIENT_URL || "http://localhost:5173";

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/statistics", label: "Statistics", icon: BarChart3 },
    { path: "/order", label: "Orders", icon: ShoppingCart },
    { path: "/setmeal", label: "Setmeals", icon: Package },
    { path: "/dish", label: "Dishes", icon: UtensilsCrossed },
    { path: "/category", label: "Categories", icon: FolderTree },
    { path: "/employee", label: "Employees", icon: Users },
  ];

  return (
    <aside
      className={`bg-[#333] text-white flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <nav className="flex flex-col gap-1 p-4 mt-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "text-[#ffc200]" : "text-gray-300 hover:text-white"
              }
            >
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={`w-full ${
                    isCollapsed ? "justify-center px-0" : "justify-start"
                  } ${isActive ? "bg-white/10" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2"}`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Button>
              )}
            </NavLink>
          );
        })}

        <div className="flex-1" />

        <a
          href={userAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-white"
        >
          <Button
            variant="ghost"
            className={`w-full ${
              isCollapsed ? "justify-center px-0" : "justify-start"
            }`}
            title={isCollapsed ? "User App" : undefined}
          >
            <Store
              className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2"}`}
            />
            {!isCollapsed && <span>User App</span>}
          </Button>
        </a>

        <a
          href="https://github.com/kaiwenyao/firmament-take-out-admin"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-white"
        >
          <Button
            variant="ghost"
            className={`w-full ${
              isCollapsed ? "justify-center px-0" : "justify-start"
            }`}
            title={isCollapsed ? "GitHub" : undefined}
          >
            <Github
              className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2"}`}
            />
            {!isCollapsed && <span>GitHub</span>}
          </Button>
        </a>
      </nav>
    </aside>
  );
}
