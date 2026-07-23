import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

import { useAppSelector } from "../../hooks/redux"; 
import { PendingApproval } from "./PendingApproval";

interface ProtectedLayoutProps {
  currentTheme: string;
  onToggleTheme: () => void;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ currentTheme, onToggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

 
  const { accessToken, user } = useAppSelector((state) => state.auth);

 
  if (!accessToken) {
    
    return <Navigate to="/" state={{ from: location }} replace />;
  }

 
  if (user?.role === "INSTRUCTOR" && user.isApproved === false) {
    return <PendingApproval />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface transition-colors duration-200">
      {/* Sidebar navigation context */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Outer Content frame */}
      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <Topbar 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
          currentTheme={currentTheme}
          onToggleTheme={onToggleTheme}
        />
        
        {/* Main nested route injection */}
        <main className="flex-1 p-margin-mobile md:p-margin-desktop">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;