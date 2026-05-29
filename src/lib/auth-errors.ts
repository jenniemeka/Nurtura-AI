/**
 * Translate raw Supabase auth errors into friendly, actionable guidance.
 * Surfaces email-verification status so users know exactly what to do next.
 */
export type AuthHint = {
  title: string;
  body: string;
  tone: "warn" | "error" | "info";
  needsVerification?: boolean;
};

export function explainAuthError(raw: string | null | undefined, mode: "login" | "signup"): AuthHint | null {
  if (!raw) return null;
  const m = raw.toLowerCase();

  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
    return {
      title: "Please verify your email",
      body: "We sent you a confirmation link. Open it from your inbox (check spam too), then come back and log in.",
      tone: "warn",
      needsVerification: true,
    };
  }
  if (m.includes("invalid login") || m.includes("invalid_credentials") || m.includes("invalid email or password")) {
    return {
      title: "Email or password is incorrect",
      body: "Double-check your details. If you just signed up, you may need to verify your email first — open the link we sent you.",
      tone: "error",
      needsVerification: true,
    };
  }
  if (m.includes("already registered") || m.includes("user already") || m.includes("already exists")) {
    return {
      title: "This email is already in use",
      body: "Try logging in instead. If you forgot your password, use “Reset password”.",
      tone: "info",
    };
  }
  if (m.includes("rate") || m.includes("too many")) {
    return {
      title: "Too many attempts",
      body: "Please wait a minute before trying again.",
      tone: "warn",
    };
  }
  if (m.includes("password") && (m.includes("weak") || m.includes("short") || m.includes("6"))) {
    return {
      title: "Password too weak",
      body: "Use at least 6 characters. A short phrase works well.",
      tone: "warn",
    };
  }
  if (m.includes("signup") && m.includes("disabled")) {
    return {
      title: "Signups are paused",
      body: "New account creation is temporarily unavailable. Please try again later.",
      tone: "error",
    };
  }
  if (m.includes("network") || m.includes("fetch")) {
    return {
      title: "Network issue",
      body: "We couldn't reach the server. Check your connection and try again.",
      tone: "error",
    };
  }
  return {
    title: mode === "login" ? "Couldn't log you in" : "Couldn't create your account",
    body: raw,
    tone: "error",
  };
}

export function signupVerificationHint(emailSent: boolean): AuthHint {
  return emailSent
    ? {
        title: "Check your inbox",
        body: "We sent a confirmation link to your email. Open it to finish setting up your account, then you can log in.",
        tone: "info",
        needsVerification: true,
      }
    : {
        title: "You're in ✨",
        body: "Your account is active — let's set up your profile.",
        tone: "info",
      };
}
