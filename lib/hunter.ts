import type { Lead } from "@/lib/generateMockLeads";

type HunterFinderResponse = {
  data?: {
    email?: string | null;
    score?: number | null;
  };
};

type HunterVerifierResponse = {
  data?: {
    score?: number | null;
    status?: string | null;
    result?: string | null;
  };
};

type HunterDomainSearchResponse = {
  data?: {
    emails?: Array<{
      value?: string | null;
      confidence?: number | null;
      first_name?: string | null;
      last_name?: string | null;
      position?: string | null;
      department?: string | null;
      seniority?: string | null;
      type?: string | null;
    }>;
  };
};

const HUNTER_BASE_URL = "https://api.hunter.io/v2";

function getHunterApiKey() {
  return process.env.HUNTER_API_KEY?.trim() || "";
}

function splitName(name?: string) {
  const normalized = (name || "").trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function hasHunterResult(lead: Lead) {
  return ["valid", "invalid", "risky", "not_found", "not_configured"].includes(
    lead.emailStatus || "",
  );
}

function mapVerificationStatus(payload: HunterVerifierResponse["data"]) {
  const status = String(payload?.status || "").toLowerCase();
  const result = String(payload?.result || "").toLowerCase();

  if (status === "valid" || result === "deliverable") {
    return "valid" as const;
  }

  if (status === "invalid" || result === "undeliverable" || result === "invalid") {
    return "invalid" as const;
  }

  return "risky" as const;
}

function getLeadNameForHunter(lead: Lead) {
  return lead.contactName?.trim() || lead.companyName?.trim() || "";
}

function hasRealContactName(lead: Lead) {
  const contactName = lead.contactName?.trim() || "";
  if (!contactName) {
    return false;
  }

  return contactName.split(/\s+/).length >= 2;
}

async function verifyEmail(email: string, apiKey: string) {
  const verifierUrl = new URL(`${HUNTER_BASE_URL}/email-verifier`);
  verifierUrl.searchParams.set("email", email);
  verifierUrl.searchParams.set("api_key", apiKey);

  const verifierResponse = await fetch(verifierUrl, {
    cache: "no-store",
  });

  if (!verifierResponse.ok) {
    const details = await verifierResponse.text();
    throw new Error(`Hunter email verifier failed: ${verifierResponse.status} ${details}`);
  }

  return (await verifierResponse.json()) as HunterVerifierResponse;
}

function pickBestDomainEmail(payload: HunterDomainSearchResponse) {
  const emails = Array.isArray(payload.data?.emails) ? payload.data?.emails : [];
  if (!emails.length) {
    return null;
  }

  const rankedEmails = [...emails].sort((left, right) => {
    const rightConfidence = right.confidence ?? -1;
    const leftConfidence = left.confidence ?? -1;
    if (rightConfidence !== leftConfidence) {
      return rightConfidence - leftConfidence;
    }

    const rightHasName = Number(Boolean(right.first_name || right.last_name));
    const leftHasName = Number(Boolean(left.first_name || left.last_name));
    return rightHasName - leftHasName;
  });

  return rankedEmails[0] || null;
}

export async function enrichLead(lead: Lead): Promise<Lead> {
  if (!lead.domain) {
    console.info("Skipping Hunter enrichment for lead without domain.", {
      companyName: lead.companyName,
    });
    return {
      ...lead,
      email: "",
      emailScore: null,
      emailStatus: "not_found",
    };
  }

  if (hasHunterResult(lead)) {
    return lead;
  }

  const apiKey = getHunterApiKey();
  if (!apiKey) {
    console.warn("HUNTER_API_KEY is not set. Skipping Hunter enrichment.");
    return {
      ...lead,
      emailScore: null,
      emailStatus: "not_configured",
    };
  }

  const { firstName, lastName } = splitName(getLeadNameForHunter(lead));

  try {
    console.info("Searching domain via Hunter.", {
      companyName: lead.companyName,
      domain: lead.domain,
    });

    const domainSearchUrl = new URL(`${HUNTER_BASE_URL}/domain-search`);
    domainSearchUrl.searchParams.set("domain", lead.domain);
    domainSearchUrl.searchParams.set("api_key", apiKey);

    const domainSearchResponse = await fetch(domainSearchUrl, {
      cache: "no-store",
    });

    if (!domainSearchResponse.ok) {
      const details = await domainSearchResponse.text();
      throw new Error(`Hunter domain search failed: ${domainSearchResponse.status} ${details}`);
    }

    const domainSearchPayload = (await domainSearchResponse.json()) as HunterDomainSearchResponse;
    const domainMatch = pickBestDomainEmail(domainSearchPayload);
    let foundEmail = domainMatch?.value?.trim() || "";
    let foundScore = domainMatch?.confidence ?? null;

    if (!foundEmail && hasRealContactName(lead)) {
      console.info("Falling back to Hunter email finder.", {
        companyName: lead.companyName,
        domain: lead.domain,
        contactName: lead.contactName,
      });

      const finderUrl = new URL(`${HUNTER_BASE_URL}/email-finder`);
      finderUrl.searchParams.set("domain", lead.domain);
      finderUrl.searchParams.set("first_name", firstName);
      finderUrl.searchParams.set("last_name", lastName);
      finderUrl.searchParams.set("api_key", apiKey);

      const finderResponse = await fetch(finderUrl, {
        cache: "no-store",
      });

      if (!finderResponse.ok) {
        const details = await finderResponse.text();
        throw new Error(`Hunter email finder failed: ${finderResponse.status} ${details}`);
      }

      const finderPayload = (await finderResponse.json()) as HunterFinderResponse;
      foundEmail = finderPayload.data?.email?.trim() || "";
      foundScore = finderPayload.data?.score ?? foundScore;
    }

    if (!foundEmail) {
      return {
        ...lead,
        email: "",
        emailScore: null,
        emailStatus: "not_found",
      };
    }

    const verifierPayload = await verifyEmail(foundEmail, apiKey);

    return {
      ...lead,
      email: foundEmail,
      emailScore: verifierPayload.data?.score ?? foundScore ?? null,
      emailStatus: mapVerificationStatus(verifierPayload.data),
    };
  } catch (error) {
    console.error("Hunter enrichment failed.", {
      companyName: lead.companyName,
      domain: lead.domain,
      error: error instanceof Error ? error.message : error,
    });

    return {
      ...lead,
      email: lead.email || "",
      emailScore: null,
      emailStatus: lead.email ? "unverified" : "not_found",
    };
  }
}

export async function enrichLeads(leads: Lead[]) {
  return Promise.all(leads.map((lead) => enrichLead(lead)));
}
