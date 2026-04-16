import { ObjectId } from "mongodb";
import type { Lead, LeadRequest } from "@/lib/generateMockLeads";
import { getMongoClient, isMongoConfigured } from "@/lib/mongodb";

export type LeadGenerationRecord = {
  _id: ObjectId | string;
  createdAt: Date;
  request: LeadRequest;
  requestedCount: number;
  generatedCount: number;
  generatedByEmail?: string;
  leads: Lead[];
};

const DATABASE_NAME = process.env.MONGODB_DB_NAME || "leadgen";
const COLLECTION_NAME = "lead_generations";

export type LeadGenerationFetchResult = {
  generations: LeadGenerationRecord[];
  mongoAvailable: boolean;
  source: "mongo" | "local" | "none";
};

async function getCollection() {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection<LeadGenerationRecord>(COLLECTION_NAME);
}

function normalizeSearchValue(value?: string) {
  return value?.trim() || "";
}

function buildRepeatSearchFilter(request: LeadRequest) {
  return {
    "request.companyType": normalizeSearchValue(request.companyType),
    "request.leadPrompt": normalizeSearchValue(request.leadPrompt),
    "request.location": normalizeSearchValue(request.location),
    "request.country": normalizeSearchValue(request.country),
  };
}

export async function saveLeadGeneration(request: LeadRequest, leads: Lead[], generatedByEmail: string) {
  if (!isMongoConfigured()) {
    return null;
  }

  try {
    const collection = await getCollection();
    const document = {
      createdAt: new Date(),
      request,
      requestedCount: request.numberOfLeads,
      generatedCount: leads.length,
      generatedByEmail,
      leads,
    };

    const result = await collection.insertOne(document as LeadGenerationRecord);
    return result.insertedId;
  } catch (error) {
    console.error("Failed to save lead generation to MongoDB.", error);
    return null;
  }
}

export async function deleteLeadGeneration(id: string) {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid lead generation id.");
  }

  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) } as Partial<LeadGenerationRecord>);
  return result.deletedCount > 0;
}

export async function getPreviousLeadsForRequest(request: LeadRequest, limit = 100) {
  if (!isMongoConfigured()) {
    return [];
  }

  try {
    const collection = await getCollection();
    const generations = await collection
      .find(buildRepeatSearchFilter(request))
      .sort({ createdAt: -1 })
      .limit(20)
      .project<{ leads: Lead[] }>({ leads: 1 })
      .toArray();

    return generations.flatMap((generation) => generation.leads || []).slice(0, limit);
  } catch (error) {
    console.error("Failed to load previous leads for repeat filtering.", error);
    return [];
  }
}

export async function getRecentLeadGenerations(limit = 12) {
  if (!isMongoConfigured()) {
    return {
      generations: [],
      mongoAvailable: false,
      source: "none",
    } satisfies LeadGenerationFetchResult;
  }

  try {
    const collection = await getCollection();
    const generations = await collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray();

    return {
      generations,
      mongoAvailable: true,
      source: "mongo",
    } satisfies LeadGenerationFetchResult;
  } catch (error) {
    console.error("Failed to load lead generations from MongoDB.", error);

    return {
      generations: [],
      mongoAvailable: false,
      source: "none",
    } satisfies LeadGenerationFetchResult;
  }
}
