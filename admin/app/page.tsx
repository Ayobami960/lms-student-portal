"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { useLoginMutation } from "@/store/api/apiSlice";
import { useAppDispatch } from "@/hooks/redux";
import { setAuth } from "@/store/authSlice";
import AuthImage from "../images/students-collaborating.jpg"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

 async function onSubmit(values: FormValues) {
  try {
    const res = await login(values).unwrap();
    const { accessToken, user } = res.data;

    if (user.role !== "ADMIN") {
      toast.error("This account doesn't have admin access.");
      return; 
    }

    dispatch(setAuth({ accessToken, user }));
    toast.success("Welcome back!");
    router.push("/dashboard");
  } catch (err: any) {
    toast.error(err?.data?.message ?? "Login failed");
  }
}


  


  const fieldClass =
    "w-full rounded-[10px] border-2 border-[var(--foreground)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none shadow-[3px_4px_0px_1px_var(--primary)] transition-transform focus:translate-y-1 focus:shadow-[1px_2px_0px_0px_var(--primary)] disabled:opacity-70";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: image panel */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-10">
        <div className="relative w-full h-[calc(100vh-5rem)] rounded-[24px] border-2 border-foreground overflow-hidden shadow-[6px_8px_0px_1px_var(--primary)]">
          <Image
            src={AuthImage}
            alt="Students collaborating"
           fill
            priority
            className="object-cover h-full"
          />
          <div className="absolute inset-0 bg-(--foreground)/20" />

          {/* Brand mark, layered on top of the image */}
          <div className="absolute top-8 left-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border-2 border-foreground gradient-primary flex items-center justify-center shadow-[2px_3px_0px_0px_var(--foreground)]">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white drop-shadow-sm">
              Admin Power Management
            </span>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
      <div className="w-full md:max-w-md lg:max-w-[80%] rounded-[20px] border-2 border-foreground bg-card px-8 py-10 shadow-[6px_8px_0px_1px_var(--primary)]">
        {/* Heading */}
        <h1 className="text-3xl font-black text-card-foreground mb-2 leading-tight">
          Welcome back to <br />
          <span className="text-primary">your classroom.</span>
        </h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">
          Log in to manage courses, students, and enrollment analytics.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@school.com"
                className={`${fieldClass} pl-11`}
                {...register("email")}
                aria-invalid={!!errors.email}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2"
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${fieldClass} pl-11 pr-11`}
                {...register("password")}
                aria-invalid={!!errors.password}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-destructive)" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-card-foreground)">
            <input
              type="checkbox"
              className="rounded border-2 border-foreground text-primary focus:ring-(--primary)/50"
              {...register("rememberMe")}
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl border-2 border-foreground gradient-primary text-white font-black text-sm shadow-[3px_4px_0px_1px_var(--foreground)] transition-transform mt-2 flex items-center justify-center gap-2 focus:translate-y-1 focus:shadow-[1px_2px_0px_0px_var(--foreground)] hover:opacity-95 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Logging in...
              </>
            ) : (
              <>
                Log In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        
      </div>
      </div>
    </div>
  );
}
