import { NavLink, useNavigate } from "react-router";
import {
  BookOpen, ClipboardList, Award, Sparkles, MessageSquare,
  GraduationCap, X, LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { clearAuth } from "../../store/authSlice";
import { useLogoutMutation } from "../../store/api/apiSlice";
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
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.user?.role);
  const studentId = useAppSelector((s) => s.auth.user?.studentId);
  const links = role === "INSTRUCTOR" ? INSTRUCTOR_LINKS : STUDENT_LINKS;
  const [logout] = useLogoutMutation();

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      /* ignore — clear local state regardless of API result */
    }
    dispatch(clearAuth());
    navigate("/");
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2 text-lg font-bold text-on-surface">
          <span className="icon-tile">
            <GraduationCap size={18} />
          </span>
          Skill
        </div>
        <button
          className="lg:hidden text-on-surface-variant"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-5 px-4" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "nav-item-active" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-outline-variant p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <LogOut size={18} />
          Log Out
        </button>
       
        {studentId && (
          <p className="px-1 font-mono text-[11px] text-outline" title="Your Student ID — required to join live classes">
            {studentId}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-outline-variant bg-surface-container-lowest lg:block">
        {content}
      </aside>
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative z-50 h-full w-72 bg-surface-container-lowest">{content}</aside>
        </div>
      )}
    </>
  );
};