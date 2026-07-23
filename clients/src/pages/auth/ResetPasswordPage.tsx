import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router";
import { School, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import toast from "react-hot-toast";
import Auth from "../../images/authImage.jpg";
import { useResetPasswordMutation } from "../../store/api/apiSlice";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[a-z]/, "Add a lowercase letter")
      .regex(/[0-9]/, "Add a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [isDone, setIsDone] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: y * -6, ry: x * 6 });
  };

  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("Missing or invalid reset token");
      return;
    }
    try {
      await resetPassword({ token, password: values.password }).unwrap();
      setIsDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Reset link is invalid or expired");
    }
  };

  return (
    <div className="h-screen w-full flex bg-surface-container-lowest text-on-surface overflow-hidden">
      {/* Left side: Brand Visual Panel */}
      <section className="hidden lg:flex lg:w-1/2 p-10">
        <div className="auth-image-card">
          <span className="auth-image-ribbon" />
          <img
            alt="EduAI Pro"
            className="absolute inset-0 w-full h-full object-cover"
            src={Auth}
          />
          <div className="auth-image-overlay" />
          <div className="relative z-10 h-full flex items-center justify-center text-center px-lg">
            <div className="flex flex-col items-center gap-md">
              <div className="bg-surface-container-lowest/20 backdrop-blur-md p-md rounded-xl inline-flex items-center justify-center">
                <School className="text-white w-16 h-16" />
              </div>
              <h1 className="text-4xl text-white font-bold tracking-tight">Skill Forge</h1>
              <p className="text-lg text-white/90">Elevate your modern learning experience.</p>
              <div className="mt-lg flex items-center gap-md">
                <div className="h-[1px] w-12 bg-white/30"></div>
                <span className="text-white/70 text-xs font-medium uppercase tracking-widest">Empowering Minds</span>
                <div className="h-[1px] w-12 bg-white/30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right side: Reset Form */}
      <main className="flex-1 flex items-center justify-center h-full p-10 bg-surface-container-low dark:bg-inverse-surface">
        <div className="cyber-auth-shell w-full h-full">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="cyber-auth-card h-full flex flex-col p-lg"
            style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
          >
            {/* Decorative layers */}
            <div className="cyber-auth-glow-field">
              <div className="cyber-auth-glow cyber-auth-glow-1" />
              <div className="cyber-auth-glow cyber-auth-glow-2" />
            </div>
            <div className="cyber-auth-glare" />
            <div className="cyber-auth-lines">
              <span /><span /><span />
            </div>
            <div className="cyber-auth-corners">
              <span /><span /><span /><span />
            </div>
            <div className="cyber-auth-scan" />

            {/* Form content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center overflow-y-auto">
              {!isDone ? (
                <>
                  <div className="mb-lg">
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mb-6 font-medium transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign In
                    </Link>
                    <h2 className="text-2xl font-semibold text-on-surface tracking-tight mb-2 text-center">Skill Forge</h2>
                    <h2 className="text-xl font-semibold text-on-surface tracking-tight mb-2">Reset Password</h2>
                    <p className="text-sm text-outline">
                      Choose a new password for your account.
                    </p>
                  </div>

                  {!token && (
                    <p className="mb-md rounded-lg bg-error/10 border border-error/30 p-3 text-xs text-error">
                      No reset token found in the URL — use the link from your email.
                    </p>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant mb-1.5">
                        New Password
                      </label>
                      <div className="relative flex items-center rounded-lg border border-outline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <Lock className="w-5 h-5 text-outline absolute left-3" />
                        <input
                          {...register("password")}
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-transparent border-0 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                          aria-invalid={!!errors.password}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 text-outline hover:text-on-surface transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.password.message}</p>
                      )}
                    </div>


                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-on-surface-variant mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative flex items-center rounded-lg border border-outline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <Lock className="w-5 h-5 text-outline absolute left-3" />
                        <input
                          {...register("confirmPassword")}
                          id="confirmPassword"
                          type={showPassword1 ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-transparent border-0 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                          aria-invalid={!!errors.confirmPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword1((s) => !s)}
                          className="absolute right-3 text-outline hover:text-on-surface transition-colors"
                          aria-label={showPassword1 ? "Hide password" : "Show password"}
                        >
                          {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.confirmPassword.message}</p>
                      )}
                    </div>



                    <button
                      type="submit"
                      disabled={isLoading || !token}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-6"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <span>Reset Password</span>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-md">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-xl">
                    <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-semibold text-on-surface tracking-tight mb-2">Password Reset!</h2>
                  <p className="text-sm text-outline mb-xl max-w-[320px] mx-auto">
                    Redirecting you to sign in...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;