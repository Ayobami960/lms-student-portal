import type { LucideIcon } from "lucide-react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  avatar?: string | null;
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