"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const tickerPairs = [
  { pair: "EURUSD", price: "1.08428", change: "+0.42%", up: true },
  { pair: "GBPUSD", price: "1.26910", change: "+0.31%", up: true },
  { pair: "XAUUSD", price: "2034.50", change: "+0.55%", up: true },
  { pair: "USDJPY", price: "149.82", change: "0.00%", up: false },
];

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [shake, setShake] = useState(false);
  
  const setSession = useAuthStore((state) => state.setSession);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        triggerShake();
        return;
      }

      if (authData.session) {
        setSession(authData.session);
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        triggerShake();
        return;
      }

      if (authData.user && !authData.session) {
        setShowEmailConfirmation(true);
      } else if (authData.session) {
        setSession(authData.session);
        router.push("/onboarding");
      }
    } catch {
      setError("An unexpected error occurred");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex flex-col items-center justify-center relative">
        <div className="mb-8">
          <h1 className="text-[22px] font-black tracking-[2px] text-[#C9A84C]">
            FOREXELITE <span className="bg-[#C9A84C] text-[#080E1A] text-[11px] px-1.5 py-0.5 rounded ml-1.5 align-middle">PRO</span>
          </h1>
        </div>

        <div className="bg-[#090F1E] border border-[#141E30] rounded-[10px] p-9 w-[380px] text-center">
          <div className="w-16 h-16 bg-[#C9A84C]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-[20px] font-black tracking-[1px] mb-2">CHECK YOUR EMAIL</h2>
          <p className="text-[13px] text-[#8899BB] mb-6">
            We&apos;ve sent a confirmation link to<br />
            <span className="text-[#EEF2FF]">{signupForm.getValues("email")}</span>
          </p>
          <Button
            onClick={() => {
              setShowEmailConfirmation(false);
              setActiveTab("login");
            }}
            className="w-full bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold text-[14px] h-11 rounded-[6px] tracking-wide"
          >
            Back to Login
          </Button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-[#090F1E] border-t border-[#141E30] py-2 px-6 flex gap-8 text-[12px] font-mono text-[#8899BB]">
          {tickerPairs.map((item, i) => (
            <span key={i}>
              {item.pair}{" "}
              <span className={item.up ? "text-[#00E5A0]" : ""}>
                {item.price} {item.up ? "▲" : "▼"} {item.change}
              </span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080E1A] flex flex-col items-center justify-center relative">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-[22px] font-black tracking-[2px] text-[#C9A84C]">
          FOREXELITE <span className="bg-[#C9A84C] text-[#080E1A] text-[11px] px-1.5 py-0.5 rounded ml-1.5 align-middle">PRO</span>
        </h1>
      </div>

      {/* Login/Signup Card */}
      <div
        className={`bg-[#090F1E] border border-[#141E30] rounded-[10px] p-9 w-[380px] ${shake ? "animate-shake" : ""}`}
        style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
      >
        {/* Tab Toggle */}
        <div className="flex bg-[#0C1525] rounded-[6px] p-1 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 px-4 rounded-[4px] text-[13px] font-bold transition-colors ${
              activeTab === "login"
                ? "bg-[#C9A84C] text-[#080E1A]"
                : "text-[#8899BB] hover:text-[#EEF2FF]"
            }`}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2 px-4 rounded-[4px] text-[13px] font-bold transition-colors ${
              activeTab === "signup"
                ? "bg-[#C9A84C] text-[#080E1A]"
                : "text-[#8899BB] hover:text-[#EEF2FF]"
            }`}
          >
            SIGN UP
          </button>
        </div>

        {activeTab === "login" ? (
          <>
            <h2 className="text-[26px] font-black tracking-[1px] mb-1">WELCOME BACK</h2>
            <p className="text-[13px] text-[#8899BB] mb-7">Sign in to your trading desk</p>

            <form onSubmit={loginForm.handleSubmit(handleLogin)}>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] text-[#8899BB] block mb-1.5">Email</label>
                  <Input
                    type="email"
                    placeholder="trader@example.com"
                    {...loginForm.register("email")}
                    className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] text-[14px] rounded-[6px] h-10"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-[#FF6B6B] text-[11px] mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] text-[#8899BB] block mb-1.5">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                    className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] text-[14px] rounded-[6px] h-10"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-[#FF6B6B] text-[11px] mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-[6px] p-3">
                    <p className="text-[#FF6B6B] text-[12px]">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold text-[14px] h-11 rounded-[6px] tracking-wide disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      SIGNING IN...
                    </>
                  ) : (
                    "SIGN IN"
                  )}
                </Button>

                <p className="text-[13px] text-center text-[#8899BB] mt-4">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-[#C9A84C] hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-[26px] font-black tracking-[1px] mb-1">CREATE ACCOUNT</h2>
            <p className="text-[13px] text-[#8899BB] mb-7">Start your trading journey</p>

            <form onSubmit={signupForm.handleSubmit(handleSignup)}>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] text-[#8899BB] block mb-1.5">Email</label>
                  <Input
                    type="email"
                    placeholder="trader@example.com"
                    {...signupForm.register("email")}
                    className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] text-[14px] rounded-[6px] h-10"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-[#FF6B6B] text-[11px] mt-1">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] text-[#8899BB] block mb-1.5">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...signupForm.register("password")}
                    className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] text-[14px] rounded-[6px] h-10"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-[#FF6B6B] text-[11px] mt-1">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] text-[#8899BB] block mb-1.5">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...signupForm.register("confirmPassword")}
                    className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] text-[14px] rounded-[6px] h-10"
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-[#FF6B6B] text-[11px] mt-1">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-[6px] p-3">
                    <p className="text-[#FF6B6B] text-[12px]">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold text-[14px] h-11 rounded-[6px] tracking-wide disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      CREATING ACCOUNT...
                    </>
                  ) : (
                    "CREATE ACCOUNT"
                  )}
                </Button>

                <p className="text-[13px] text-center text-[#8899BB] mt-4">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-[#C9A84C] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Bottom Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#090F1E] border-t border-[#141E30] py-2 px-6 flex gap-8 text-[12px] font-mono text-[#8899BB]">
        {tickerPairs.map((item, i) => (
          <span key={i}>
            {item.pair}{" "}
            <span className={item.up ? "text-[#00E5A0]" : ""}>
              {item.price} {item.up ? "▲" : "▼"} {item.change}
            </span>
          </span>
        ))}
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
