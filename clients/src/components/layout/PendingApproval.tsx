import { useNavigate } from "react-router";
import { Clock, LogOut, GraduationCap } from "lucide-react";
import { useAppDispatch } from "../../hooks/redux";
import { clearAuth } from "../../store/authSlice";
import { useLogoutMutation } from "../../store/api/apiSlice";

// Shown instead of the dashboard when an instructor account hasn't been
// approved by an admin yet — they can log in, but can't access any content.
export function PendingApproval() {
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock size={28} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="mb-2 text-xl font-bold">Your account is awaiting approval</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Instructor accounts need to be approved by an administrator before you can access the dashboard and create courses.
          You'll be able to log in normally once that happens — no need to register again.
        </p>
        <button onClick={handleLogout} className="btn-secondary w-full">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}
