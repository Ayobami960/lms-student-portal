
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

import type { AuthUser, ApiSuccess, Paginated, CompleteLessonResponse } from "../../types";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Course",
    "Module",
    "Lesson",
    "Assignment",
    "Submission",
    "Certificate",
    "Conversation",
    "User",
    "Me",
    "Notification",
    "SupportConversation",
    "LiveClass",
    "Todo",
  ],
  endpoints: (builder) => ({
    // ---------------- Auth ----------------
    register: builder.mutation<
      ApiSuccess<{ accessToken: string }>,
      { name: string; email: string; password: string; confirmPassword: string; role?: string }
    >({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    login: builder.mutation<ApiSuccess<{ accessToken: string; user: AuthUser }>, { email: string; password: string; rememberMe?: boolean }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    logout: builder.mutation<ApiSuccess<null>, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    me: builder.query<ApiSuccess<AuthUser> & { accessToken?: string }, void>({
      query: () => "/auth/me",
      providesTags: ["Me"],
    }),
    updateProfile: builder.mutation<ApiSuccess<any>, { name?: string; avatar?: string  }>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),
    forgotPassword: builder.mutation<ApiSuccess<{ token: string | null }>, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation<ApiSuccess<null>, { token: string; password: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),

    // ---------------- Courses ----------------
    listCourses: builder.query<
      Paginated<any>,
      { search?: string; category?: string; level?: string; sort?: string; page?: number; limit?: number; mine?: boolean }
    >({
      query: (params) => ({ url: "/courses", params }),
      providesTags: (result) =>
        result
          ? [...result.data.map((c: any) => ({ type: "Course" as const, id: c.id })), { type: "Course", id: "LIST" }]
          : [{ type: "Course", id: "LIST" }],
    }),
    getCourse: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Course", id }],
    }),
    createCourse: builder.mutation<
      ApiSuccess<any>,
      Partial<{ title: string; description: string; category: string; level: string; duration: number; thumbnail: string }>
    >({
      query: (body) => ({ url: "/courses", method: "POST", body }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
    updateCourse: builder.mutation<ApiSuccess<any>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/courses/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }, { type: "Course", id: "LIST" }],
    }),
    deleteCourse: builder.mutation<ApiSuccess<null>, string>({
      query: (id) => ({ url: `/courses/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Course", id }, { type: "Course", id: "LIST" }],
    }),
    enrollCourse: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/courses/${id}/enroll`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Course", id }, { type: "Course", id: "LIST" }],
    }),
    getCourseRoster: builder.query<ApiSuccess<any[]>, string>({
      query: (id) => `/courses/${id}/roster`,
      providesTags: (_r, _e, id) => [{ type: "Course" as const, id: `roster-${id}` }],
    }),
    unenrollStudent: builder.mutation<ApiSuccess<null>, { enrollmentId: string; courseId: string }>({
      query: ({ enrollmentId }) => ({ url: `/courses/enrollments/${enrollmentId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { courseId }) => [{ type: "Course" as const, id: `roster-${courseId}` }],
    }),

    // ---------------- Lessons ----------------
    getLesson: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/lessons/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Lesson", id }],
    }),
    completeLesson: builder.mutation<ApiSuccess<CompleteLessonResponse>, string>({
      query: (id) => ({ url: `/lessons/${id}/complete`, method: "POST" }),
      invalidatesTags: (result, _e, id) => [
        { type: "Lesson", id },
        ...(result ? [{ type: "Course" as const, id: result.data.courseId }] : []),
      ],
    }),
    updateLesson: builder.mutation<ApiSuccess<any>, { id: string; courseId: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/lessons/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id, courseId }) => [{ type: "Lesson", id }, { type: "Course", id: courseId }],
    }),

    // ---------------- Assignments ----------------
    listAssignments: builder.query<ApiSuccess<any[]>, { courseId?: string } | void>({
      query: (params) => ({ url: "/assignments", params: params ?? {} }),
      providesTags: (result) =>
        result
          ? [...result.data.map((a: any) => ({ type: "Assignment" as const, id: a.id })), { type: "Assignment", id: "LIST" }]
          : [{ type: "Assignment", id: "LIST" }],
    }),
    createAssignment: builder.mutation<ApiSuccess<any>, { lessonId: string; data: Record<string, unknown> }>({
      query: ({ lessonId, data }) => ({ url: `/lessons/${lessonId}/assignments`, method: "POST", body: data }),
      invalidatesTags: [{ type: "Assignment", id: "LIST" }],
    }),
    submitAssignment: builder.mutation<ApiSuccess<any>, { id: string; file: File; comment?: string }>({
      query: ({ id, file, comment }) => {
        const form = new FormData();
        form.append("file", file);
        if (comment) form.append("comment", comment);
        return { url: `/assignments/${id}/submit`, method: "POST", body: form };
      },
      invalidatesTags: [{ type: "Assignment", id: "LIST" }],
    }),

    // ---------------- Grading (instructor) ----------------
    listGradingSubmissions: builder.query<ApiSuccess<any[]>, { courseId?: string } | void>({
      query: (params) => ({ url: "/grading/submissions", params: params ?? {} }),
      providesTags: (result) =>
        result
          ? [...result.data.map((s: any) => ({ type: "Submission" as const, id: s.id })), { type: "Submission", id: "LIST" }]
          : [{ type: "Submission", id: "LIST" }],
    }),
    gradeSubmission: builder.mutation<ApiSuccess<any>, { id: string; score: number; feedback?: string; approved?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/grading/submissions/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Submission", id }, { type: "Submission", id: "LIST" }],
    }),

    // ---------------- Certificates ----------------
    listCertificates: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/certificates",
      providesTags: (result) =>
        result
          ? [...result.data.map((c: any) => ({ type: "Certificate" as const, id: c.id })), { type: "Certificate", id: "LIST" }]
          : [{ type: "Certificate", id: "LIST" }],
    }),
    generateCertificate: builder.mutation<ApiSuccess<any>, string>({
      query: (courseId) => ({ url: "/certificates/generate", method: "POST", body: { courseId } }),
      invalidatesTags: [{ type: "Certificate", id: "LIST" }],
    }),

    // ---------------- Analytics ----------------
    getDashboardAnalytics: builder.query<ApiSuccess<any>, void>({ query: () => "/analytics/dashboard" }),
    getProgressAnalytics: builder.query<ApiSuccess<any[]>, void>({ query: () => "/analytics/progress" }),
    getPerformanceAnalytics: builder.query<ApiSuccess<any[]>, void>({ query: () => "/analytics/performance" }),
    getMonthlyHours: builder.query<ApiSuccess<{ month: string; hours: number }[]>, void>({ query: () => "/analytics/monthly-hours" }),
    getLeaderboard: builder.query<ApiSuccess<any[]>, string | void>({
      query: (courseId) => ({ url: "/analytics/leaderboard", params: courseId ? { courseId } : {} }),
    }),

    // ---------------- Platform settings ----------------
    getMaintenanceStatus: builder.query<ApiSuccess<{ enabled: boolean; message: string }>, void>({
      query: () => "/settings/maintenance",
    }),

    // ---------------- Messaging (support tickets + instructor DMs) ----------------
    listMyConversations: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/conversations",
      providesTags: (result) =>
        result
          ? [...result.data.map((c: any) => ({ type: "SupportConversation" as const, id: c.id })), { type: "SupportConversation", id: "LIST" }]
          : [{ type: "SupportConversation", id: "LIST" }],
    }),
    getMyConversation: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/conversations/${id}`,
      providesTags: (_r, _e, id) => [{ type: "SupportConversation" as const, id }],
    }),
    startConversation: builder.mutation<
      ApiSuccess<any>,
      { subject: string; message: string; type: "SUPPORT" | "INSTRUCTOR_DM"; recipientId?: string; courseId?: string }
    >({
      query: (body) => ({ url: "/conversations", method: "POST", body }),
      invalidatesTags: [{ type: "SupportConversation", id: "LIST" }],
    }),
    replyToConversation: builder.mutation<ApiSuccess<any>, { id: string; content: string }>({
      query: ({ id, content }) => ({ url: `/conversations/${id}/messages`, method: "POST", body: { content } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "SupportConversation" as const, id }, { type: "SupportConversation", id: "LIST" }],
    }),

    // ---------------- Live classroom ----------------
    listLiveClasses: builder.query<ApiSuccess<any[]>, string>({
      query: (courseId) => `/courses/${courseId}/live-classes`,
      providesTags: (result) =>
        result
          ? [...result.data.map((c: any) => ({ type: "LiveClass" as const, id: c.id })), { type: "LiveClass", id: "LIST" }]
          : [{ type: "LiveClass", id: "LIST" }],
    }),
    createLiveClass: builder.mutation<ApiSuccess<any>, { courseId: string; title: string; description?: string; scheduledAt: string }>({
      query: ({ courseId, ...body }) => ({ url: `/courses/${courseId}/live-classes`, method: "POST", body }),
      invalidatesTags: [{ type: "LiveClass", id: "LIST" }],
    }),
    startLiveClass: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/live-classes/${id}/start`, method: "POST" }),
      invalidatesTags: [{ type: "LiveClass", id: "LIST" }],
    }),
    endLiveClass: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/live-classes/${id}/end`, method: "POST" }),
      invalidatesTags: [{ type: "LiveClass", id: "LIST" }],
    }),
    joinLiveClass: builder.mutation<ApiSuccess<any>, { id: string; studentId?: string }>({
      query: ({ id, studentId }) => ({ url: `/live-classes/${id}/join`, method: "POST", body: { studentId } }),
    }),
    leaveLiveClass: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/live-classes/${id}/leave`, method: "POST" }),
    }),
    getLiveClassAttendance: builder.query<ApiSuccess<any[]>, string>({
      query: (id) => `/live-classes/${id}/attendance`,
    }),
    listLiveClassChat: builder.query<ApiSuccess<any[]>, string>({
      query: (id) => `/live-classes/${id}/chat`,
    }),
    sendLiveClassChat: builder.mutation<ApiSuccess<any>, { id: string; content: string }>({
      query: ({ id, content }) => ({ url: `/live-classes/${id}/chat`, method: "POST", body: { content } }),
    }),

    // ---------------- To-do list ----------------
    listTodos: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/todos",
      providesTags: (result) =>
        result
          ? [...result.data.map((t: any) => ({ type: "Todo" as const, id: t.id })), { type: "Todo", id: "LIST" }]
          : [{ type: "Todo", id: "LIST" }],
    }),
    createTodo: builder.mutation<ApiSuccess<any>, { title: string; category?: string; dueAt?: string }>({
      query: (body) => ({ url: "/todos", method: "POST", body }),
      invalidatesTags: [{ type: "Todo", id: "LIST" }],
    }),
    updateTodo: builder.mutation<ApiSuccess<any>, { id: string; completed?: boolean; title?: string }>({
      query: ({ id, ...body }) => ({ url: `/todos/${id}`, method: "PATCH", body }),
      invalidatesTags: [{ type: "Todo", id: "LIST" }],
    }),
    deleteTodo: builder.mutation<ApiSuccess<null>, string>({
      query: (id) => ({ url: `/todos/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Todo", id: "LIST" }],
    }),

    // ---------------- AI Assistant ----------------
    listConversations: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/ai/conversations",
      providesTags: (result) =>
        result
          ? [...result.data.map((c: any) => ({ type: "Conversation" as const, id: c.id })), { type: "Conversation", id: "LIST" }]
          : [{ type: "Conversation", id: "LIST" }],
    }),
    getConversation: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/ai/conversations/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Conversation", id }],
    }),
    sendChatMessage: builder.mutation<ApiSuccess<{ conversation: any; reply: any }>, { message: string; conversationId?: string; courseId?: string }>({
      query: (body) => ({ url: "/ai/chat", method: "POST", body }),
      invalidatesTags: [{ type: "Conversation", id: "LIST" }],
    }),

    // ---------------- Instructor course creation ----------------
    createModule: builder.mutation<ApiSuccess<any>, { courseId: string; data: Record<string, unknown> }>({
      query: ({ courseId, data }) => ({ url: `/courses/${courseId}/modules`, method: "POST", body: data }),
      invalidatesTags: (_r, _e, { courseId }) => [{ type: "Course", id: courseId }],
    }),
    createLesson: builder.mutation<ApiSuccess<any>, { moduleId: string; courseId?: string; data: Record<string, unknown> }>({
      query: ({ moduleId, data }) => ({ url: `/modules/${moduleId}/lessons`, method: "POST", body: data }),
      invalidatesTags: (_r, _e, { courseId }) => (courseId ? [{ type: "Course", id: courseId }] : [{ type: "Course", id: "LIST" }]),
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
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useListCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useEnrollCourseMutation,
  useGetCourseRosterQuery,
  useUnenrollStudentMutation,
  useGetLessonQuery,
  useCompleteLessonMutation,
  useUpdateLessonMutation,
  useListAssignmentsQuery,
  useCreateAssignmentMutation,
  useSubmitAssignmentMutation,
  useListGradingSubmissionsQuery,
  useGradeSubmissionMutation,
  useListCertificatesQuery,
  useGenerateCertificateMutation,
  useGetDashboardAnalyticsQuery,
  useGetProgressAnalyticsQuery,
  useGetPerformanceAnalyticsQuery,
  useGetMonthlyHoursQuery,
  useGetLeaderboardQuery,
  useGetMaintenanceStatusQuery,
  useListMyConversationsQuery,
  useGetMyConversationQuery,
  useStartConversationMutation,
  useReplyToConversationMutation,
  useListLiveClassesQuery,
  useCreateLiveClassMutation,
  useStartLiveClassMutation,
  useEndLiveClassMutation,
  useJoinLiveClassMutation,
  useLeaveLiveClassMutation,
  useGetLiveClassAttendanceQuery,
  useListLiveClassChatQuery,
  useSendLiveClassChatMutation,
  useListTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useListConversationsQuery,
  useGetConversationQuery,
  useLazyGetConversationQuery,
  useSendChatMessageMutation,
  useCreateModuleMutation,
  useCreateLessonMutation,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = apiSlice;

