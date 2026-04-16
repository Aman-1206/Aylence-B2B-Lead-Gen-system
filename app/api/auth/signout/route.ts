import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAppBaseUrl } from "@/lib/authConfig";

export async function POST(request: Request) {
  const response = NextResponse.redirect(`${getAppBaseUrl(request.url)}/signin`);
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(`${getAppBaseUrl(request.url)}/signin`);
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
