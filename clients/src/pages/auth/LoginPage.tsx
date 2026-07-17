
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router"; // Keeps your v7 router-friendly import
import { Eye, EyeOff, School, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Integration Hooks & Slices
import { useLoginMutation } from "../../store/api/apiSlice";
import { setAuth } from "../../store/authSlice";
import { useAppDispatch } from "../../hooks/redux";

// Form validation schema
const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await login(values).unwrap();
      dispatch(setAuth({ accessToken: res.data.accessToken, user: res.data.user }));
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Login failed");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-surface-container-lowest text-on-surface overflow-hidden">
      {/* Left side: Brand Visual Panel */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-xl overflow-hidden">
        <img
          alt="Lumina LMS"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          src="https://lh3.googleusercontent.com/aida/AP1WRLv0vs9g5jzZQmfctFgrk63PUbEIp0aKKxw18fHegiIPMCUCHsmRMCpLKZvYlZvPh8jrwvK27YMIG5AR6VjWzG5aSdgWaDiFI0r_5lOV1Zaj5SjuNY1bcpbRS-NdSGJzfgkgEhW1VD3mYCOnAeD349yGZkbIkYRus_IwY9wgMnxL2jza0jislWjVyDh29lk6iAe95SN9C433SQnNHraJNRQPxLP5VDrTVb3FuqwDZ-ERU0tlXQRRkUVV7HOj"
        />
        <div className="relative z-10 text-center px-lg">
          <div className="flex flex-col items-center gap-md">
            <div className="bg-surface-container-lowest/20 backdrop-blur-md p-md rounded-xl inline-flex items-center justify-center">
              <School className="text-white w-16 h-16" />
            </div>
            <h1 className="text-4xl text-white font-bold tracking-tight">Lumina LMS</h1>
            <p className="text-lg text-on-primary-container/90">Elevate your modern learning experience.</p>
            <div className="mt-lg flex items-center gap-md">
              <div className="h-[1px] w-12 bg-white/30"></div>
              <span className="text-white/70 text-xs font-medium uppercase tracking-widest">Empowering Minds</span>
              <div className="h-[1px] w-12 bg-white/30"></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/50 to-transparent"></div>
      </section>

      {/* Right side: Login Form (Scrollable Container) */}
      <main className="flex-1 flex flex-col items-center justify-center h-full overflow-y-auto p-md  bg-surface-container-low dark:bg-inverse-surface">
        {/* Mobile Header (only visible on small screens) */}
        <header className="lg:hidden mb-xl text-center">
          <div className="flex items-center justify-center gap-sm mb-xs">
            <School className="text-primary w-10 h-10" />
            <h1 className="text-2xl font-bold tracking-tight text-primary">Lumina AI</h1>
          </div>
          <p className="text-sm text-outline">Elevate your learning experience</p>
        </header>

        {/* Center Registration Core Form Card */}
        <div className="w-full max-w-[400px] my-auto bg-surface-container-lowest dark:bg-surface-container p-lg rounded-2xl shadow-xl border border-outline-variant/30">
          <div className="mb-lg">
            <h2 className="text-2xl font-semibold text-on-surface tracking-tight mb-2">Welcome Back</h2>
            <p className="text-sm text-outline">Please sign in to access your digital environment</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
            {/* Email Field Wrapper */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center rounded-lg border border-outline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Mail className="w-5 h-5 text-outline absolute left-3" />
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field Wrapper */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center rounded-lg border border-outline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Lock className="w-5 h-5 text-outline absolute left-3" />
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-transparent border-0 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-outline hover:text-on-surface-variant focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  {...register("rememberMe")}
                  type="checkbox"
                  className="w-4 h-4 rounded text-primary border-outline focus:ring-primary"
                />
                <span className="text-xs font-medium text-on-surface-variant">Remember me</span>
              </label>
            </div>

            {/* Main CTA Submission Trigger */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Registration Alternation Anchor link wrapper */}
          <div className="mt-lg pt-md border-t border-outline-variant/30 text-center">
            <p className="text-xs text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

