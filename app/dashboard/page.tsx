import DeleteRunButton from "@/app/components/DeleteRunButton";
import ExportRunButton from "@/app/components/ExportRunButton";
import { getRecentLeadGenerations } from "@/lib/leadGenerations";
import { isMongoConfigured } from "@/lib/mongodb";

type DashboardPageProps = {
  searchParams?: Promise<{
    companyType?: string;
    companyTypeQuery?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedCompanyType = params?.companyType?.trim() || "";
  const companyTypeQuery = params?.companyTypeQuery?.trim() || "";
  const normalizedCompanyTypeQuery = companyTypeQuery.toLowerCase();
  const mongoConfigured = isMongoConfigured();
  const dashboardData = await getRecentLeadGenerations(10);
  const allGenerations = dashboardData.generations;
  const mongoAvailable = dashboardData.mongoAvailable;
  const companyTypes = Array.from(
    new Set(allGenerations.map((generation) => generation.request.companyType).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const generations = allGenerations.filter((generation) => {
    const matchesSelectedType = selectedCompanyType
      ? generation.request.companyType === selectedCompanyType
      : true;
    const matchesTypedQuery = normalizedCompanyTypeQuery
      ? generation.request.companyType.toLowerCase().includes(normalizedCompanyTypeQuery)
      : true;

    return matchesSelectedType && matchesTypedQuery;
  });
  const activeFilterLabel = selectedCompanyType || companyTypeQuery;

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
                  Saved runs{activeFilterLabel ? ` for ${activeFilterLabel}` : ""}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{generations.length}</p>
              </div>
            </div>
          </div>
        </section>

        {companyTypes.length > 0 ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/85 px-6 py-5 shadow-sm">
            <form className="grid gap-4 lg:grid-cols-[1fr_1.5fr] lg:items-end">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Filter by company type</h2>
                <p className="mt-1 text-sm text-slate-600">
                  View generated runs for one company type at a time.
                </p>
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <select
                  name="companyType"
                  defaultValue={selectedCompanyType}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  <option value="">All company types</option>
                  {companyTypes.map((companyType) => (
                    <option key={companyType} value={companyType}>
                      {companyType}
                    </option>
                  ))}
                </select>
                <input
                  name="companyTypeQuery"
                  defaultValue={companyTypeQuery}
                  placeholder="Or type a custom company type"
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
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
          </section>
        ) : null}

        {generations.length === 0 ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/85 px-6 py-5 text-slate-700">
            {activeFilterLabel
              ? `No saved lead generations found for ${activeFilterLabel}.`
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
                <p className="mt-1 break-words text-sm text-slate-600">
                  Generated by{" "}
                  <span className="font-medium text-slate-900">
                    {generation.generatedByEmail || "Unknown email"}
                  </span>
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
                <DeleteRunButton id={generation._id.toString()} />
              </div>
            </div>

            <div className="mt-4 grid max-h-[34rem] gap-3 overflow-y-auto pr-1">
              {generation.leads.map((lead) => (
                <article
                  key={lead.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-semibold text-slate-950">
                        {lead.companyName}
                      </h3>
                      <p className="mt-1 break-words text-slate-600">
                        {lead.contactName || "Contact not available"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                        {lead.emailStatus || "unverified"}
                      </span>
                      <span className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                        Score: {lead.emailScore ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Domain
                      </dt>
                      <dd className="mt-1 break-words text-slate-800">
                        {lead.domain || "Not available"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Email
                      </dt>
                      <dd className="mt-1 break-words text-slate-800">
                        {lead.email || "Email not available"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Phone
                      </dt>
                      <dd className="mt-1 break-words text-slate-800">
                        {lead.phone || "Phone not available"}
                      </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Address
                      </dt>
                      <dd className="mt-1 break-words text-slate-800">
                        {lead.address || "Address not available"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Area
                      </dt>
                      <dd className="mt-1 break-words text-slate-800">
                        {[lead.landmark, lead.city, lead.state, lead.country, lead.postalCode]
                          .filter(Boolean)
                          .join(", ") || "Not available"}
                      </dd>
                    </div>
                  </dl>

                  {lead.url ? (
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Visit Site
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
