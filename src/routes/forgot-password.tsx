import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Input } from "@/components/auth-shell";
import { AuthAlert } from "@/components/auth-alert";
import { explainAuthError, type AuthHint } from "@/lib/auth-errors";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Nurtura" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const hydrated = useHydrated();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<AuthHint | null>(null);
  const [sent, setSent] = useState(false);
  const busy = !hydrated || loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setHint(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) {
      setHint(explainAuthError(error.message, "login"));
      return;
    }
    setSent(true);
    setHint({
      title: "Check your inbox",
      body: "If an account exists for that email, we sent a reset link. Open it to set a new password.",
      tone: "info",
    });
  }

  return (
    <AuthShell title="Reset your password" sub="We'll email you a link to set a new one.">
      <AuthAlert hint={hint} />
      {!sent && (
        <form onSubmit={onSubmit} className="space-y-3">
          <Input disabled={busy} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button disabled={busy} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink/60">
        Remembered it? <Link to="/login" className="font-medium text-ink underline underline-offset-4">Log in</Link>
      </p>
    </AuthShell>
  );
}

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
