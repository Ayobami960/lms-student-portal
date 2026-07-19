import { Routes, Route, Navigate } from "react-router";
import { lazy, Suspense, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import { useAppDispatch, useAppSelector } from "./hooks/redux";
import { useLazyMeQuery } from "./store/api/apiSlice";
// FIX: Imported setAccessToken and clearAuth alongside setUser
import { setUser, setAccessToken, clearAuth } from "./store/authSlice";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage"));

const CoursesPage = lazy(() => import("./pages/courses/CoursesPage"));
const CoursesDetail = lazy(() => import("./pages/courses/CourseDetails"));
const AssignmentsPage = lazy(() => import("./pages/Assignment/AssignmentsPage"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));


function Fallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAppSelector((state) => state.auth);
  
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [triggerMe] = useLazyMeQuery();

  useEffect(() => {
    if (accessToken || !user) {
      setIsAuthChecked(true);
      return;
    }

    let mounted = true;

    triggerMe()
      .unwrap()
      .then((payload) => {
        if (mounted) {
          // FIX 1: Update the user object profile details
          dispatch(setUser(payload.data));
          
          // FIX 2: Your api slice backend intercepts and returns a brand-new 
          // short-lived access token in the response data or cookies. We must read it here 
          // and save it into our global state slice context so headers attach correctly.
          // Note: Adjust payload path if your API returns it inside another wrapper like payload.accessToken
          if (payload.accessToken) {
            dispatch(setAccessToken(payload.accessToken));
          }
        }
      })
      .catch(() => {
        // FIX 3: If the background refresh API request hits a 401 or network error 
        // because the user's cookies expired, clean up the stale localStorage user layout context.
        if (mounted) {
          dispatch(clearAuth());
        }
      })
      .finally(() => {
        if (mounted) setIsAuthChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, [accessToken, user, triggerMe, dispatch]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!isAuthChecked) {
    return <Fallback />;
  }

  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        {/* Public auth pages (Will redirect to /dashboard if logged in) */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } 
        />

        {/* Protected layout wraps the dashboard and course routes */}
        <Route element={<ProtectedLayout currentTheme={theme} onToggleTheme={toggleTheme} />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CoursesDetail />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
        </Route>

        {/* Fallback route - sends unhandled paths back home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}