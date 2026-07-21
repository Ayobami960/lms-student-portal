import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import type { AuthUser } from "../authSlice";




export interface ApiSuccess<T> { success: true; message: string; data: T }
export interface Paginated<T> { success: true; message: string; data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Course", "User", "Certificate"],
  endpoints: (builder) => ({
    // ---------------- Auth ----------------
    register: builder.mutation<ApiSuccess<{ accessToken: string }>, { name: string; email: string; password: string; confirmPassword: string }>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    login: builder.mutation<ApiSuccess<{ accessToken: string; user: AuthUser }>, { email: string; password: string; rememberMe?: boolean }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    logout: builder.mutation<ApiSuccess<null>, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    me: builder.query<ApiSuccess<AuthUser>, void>({
      query: () => "/auth/me",
    }),

    // ---------------- Users (admin management) ----------------
    listUsers: builder.query<Paginated<any>, { page?: number; limit?: number; role?: string; pending?: boolean }>({
      query: (params) => ({ url: "/users", params }),
      providesTags: (result) =>
        result ? [...result.data.map((u: any) => ({ type: "User" as const, id: u.id })), { type: "User", id: "LIST" }] : [{ type: "User", id: "LIST" }],
    }),
    approveInstructor: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/users/${id}/approve`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    updateUserRole: builder.mutation<ApiSuccess<any>, { id: string; role: string }>({
      query: ({ id, role }) => ({ url: `/users/${id}/role`, method: "PATCH", body: { role } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    deleteUser: builder.mutation<ApiSuccess<null>, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    // ---------------- Courses (platform oversight) ----------------
    listCourses: builder.query<Paginated<any>, { page?: number; limit?: number }>({
      query: (params) => ({ url: "/courses", params }),
      providesTags: (result) =>
        result ? [...result.data.map((c: any) => ({ type: "Course" as const, id: c.id })), { type: "Course", id: "LIST" }] : [{ type: "Course", id: "LIST" }],
    }),
    removeCourse: builder.mutation<ApiSuccess<null>, string>({
      query: (id) => ({ url: `/courses/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),

    // ---------------- Analytics ----------------
    getDashboardAnalytics: builder.query<ApiSuccess<any>, void>({ query: () => "/analytics/admin/dashboard" }),
    getAdminDashboardAnalytics: builder.query<ApiSuccess<any>, void>({ query: () => "/analytics/admin/dashboard",}),
    
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useLazyMeQuery,
  useListUsersQuery,
  useApproveInstructorMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useListCoursesQuery,
  useRemoveCourseMutation,
  useGetDashboardAnalyticsQuery,
  useGetAdminDashboardAnalyticsQuery
} = apiSlice;
