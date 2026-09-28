import { useState } from "react";
import { PublicNavbar } from "@/components/navbar";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    setError("");
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="max-w-md mx-auto px-5 py-24">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Choose a new password
          </h1>
          {done ? (
            <>
              <p className="text-gray-500 mt-3">
                Your password was updated and existing sessions were signed out.
              </p>
              <a
                href="/login"
                className="text-olive-600 text-sm inline-block mt-6"
              >
                Sign in
              </a>
            </>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="New password">
                <Input
                  type="password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field label="Confirm password">
                <Input
                  type="password"
                  minLength={8}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </Field>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                disabled={!token}
                className="w-full bg-olive-500 hover:bg-olive-600"
              >
                Update password
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
