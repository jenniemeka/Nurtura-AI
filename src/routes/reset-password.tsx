import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Input } from "@/components/auth-shell";
import { AuthAlert } from "@/components/auth-alert";
import { explainAuthError, type AuthHint } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password — Nurtura" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const hydrated = useHydrated();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<AuthHint | null>(null);

  // Wait for Supabase to process the recovery link (PASSWORD_RECOVERY event) before showing the form.
  useEffect(() => {
    if (!hydrated) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [hydrated]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setHint({ title: "Password too short", body: "Use at least 8 characters.", tone: "warn" });
      return;
    }
    if (password !== confirm) {
      setHint({ title: "Passwords don't match", body: "Re-enter the same password in both fields.", tone: "warn" });
      return;
    }
    setLoading(true);
    setHint(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setHint(explainAuthError(error.message, "login"));
      return;
    }
    nav({ to: "/dashboard" });
  }

  const busy = !hydrated || !ready || loading;

  return (
    <AuthShell title="Set a new password" sub="Choose something you'll remember.">
      <AuthAlert hint={hint} />
      {ready && !hasSession ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-medium">Reset link invalid or expired</p>
          <p className="mt-1">Please <Link to="/forgot-password" className="underline underline-offset-4">request a new link</Link>.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <Input disabled={busy} type="password" placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Input disabled={busy} type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          <button disabled={busy} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
