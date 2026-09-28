import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  LogIn,
  Eye,
  EyeOff,
  UserPlus,
  Package,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { apiFetch } from "@/lib/api";

type Tab = "login" | "register";

function StrengthBar({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-emerald-500",
  ];

  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${score <= 1 ? "text-red-400" : score === 2 ? "text-orange-400" : score === 3 ? "text-yellow-400" : "text-emerald-400"}`}
      >
        {labels[score]}
      </p>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-500">{label}</Label>
      {children}
    </div>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  useAuth();
  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "register" ? "register" : "login";
  });

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regError, setRegError] = useState("");
  const [regIsLoading, setRegIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP verification state
  const [regPending, setRegPending] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const login = useLogin();
  const requestedReturn = new URLSearchParams(window.location.search).get(
    "returnTo",
  );
  const returnTo =
    requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//")
      ? requestedReturn
      : null;

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }
    login.mutate(
      { data: { email: loginEmail, password: loginPassword } },
      {
        onSuccess: (user) => {
          queryClient.clear();
          queryClient.setQueryData(getGetMeQueryKey(), user);
          setLocation(
            returnTo ??
              ((user.role as string) === "customer" ? "/dashboard" : "/admin"),
          );
        },
        onError: (err) => {
          const data = (err as { data?: { error?: string } })?.data;
          setLoginError(data?.error ?? "Invalid email or password.");
        },
      },
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (!regEmail || !regPassword || !regConfirm) {
      setRegError("Please fill in all fields.");
      return;
    }
    if (regPassword.length < 8) {
      setRegError("Password must be at least 8 characters.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setRegError(
        "You must agree to the Terms of Service and Privacy Policy to continue.",
      );
      return;
    }
    setRegIsLoading(true);
    try {
      const data = await apiFetch<{
        message?: string;
        email?: string;
        devCode?: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      setVerifyEmail(data.email ?? regEmail);
      if (data.devCode) setDevCode(data.devCode);
      setRegPending(true);
    } catch (error) {
      setRegError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setRegIsLoading(false);
    }
  }

  async function submitVerify(code: string) {
    setVerifyError("");
    if (!code.trim()) {
      setVerifyError("Please enter the verification code.");
      return;
    }
    setVerifyLoading(true);
    try {
      const data = await apiFetch<{
        id?: number;
        email?: string;
        role?: string;
      }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: verifyEmail, code: code.trim() }),
      });
      setVerifySuccess(true);
      queryClient.setQueryData(getGetMeQueryKey(), data);
      setTimeout(
        () =>
          setLocation(
            returnTo ?? (data.role === "customer" ? "/dashboard" : "/admin"),
          ),
        1200,
      );
    } catch (error) {
      setVerifyError(
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again.",
      );
    } finally {
      setVerifyLoading(false);
    }
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    void submitVerify(verifyCode);
  }

  async function handleResend() {
    setResendMsg("");
    setResendLoading(true);
    try {
      const data = await apiFetch<{ message?: string; devCode?: string }>(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify({ email: verifyEmail }),
        },
      );
      if (data.devCode) setDevCode(data.devCode);
      setResendMsg("A new code has been sent to your email.");
    } catch (error) {
      setResendMsg(
        error instanceof Error
          ? error.message
          : "Failed to resend. Please try again.",
      );
    } finally {
      setResendLoading(false);
    }
  }

  const inputClass =
    "h-11 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-olive-500/50 focus:ring-olive-500/20";

  return (
    <div className="min-h-[100dvh] w-full flex bg-white">
      <Helmet>
        <title>
          {tab === "login" ? "Sign In — Shiprion" : "Create Account — Shiprion"}
        </title>
        <meta
          name="description"
          content="Sign in to your Shiprion account or create a new account to track shipments, manage deliveries, and access 24/7 support."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gray-50 px-12 py-14 relative overflow-hidden border-r border-gray-200">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-olive-500/8 rounded-full blur-[180px] animate-orb pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[140px] animate-orb-alt pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-olive-500 rounded-lg flex items-center justify-center glow-olive-sm">
            <Package className="h-5 w-5 text-gray-900" />
          </div>
          <span className="text-gray-900 font-bold text-xl tracking-tight">
            Shiprion<span className="text-olive-400">.</span>
          </span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-olive-400 tracking-[0.2em] uppercase">
              Global Logistics Platform
            </p>
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
              Ship smarter,
              <br />
              <span className="text-gradient-olive">anywhere.</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Track shipments in real time, manage your deliveries, and connect
              to a network spanning 180+ countries.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Real-time shipment tracking",
              "End-to-end delivery visibility",
              "Instant rate calculator",
              "24/7 customer support",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-olive-400 shrink-0" />
                <span className="text-gray-500 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-gray-700 text-xs">
          © {new Date().getFullYear()} Shiprion Logistics. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-olive-500 rounded-lg flex items-center justify-center glow-olive-sm">
                <Package className="h-4 w-4 text-gray-900" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                Shiprion<span className="text-olive-400">.</span>
              </span>
            </div>
          </div>

          <div className="bg-white backdrop-blur-xl rounded-2xl border border-gray-200 overflow-hidden">
            {!regPending && (
              <div className="grid grid-cols-2 border-b border-gray-200">
                {(["login", "register"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                      setLoginError("");
                      setRegError("");
                    }}
                    className={`relative py-4 text-sm font-semibold transition-colors ${tab === t ? "text-olive-400" : "text-gray-500 hover:text-gray-600"}`}
                    data-testid={`tab-${t}`}
                  >
                    {t === "login" ? (
                      <span className="flex items-center justify-center gap-2">
                        <LogIn className="h-3.5 w-3.5" />
                        Sign In
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <UserPlus className="h-3.5 w-3.5" />
                        Create Account
                      </span>
                    )}
                    {tab === t && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-olive-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="p-7">
              <AnimatePresence mode="wait">
                {regPending ? (
                  <motion.div
                    key="verify"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {verifySuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-10 flex flex-col items-center gap-4 text-center"
                      >
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            Email verified!
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Redirecting to your dashboard…
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <>
                        <div className="mb-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-olive-500/10 border border-olive-500/20 flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="h-7 w-7 text-olive-400" />
                          </div>
                          <h1 className="text-xl font-bold text-gray-900">
                            Check your email
                          </h1>
                          <p className="text-sm text-gray-500 mt-1">
                            We sent a 6-digit code to{" "}
                            <span className="font-medium text-gray-600">
                              {verifyEmail}
                            </span>
                          </p>
                        </div>

                        {devCode && (
                          <div className="mb-4 rounded-xl bg-amber-50 border-2 border-amber-300 px-4 py-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="h-4 w-4 text-amber-600 shrink-0" />
                              <p className="text-sm font-semibold text-amber-700">
                                Dev mode — no email sent, use this code
                              </p>
                            </div>
                            <p className="text-3xl font-mono font-extrabold tracking-[0.3em] text-amber-900 text-center py-1 select-all">
                              {devCode}
                            </p>
                            <p className="text-xs text-amber-600 text-center mt-1">
                              Enter the code above to verify your account
                            </p>
                          </div>
                        )}

                        <form onSubmit={handleVerify} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">
                              Verification code
                            </Label>
                            <div className="flex justify-center">
                              <InputOTP
                                maxLength={6}
                                value={verifyCode}
                                onChange={(val) => {
                                  setVerifyCode(val);
                                  if (val.length === 6 && !verifyLoading) {
                                    void submitVerify(val);
                                  }
                                }}
                                autoFocus
                              >
                                <InputOTPGroup>
                                  {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <InputOTPSlot
                                      key={i}
                                      index={i}
                                      className="h-14 w-11 text-xl font-bold border-gray-300 text-gray-900 bg-gray-50"
                                    />
                                  ))}
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                          </div>

                          {verifyError && (
                            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                              <p className="text-sm text-red-400">
                                {verifyError}
                              </p>
                            </div>
                          )}

                          {resendMsg && (
                            <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                              <p className="text-sm text-emerald-400">
                                {resendMsg}
                              </p>
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-11 bg-olive-500 hover:bg-olive-400 text-white font-semibold glow-olive-sm"
                            disabled={verifyLoading || verifyCode.length < 6}
                            isLoading={verifyLoading}
                            loadingText="Verifying…"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Verify Email
                            </span>
                          </Button>
                        </form>

                        <div className="mt-4 text-center">
                          <p className="text-xs text-gray-600 mb-2">
                            Didn't receive the code?
                          </p>
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading}
                            className="text-sm text-olive-400 hover:text-olive-300 font-medium flex items-center gap-1.5 mx-auto"
                          >
                            <RefreshCw
                              className={`h-3.5 w-3.5 ${resendLoading ? "animate-spin" : ""}`}
                            />
                            Resend code
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setRegPending(false);
                            setVerifyCode("");
                            setVerifyError("");
                            setDevCode(null);
                            setResendMsg("");
                          }}
                          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-600"
                        >
                          ← Back
                        </button>
                      </>
                    )}
                  </motion.div>
                ) : tab === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h1 className="text-xl font-bold text-gray-900">
                        Welcome back
                      </h1>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Sign in to your Shiprion account
                      </p>
                    </div>

                    <form
                      onSubmit={handleLogin}
                      className="space-y-4"
                      data-testid="form-login"
                    >
                      <FieldRow label="Email address">
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          autoComplete="email"
                          data-testid="input-email"
                          className={inputClass}
                        />
                      </FieldRow>

                      <FieldRow label="Password">
                        <div className="relative">
                          <Input
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            autoComplete="current-password"
                            className={`${inputClass} pr-10`}
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                            aria-label={
                              showLoginPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showLoginPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FieldRow>

                      <div className="text-right -mt-2">
                        <a
                          href="/forgot-password"
                          className="text-xs text-olive-500 hover:underline"
                        >
                          Forgot password?
                        </a>
                      </div>

                      {loginError && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                          <p
                            className="text-sm text-red-400"
                            data-testid="text-login-error"
                          >
                            {loginError}
                          </p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 bg-olive-500 hover:bg-olive-400 text-white font-semibold glow-olive-sm"
                        isLoading={login.isPending}
                        loadingText="Signing in…"
                      >
                        <span className="flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </span>
                      </Button>
                    </form>

                    <p className="mt-5 text-center text-xs text-gray-500">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setTab("register")}
                        className="text-olive-400 hover:text-olive-300 font-medium"
                      >
                        Create one
                      </button>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h1 className="text-xl font-bold text-gray-900">
                        Create your account
                      </h1>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Start tracking shipments worldwide
                      </p>
                    </div>

                    <form
                      onSubmit={handleRegister}
                      className="space-y-4"
                      data-testid="form-register"
                    >
                      <FieldRow label="Email address">
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          autoComplete="email"
                          className={inputClass}
                        />
                      </FieldRow>

                      <FieldRow label="Password">
                        <div className="relative">
                          <Input
                            type={showRegPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            autoComplete="new-password"
                            className={`${inputClass} pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                            aria-label={
                              showRegPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showRegPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <StrengthBar password={regPassword} />
                      </FieldRow>

                      <FieldRow label="Confirm password">
                        <div className="relative">
                          <Input
                            type={showRegConfirm ? "text" : "password"}
                            placeholder="Repeat your password"
                            value={regConfirm}
                            onChange={(e) => setRegConfirm(e.target.value)}
                            autoComplete="new-password"
                            className={`${inputClass} pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                            aria-label={
                              showRegConfirm ? "Hide password" : "Show password"
                            }
                          >
                            {showRegConfirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FieldRow>

                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              agreedToTerms
                                ? "bg-olive-500 border-olive-500"
                                : "border-gray-300 bg-white group-hover:border-olive-400"
                            }`}
                          >
                            {agreedToTerms && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 leading-relaxed">
                          I agree to the{" "}
                          <a
                            href="/terms"
                            target="_blank"
                            className="text-olive-400 hover:underline"
                          >
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy"
                            target="_blank"
                            className="text-olive-400 hover:underline"
                          >
                            Privacy Policy
                          </a>
                        </span>
                      </label>

                      {regError && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-red-400">{regError}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 bg-olive-500 hover:bg-olive-400 text-white font-semibold glow-olive-sm"
                        isLoading={regIsLoading}
                        loadingText="Creating account…"
                      >
                        <span className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Create Account
                        </span>
                      </Button>
                    </form>

                    <p className="mt-5 text-center text-xs text-gray-500">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setTab("login")}
                        className="text-olive-400 hover:text-olive-300 font-medium"
                      >
                        Sign in
                      </button>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
