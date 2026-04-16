export const AUTH_COOKIE_NAME = "leadgen_session";
export const OAUTH_STATE_COOKIE_NAME = "leadgen_oauth_state";

export type AuthSession = {
  email: string;
  name?: string;
  picture?: string;
  exp: number;
};

export function getAllowedEmails() {
  return (process.env.ALLOWED_GOOGLE_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  return getAllowedEmails().includes(normalizedEmail);
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing AUTH_SECRET in .env.local");
  }

  return secret;
}

export function getAppBaseUrl(requestUrl?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (requestUrl) {
    const url = new URL(requestUrl);
    return url.origin;
  }

  return "http://localhost:3000";
}
