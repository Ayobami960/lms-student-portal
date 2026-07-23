import { useNavigate } from "react-router";
import { Clock, LogOut, GraduationCap } from "lucide-react";
import { useAppDispatch } from "../../hooks/redux";
import { clearAuth } from "../../store/authSlice";
import { useLogoutMutation } from "../../store/api/apiSlice";


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
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      
      <div className="card w-full max-w-4xl p-8 text-center">
        <div className="mb-6 flex items-center justify-center gap-2 text-xl font-bold text-black">
        <GraduationCap size={28} /> LMS Platform
      </div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning-container">
          <Clock size={28} className="text-warning" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-on-surface">Your account is awaiting approval</h1>
        <p className="mb-6 text-sm text-on-surface-variant">
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