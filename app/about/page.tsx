export default function AboutPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">About Us</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          A simple workspace for practical lead generation.
        </h1>
        <p className="text-base leading-7 text-slate-600">
          Lead Generator keeps the workflow direct: enter a market, test a small result set, build
          the final list, and manage saved runs from the dashboard.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {[
          ["Focused", "Every screen supports the lead workflow without extra noise."],
          ["Reviewable", "Preview data before generating the full list."],
          ["Exportable", "Keep the final table ready for CSV export."],
          ["Manageable", "Remove saved runs from the dashboard when they are no longer needed."],
        ].map(([title, copy]) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
