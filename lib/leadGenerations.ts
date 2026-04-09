import { ObjectId } from "mongodb";
import type { Lead, LeadRequest } from "@/lib/generateMockLeads";
import { appendLeadGenerationToLocalStore, getRecentLocalLeadGenerations } from "@/lib/localLeadStore";
import { getMongoClient, isMongoConfigured } from "@/lib/mongodb";

export type LeadGenerationRecord = {
  _id: ObjectId | string;
  createdAt: Date;
  request: LeadRequest;
  requestedCount: number;
  generatedCount: number;
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

export async function saveLeadGeneration(request: LeadRequest, leads: Lead[]) {
  await appendLeadGenerationToLocalStore(request, leads);

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
      leads,
    };

    const result = await collection.insertOne(document as LeadGenerationRecord);
    return result.insertedId;
  } catch (error) {
    console.error("Failed to save lead generation to MongoDB.", error);
    return null;
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
    const localGenerations = await getRecentLocalLeadGenerations(limit);

    return {
      generations: localGenerations.map((generation) => ({
        _id: generation.id,
        createdAt: new Date(generation.createdAt),
        request: generation.request,
        requestedCount: generation.requestedCount,
        generatedCount: generation.generatedCount,
        leads: generation.leads,
      })),
      mongoAvailable: false,
      source: localGenerations.length > 0 ? "local" : "none",
    } satisfies LeadGenerationFetchResult;
  }
}
