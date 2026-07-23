import { useNavigate } from "react-router";
import { Wrench, LogOut, GraduationCap } from "lucide-react";
import { useAppDispatch } from "../../hooks/redux";
import { clearAuth } from "../../store/authSlice";
import { useLogoutMutation } from "../../store/api/apiSlice";


export function MaintenancePage({ message }: { message?: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  async function handleLogout() {
    try { await logout().unwrap(); } catch { /* ignore */ }
    dispatch(clearAuth());
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-950">
      <div className="mb-6 flex items-center gap-2 text-xl font-bold text-primary-700 dark:text-primary-400">
        <GraduationCap size={28} /> LMS Platform
      </div>
      <div className="card max-w-md p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Wrench size={28} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="mb-2 text-xl font-bold">We'll be right back</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {message || "The platform is currently undergoing scheduled maintenance. Please check back shortly — we'll email you when it's back online."}
        </p>
        <button onClick={handleLogout} className="btn-secondary w-full">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}
