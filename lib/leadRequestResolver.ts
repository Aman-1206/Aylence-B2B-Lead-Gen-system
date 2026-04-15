import { parseLeadPrompt } from "@/lib/openrouter";
import { sanitizeLeadRequest, type LeadRequest } from "@/lib/generateMockLeads";

export type LeadInputMode = "form" | "prompt";

export type LeadRequestPayload = Partial<LeadRequest> & {
  inputMode?: LeadInputMode;
  prompt?: string;
};

export type ResolvedLeadRequest = {
  inputMode: LeadInputMode;
  request: LeadRequest;
};

function hasStructuredLeadFields(payload: LeadRequestPayload) {
  return Boolean(
    payload.companyType?.trim() &&
      payload.location?.trim() &&
      Number.isFinite(Number(payload.numberOfLeads)),
  );
}

export async function resolveLeadRequest(
  payload: LeadRequestPayload,
): Promise<ResolvedLeadRequest> {
  const inputMode: LeadInputMode = payload.inputMode === "prompt" ? "prompt" : "form";

  if (inputMode === "prompt" && !hasStructuredLeadFields(payload)) {
    const parsedRequest = await parseLeadPrompt(payload.prompt || "");

    return {
      inputMode,
      request: sanitizeLeadRequest({
        ...payload,
        ...parsedRequest,
      }),
    };
  }

  return {
    inputMode,
    request: sanitizeLeadRequest(payload),
  };
}
