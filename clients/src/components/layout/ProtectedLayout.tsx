import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { setAuth, setAccessToken, clearAuth } from "../../store/authSlice";
import { Sidebar } from "./Sidebar";
import { PendingApproval } from "./PendingApproval";
import { MaintenancePage } from "./MaintenancePage";
import { useGetMaintenanceStatusQuery, useMeQuery } from "../../store/api/apiSlice";
import { ProfilePanel } from "../profile/ProfilePanel";
import { Navbar } from "./Navbar";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

interface ProtectedLayoutProps {
  currentTheme: string;
  onToggleTheme: () => void;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ currentTheme, onToggleTheme }) => {
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  
  const { data: maintenance } = useGetMaintenanceStatusQuery(undefined, { pollingInterval: 60_000 });

  
  const { data: meData } = useMeQuery(undefined, { pollingInterval: 60_000, skip: !ready });

  useEffect(() => {
    if (meData?.data && accessToken) {
      dispatch(setAuth({ accessToken, user: meData.data }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meData]);

  useEffect(() => {
    const controller = new AbortController();

    async function bootstrap() {
      if (accessToken && user) { setReady(true); return; }
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          signal: controller.signal,
        });
        if (!refreshRes.ok) throw new Error("refresh failed");
        const refreshJson = await refreshRes.json();
        const token = refreshJson.data.accessToken as string;
        dispatch(setAccessToken(token));

        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
          signal: controller.signal,
        });
        if (!meRes.ok) throw new Error("me failed");
        const meJson = await meRes.json();

        dispatch(setAuth({ accessToken: token, user: meJson.data }));
        setReady(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        dispatch(clearAuth());
        setAuthFailed(true);
        setReady(true);
      }
    }

    bootstrap();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (authFailed) return <Navigate to="/login" replace />;

  if (user?.role === "INSTRUCTOR" && user.isApproved === false) {
    return <PendingApproval />;
  }

  if (maintenance?.data.enabled && user?.role !== "ADMIN") {
    return <MaintenancePage message={maintenance.data.message} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenProfile={() => setProfilePanelOpen(true)}
          currentTheme={currentTheme}
          onToggleTheme={onToggleTheme}
        />

        <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop">
          <Outlet />
        </div>
      </div>

      <ProfilePanel
        open={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
      />
    </div>
  );
};