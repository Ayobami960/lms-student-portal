import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import type { AuthUser } from "../authSlice";

export interface ApiSuccess<T> { success: true; message: string; data: T }
export interface Paginated<T> { success: true; message: string; data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Course", "User", "Certificate", "Notification", "Invitation", "Announcement"],
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
    setUserActive: builder.mutation<ApiSuccess<any>, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/users/${id}/active`, method: "PATCH", body: { isActive } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
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
    getAdminDashboardAnalytics: builder.query<ApiSuccess<any>, void>({ query: () => "/analytics/admin/dashboard" }),

    // ---------------- Admin invitations ----------------
    inviteAdmin: builder.mutation<ApiSuccess<{ email: string; expiresAt: string }>, { email: string }>({
      query: (body) => ({ url: "/admin/invitations", method: "POST", body }),
      invalidatesTags: [{ type: "Invitation", id: "LIST" }],
    }),
    listPendingInvitations: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/admin/invitations",
      providesTags: [{ type: "Invitation", id: "LIST" }],
    }),
    verifyInvitation: builder.query<ApiSuccess<{ email: string }>, string>({
      query: (token) => `/admin/invitations/${token}`,
    }),
    acceptInvitation: builder.mutation<ApiSuccess<any>, { token: string; name: string; password: string; confirmPassword: string }>({
      query: ({ token, ...body }) => ({ url: `/admin/invitations/${token}/accept`, method: "POST", body }),
    }),

    // ---------------- Platform settings / maintenance mode ----------------
    getMaintenanceStatus: builder.query<ApiSuccess<{ enabled: boolean; message: string }>, void>({
      query: () => "/settings/maintenance",
      providesTags: ["Announcement"], // reuse a light tag just to allow manual refetch after toggling
    }),
    setMaintenanceStatus: builder.mutation<ApiSuccess<{ enabled: boolean; message: string }>, { enabled: boolean; message?: string }>({
      query: (body) => ({ url: "/settings/maintenance", method: "PATCH", body }),
      invalidatesTags: ["Announcement"],
    }),

    // ---------------- Announcements ----------------
    listAnnouncements: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/announcements",
      providesTags: (result) =>
        result ? [...result.data.map((a: any) => ({ type: "Announcement" as const, id: a.id })), { type: "Announcement", id: "LIST" }] : [{ type: "Announcement", id: "LIST" }],
    }),
    createAnnouncement: builder.mutation<ApiSuccess<any>, { title: string; message: string; audience: string }>({
      query: (body) => ({ url: "/announcements", method: "POST", body }),
      invalidatesTags: [{ type: "Announcement", id: "LIST" }],
    }),

    // ---------------- Notifications ----------------
    listNotifications: builder.query<ApiSuccess<{ notifications: any[]; unreadCount: number }>, void>({
      query: () => "/notifications",
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markNotificationRead: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markAllNotificationsRead: builder.mutation<ApiSuccess<null>, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    deleteNotification: builder.mutation<ApiSuccess<null>, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
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
  useSetUserActiveMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useListCoursesQuery,
  useRemoveCourseMutation,
  useGetDashboardAnalyticsQuery,
  useGetAdminDashboardAnalyticsQuery,
  useInviteAdminMutation,
  useListPendingInvitationsQuery,
  useVerifyInvitationQuery,
  useAcceptInvitationMutation,
  useGetMaintenanceStatusQuery,
  useSetMaintenanceStatusMutation,
  useListAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = apiSlice;