import type { LucideIcon } from "lucide-react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN"; 
  avatar?: string | null;
  isVerified: boolean;
  isApproved: boolean;   
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
}

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

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface LessonInput {
  title: string;
  description: string;
  content: string;
  videoUrl: string;
}

export interface ModuleInput {
  title: string;
  description: string;
  lessons: LessonInput[];
}

export interface CourseEnrollment {
  id: string;
  title: string;
  students: number;
}

export interface EnrollmentChartProps {
  courses: CourseEnrollment[];
}

// ---------------- Dashboard ----------------

export interface DashboardStats {
  // Instructor
  totalCourses?: number;
  totalStudents?: number;
  submissionsToGrade?: number;
  averageRating?: number;
  courses?: CourseEnrollment[];
  // Student
  completedCourses?: number;
  averageProgress?: number;
  certificatesEarned?: number;
  needsRevision?: number;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  progress: number;
  completed?: boolean;
}

export interface PerformanceEntry {
  assignment?: string;
  percentage?: number;
}

export interface SummaryCardData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export interface ChatMessage {
  sender: "ai" | "user";
  text: string;
}

export interface QuickPrompt {
  label: string;
  prompt: string;
}