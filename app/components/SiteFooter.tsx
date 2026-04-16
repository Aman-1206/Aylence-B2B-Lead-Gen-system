import Link from "next/link";
import CompanyLogo from "@/app/components/CompanyLogo";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 text-sm text-slate-600 sm:px-6 md:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div>
          <CompanyLogo className="text-slate-950" />
          <p className="mt-2 max-w-xl leading-6">
            Generate focused business lead lists, review test results, save runs, and export
            clean CSV files from one simple workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link href="/generate" className="hover:text-slate-950">
            Generate
          </Link>
          <Link href="/dashboard" className="hover:text-slate-950">
            Dashboard
          </Link>
          <Link href="/about" className="hover:text-slate-950">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-slate-950">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
