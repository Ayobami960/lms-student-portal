"use client";

import { ReactNode, useRef, useEffect } from "react";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";

import { makeStore, AppStore } from "../store";
import { persistAuthUser } from "../store/authSlice";

export function Providers({ children }: { children: ReactNode }) {
 
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const store = storeRef.current!;
    let lastUser = store.getState().auth.user;
    const unsubscribe = store.subscribe(() => {
      const user = store.getState().auth.user;
      if (user !== lastUser) {
        lastUser = user;
        persistAuthUser(user);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Provider store={storeRef.current}>
      {children}
      <Toaster position="top-right" />
    </Provider>
  );
}