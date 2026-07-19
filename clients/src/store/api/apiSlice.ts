import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import type { AuthUser } from "../authSlice";

export interface ApiSuccess<T> { 
  success: true; 
  message: string; 
  data: T; 
}

export interface Paginated<T> { 
  success: true; 
  message: string; 
  data: T[]; 
  pagination: { 
    page: number; 
    limit: number; 
    total: number; 
    totalPages: number; 
  }; 
}

export interface CompleteLessonResponse {
  progress: number;
  completed: boolean;
  courseId: string;
  nextLessonId: string | null;
  courseCompleted: boolean;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Course", "Module", "Lesson", "Assignment", "Submission", "Certificate", "Conversation", "User", "Me"],
  endpoints: (builder) => ({
    register: builder.mutation<ApiSuccess<{ accessToken: string }>, { name: string; email: string; password: string; confirmPassword: string; role?: string }>({
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
    forgotPassword: builder.mutation<ApiSuccess<{ token: string | null }>, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation<ApiSuccess<null>, { token: string; password: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
    listCourses: builder.query<Paginated<any>, { search?: string; category?: string; level?: string; sort?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: "/courses", params }),
      providesTags: (result) =>
        result ? [...result.data.map((c: any) => ({ type: "Course" as const, id: c.id })), { type: "Course", id: "LIST" }] : [{ type: "Course", id: "LIST" }],
    }),
    getCourse: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Course", id }],
    }),
    createCourse: builder.mutation<ApiSuccess<any>, Partial<{ title: string; description: string; category: string; level: string; duration: number; thumbnail: string }>>({
      query: (body) => ({ url: "/courses", method: "POST", body }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
    updateCourse: builder.mutation<ApiSuccess<any>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/courses/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }, { type: "Course", id: "LIST" }],
    }),
    enrollCourse: builder.mutation<ApiSuccess<any>, string>({
      query: (id) => ({ url: `/courses/${id}/enroll`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Course", id }, { type: "Course", id: "LIST" }],
    }),
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
    listAssignments: builder.query<ApiSuccess<any[]>, { courseId?: string } | void>({
      query: (params) => ({ url: "/assignments", params: params ?? {} }),
      providesTags: (result) =>
        result ? [...result.data.map((a: any) => ({ type: "Assignment" as const, id: a.id })), { type: "Assignment", id: "LIST" }] : [{ type: "Assignment", id: "LIST" }],
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
    listGradingSubmissions: builder.query<ApiSuccess<any[]>, { courseId?: string } | void>({
      query: (params) => ({ url: "/grading/submissions", params: params ?? {} }),
      providesTags: (result) =>
        result ? [...result.data.map((s: any) => ({ type: "Submission" as const, id: s.id })), { type: "Submission", id: "LIST" }] : [{ type: "Submission", id: "LIST" }],
    }),
    gradeSubmission: builder.mutation<ApiSuccess<any>, { id: string; score: number; feedback?: string }>({
      query: ({ id, ...body }) => ({ url: `/grading/submissions/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Submission", id }, { type: "Submission", id: "LIST" }],
    }),
    listCertificates: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/certificates",
      providesTags: (result) =>
        result ? [...result.data.map((c: any) => ({ type: "Certificate" as const, id: c.id })), { type: "Certificate", id: "LIST" }] : [{ type: "Certificate", id: "LIST" }],
    }),
    generateCertificate: builder.mutation<ApiSuccess<any>, string>({
      query: (courseId) => ({ url: "/certificates/generate", method: "POST", body: { courseId } }),
      invalidatesTags: [{ type: "Certificate", id: "LIST" }],
    }),
    getDashboardAnalytics: builder.query<ApiSuccess<any>, void>({ query: () => "/analytics/dashboard" }),
    getProgressAnalytics: builder.query<ApiSuccess<any[]>, void>({ query: () => "/analytics/progress" }),
    getPerformanceAnalytics: builder.query<ApiSuccess<any[]>, void>({ query: () => "/analytics/performance" }),
    listConversations: builder.query<ApiSuccess<any[]>, void>({
      query: () => "/ai/conversations",
      providesTags: (result) =>
        result ? [...result.data.map((c: any) => ({ type: "Conversation" as const, id: c.id })), { type: "Conversation", id: "LIST" }] : [{ type: "Conversation", id: "LIST" }],
    }),
    getConversation: builder.query<ApiSuccess<any>, string>({
      query: (id) => `/ai/conversations/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Conversation", id }],
    }),
    sendChatMessage: builder.mutation<ApiSuccess<{ conversation: any; reply: any }>, { message: string; conversationId?: string; courseId?: string }>({
      query: (body) => ({ url: "/ai/chat", method: "POST", body }),
      invalidatesTags: [{ type: "Conversation", id: "LIST" }],
    }),
    createModule: builder.mutation<ApiSuccess<any>, { courseId: string; data: Record<string, unknown> }>({
      query: ({ courseId, data }) => ({ url: `/courses/${courseId}/modules`, method: "POST", body: data }),
      invalidatesTags: (_r, _e, { courseId }) => [{ type: "Course", id: courseId }],
    }),
    createLesson: builder.mutation<ApiSuccess<any>, { moduleId: string; data: Record<string, unknown> }>({
      query: ({ moduleId, data }) => ({ url: `/modules/${moduleId}/lessons`, method: "POST", body: data }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useLazyMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useListCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useEnrollCourseMutation,
  useGetLessonQuery,
  useCompleteLessonMutation,
  useListAssignmentsQuery,
  useSubmitAssignmentMutation,
  useListGradingSubmissionsQuery,
  useGradeSubmissionMutation,
  useListCertificatesQuery,
  useGenerateCertificateMutation,
  useGetDashboardAnalyticsQuery,
  useGetProgressAnalyticsQuery,
  useGetPerformanceAnalyticsQuery,
  useListConversationsQuery,
  useGetConversationQuery,
  useLazyGetConversationQuery,
  useSendChatMessageMutation,
  useCreateModuleMutation,
  useCreateLessonMutation,
} = apiSlice;