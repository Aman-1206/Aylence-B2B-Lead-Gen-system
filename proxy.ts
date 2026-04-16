import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authConfig";

const PUBLIC_PATHS = ["/signin", "/access-denied"];
const AUTH_PATH_PREFIX = "/api/auth";

function getAllowedEmails() {
  return (process.env.ALLOWED_GOOGLE_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

type MiddlewareSession = {
  email: string;
  exp: number;
};

async function verifySession(token?: string): Promise<MiddlewareSession | null> {
  if (!token || !process.env.AUTH_SECRET) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const verified = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(payload),
  );

  if (!verified) {
    return null;
  }

  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      email?: string;
      exp?: number;
    };

    if (!session.email || !session.exp || session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email: session.email,
      exp: session.exp,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname) || pathname.startsWith(AUTH_PATH_PREFIX);

  if (isPublicPath) {
    return NextResponse.next();
  }

  const session = await verifySession(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!session) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const allowedEmails = getAllowedEmails();
  if (!allowedEmails.includes(session.email.toLowerCase())) {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
