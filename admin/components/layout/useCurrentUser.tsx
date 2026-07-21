"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { setAuth, setAccessToken, clearAuth } from "../../store/authSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";


export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (accessToken && user) {
        setReady(true);
        return;
      }
      try {
        // Plain fetch here (not RTK Query) since this runs once, outside any
        // component's query lifecycle, before the store even has a token.
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
        if (!refreshRes.ok) throw new Error("refresh failed");
        const refreshJson = await refreshRes.json();
        const token = refreshJson.data.accessToken as string;
        dispatch(setAccessToken(token));

        const meRes = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
        if (!meRes.ok) throw new Error("me failed");
        const meJson = await meRes.json();

        if (!cancelled) {
          dispatch(setAuth({ accessToken: token, user: meJson.data }));
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          dispatch(clearAuth());
          setReady(true);
          router.push("/");
        }
      }
    }
    bootstrap();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready, user };
}
