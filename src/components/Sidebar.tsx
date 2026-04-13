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
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
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
      <nav className="flex flex-col gap-1 p-4 mt-2">
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
      </nav>
    </aside>
  );
}
