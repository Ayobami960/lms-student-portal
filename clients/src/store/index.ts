import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import authReducer, { persistAuthUser } from "./authSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

// Keep the persisted user profile in sync with auth state (survives page reloads;
// the access token itself is re-obtained via the httpOnly refresh cookie on boot).
let lastUser = store.getState().auth.user;
store.subscribe(() => {
  const user = store.getState().auth.user;
  if (user !== lastUser) {
    lastUser = user;
    persistAuthUser(user);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
