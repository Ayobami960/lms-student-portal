import { NavLink } from "react-router";
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardList,
  Award,
  BookOpen,
  Sparkles,
  LogOut,
  X,
  MessageSquare,
  Users2,
} from "lucide-react";

import { clearAuth } from "../../store/authSlice";
import { useLogoutMutation } from "../../store/api/apiSlice";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import type { MenuItem, SidebarProps } from "../../types";

const STUDENT_LINKS: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/certificates", label: "Certificates", icon: Award },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
];

const INSTRUCTOR_LINKS: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/my-courses", label: "My Courses", icon: BookOpen },
  { to: "/grading", label: "Grading", icon: ClipboardList },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.user?.role);
  const studentId = useAppSelector((s) => s.auth.user?.studentId);
  const links = role === "INSTRUCTOR" ? INSTRUCTOR_LINKS : STUDENT_LINKS;

  const [logout] = useLogoutMutation();

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // ignore — clear local state regardless of API result
    }
    dispatch(clearAuth());
    window.location.href = "/login";
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-70 flex flex-col p-md gap-sm border-r border-outline-variant bg-surface-container-lowest z-50 shadow-sm transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
              <GraduationCap className="w-5 h-5" fill="currentColor" strokeWidth={1} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Skill Forge</h1>
              <p className="text-xs font-semibold text-outline tracking-wider">Learning Portal</p>
            </div>
          </div>
          <button className="lg:hidden text-outline hover:text-on-surface" onClick={onClose} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role-based Navigation Menu */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container border-l-4 border-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Elements */}
        <div className="mt-auto pt-md border-t border-outline-variant flex flex-col gap-1">
          <div className="flex items-center gap-2 px-4 py-1 text-xs text-outline">
            <Users2 className="w-3.5 h-3.5" /> {role === "INSTRUCTOR" ? "Instructor view" : "Student view"}
          </div>
          {studentId && (
            <p
              className="px-4 font-mono text-[11px] text-outline"
              title="Your Student ID — required to join live classes"
            >
              {studentId}
            </p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 cursor-pointer text-on-surface-variant px-4 py-2 hover:bg-surface-container-high rounded-lg transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};