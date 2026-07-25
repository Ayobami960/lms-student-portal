import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, School, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useLoginMutation } from "../../store/api/apiSlice";
import { setAuth } from "../../store/authSlice";
import { useAppDispatch } from "../../hooks/redux";
import Auth from "../../images/authImage.jpg";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  terms: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

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
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      terms: false,
    },
  });

  const termsAccepted = watch("terms");

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
    <div className="h-screen w-full flex bg-surface-container-lowest text-on-surface overflow-hidden">
      {/* Left side: Brand Visual Panel */}
      <section className="hidden lg:flex lg:w-1/2 p-10">
        <div className="auth-image-card">
          <span className="auth-image-ribbon" />
          <img
            alt="SkillForge"
            className="absolute inset-0 w-full h-full object-cover"
            src={Auth}
          />
          <div className="auth-image-overlay" />
          <div className="relative z-10 h-full flex items-center justify-center text-center px-lg">
            <div className="flex flex-col items-center gap-md">
              <div className="bg-surface-container-lowest/20 backdrop-blur-md p-md rounded-xl inline-flex items-center justify-center">
                <School className="text-white w-16 h-16" />
              </div>
              <h1 className="text-4xl text-white font-bold tracking-tight">SkillForge</h1>
              <p className="text-lg text-white/90">Elevate your modern learning experience.</p>
              <div className="mt-lg flex items-center gap-md">
                <div className="h-px w-12 bg-white/30"></div>
                <span className="text-white/70 text-xs font-medium uppercase tracking-widest">Empowering Minds</span>
                <div className="h-px w-12 bg-white/30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right side: Login Form — padding matches the image section (p-10) so both cards are the same visible height */}
      <main className="flex-1 flex items-center justify-center h-full p-5 bg-surface-container-low dark:bg-inverse-surface">
        <div className="cyber-auth-shell w-full  h-full">
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

            {/* Form content — centered vertically inside the full-height card, scrollable if it ever overflows on short screens */}
            <div className="relative z-10 flex-1 flex flex-col justify-center overflow-y-auto">
              <div className="mb-lg">
                
                <h2 className="text-xl font-semibold text-on-surface tracking-tight mb-2">Welcome Back Skill Forge</h2>
                <p className="text-sm text-outline">Please sign in to access your digital environment</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
                {/* Email Field */}
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

                {/* Password Field */}
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

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      {...register("terms")}
                      type="checkbox"
                      className="w-4 h-4 rounded text-primary border-outline focus:ring-primary"
                    />
                    <span className="text-xs font-medium text-on-surface-variant">Remember me</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !termsAccepted || !isValid}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

              <div className="mt-lg pt-md border-t border-outline-variant/30 text-center">
                <p className="text-xs text-on-surface-variant">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="text-primary hover:underline font-semibold">
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;