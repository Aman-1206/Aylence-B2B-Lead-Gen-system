import CompanyLogo from "@/app/components/CompanyLogo";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <CompanyLogo className="justify-center text-slate-950" imageClassName="h-12 max-w-[13rem]" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Sign in to continue.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use your approved Google account to access the lead generation workspace.
        </p>
        <a
          href="/api/auth/google"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Continue with Google
        </a>
      </section>
    </main>
  );
}
