import Form from "@/app/components/Form";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-card rounded-[2rem] p-8 sm:p-10">
          <div className="max-w-lg space-y-6">
            <span className="inline-flex rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold text-teal-800">
              Lead Generation MVP
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Generate, preview, refine, and export business leads in one flow.
              </h1>
              <p className="text-base leading-7 text-slate-600 sm:text-lg">
                This mock-first app simulates a lead sourcing pipeline with preview regeneration,
                full list generation, and CSV export so the product flow is ready before real
                scraping or Google Sheets integrations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-slate-500">Preview</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">5 leads</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-slate-500">Full export</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">CSV ready</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-slate-500">Storage</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">MongoDB</p>
              </div>
            </div>
          </div>
        </section>

        <Form />
      </div>
    </main>
  );
}
