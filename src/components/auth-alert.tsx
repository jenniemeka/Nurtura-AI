import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AuthHint } from "@/lib/auth-errors";

export function AuthAlert({
  hint,
  email,
  onResent,
}: {
  hint: AuthHint | null;
  email?: string;
  onResent?: () => void;
}) {
  if (!hint) return null;
  const tone =
    hint.tone === "error"
      ? "bg-rose-50 ring-rose-200 text-rose-900"
      : hint.tone === "warn"
        ? "bg-amber-50 ring-amber-200 text-amber-900"
        : "bg-sky/40 ring-sky/60 text-ink";

  async function resend() {
    if (!email) return toast.error("Enter your email above first.");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin + "/onboarding" },
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Verification email resent.");
      onResent?.();
    }
  }

  return (
    <div role="alert" className={`mb-4 rounded-2xl px-4 py-3 text-sm ring-1 ${tone}`}>
      <p className="font-medium">{hint.title}</p>
      <p className="mt-1 opacity-90">{hint.body}</p>
      {hint.needsVerification && (
        <button
          type="button"
          onClick={resend}
          className="mt-2 text-xs font-medium underline underline-offset-4"
        >
          Resend verification email
        </button>
      )}
    </div>
  );
}
