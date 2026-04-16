import { NextResponse } from "next/server";
import { dedupeLeads, fetchUniqueApifyLeads, hasAnyLeadContact } from "@/lib/apify";
import { getPreviousLeadsForRequest, saveLeadGeneration } from "@/lib/leadGenerations";
import type { Lead } from "@/lib/generateMockLeads";
import { resolveLeadRequest, type LeadRequestPayload } from "@/lib/leadRequestResolver";
import { getCurrentSession } from "@/lib/authSession";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json()) as LeadRequestPayload & { initialLeads?: Lead[] };
    const { request: payload } = await resolveLeadRequest(body);
    const previousLeads = await getPreviousLeadsForRequest(payload);
    const initialLeads = dedupeLeads(
      Array.isArray(body.initialLeads) ? body.initialLeads : [],
      previousLeads,
    );
    let combinedLeads = initialLeads;
    let apifyFallbackMessage = "";

    try {
      combinedLeads = await fetchUniqueApifyLeads(
        payload,
        payload.numberOfLeads,
        initialLeads,
        previousLeads,
      );
    } catch (error) {
      if (!initialLeads.length) {
        throw error;
      }

      console.warn("Apify final lead fetch failed. Falling back to preview leads.", {
        error: error instanceof Error ? error.message : error,
      });
      apifyFallbackMessage =
        " Apify could not complete the final run, so the available preview leads were used.";
    }

    const finalLeads = combinedLeads.filter(hasAnyLeadContact);

    const savedToMongo = Boolean(await saveLeadGeneration(payload, finalLeads, session.email));

    const storageMessage = savedToMongo
      ? "and saved them to MongoDB"
      : "without saving them because MongoDB is not configured";
    const exactCountMessage =
      finalLeads.length === payload.numberOfLeads
        ? `Fetched ${finalLeads.length} unique leads ${storageMessage}.${apifyFallbackMessage}`
        : `Fetched ${finalLeads.length} unique leads out of the requested ${payload.numberOfLeads} ${storageMessage}.${apifyFallbackMessage}`;

    return NextResponse.json({
      leads: finalLeads,
      resolvedRequest: payload,
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
