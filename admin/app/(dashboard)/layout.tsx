"use client";

import { RequireAdmin } from "@/components/RequireAdmin";
import { Sidebar } from "../../components/layout/Sidebar";
import { Topbar } from "../../components/layout/Topbar";
import { useAuthBootstrap } from "../../components/layout/useCurrentUser";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useAuthBootstrap();

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
         <RequireAdmin>{children}</RequireAdmin>
          </main>
      </div>
    </div>
  );
}
