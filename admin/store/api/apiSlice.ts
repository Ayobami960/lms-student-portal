import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import type { AuthUser } from "../authSlice";

export interface ApiSuccess<T> { success: true; message: string; data: T }
export interface Paginated<T> { success: true; message: string; data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

export interface CreateCoursePayload {
  title?: string;
  description?: string;
  category?: string;
  level?: string;
  duration?: number;
  thumbnail?: string;
  published?: boolean;
  instructorId?: string;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Course", "User", "Certificate", "Notification", "Invitation", "Announcement", "Assignment", "Conversation"],
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
    setUserActivate: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/users/${id}/activate`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    setUserDeactivate: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/users/${id}/deactivate`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    assignStudentId: builder.mutation<ApiSuccess<any>, { id: string; studentId?: string }>({
      query: ({ id, studentId }) => ({ url: `/users/${id}/student-id`, method: "PATCH", body: { studentId } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    getUserActivity: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/users/${id}/activity`,
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
    getCourse: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Course", id }],
    }),
    createCourse: builder.mutation<ApiSuccess<any>, CreateCoursePayload>({
      query: (body) => ({ url: "/courses", method: "POST", body }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
    updateCourse: builder.mutation<ApiSuccess<any>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/courses/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }, { type: "Course", id: "LIST" }],
    }),
    removeCourse: builder.mutation<ApiSuccess<null>, string>({
      query: (id) => ({ url: `/courses/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
    createModule: builder.mutation<ApiSuccess<any>, { courseId: string; data: { title: string; description?: string; order?: number } }>({
      query: ({ courseId, data }) => ({ url: `/courses/${courseId}/modules`, method: "POST", body: data }),
      invalidatesTags: (_r, _e, { courseId }) => [{ type: "Course", id: courseId }],
    }),
    createLesson: builder.mutation<ApiSuccess<any>, { moduleId: string; data: { title: string; description?: string; content?: string; videoUrl?: string; order?: number } }>({
      query: ({ moduleId, data }) => ({ url: `/modules/${moduleId}/lessons`, method: "POST", body: data }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
    updateLesson: builder.mutation<ApiSuccess<any>, { id: string; courseId?: string; data: { title?: string; description?: string; content?: string; videoUrl?: string } }>({
      query: ({ id, data }) => ({ url: `/lessons/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { courseId }) => (courseId ? [{ type: "Course", id: courseId }] : [{ type: "Course", id: "LIST" }]),
    }),

    // ---------------- Assignments ----------------
    listAssignments: builder.query<ApiSuccess<any[]>, { courseId?: string } | void>({
      query: (params) => ({ url: "/assignments", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.data.map((a: any) => ({ type: "Assignment" as const, id: a.id })), { type: "Assignment", id: "LIST" }]
          : [{ type: "Assignment", id: "LIST" }],
    }),
    createAssignment: builder.mutation<
      ApiSuccess<any>,
      { lessonId: string; data: { title: string; description: string; instructions?: string; dueDate: string; maxScore?: number } }
    >({
      query: ({ lessonId, data }) => ({ url: `/lessons/${lessonId}/assignments`, method: "POST", body: data }),
      invalidatesTags: [{ type: "Assignment", id: "LIST" }],
    }),
    updateAssignment: builder.mutation<
      ApiSuccess<any>,
      { id: string; data: Partial<{ title: string; description: string; instructions: string; dueDate: string; maxScore: number }> }
    >({
      query: ({ id, data }) => ({ url: `/assignments/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Assignment", id }, { type: "Assignment", id: "LIST" }],
    }),
    deleteAssignment: builder.mutation<ApiSuccess<null>, string>({
      query: (id) => ({ url: `/assignments/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Assignment", id: "LIST" }],
    }),

    // ---------------- Analytics ----------------
    getDashboardAnalytics: builder.query<ApiSuccess<any>, void>({ query: () => "/analytics/admin/dashboard" }),
    getAdminDashboardAnalytics: builder.query<ApiSuccess<any>, void>({ query: () => "/analytics/admin/dashboard" }),
    getDashboardCharts: builder.query<ApiSuccess<any>, void>({ query: () => "/analytics/charts" }),

    // ---------------- Audit logs ----------------
    listAuditLogs: builder.query<Paginated<any>, { page?: number; limit?: number; action?: string; actorId?: string; from?: string; to?: string }>({
      query: (params) => ({ url: "/audit-logs", params }),
    }),
    listAuditActions: builder.query<ApiSuccess<string[]>, void>({
      query: () => "/audit-logs/actions",
    }),

    // ---------------- Support inbox (admin side of messaging) ----------------
    listConversations: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/conversations",
      providesTags: [{ type: "Conversation" as const, id: "LIST" }],
    }),
    getConversation: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/conversations/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Conversation" as const, id }],
    }),
    sendConversationMessage: builder.mutation<ApiSuccess<any>, { id: string; content: string }>({
      query: ({ id, content }) => ({ url: `/conversations/${id}/messages`, method: "POST", body: { content } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Conversation" as const, id }, { type: "Conversation" as const, id: "LIST" }],
    }),
    updateConversationStatus: builder.mutation<ApiSuccess<any>, { id: string; status: "OPEN" | "RESOLVED" | "ARCHIVED" }>({
      query: ({ id, status }) => ({ url: `/conversations/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Conversation" as const, id }, { type: "Conversation" as const, id: "LIST" }],
    }),

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
  useSetUserActivateMutation,
  useSetUserDeactivateMutation,
  useAssignStudentIdMutation,
  useGetUserActivityQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useListCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useRemoveCourseMutation,
  useCreateModuleMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useListAssignmentsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetDashboardAnalyticsQuery,
  useGetAdminDashboardAnalyticsQuery,
  useGetDashboardChartsQuery,
  useListAuditLogsQuery,
  useListAuditActionsQuery,
  useListConversationsQuery,
  useGetConversationQuery,
  useSendConversationMessageMutation,
  useUpdateConversationStatusMutation,
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