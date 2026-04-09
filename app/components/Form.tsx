"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import LeadsPreview from "@/app/components/LeadsPreview";
import LeadsTable from "@/app/components/LeadsTable";
import type { Lead, LeadRequest } from "@/lib/generateMockLeads";

const companyTypes = [
  "Marketing Agency",
  "Real Estate",
  "E-commerce",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Software",
  "Other",
];

const presetCompanyTypes = companyTypes.filter((companyType) => companyType !== "Other");

type FlowStage = "idle" | "preview" | "full";

const initialForm: LeadRequest = {
  name: "",
  companyType: "Marketing Agency",
  location: "",
  numberOfLeads: 50,
};

export default function Form() {
  const [formData, setFormData] = useState<LeadRequest>(initialForm);
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  const [fullLeads, setFullLeads] = useState<Lead[]>([]);
  const [stage, setStage] = useState<FlowStage>("idle");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isFullLoading, setIsFullLoading] = useState(false);
  const [previewOffset, setPreviewOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canContinue = previewLeads.length > 0 && !isPreviewLoading && !isFullLoading;
  const totalRequestedLabel = useMemo(
    () => `${formData.numberOfLeads.toLocaleString()} leads requested`,
    [formData.numberOfLeads],
  );
  const selectedCompanyTypeOption = presetCompanyTypes.includes(formData.companyType)
    ? formData.companyType
    : "Other";
  const customCompanyType = selectedCompanyTypeOption === "Other" ? formData.companyType : "";

  async function fetchPreview(offset = 0) {
    setError(null);
    setNotice(null);
    setIsPreviewLoading(true);

    try {
      const response = await fetch("/api/generate-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          offset,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate preview leads.");
      }

      const data = (await response.json()) as { leads: Lead[]; message?: string };
      setPreviewLeads(data.leads);
      setFullLeads([]);
      setPreviewOffset(offset);
      setStage("preview");
      setNotice(data.message ?? "Preview generated successfully.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchPreview(0);
  }

  async function handleContinue() {
    setError(null);
    setNotice(null);
    setIsFullLoading(true);

    try {
      const response = await fetch("/api/generate-full-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          initialLeads: previewLeads,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate the full lead list.");
      }

      const data = (await response.json()) as { leads: Lead[]; message?: string };
      setFullLeads(data.leads);
      setStage("full");
      setNotice(data.message ?? "Full lead list ready.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsFullLoading(false);
    }
  }

  async function handleRegenerate() {
    await fetchPreview(previewOffset + 5);
  }

  function exportToCsv() {
    if (!fullLeads.length) {
      return;
    }

    const headers = [
      "Company Name",
      "Contact Name",
      "Domain",
      "URL",
      "Address",
      "Phone",
      "Email",
      "Score",
      "Status",
    ];
    const rows = fullLeads.map((lead) => [
      lead.companyName,
      lead.contactName,
      lead.domain,
      lead.url,
      lead.address,
      lead.phone,
      lead.email,
      lead.emailScore,
      lead.emailStatus,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads.csv";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("CSV export started.");
  }

  return (
    <section className="glass-card rounded-[2rem] p-6 sm:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-teal-700">
              Lead Request
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Build your target list</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Open Dashboard
            </Link>
            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              {totalRequestedLabel}
            </div>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              value={formData.name}
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              placeholder="Aman Verma"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Company Type</span>
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                value={selectedCompanyTypeOption}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    companyType: event.target.value === "Other" ? "" : event.target.value,
                  }))
                }
              >
                {companyTypes.map((companyType) => (
                  <option key={companyType} value={companyType}>
                    {companyType}
                  </option>
                ))}
              </select>
            </label>

            {selectedCompanyTypeOption === "Other" ? (
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Custom Company Type</span>
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  value={customCompanyType}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, companyType: event.target.value }))
                  }
                  placeholder="Consulting Firm"
                  required
                />
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Location</span>
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                value={formData.location}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, location: event.target.value }))
                }
                placeholder="Delhi, India"
                required
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Number of Leads</span>
            <input
              type="number"
              min={5}
              step={1}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              value={formData.numberOfLeads}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  numberOfLeads: Number(event.target.value || 5),
                }))
              }
              required
            />
            <span className="text-xs text-slate-500">
              Minimum 5 so the preview and final list stay aligned.
            </span>
          </label>

          <button
            type="submit"
            disabled={isPreviewLoading || isFullLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-3.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-400"
          >
            {isPreviewLoading ? <span className="spinner" aria-hidden="true" /> : null}
            {isPreviewLoading ? "Generating Preview..." : "Generate Leads"}
          </button>
        </form>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}

        {stage !== "idle" ? (
          <LeadsPreview
            leads={previewLeads}
            isLoading={isPreviewLoading}
            isContinuing={isFullLoading}
            onRegenerateNext={handleRegenerate}
            onContinue={handleContinue}
            canContinue={canContinue}
          />
        ) : null}

        {stage === "full" ? (
          <LeadsTable
            leads={fullLeads}
            requestedCount={formData.numberOfLeads}
            onExport={exportToCsv}
          />
        ) : null}
      </div>
    </section>
  );
}
