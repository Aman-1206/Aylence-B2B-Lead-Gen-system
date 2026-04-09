import type { Lead } from "@/lib/generateMockLeads";

type LeadsTableProps = {
  leads: Lead[];
  requestedCount: number;
  onExport: () => void;
};

export default function LeadsTable({ leads, requestedCount, onExport }: LeadsTableProps) {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Full Lead List</h3>
          <p className="mt-1 text-sm text-slate-600">
            Showing {leads.length} of {requestedCount} requested leads, ready to review and export.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Export to Excel
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="max-h-[28rem] overflow-auto">
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
              {leads.map((lead) => (
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
    </div>
  );
}
