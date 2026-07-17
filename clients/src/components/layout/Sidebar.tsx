import { NavLink, useNavigate } from "react-router";
import {
  GraduationCap,
  LayoutDashboard,
  School,
  ClipboardList,
  Award,
  Bot,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { clearAuth } from "../../store/authSlice";
import { useLogoutMutation } from "../../store/api/apiSlice";
import { useAppDispatch } from "../../hooks/redux";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const menuItems: MenuItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Courses", path: "/courses", icon: School },
    { name: "Assignments", path: "/assignments", icon: ClipboardList },
    { name: "Certificates", path: "/certificates", icon: Award },
    { name: "AI Assistant", path: "/ai-assistant", icon: Bot }
  ];

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // ignore — clear local state regardless of API result
    }
    dispatch(clearAuth());
    navigate("/login");
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-[280px] flex flex-col p-md gap-sm border-r border-outline-variant bg-surface-container-lowest z-50 shadow-sm transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
              <GraduationCap className="w-5 h-5" fill="currentColor" strokeWidth={1} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary leading-tight">EduAI Pro</h1>
              <p className="text-xs font-semibold text-outline tracking-wider">Learning Portal</p>
            </div>
          </div>
          <button className="lg:hidden text-outline hover:text-on-surface" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Menu */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive && item.path !== "#"
                    ? "bg-secondary-container text-on-secondary-container border-l-4 border-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`
                }
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Elements */}
        <div className="mt-auto pt-md border-t border-outline-variant flex flex-col gap-1">
          
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 cursor-pointer text-on-surface-variant px-4 py-2 hover:bg-surface-container-high rounded-lg transition-all text-sm font-medium" >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};