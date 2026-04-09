import { NextResponse } from "next/server";
import { fetchApifyLeadWindow } from "@/lib/apify";
import { sanitizeLeadRequest, type LeadRequest } from "@/lib/generateMockLeads";
import { enrichLeads } from "@/lib/hunter";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadRequest & { offset?: number };
    const payload = sanitizeLeadRequest(body);
    const offset = Math.max(0, Number(body.offset) || 0);
    const leads = await fetchApifyLeadWindow(payload, offset, 5);
    const enrichedLeads = await enrichLeads(leads);

    return NextResponse.json({
      leads: enrichedLeads,
      message:
        enrichedLeads.length === 5
          ? `Fetched a fresh 5-lead preview for ${payload.companyType} in ${payload.location}.`
          : `Fetched ${enrichedLeads.length} preview leads for ${payload.companyType} in ${payload.location}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to fetch preview leads from Apify.",
      },
      { status: 400 },
    );
  }
}
