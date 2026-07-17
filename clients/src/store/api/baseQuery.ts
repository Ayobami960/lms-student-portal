import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {  FetchArgs, BaseQueryFn, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

import { Mutex } from "async-mutex";
import type { RootState } from "../index";
import { setAccessToken, clearAuth } from "../authSlice";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";

// Prevents multiple simultaneous 401s from all firing their own refresh call —
// every request that hits a 401 while a refresh is already in flight waits for it.
const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include", // send the httpOnly refresh cookie
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await mutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);
        const data = refreshResult.data as { data?: { accessToken?: string } } | undefined;
        if (data?.data?.accessToken) {
          api.dispatch(setAccessToken(data.data.accessToken));
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          api.dispatch(clearAuth());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};
