import { sanitizeLeadRequest, type LeadRequest } from "@/lib/generateMockLeads";

export type LeadInputMode = "form";

export type LeadRequestPayload = Partial<LeadRequest> & {
  inputMode?: LeadInputMode;
};

export type ResolvedLeadRequest = {
  inputMode: LeadInputMode;
  request: LeadRequest;
};

export async function resolveLeadRequest(
  payload: LeadRequestPayload,
): Promise<ResolvedLeadRequest> {
  return {
    inputMode: "form",
    request: sanitizeLeadRequest(payload),
  };
}
