import type { Lead, LeadRequest } from "@/lib/generateMockLeads";

type ApifyPlace = {
  title?: string;
  contactName?: string;
  contactPerson?: string;
  street?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  phone?: string;
  website?: string;
  url?: string;
  domain?: string;
  emails?: string[];
};

const APIFY_BASE_URL = "https://api.apify.com/v2";
const DEFAULT_ACTOR_ID = "compass~crawler-google-places";

function getApifyToken() {
  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    throw new Error("Missing APIFY_API_TOKEN in .env.local");
  }

  return token;
}

function getActorId() {
  return process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR_ID;
}

function compactAddress(place: ApifyPlace) {
  return [place.street, place.city, place.state, place.countryCode]
    .filter(Boolean)
    .join(", ");
}

function pickEmail(place: ApifyPlace) {
  if (Array.isArray(place.emails) && place.emails.length > 0) {
    return place.emails[0] ?? "";
  }

  return "";
}

function normalizeUrl(rawUrl?: string) {
  const value = rawUrl?.trim();

  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function extractDomain(place: ApifyPlace) {
  if (place.domain?.trim()) {
    return place.domain.trim().toLowerCase();
  }

  const normalizedUrl = normalizeUrl(place.website || place.url);
  if (!normalizedUrl) {
    return "";
  }

  try {
    return new URL(normalizedUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function mapPlaceToLead(place: ApifyPlace): Lead {
  const url = normalizeUrl(place.website || place.url);
  const domain = extractDomain(place);

  return {
    id: crypto.randomUUID(),
    contactName: place.contactName?.trim() || place.contactPerson?.trim() || "",
    companyName: place.title?.trim() || "Unknown Company",
    address: compactAddress(place) || "Address not available",
    phone: place.phone?.trim() || "Phone not available",
    email: pickEmail(place),
    domain,
    url,
    emailScore: null,
    emailStatus: "unverified",
  };
}

function buildApifyInput(request: LeadRequest, count: number) {
  return {
    includeWebResults: false,
    language: "en",
    locationQuery: request.location,
    maxCrawledPlacesPerSearch: count,
    maximumLeadsEnrichmentRecords: 0,
    scrapeContacts: false,
    scrapeDirectories: false,
    scrapeImageAuthors: false,
    scrapePlaceDetailPage: false,
    scrapeReviewsPersonalData: true,
    scrapeSocialMediaProfiles: {
      facebooks: false,
      instagrams: false,
      tiktoks: false,
      twitters: false,
      youtubes: false,
    },
    scrapeTableReservationProvider: false,
    searchStringsArray: [request.companyType],
    skipClosedPlaces: false,
  };
}

export async function fetchApifyLeads(request: LeadRequest, count: number) {
  const token = getApifyToken();
  const actorId = getActorId();
  const endpoint = `${APIFY_BASE_URL}/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildApifyInput(request, count)),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apify request failed: ${response.status} ${errorText}`);
  }

  const items = (await response.json()) as ApifyPlace[];
  return items
    .map(mapPlaceToLead)
    .filter((lead) => lead.domain);
}

export function dedupeLeads(leads: Lead[]) {
  const seen = new Set<string>();

  return leads.filter((lead) => {
    const key = `${lead.companyName}|${lead.address}|${lead.phone}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function fetchApifyLeadWindow(
  request: LeadRequest,
  offset: number,
  limit: number,
  existingLeads: Lead[] = [],
) {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  const rawLeads = await fetchApifyLeads(request, safeOffset + safeLimit);
  const uniqueLeads = dedupeLeads([...existingLeads, ...rawLeads]);

  return uniqueLeads.slice(safeOffset, safeOffset + safeLimit);
}

export async function fetchUniqueApifyLeads(
  request: LeadRequest,
  targetCount: number,
  existingLeads: Lead[] = [],
) {
  const safeTarget = Math.max(0, targetCount);
  let uniqueLeads = dedupeLeads(existingLeads);
  let fetchCount = Math.max(safeTarget, existingLeads.length + 5, 5);
  let attempts = 0;

  while (uniqueLeads.length < safeTarget && attempts < 5) {
    const fetchedLeads = await fetchApifyLeads(request, fetchCount);
    uniqueLeads = dedupeLeads([...existingLeads, ...fetchedLeads]);
    fetchCount += Math.max(safeTarget - uniqueLeads.length, 5);
    attempts += 1;
  }

  return uniqueLeads.slice(0, safeTarget);
}
