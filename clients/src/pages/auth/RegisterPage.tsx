import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, School, Mail, Lock, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useRegisterMutation } from "../../store/api/apiSlice";

const schema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[a-z]/, "Add a lowercase letter")
      .regex(/[0-9]/, "Add a number"),
    confirmPassword: z.string(),
    role: z.enum(["STUDENT", "INSTRUCTOR"]),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);

  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "STUDENT",
      terms: false,
    },
  });

 
  const termsAccepted = watch("terms");

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser(values).unwrap();
      toast.success("Account created! Please sign in.");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Registration failed");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-surface-container-lowest text-on-surface overflow-hidden">
      {/* Left side: Brand Visual Panel */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-xl overflow-hidden">
        <img
          alt="EduAI Pro"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          src="https://lh3.googleusercontent.com/aida/AP1WRLv0vs9g5jzZQmfctFgrk63PUbEIp0aKKxw18fHegiIPMCUCHsmRMCpLKZvYlZvPh8jrwvK27YMIG5AR6VjWzG5aSdgWaDiFI0r_5lOV1Zaj5SjuNY1bcpbRS-NdSGJzfgkgEhW1VD3mYCOnAeD349yGZkbIkYRus_IwY9wgMnxL2jza0jislWjVyDh29lk6iAe95SN9C433SQnNHraJNRQPxLP5VDrTVb3FuqwDZ-ERU0tlXQRRkUVV7HOj"
        />
        <div className="relative z-10 text-center px-lg">
          <div className="flex flex-col items-center gap-md">
            <div className="bg-surface-container-lowest/20 backdrop-blur-md p-md rounded-xl inline-flex items-center justify-center">
              <School className="text-white w-16 h-16" />
            </div>
            <h1 className="text-4xl text-white font-bold tracking-tight">EduAI Pro</h1>
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

      {/* Right side: Register Form (Scrollable Container) */}
      <main className="flex-1 flex flex-col items-center justify-center h-full overflow-y-auto p-md lg:p-xl bg-surface-container-low dark:bg-inverse-surface">
        <div className="w-full max-w-[440px] my-auto bg-surface-container-lowest dark:bg-surface-container p-lg rounded-2xl shadow-xl border border-outline-variant/30">
          <div className="mb-md">
            <h2 className="text-2xl font-semibold text-on-surface tracking-tight mb-1">Create Your Account</h2>
            <p className="text-sm text-outline">Start learning — or teaching — in minutes.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-sm" noValidate>
            {/* Full Name Field Wrapper */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-on-surface-variant mb-1">
                Full Name
              </label>
              <div className="relative flex items-center rounded-lg border border-outline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <User className="w-4.5 h-4.5 text-outline absolute left-3" />
                <input
                  {...register("name")}
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 bg-transparent border-0 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field Wrapper */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-on-surface-variant mb-1">
                Email Address
              </label>
              <div className="relative flex items-center rounded-lg border border-outline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Mail className="w-4.5 h-4.5 text-outline absolute left-3" />
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-transparent border-0 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Role Selector — restored from the old page, styled to match this layout */}
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 rounded-lg border border-outline px-3 py-2 text-sm text-on-surface-variant cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary has-[:checked]:font-semibold">
                  <input type="radio" value="STUDENT" {...register("role")} className="accent-primary" />
                  Student
                </label>
                <label className="flex items-center justify-center gap-2 rounded-lg border border-outline px-3 py-2 text-sm text-on-surface-variant cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary has-[:checked]:font-semibold">
                  <input type="radio" value="INSTRUCTOR" {...register("role")} className="accent-primary" />
                  Instructor
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.role.message}</p>
              )}
            </div>

            {/* Password Field Wrapper */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-on-surface-variant mb-1">
                Password
              </label>
              <div className="relative flex items-center rounded-lg border border-outline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Lock className="w-4.5 h-4.5 text-outline absolute left-3" />
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-transparent border-0 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-outline hover:text-on-surface-variant focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field Wrapper */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-on-surface-variant mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center rounded-lg border border-outline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Lock className="w-4.5 h-4.5 text-outline absolute left-3" />
                <input
                  {...register("confirmPassword")}
                  id="confirmPassword"
                  type={showPassword1 ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-transparent border-0 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword1(!showPassword1)}
                  className="absolute right-3 text-outline hover:text-on-surface-variant focus:outline-none"
                  aria-label={showPassword1 ? "Hide password" : "Show password"}
                >
                  {showPassword1 ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-error font-medium" role="alert">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="space-y-1 pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none text-xs">
                <input
                  {...register("terms")}
                  type="checkbox"
                  className="w-4 h-4 rounded text-primary border-outline focus:ring-primary mt-0.5"
                />
                <span className="text-on-surface-variant leading-tight">
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-error font-medium" role="alert">{errors.terms.message}</p>
              )}
            </div>

            {/* Main CTA Submission Trigger — disabled until terms are checked and the form is valid */}
            <button
              type="submit"
              disabled={isLoading || !termsAccepted || !isValid}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="mt-md pt-md border-t border-outline-variant/30 text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;