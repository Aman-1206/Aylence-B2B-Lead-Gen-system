import { promises as fs } from "fs";
import path from "path";
import type { Lead, LeadRequest } from "@/lib/generateMockLeads";

export type LocalLeadGenerationRecord = {
  id: string;
  createdAt: string;
  request: LeadRequest;
  requestedCount: number;
  generatedCount: number;
  leads: Lead[];
};

type LegacyLeadStore = {
  leads?: Lead[];
  generations?: LocalLeadGenerationRecord[];
};

const leadsFilePath = path.join(process.cwd(), "data", "leads.json");

async function readLeadStore() {
  try {
    const fileContents = await fs.readFile(leadsFilePath, "utf-8");
    const parsed = JSON.parse(fileContents) as LegacyLeadStore;

    return {
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      generations: Array.isArray(parsed.generations) ? parsed.generations : [],
    };
  } catch {
    return {
      leads: [],
      generations: [],
    };
  }
}

export async function appendLeadGenerationToLocalStore(request: LeadRequest, leads: Lead[]) {
  await fs.mkdir(path.dirname(leadsFilePath), { recursive: true });

  const store = await readLeadStore();
  const generation: LocalLeadGenerationRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    request,
    requestedCount: request.numberOfLeads,
    generatedCount: leads.length,
    leads,
  };

  store.leads.push(...leads);
  store.generations.unshift(generation);

  await fs.writeFile(leadsFilePath, JSON.stringify(store, null, 2), "utf-8");
  return generation;
}

export async function getRecentLocalLeadGenerations(limit = 12) {
  const store = await readLeadStore();
  return store.generations
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
}
