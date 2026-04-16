"use client";

import type { Lead } from "@/lib/generateMockLeads";

type ExportRunButtonProps = {
  leads: Lead[];
  filename: string;
};

export default function ExportRunButton({ leads, filename }: ExportRunButtonProps) {
  function handleExport() {
    if (!leads.length) {
      return;
    }

    const headers = [
      "Company Name",
      "Contact Name",
      "Domain",
      "URL",
      "Address",
      "Street",
      "City",
      "Landmark",
      "State",
      "Country",
      "Postal Code",
      "Phone",
      "Email",
      "Score",
      "Status",
    ];
    const rows = leads.map((lead) => [
      lead.companyName,
      lead.contactName,
      lead.domain,
      lead.url,
      lead.address,
      lead.street,
      lead.city,
      lead.landmark,
      lead.state,
      lead.country,
      lead.postalCode,
      lead.phone,
      lead.email,
      lead.emailScore,
      lead.emailStatus,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      Export to Excel
    </button>
  );
}
