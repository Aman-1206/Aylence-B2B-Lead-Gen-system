import Form from "@/app/components/Form";

export default function GeneratePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Generate</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Create a new lead list.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Choose a target, test the results, then generate a final list capped at 15 leads.
        </p>
      </div>
      <Form />
    </main>
  );
}
