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
type InputMode = "form" | "prompt";
type GenerateLeadsResponse = {
  leads: Lead[];
  message?: string;
  resolvedRequest?: LeadRequest;
};

const initialForm: LeadRequest = {
  name: "",
  companyType: "Marketing Agency",
  location: "",
  numberOfLeads: 50,
};

export default function Form() {
  const [formData, setFormData] = useState<LeadRequest>(initialForm);
  const [inputMode, setInputMode] = useState<InputMode>("form");
  const [prompt, setPrompt] = useState("");
  const [resolvedPromptRequest, setResolvedPromptRequest] = useState<LeadRequest | null>(null);
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([]);
  const [fullLeads, setFullLeads] = useState<Lead[]>([]);
  const [stage, setStage] = useState<FlowStage>("idle");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isFullLoading, setIsFullLoading] = useState(false);
  const [previewOffset, setPreviewOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canContinue = previewLeads.length > 0 && !isPreviewLoading && !isFullLoading;
  const effectiveRequest = inputMode === "prompt" ? resolvedPromptRequest || formData : formData;
  const totalRequestedLabel = useMemo(() => {
    if (inputMode === "prompt" && !resolvedPromptRequest) {
      return "Prompt-driven request";
    }

    return `${effectiveRequest.numberOfLeads.toLocaleString()} leads requested`;
  }, [effectiveRequest.numberOfLeads, inputMode, resolvedPromptRequest]);
  const selectedCompanyTypeOption = presetCompanyTypes.includes(formData.companyType)
    ? formData.companyType
    : "Other";
  const customCompanyType = selectedCompanyTypeOption === "Other" ? formData.companyType : "";

  function resetGenerationState() {
    setPreviewLeads([]);
    setFullLeads([]);
    setStage("idle");
    setPreviewOffset(0);
    setError(null);
    setNotice(null);
  }

  function buildRequestPayload() {
    if (inputMode === "prompt") {
      return {
        ...(resolvedPromptRequest || {}),
        inputMode,
        name: formData.name,
        prompt,
      };
    }

    return {
      inputMode,
      ...formData,
    };
  }

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
          ...buildRequestPayload(),
          offset,
        }),
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
        setResolvedPromptRequest(data.resolvedRequest);
        setFormData(data.resolvedRequest);
      } else if (inputMode === "form") {
        setResolvedPromptRequest(null);
      }
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
          ...buildRequestPayload(),
          initialLeads: previewLeads,
        }),
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
        setResolvedPromptRequest(data.resolvedRequest);
        setFormData(data.resolvedRequest);
      }
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

          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Choose Input Mode</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setInputMode("form");
                  setResolvedPromptRequest(null);
                  resetGenerationState();
                }}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  inputMode === "form"
                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-4 ring-teal-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="block text-sm font-semibold">Fill the form</span>
                <span className="mt-1 block text-sm text-slate-500">
                  Pick company type, location, and lead count manually.
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode("prompt");
                  resetGenerationState();
                }}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  inputMode === "prompt"
                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-4 ring-teal-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="block text-sm font-semibold">Write a prompt</span>
                <span className="mt-1 block text-sm text-slate-500">
                  Let OpenRouter extract the search requirements for Apify.
                </span>
              </button>
            </div>
          </div>

          {inputMode === "form" ? (
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
            </>
          ) : (
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Lead Generation Prompt</span>
                <textarea
                  className="min-h-32 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  value={prompt}
                  onChange={(event) => {
                    setPrompt(event.target.value);
                    setResolvedPromptRequest(null);
                  }}
                  placeholder="Generate 100 software company leads in Bangalore, India."
                  required
                />
              </label>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                Include the company type, location, and number of leads in plain language. The
                prompt will be parsed by OpenRouter, then the extracted values will be sent to
                Apify.
              </div>
              {resolvedPromptRequest ? (
                <div className="grid gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 sm:grid-cols-3">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                      Company Type
                    </span>
                    <span>{resolvedPromptRequest.companyType}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                      Location
                    </span>
                    <span>{resolvedPromptRequest.location}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                      Lead Count
                    </span>
                    <span>{resolvedPromptRequest.numberOfLeads}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

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
            requestedCount={effectiveRequest.numberOfLeads}
            onExport={exportToCsv}
          />
        ) : null}
      </div>
    </section>
  );
}
