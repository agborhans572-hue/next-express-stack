import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Eye, EyeOff, Package, Lock } from "lucide-react";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoading) return;
    if (user && (user.role as string) !== "customer") setLocation("/admin");
    else if (user) setLocation("/dashboard");
  }, [user, isLoading, setLocation]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Username and password are required.");
      return;
    }
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (user) => {
          if ((user.role as string) === "customer") {
            setError("Access denied. Staff credentials required.");
            return;
          }
          queryClient.setQueryData(getGetMeQueryKey(), user);
          setLocation("/admin");
        },
        onError: (err) => {
          const apiError = (err as { data?: { error?: string } })?.data?.error;
          const message =
            apiError ||
            (err instanceof Error ? err.message : "") ||
            "Access denied. Invalid credentials.";
          setError(
            message.includes("Unexpected error")
              ? "Access denied. Invalid credentials."
              : message,
          );
        },
      },
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#060a13] flex items-center justify-center p-4 relative overflow-hidden">
      <Helmet>
        <title>Admin Sign In — Shiprion</title>
        <meta
          name="description"
          content="Secure admin access to the Shiprion logistics dashboard."
        />
      </Helmet>
      <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[140px] animate-orb pointer-events-none" />
      <div className="absolute bottom-[20%] left-[20%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[120px] animate-orb-alt pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-olive-500 rounded-lg flex items-center justify-center glow-olive-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">
                ShipRion<span className="text-olive-400">.</span>
              </span>
            </div>
          </div>
          <div className="inline-flex w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl items-center justify-center mx-auto">
            <ShieldCheck className="h-7 w-7 text-red-400" />
          </div>
          <h1
            className="text-2xl font-bold text-white"
            data-testid="text-admin-login-title"
          >
            Admin Access
          </h1>
          <p
            className="text-sm text-gray-500"
            data-testid="text-admin-login-subtitle"
          >
            Restricted area. Authorised personnel only.
          </p>
        </div>

        <div
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden"
          data-testid="card-admin-login-form"
        >
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-olive-400" />
              Administrator Login
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter your admin credentials to continue
            </p>
          </div>
          <div className="p-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-testid="form-admin-login"
            >
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-gray-400 text-sm">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-600 h-11 focus:border-olive-500/50 focus:ring-olive-500/20"
                  data-testid="input-admin-username"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-password"
                  className="text-gray-400 text-sm"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-600 h-11 pr-10 focus:border-olive-500/50 focus:ring-olive-500/20"
                    data-testid="input-admin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    data-testid="button-toggle-admin-password"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                  data-testid="text-admin-login-error"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-olive-500 hover:bg-olive-400 text-white font-semibold glow-olive-sm"
                disabled={login.isPending}
                data-testid="button-admin-login-submit"
              >
                {login.isPending ? "Verifying..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
