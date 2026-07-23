import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router";
import { School, Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Auth from "../../images/authImage.jpg";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    console.log("Password reset requested for:", values.email);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setIsSubmitted(true);
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
              <h1 className="text-4xl text-white font-bold tracking-tight">EduAI Pro</h1>
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

      {/* Right side: Recovery Form */}
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
              {!isSubmitted ? (
                <>
                  <div className="mb-lg">
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mb-6 font-medium transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign In
                    </Link>
                    <h2 className="text-2xl font-semibold text-on-surface tracking-tight mb-2 text-center">Edu Next Explore</h2>
                    <h2 className="text-xl font-semibold text-on-surface tracking-tight mb-2">Reset Password</h2>
                    <p className="text-sm text-outline">
                      Enter the email associated with your account and we&apos;ll send you a link to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
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

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-6"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Link...</span>
                        </>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-md">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-xl">
                    <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-semibold text-on-surface tracking-tight mb-2">Check Your Email</h2>
                  <p className="text-sm text-outline mb-xl max-w-[320px] mx-auto">
                    If an account exists for that email, we&apos;ve sent password reset instructions to your inbox.
                  </p>
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg shadow-md transition-all text-sm"
                  >
                    Return to Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;