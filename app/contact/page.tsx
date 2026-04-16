import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Contact</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Need help with your lead workflow?
        </h1>
        <p className="text-base leading-7 text-slate-600">
          Share what you want to generate, where you want to search, and what fields matter most.
        </p>
        <Link
          href="/generate"
          className="inline-flex rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800"
        >
          Start Generating
        </Link>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input className="rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-teal-500" placeholder="Aman Verma" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input className="rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-teal-500" placeholder="aman@example.com" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Message</span>
            <textarea className="min-h-32 rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-teal-500" placeholder="Tell us what you need." />
          </label>
          <button type="button" className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white">
            Send Message
          </button>
        </form>
      </section>
    </main>
  );
}
