import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
  avatar?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
}

// Access tokens are short-lived and re-obtained via the httpOnly refresh cookie
// on load, so only the user profile is persisted (for instant UI on refresh).
const STORAGE_KEY = "lms-admin-auth";

function loadPersistedUser(): AuthUser | null {
  if (typeof window === "undefined") return null; // Next.js SSR guard
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
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { setAuth, setAccessToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;

export function persistAuthUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage unavailable — ignore */
  }
}
