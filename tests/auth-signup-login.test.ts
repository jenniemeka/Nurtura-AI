import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Verifies that with the current email-confirmation settings (auto_confirm_email = true),
 * a freshly created account can immediately sign in with email/password.
 * If this test fails, either auto-confirm was turned off in Cloud auth settings,
 * or signups are otherwise blocked.
 */
describe("auth: signup → immediate login", () => {
  if (!url || !anon) {
    it.skip("missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY env", () => {});
    return;
  }

  it("new account can log in right after signup", async () => {
    const supabase = createClient(url, anon, { auth: { persistSession: false } });
    const email = `qa+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@nurtura.test`;
    const password = "Test-" + Math.random().toString(36).slice(2, 10) + "!A1";

    const signUp = await supabase.auth.signUp({
      email,
      password,
      options: { data: { parent_name: "QA Bot" } },
    });
    expect(signUp.error, `signUp error: ${signUp.error?.message}`).toBeNull();
    expect(signUp.data.user?.id).toBeTruthy();

    // Re-create client to drop any sign-up session and confirm credentials work standalone.
    const fresh = createClient(url, anon, { auth: { persistSession: false } });
    const signIn = await fresh.auth.signInWithPassword({ email, password });

    expect(
      signIn.error,
      `Sign-in failed for a brand-new account — check that email auto-confirm is enabled in Cloud auth settings. Error: ${signIn.error?.message}`,
    ).toBeNull();
    expect(signIn.data.session?.access_token).toBeTruthy();
    expect(signIn.data.user?.email).toBe(email);
  }, 20_000);
});
