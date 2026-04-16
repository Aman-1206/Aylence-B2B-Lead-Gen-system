import { NextResponse } from "next/server";
import { fetchApifyLeadWindow } from "@/lib/apify";
import { getPreviousLeadsForRequest } from "@/lib/leadGenerations";
import { resolveLeadRequest, type LeadRequestPayload } from "@/lib/leadRequestResolver";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadRequestPayload & { offset?: number };
    const { request: payload } = await resolveLeadRequest(body);
    const offset = Math.max(0, Number(body.offset) || 0);
    const testLeadCount = Math.min(15, Math.max(1, payload.testLeadCount));
    const previousLeads = await getPreviousLeadsForRequest(payload);
    const leads = await fetchApifyLeadWindow(payload, offset, testLeadCount, previousLeads);

    return NextResponse.json({
      leads,
      resolvedRequest: payload,
      message:
        (
        leads.length === testLeadCount
          ? `Fetched a fresh ${testLeadCount}-lead test list for ${payload.companyType} in ${payload.location}.`
          : `Fetched ${leads.length} preview leads for ${payload.companyType} in ${payload.location}.`
        ),
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
