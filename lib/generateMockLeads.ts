export type Lead = {
  id: string;
  contactName?: string;
  companyName: string;
  address: string;
  street?: string;
  city?: string;
  landmark?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone: string;
  email: string;
  domain?: string;
  url?: string;
  emailScore?: number | null;
  emailStatus?: "valid" | "invalid" | "risky" | "not_found" | "unverified" | "not_configured";
};

export type LeadRequest = {
  name: string;
  companyType: string;
  leadPrompt: string;
  location: string;
  city: string;
  landmark: string;
  state: string;
  country: string;
  postalCode: string;
  testLeadCount: number;
  numberOfLeads: number;
};

export type LeadRequestWithInitialLeads = LeadRequest & {
  initialLeads?: Lead[];
};

const prefixes = [
  "Bright",
  "Prime",
  "Summit",
  "Nova",
  "Urban",
  "Evergreen",
  "Velocity",
  "Pioneer",
  "BluePeak",
  "Golden",
  "Vertex",
  "Nimbus",
];

const suffixes = [
  "Solutions",
  "Partners",
  "Works",
  "Studios",
  "Hub",
  "Enterprises",
  "Labs",
  "Advisors",
  "Networks",
  "Group",
];

const streets = [
  "Ring Road",
  "MG Road",
  "Park Street",
  "Link Road",
  "Business Avenue",
  "Central Plaza",
  "Commerce Street",
  "Tech Park",
  "Market Lane",
  "Sunrise Boulevard",
];

function randomFrom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCompanyName(companyType: string) {
  const normalizedType = companyType.trim() || "Business";
  return `${randomFrom(prefixes)} ${normalizedType} ${randomFrom(suffixes)}`;
}

function buildContactName() {
  const firstNames = ["Rahul", "Aman", "Priya", "Neha", "Arjun", "Karan", "Sneha", "Rohan"];
  const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Patel", "Mehta", "Kapoor", "Joshi"];
  return `${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
}

function splitLocation(location: string) {
  const [city = "", state = "", country = ""] = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city,
    state,
    country: country || state,
  };
}

function buildLocationFromAddress(payload: Partial<LeadRequest>) {
  const parts = [
    payload.landmark,
    payload.city,
    payload.state,
    payload.country,
    payload.postalCode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.join(", ") || payload.location?.trim() || "Delhi, India";
}

function buildPhone() {
  return `+91-${randomDigits(10)}`;
}

function buildEmail(companyName: string) {
  const companySlug = slugify(companyName).replace(/-/g, "");
  const domains = ["com", "in", "co", "biz"];
  return `hello@${companySlug}.${randomFrom(domains)}`;
}

function buildWebsite(companyName: string) {
  const companySlug = slugify(companyName).replace(/-/g, "");
  return `https://www.${companySlug}.com`;
}

function buildLeadKey(lead: Pick<Lead, "companyName" | "phone" | "email">) {
  return `${lead.companyName}|${lead.phone}|${lead.email}`;
}

export function sanitizeLeadRequest(payload: Partial<LeadRequest>): LeadRequest {
  const location = buildLocationFromAddress(payload);
  const locationParts = splitLocation(location);

  return {
    name: payload.name?.trim() || "Unknown User",
    companyType: payload.companyType?.trim() || "Business",
    leadPrompt: payload.leadPrompt?.trim() || "",
    location,
    city: payload.city?.trim() || locationParts.city,
    landmark: payload.landmark?.trim() || "",
    state: payload.state?.trim() || locationParts.state,
    country: payload.country?.trim() || locationParts.country,
    postalCode: payload.postalCode?.trim() || "",
    testLeadCount: Math.min(15, Math.max(1, Math.round(Number(payload.testLeadCount) || 5))),
    numberOfLeads: Math.min(15, Math.max(1, Math.round(Number(payload.numberOfLeads) || 15))),
  };
}

export function generateMockLeads(
  request: LeadRequest,
  count: number,
  existingLeads: Lead[] = [],
) {
  const leads: Lead[] = [];
  const seenKeys = new Set(existingLeads.map((lead) => buildLeadKey(lead)));

  while (leads.length < count) {
    const companyName = buildCompanyName(request.companyType);
    const street = `${Math.floor(Math.random() * 180) + 1} ${randomFrom(streets)}`;
    const locationParts = splitLocation(request.location);
    const phone = buildPhone();
    const email = buildEmail(companyName);
    const url = buildWebsite(companyName);
    const lead: Lead = {
      id: crypto.randomUUID(),
      contactName: buildContactName(),
      companyName,
      address: `${street}, ${request.location}`,
      street,
      city: request.city || locationParts.city,
      landmark: request.landmark || randomFrom(streets),
      state: request.state || locationParts.state,
      country: request.country || locationParts.country,
      postalCode: request.postalCode,
      phone,
      email,
      domain: url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
      url,
      emailScore: null,
      emailStatus: "unverified",
    };

    const key = buildLeadKey(lead);
    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    leads.push(lead);
  }

  return leads;
}
