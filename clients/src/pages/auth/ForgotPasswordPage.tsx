import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router"; // Assuming your React Router setup
import { School, Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
// import toast from "react-hot-toast"; // Uncomment if using toast

// Assuming these hooks exist similarly to your Login Page setup
// import { useForgotPasswordMutation } from "../../store/api/apiSlice";

// Form validation schema
const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  // const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  // Placeholder loading state (replace with logic above)
  const [isLoading, setIsLoading] = useState(false); 
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    // try {
    //   setIsLoading(true); // Placeholder logic
    //   // Simulate API call
    //   await new Promise((resolve) => setTimeout(resolve, 1500));
    //   // await forgotPassword(values).unwrap();
    //   setIsSubmitted(true);
    //   // toast.success("Reset link sent!");
    // } catch (err: any) {
    //   // toast.error(err?.data?.message ?? "Something went wrong.");
    // } finally {
    //   setIsLoading(false); // Placeholder logic
    // }

    // --- Placeholder Simulation Logic ---
    setIsLoading(true);
    console.log("Password reset requested for:", values.email);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setIsSubmitted(true);
    // ------------------------------------
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-surface-container-lowest text-on-surface overflow-hidden">
      {/* Left side: Brand Visual Panel (Identical to LoginPage) */}
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

      {/* Right side: Recovery Form Card (Scrollable Container) */}
      <main className="flex-1 flex flex-col items-center justify-center h-full overflow-y-auto p-md bg-surface-container-low dark:bg-inverse-surface">
        
        {/* Core Request Form Card */}
        <div className="w-full max-w-[400px] my-auto bg-surface-container-lowest dark:bg-surface-container p-lg rounded-2xl shadow-xl border border-outline-variant/30">
          
          {!isSubmitted ? (
            // --- STATE 1: Request Reset Link Form ---
            <>
              <div className="mb-lg">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mb-6 font-medium transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
                <h2 className="text-2xl font-semibold text-on-surface tracking-tight mb-2">Reset Password</h2>
                <p className="text-sm text-outline">
                  Enter the email associated with your account and we&apos;ll send you a link to reset your password.
                </p>
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

                {/* Main CTA Submission Trigger */}
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
            // --- STATE 2: Success Confirmation Message ---
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
      </main>
    </div>
  );
};


export default ForgotPasswordPage;
