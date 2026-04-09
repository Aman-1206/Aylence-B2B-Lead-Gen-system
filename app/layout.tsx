import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Generator MVP",
  description: "Lead generation workflow with preview, regeneration, CSV export, and MongoDB dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
            Lead Generator
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <Link
              href="/"
              className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 transition hover:border-slate-400 hover:text-slate-900"
            >
              Generate
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 transition hover:border-slate-400 hover:text-slate-900"
            >
              Dashboard
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
