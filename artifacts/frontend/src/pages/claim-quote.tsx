import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PublicNavbar } from "@/components/navbar";
import { useAuth } from "@/context/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function ClaimQuotePage() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [state, setState] = useState<"idle" | "claiming" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!isLoading && user?.role === "customer" && token && state === "idle") {
      setState("claiming");
      void apiFetch("/quotes/claim", {
        method: "POST",
        body: JSON.stringify({ token }),
      })
        .then(() => setState("done"))
        .catch((e: Error) => {
          setMessage(e.message);
          setState("error");
        });
    }
  }, [isLoading, user?.id, token, state]);
  const returnTo = `/claim-quote?token=${encodeURIComponent(token)}`;
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="max-w-lg mx-auto px-5 py-24">
        <div className="bg-white border border-gray-200 rounded-3xl p-9 text-center shadow-sm">
          {isLoading || state === "claiming" ? (
            <>
              <Loader2 className="w-10 h-10 text-olive-500 animate-spin mx-auto" />
              <h1 className="text-xl font-bold mt-5">Linking your quote</h1>
            </>
          ) : state === "done" ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-olive-500 mx-auto" />
              <h1 className="text-2xl font-extrabold mt-5">
                Quote added to your account
              </h1>
              <p className="text-gray-500 mt-2">
                You can now follow its review and accept the offer from your
                dashboard.
              </p>
              <Button
                className="mt-7 bg-olive-500"
                onClick={() => navigate("/dashboard?section=quotes")}
              >
                View quote
              </Button>
            </>
          ) : !user ? (
            <>
              <h1 className="text-2xl font-extrabold">
                Verify your email to claim this quote
              </h1>
              <p className="text-gray-500 mt-3">
                Sign in or create an account using the same email address that
                received this invitation.
              </p>
              <Button
                className="mt-7 bg-olive-500"
                onClick={() =>
                  navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)
                }
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold">
                Quote could not be linked
              </h1>
              <p className="text-red-600 mt-3">
                {message || "This invitation is invalid or expired."}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
