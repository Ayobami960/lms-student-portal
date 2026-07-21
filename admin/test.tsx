"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLoginMutation } from "@/store/api/apiSlice";
import { useAppDispatch } from "@/hooks/redux";
import { setAuth } from "@/store/authSlice";

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
      dispatch(setAuth({ accessToken: res.data.accessToken, user: res.data.user }));
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Login failed");
    }
  }

  // Shared "neubrutalist" input treatment: thick dark border + offset shadow
  // that compresses on focus, matching the card and button below.
  const fieldClass =
    "w-full rounded-[4px] border-2 border-[#264143] px-3 py-3 text-[15px] outline-none shadow-[3px_4px_0px_1px_#E99F4C] transition-transform focus:translate-y-1 focus:shadow-[1px_2px_0px_0px_#E99F4C]";

  return (
    <div className="min-h-screen flex bg-[#F7F0EC]">
      {/* Left: image panel — swap the src for your own artwork */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src="/images/login-hero.jpg"
          alt="Students collaborating"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#264143]/20" />
      </div>

      {/* Right: form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="flex flex-col items-center rounded-[20px] border-2 border-[#264143] bg-[#EDDCD9] px-8 py-10 shadow-[3px_4px_0px_1px_#E99F4C]">
          <p className="mt-1 text-2xl font-black text-[#264143]">WELCOME BACK</p>
          <p className="mb-2 text-sm text-[#264143]/70">Log in to the admin console.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 w-full" noValidate>
            <div className="my-2.5 flex flex-col items-baseline">
              <label htmlFor="email" className="mb-1 font-semibold text-[#264143]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className={fieldClass}
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="my-2.5 flex flex-col items-baseline">
              <label htmlFor="password" className="mb-1 font-semibold text-[#264143]">
                Password
              </label>
              <div className="relative w-full">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`${fieldClass} pr-10`}
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#264143]/60 hover:text-[#264143]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-[#264143]">
              <input
                type="checkbox"
                className="rounded border-[#264143]"
                {...register("rememberMe")}
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="my-6 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#DE5499] py-4 text-[15px] font-extrabold text-white shadow-[3px_3px_0px_0px_#E99F4C] transition-transform hover:opacity-90 focus:translate-y-1 focus:shadow-[1px_2px_0px_0px_#E99F4C] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              {isLoading ? "Logging in..." : "LOG IN"}
            </button>
          </form>

          <p className="text-center text-sm text-[#264143]">
            Don&apos;t have an admin account?{" "}
            <Link href="/register" className="font-extrabold text-[#264143] hover:underline">
              Sign up
            </Link>
          </p>

          
        </div>
      </div>
    </div>
  );
}