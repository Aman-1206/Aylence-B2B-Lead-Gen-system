"use client";

import Link from "next/link";
import { useState } from "react";
import CompanyLogo from "@/app/components/CompanyLogo";

const links = [
  { href: "/", label: "Home" },
  { href: "/generate", label: "Generate" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

type SiteHeaderProps = {
  sessionEmail?: string;
};

export default function SiteHeader({ sessionEmail }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-slate-950"
            onClick={() => setIsOpen(false)}
            aria-label="Webrigo home"
          >
            <CompanyLogo />
          </Link>
          <nav className="hidden items-center justify-end gap-2 text-sm font-medium text-slate-600 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {link.label}
              </Link>
            ))}
            {sessionEmail ? (
              <>
                <span className="max-w-48 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
                  {sessionEmail}
                </span>
                <a
                  href="/api/auth/signout"
                  className="rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Sign out
                </a>
              </>
            ) : null}
          </nav>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-800 transition hover:bg-slate-100 lg:hidden"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls="site-navigation"
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="grid gap-1.5">
              <span
                className={`block h-0.5 w-5 rounded bg-current transition ${
                  isOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded bg-current transition ${
                  isOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded bg-current transition ${
                  isOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
        <nav
          id="site-navigation"
          className={`mt-4 gap-2 text-sm font-medium text-slate-600 lg:hidden ${
            isOpen ? "grid" : "hidden"
          }`}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
          {sessionEmail ? (
            <>
              <span className="truncate rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
                {sessionEmail}
              </span>
              <a
                href="/api/auth/signout"
                className="rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Sign out
              </a>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
