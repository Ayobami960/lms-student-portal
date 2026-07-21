"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, GraduationCap, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useVerifyInvitationQuery, useAcceptInvitationMutation } from "../../store/api/apiSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const schema = z
  .object({
    name: z.string().min(2, "Name is required"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[a-z]/, "Add a lowercase letter")
      .regex(/[0-9]/, "Add a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
type FormValues = z.infer<typeof schema>;

// Public page — the invited user isn't logged in yet. Reached via the link
// in the invitation email: /accept-invite?token=...
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteFallback />}>
      <AcceptInviteForm />
    </Suspense>
  );
}

// useSearchParams() opts the tree into client-side rendering, so it has to
// live inside a component wrapped in <Suspense> — otherwise `next build`
// fails with a "missing-suspense-with-csr-bailout" prerender error.
function AcceptInviteForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const { data: verifyRes, isLoading: verifying, error: verifyError } = useVerifyInvitationQuery(token, { skip: !token });
  const [acceptInvitation, { isLoading: accepting }] = useAcceptInvitationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await acceptInvitation({ token, ...values }).unwrap();
      setDone(true);
      toast.success("Admin account created!");
      setTimeout(() => router.push("/"), 2000);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to accept invitation");
    }
  }

  return (
    <PageShell>
      <Card>
        {!token || verifyError ? (
          <CardContent className="py-8 text-center">
            <XCircle size={36} className="mx-auto mb-3 text-red-500" />
            <h1 className="mb-1 text-xl font-bold">Invalid invitation</h1>
            <p className="text-sm text-muted-foreground">
              This invitation link is missing, invalid, or has expired. Ask an admin to send a new one.
            </p>
          </CardContent>
        ) : verifying ? (
          <CardContent className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary-600" size={28} />
          </CardContent>
        ) : done ? (
          <CardContent className="py-8 text-center">
            <CheckCircle2 size={36} className="mx-auto mb-3 text-green-600" />
            <h1 className="mb-1 text-xl font-bold">You&apos;re all set!</h1>
            <p className="text-sm text-muted-foreground">Redirecting you to log in...</p>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Set up your admin account</CardTitle>
              <CardDescription>
                You&apos;ve been invited as an admin for <strong>{verifyRes?.data.email}</strong>. Choose your
                name and a password to activate the account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FieldGroup>
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Full name</FieldLabel>
                    <Input
                      id="name"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                    />
                    {errors.name && <FieldError>{errors.name.message}</FieldError>}
                  </Field>

                  <Field data-invalid={!!errors.password}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                        aria-invalid={!!errors.password}
                        {...register("password")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                    {errors.password ? (
                      <FieldError>{errors.password.message}</FieldError>
                    ) : (
                      <FieldDescription>
                        At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
                      </FieldDescription>
                    )}
                  </Field>

                  <Field data-invalid={!!errors.confirmPassword}>
                    <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={!!errors.confirmPassword}
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
                  </Field>

                  <Field>
                    <Button type="submit" disabled={accepting} className="w-full">
                      {accepting && <Loader2 className="animate-spin" size={16} />}
                      {accepting ? "Activating..." : "Activate admin account"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </PageShell>
  );
}

function AcceptInviteFallback() {
  return (
    <PageShell>
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary-600" size={28} />
        </CardContent>
      </Card>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-xl font-bold text-primary-700 dark:text-primary-400"
        >
          <GraduationCap size={28} /> LMS Platform
        </Link>
        {children}
      </div>
    </div>
  );
}