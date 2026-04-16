import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-slate-50">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
        <div className="flex flex-col justify-center">
          <span className="w-fit rounded-lg bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
            Lead Generation Workspace
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Build cleaner lead lists in one focused flow.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Test a small batch, generate up to 15 final leads, save useful runs, and export contact
            data with address fields ready for follow-up.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800"
            >
              Generate Leads
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400"
            >
              View Dashboard
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["15", "final lead cap"],
              ["5", "default test leads"],
              ["CSV", "export ready"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-2xl font-semibold text-slate-950">{value}</p>
                <p className="mt-1 text-sm text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1100&q=80"
              alt="Team reviewing business data on laptops"
              className="h-56 w-full object-cover sm:h-72"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">Sample lead run</p>
                <p className="mt-1 text-sm text-slate-600">Marketing Agency in Delhi</p>
              </div>
              <span className="w-fit rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Ready to export
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ["Delhi Digital Co.", "delhidigital.co", "soyal@delhidigital.co"],
                ["Morphic Ads", "morphicads.com", "ashutosh@morphicads.com"],
                ["Northline Studio", "northlinestudio.in", "Email not available"],
              ].map(([company, domain, email]) => (
                <div
                  key={company}
                  className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm sm:grid-cols-[1fr_0.9fr_1.1fr]"
                >
                  <span className="font-medium text-slate-950">{company}</span>
                  <span className="break-words text-slate-600">{domain}</span>
                  <span className="break-words text-slate-600">{email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["1", "Choose a target", "Add company type, city, landmark, country, and lead counts."],
              ["2", "Review a test batch", "Check the small preview before building the final list."],
              ["3", "Save or export", "Use the dashboard for saved runs or export the list as CSV."],
            ].map(([step, title, copy]) => (
              <article key={title} className="rounded-lg border border-slate-200 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-sm font-semibold text-white">
                  {step}
                </span>
                <h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
