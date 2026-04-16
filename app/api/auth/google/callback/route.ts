import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  getAppBaseUrl,
  isAllowedEmail,
} from "@/lib/authConfig";
import { createSessionToken } from "@/lib/authSession";

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  exp?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${OAUTH_STATE_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${getAppBaseUrl(request.url)}/access-denied`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local" },
      { status: 500 },
    );
  }

  const redirectUri = `${getAppBaseUrl(request.url)}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokenPayload.id_token) {
    return NextResponse.json(
      {
        error: tokenPayload.error_description || tokenPayload.error || "Google auth failed.",
      },
      { status: 400 },
    );
  }

  const tokenInfoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenPayload.id_token)}`,
    { cache: "no-store" },
  );
  const tokenInfo = (await tokenInfoResponse.json()) as GoogleTokenInfo;

  const email = tokenInfo.email?.trim().toLowerCase();
  const emailVerified = tokenInfo.email_verified === "true";
  if (!tokenInfoResponse.ok || tokenInfo.aud !== clientId || !email || !emailVerified) {
    return NextResponse.redirect(`${getAppBaseUrl(request.url)}/access-denied`);
  }

  if (!isAllowedEmail(email)) {
    const response = NextResponse.redirect(`${getAppBaseUrl(request.url)}/access-denied`);
    response.cookies.delete(AUTH_COOKIE_NAME);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  const sessionToken = createSessionToken({
    email,
    name: tokenInfo.name,
    picture: tokenInfo.picture,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });

  const response = NextResponse.redirect(`${getAppBaseUrl(request.url)}/`);
  response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

  return response;
}
