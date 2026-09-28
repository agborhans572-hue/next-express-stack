import { useState } from "react";
import { PublicNavbar } from "@/components/navbar";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="max-w-md mx-auto px-5 py-24">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Reset your password
          </h1>
          {sent ? (
            <>
              <p className="text-gray-500 mt-3">
                If an eligible account exists, a reset link has been sent. Check
                your inbox.
              </p>
              <a
                href="/login"
                className="text-olive-600 text-sm inline-block mt-6"
              >
                Return to sign in
              </a>
            </>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button className="w-full bg-olive-500 hover:bg-olive-600">
                Send reset link
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
