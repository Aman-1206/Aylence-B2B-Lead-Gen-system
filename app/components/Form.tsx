"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
type GenerateLeadsResponse = {
  leads: Lead[];
  message?: string;
  resolvedRequest?: LeadRequest;
};

const initialForm: LeadRequest = {
  name: "",
  companyType: "Marketing Agency",
  leadPrompt: "",
  location: "",
  city: "",
  landmark: "",
  state: "",
  country: "",
  postalCode: "",
  testLeadCount: 5,
  numberOfLeads: 15,
};

export default function Form() {
  const [formData, setFormData] = useState<LeadRequest>(initialForm);
  const previewAbortControllerRef = useRef<AbortController | null>(null);
  const fullAbortControllerRef = useRef<AbortController | null>(null);
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  const [fullLeads, setFullLeads] = useState<Lead[]>([]);
  const [stage, setStage] = useState<FlowStage>("idle");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isFullLoading, setIsFullLoading] = useState(false);
  const [previewOffset, setPreviewOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canContinue = previewLeads.length > 0 && !isPreviewLoading && !isFullLoading;
  const isGenerating = isPreviewLoading || isFullLoading;
  const effectiveRequest = formData;
  const totalRequestedLabel = useMemo(() => {
    return `${effectiveRequest.testLeadCount} test, ${effectiveRequest.numberOfLeads} final`;
  }, [effectiveRequest.numberOfLeads, effectiveRequest.testLeadCount]);
  const selectedCompanyTypeOption = presetCompanyTypes.includes(formData.companyType)
    ? formData.companyType
    : "Other";
  const customCompanyType = selectedCompanyTypeOption === "Other" ? formData.companyType : "";

  useEffect(() => {
    return () => {
      previewAbortControllerRef.current?.abort();
      fullAbortControllerRef.current?.abort();
    };
  }, []);

  function updateAddressField(field: keyof Pick<LeadRequest, "city" | "landmark" | "state" | "country" | "postalCode">, value: string) {
    setFormData((current) => {
      const next = {
        ...current,
        [field]: value,
      };
      const location = [
        next.landmark,
        next.city,
        next.state,
        next.country,
        next.postalCode,
      ]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");

      return {
        ...next,
        location,
      };
    });
  }

  function resetGenerationState() {
    setPreviewLeads([]);
    setFullLeads([]);
    setStage("idle");
    setPreviewOffset(0);
    setError(null);
    setNotice(null);
  }

  function buildRequestPayload() {
    return {
      inputMode: "form",
      ...formData,
    };
  }

  async function fetchPreview(offset = 0) {
    previewAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    previewAbortControllerRef.current = abortController;

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
          ...buildRequestPayload(),
          offset,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Unable to generate preview leads.");
      }

      const data = (await response.json()) as GenerateLeadsResponse;
      setPreviewLeads(data.leads);
      setFullLeads([]);
      setPreviewOffset(offset);
      setStage("preview");
      setNotice(data.message ?? "Preview generated successfully.");
      if (data.resolvedRequest) {
        setFormData(data.resolvedRequest);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        setNotice("Lead generation stopped.");
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      if (previewAbortControllerRef.current === abortController) {
        previewAbortControllerRef.current = null;
      }
      setIsPreviewLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchPreview(0);
  }

  async function handleContinue() {
    fullAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    fullAbortControllerRef.current = abortController;

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
          ...buildRequestPayload(),
          initialLeads: previewLeads,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Unable to generate the full lead list.");
      }

      const data = (await response.json()) as GenerateLeadsResponse;
      setFullLeads(data.leads);
      setStage("full");
      setNotice(data.message ?? "Full lead list ready.");
      if (data.resolvedRequest) {
        setFormData(data.resolvedRequest);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        setNotice("Lead generation stopped.");
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      if (fullAbortControllerRef.current === abortController) {
        fullAbortControllerRef.current = null;
      }
      setIsFullLoading(false);
    }
  }

  async function handleRegenerate() {
    await fetchPreview(previewOffset + effectiveRequest.testLeadCount);
  }

  function handleStopGenerating() {
    previewAbortControllerRef.current?.abort();
    fullAbortControllerRef.current?.abort();
    previewAbortControllerRef.current = null;
    fullAbortControllerRef.current = null;
    setIsPreviewLoading(false);
    setIsFullLoading(false);
    setNotice("Lead generation stopped.");
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
    const rows = fullLeads.map((lead) => [
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

          <>
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

              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Lead Details / Prompt
                </span>
                <textarea
                  className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  value={formData.leadPrompt}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, leadPrompt: event.target.value }))
                  }
                  placeholder="Add specifics like: only B2B agencies, companies with websites, premium clinics, startup-focused firms, or areas to prioritize."
                />
                <span className="text-xs text-slate-500">
                  Optional. These details are added to the search query to make results more specific.
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">City</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={formData.city}
                    onChange={(event) => updateAddressField("city", event.target.value)}
                    placeholder="Delhi"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Landmark / Area</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={formData.landmark}
                    onChange={(event) => updateAddressField("landmark", event.target.value)}
                    placeholder="Connaught Place"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">State</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={formData.state}
                    onChange={(event) => updateAddressField("state", event.target.value)}
                    placeholder="Delhi"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Country</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={formData.country}
                    onChange={(event) => updateAddressField("country", event.target.value)}
                    placeholder="India"
                    required
                  />
                </label>

                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Postal Code</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={formData.postalCode}
                    onChange={(event) => updateAddressField("postalCode", event.target.value)}
                    placeholder="110001"
                  />
                  <span className="text-xs text-slate-500">
                    Search location: {formData.location || "Add a city and country to target the search."}
                  </span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Test Leads</span>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    step={1}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={formData.testLeadCount}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        testLeadCount: Number(event.target.value || 1),
                      }))
                    }
                    required
                  />
                  <span className="text-xs text-slate-500">
                    Generate 1 to 15 leads for the test preview.
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Final Leads</span>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    step={1}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={formData.numberOfLeads}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        numberOfLeads: Number(event.target.value || 1),
                      }))
                    }
                    required
                  />
                  <span className="text-xs text-slate-500">
                    Final generation is capped at 15 leads for now.
                  </span>
                </label>
              </div>
          </>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-3.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-400"
            >
              {isPreviewLoading ? <span className="spinner" aria-hidden="true" /> : null}
              {isPreviewLoading ? "Generating Preview..." : "Generate Leads"}
            </button>
            {isGenerating ? (
              <button
                type="button"
                onClick={handleStopGenerating}
                className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Stop Generating
              </button>
            ) : null}
          </div>
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
            testLeadCount={effectiveRequest.testLeadCount}
            onRegenerateNext={handleRegenerate}
            onContinue={handleContinue}
            canContinue={canContinue}
          />
        ) : null}

        {stage === "full" ? (
          <LeadsTable
            leads={fullLeads}
            requestedCount={effectiveRequest.numberOfLeads}
            onExport={exportToCsv}
          />
        ) : null}
      </div>
    </section>
  );
}
