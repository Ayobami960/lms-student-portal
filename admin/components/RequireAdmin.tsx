
"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { clearAuth } from "@/store/authSlice";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      dispatch(clearAuth());
      router.replace("/");
    }
  }, [user, router, dispatch]);

  if (!user || user.role !== "ADMIN") return null; // avoid flashing protected content

  return <>{children}</>;
}