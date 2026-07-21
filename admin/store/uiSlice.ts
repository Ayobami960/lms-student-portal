import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Theme = "light" | "dark" | "system";

interface UIState {
  sidebarOpen: boolean;
  theme: Theme;
}

function loadTheme(): Theme {
  if (typeof window === "undefined") return "system"; // Next.js SSR guard
  return (localStorage.getItem("lms-theme") as Theme) ?? "system";
}

const initialState: UIState = {
  sidebarOpen: false,
  theme: loadTheme(),
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      if (typeof window !== "undefined") localStorage.setItem("lms-theme", action.payload);
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
