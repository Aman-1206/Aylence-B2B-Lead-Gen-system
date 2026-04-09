import { NextResponse } from "next/server";
import { dedupeLeads, fetchUniqueApifyLeads } from "@/lib/apify";
import { enrichLeads } from "@/lib/hunter";
import { saveLeadGeneration } from "@/lib/leadGenerations";
import { sanitizeLeadRequest, type Lead, type LeadRequestWithInitialLeads } from "@/lib/generateMockLeads";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadRequestWithInitialLeads;
    const payload = sanitizeLeadRequest(body);
    const initialLeads = dedupeLeads(Array.isArray(body.initialLeads) ? body.initialLeads : []);
    const combinedLeads = await fetchUniqueApifyLeads(payload, payload.numberOfLeads, initialLeads);
    const leadsNeedingEnrichment = combinedLeads.filter(
      (lead) =>
        !lead.emailStatus ||
        lead.emailStatus === "unverified" ||
        lead.emailStatus === "not_configured",
    );
    const enrichedLeads = await enrichLeads(leadsNeedingEnrichment);
    const enrichedLeadMap = new Map(enrichedLeads.map((lead) => [lead.id, lead]));
    const finalLeads = combinedLeads.map((lead) => enrichedLeadMap.get(lead.id) || lead);

    const savedToMongo = Boolean(await saveLeadGeneration(payload, finalLeads));

    const storageLabel = savedToMongo
      ? "MongoDB and data/leads.json"
      : "data/leads.json";
    const exactCountMessage =
      finalLeads.length === payload.numberOfLeads
        ? `Fetched ${finalLeads.length} unique leads, enriched them with Hunter, and saved them to ${storageLabel}.`
        : `Fetched ${finalLeads.length} unique leads out of the requested ${payload.numberOfLeads}, enriched the available domains with Hunter, and saved them to ${storageLabel}.`;

    return NextResponse.json({
      leads: finalLeads,
      message: exactCountMessage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate full leads from Apify.",
      },
      { status: 400 },
    );
  }
}
