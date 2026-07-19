import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  avatar?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
}

const STORAGE_KEY = "lms-student-auth";

function loadPersistedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw).user as AuthUser) : null;
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  accessToken: null,
  user: loadPersistedUser(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { setAuth, setUser, setAccessToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;

export function persistAuthUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage unavailable */
  }
}