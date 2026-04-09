import ExportRunButton from "@/app/components/ExportRunButton";
import { getRecentLeadGenerations } from "@/lib/leadGenerations";
import { isMongoConfigured } from "@/lib/mongodb";

type DashboardPageProps = {
  searchParams?: Promise<{
    companyType?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedCompanyType = params?.companyType?.trim() || "";
  const mongoConfigured = isMongoConfigured();
  const dashboardData = await getRecentLeadGenerations(10);
  const allGenerations = dashboardData.generations;
  const mongoAvailable = dashboardData.mongoAvailable;
  const source = dashboardData.source;
  const companyTypes = Array.from(
    new Set(allGenerations.map((generation) => generation.request.companyType).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const generations = selectedCompanyType
    ? allGenerations.filter((generation) => generation.request.companyType === selectedCompanyType)
    : allGenerations;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6">
        <section className="glass-card rounded-[2rem] p-8 sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800">
                MongoDB Dashboard
              </span>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  Review saved lead generations in one place.
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  Every completed lead run is stored with its request details and full result set
                  so you can inspect what was generated without exporting first.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:min-w-52">
              <div className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-slate-500">
                  Saved runs{selectedCompanyType ? ` for ${selectedCompanyType}` : ""}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{generations.length}</p>
              </div>
            </div>
          </div>
        </section>

        {companyTypes.length > 0 ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/85 px-6 py-5 shadow-sm">
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Filter by company type</h2>
                <p className="mt-1 text-sm text-slate-600">
                  View generated runs for one company type at a time.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  name="companyType"
                  defaultValue={selectedCompanyType}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  <option value="">All company types</option>
                  {companyTypes.map((companyType) => (
                    <option key={companyType} value={companyType}>
                      {companyType}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Apply filter
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {!mongoConfigured ? (
          <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900">
            <h2 className="text-lg font-semibold">MongoDB is not connected yet</h2>
            <p className="mt-2 text-sm leading-6">
              Add `MONGODB_URI` to `.env.local` and optionally `MONGODB_DB_NAME` to start saving
              generations in this dashboard.
            </p>
          </section>
        ) : null}

        {mongoConfigured && !mongoAvailable ? (
          <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900">
            <h2 className="text-lg font-semibold">MongoDB sync is unavailable right now</h2>
            <p className="mt-2 text-sm leading-6">
              The app found `MONGODB_URI`, but your current network could not reach the MongoDB
              cluster. This usually happens when DNS SRV lookups are blocked or Atlas is not
              reachable from the current connection.
            </p>
            {source === "local" ? (
              <p className="mt-2 text-sm leading-6">
                Your generated runs are still available below from `data/leads.json`.
              </p>
            ) : null}
          </section>
        ) : null}

        {generations.length === 0 ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/85 px-6 py-5 text-slate-700">
            {selectedCompanyType
              ? `No saved lead generations found for ${selectedCompanyType}.`
              : "No saved lead generations yet. Generate a full lead list and it will appear here."}
          </section>
        ) : null}

        {generations.map((generation) => (
          <section
            key={generation._id.toString()}
            className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {generation.request.companyType} in {generation.request.location}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Requested by {generation.request.name} on{" "}
                  {generation.createdAt.toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="grid gap-3 text-sm text-slate-700 sm:justify-items-end sm:text-right">
                <p>
                  Requested: <span className="font-semibold">{generation.requestedCount}</span>
                </p>
                <p>
                  Generated: <span className="font-semibold">{generation.generatedCount}</span>
                </p>
                <ExportRunButton
                  leads={generation.leads}
                  filename={`${generation.request.companyType}-${generation.request.location}-${generation.createdAt.toISOString().slice(0, 10)}`}
                />
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-[24rem] overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="text-sm text-slate-600">
                      <th className="px-4 py-3 font-medium">Company Name</th>
                      <th className="px-4 py-3 font-medium">Contact Name</th>
                      <th className="px-4 py-3 font-medium">Domain</th>
                      <th className="px-4 py-3 font-medium">URL</th>
                      <th className="px-4 py-3 font-medium">Address</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {generation.leads.map((lead) => (
                      <tr key={lead.id} className="text-sm text-slate-700">
                        <td className="px-4 py-3 font-medium text-slate-900">{lead.companyName}</td>
                        <td className="px-4 py-3">{lead.contactName || "Not available"}</td>
                        <td className="px-4 py-3">{lead.domain}</td>
                        <td className="px-4 py-3">
                          <a
                            href={lead.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-teal-700 underline-offset-2 hover:underline"
                          >
                            Visit site
                          </a>
                        </td>
                        <td className="px-4 py-3">{lead.address}</td>
                        <td className="px-4 py-3">{lead.phone}</td>
                        <td className="px-4 py-3">{lead.email || "Email not available"}</td>
                        <td className="px-4 py-3">{lead.emailScore ?? "N/A"}</td>
                        <td className="px-4 py-3 capitalize">{lead.emailStatus || "unverified"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
