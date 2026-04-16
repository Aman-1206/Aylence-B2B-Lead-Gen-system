import CompanyLogo from "@/app/components/CompanyLogo";

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
        <CompanyLogo className="justify-center text-slate-950" imageClassName="h-12 max-w-[13rem]" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Access denied.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This Google account is not on the approved email list for this workspace.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href="/api/auth/google"
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Try another account
          </a>
          <a
            href="/api/auth/signout"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400"
          >
            Sign out
          </a>
        </div>
      </section>
    </main>
  );
}
