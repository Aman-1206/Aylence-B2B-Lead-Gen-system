import type { Lead } from "@/lib/generateMockLeads";

type LeadsPreviewProps = {
  leads: Lead[];
  isLoading: boolean;
  isContinuing: boolean;
  canContinue: boolean;
  testLeadCount: number;
  onRegenerateNext: () => Promise<void>;
  onContinue: () => Promise<void>;
};

export default function LeadsPreview({
  leads,
  isLoading,
  isContinuing,
  canContinue,
  testLeadCount,
  onRegenerateNext,
  onContinue,
}: LeadsPreviewProps) {
  return (
    <div className="space-y-4 rounded-[1.75rem] bg-slate-950 px-5 py-6 text-white sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Preview Leads</h3>
          <p className="mt-1 text-sm text-slate-300">
            Review this test list before generating the full list.
          </p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
          {testLeadCount} test leads
        </div>
      </div>

      <div className="grid gap-3">
        {leads.map((lead) => (
          <article
            key={lead.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-lg font-semibold">{lead.companyName}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  {lead.contactName || "Contact name not available"}
                </p>
                <p className="mt-1 text-sm text-slate-300">{lead.address}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-200">
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    {lead.domain || "Domain not available"}
                  </span>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-200">
                    {lead.emailStatus === "valid"
                      ? `Valid (${lead.emailScore ?? "n/a"})`
                      : lead.emailStatus === "invalid"
                        ? `Invalid (${lead.emailScore ?? "n/a"})`
                        : lead.emailStatus === "risky"
                          ? `Risky (${lead.emailScore ?? "n/a"})`
                          : lead.emailStatus === "not_found"
                            ? "Email not found"
                            : lead.emailStatus === "not_configured"
                              ? "Email enrichment off"
                              : "Unverified"}
                  </span>
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-amber-400 px-3 py-1 font-medium text-slate-950 transition hover:bg-amber-300"
                  >
                    Open URL
                  </a>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-200">
                <p>{lead.phone || "Phone not available"}</p>
                <p>{lead.email || "Email not available"}</p>
                <p>Score: {lead.emailScore ?? "N/A"}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRegenerateNext}
          disabled={isLoading || isContinuing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <span className="spinner" aria-hidden="true" /> : null}
          {isLoading ? "Regenerating..." : "Regenerate"}
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-200"
        >
          {isContinuing ? <span className="spinner !border-slate-900/30 !border-t-slate-900" aria-hidden="true" /> : null}
          {isContinuing ? "Building Full List..." : "Continue"}
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Leads appear when a domain, phone number, or email is available.
      </p>
    </div>
  );
}
