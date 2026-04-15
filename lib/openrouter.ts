type OpenRouterMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>;

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: OpenRouterMessageContent;
    };
  }>;
};

export type ParsedLeadPrompt = {
  companyType: string;
  location: string;
  numberOfLeads: number;
};

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY in .env.local");
  }

  return apiKey;
}

function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
}

function extractMessageContent(content?: OpenRouterMessageContent) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
}

function stripCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parsePromptResponse(content: string): ParsedLeadPrompt {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    throw new Error("OpenRouter returned an unreadable prompt parsing response.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenRouter did not return a valid prompt parsing object.");
  }

  const companyType =
    "companyType" in parsed && typeof parsed.companyType === "string"
      ? parsed.companyType.trim()
      : "";
  const location =
    "location" in parsed && typeof parsed.location === "string" ? parsed.location.trim() : "";
  const numberOfLeads =
    "numberOfLeads" in parsed ? Number(parsed.numberOfLeads) : Number.NaN;

  if (!companyType || !location || !Number.isFinite(numberOfLeads)) {
    throw new Error(
      "Prompt must clearly include the company type, location, and number of leads.",
    );
  }

  return {
    companyType,
    location,
    numberOfLeads: Math.max(5, Math.round(numberOfLeads)),
  };
}

export async function parseLeadPrompt(prompt: string): Promise<ParsedLeadPrompt> {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error("Prompt is required when using prompt mode.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getOpenRouterApiKey()}`,
    "Content-Type": "application/json",
  };

  if (process.env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
  }

  if (process.env.OPENROUTER_APP_NAME) {
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
  }

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: getOpenRouterModel(),
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Extract lead generation search parameters from the user's prompt. Return only valid JSON with this exact shape: {\"companyType\":\"string\",\"location\":\"string\",\"numberOfLeads\":number}. Do not add markdown, comments, or extra keys. If the prompt is ambiguous, infer the most likely companyType and location only when the user strongly implies them. Always keep numberOfLeads as a whole number.",
        },
        {
          role: "user",
          content: trimmedPrompt,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = extractMessageContent(data.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error("OpenRouter returned an empty prompt parsing response.");
  }

  return parsePromptResponse(content);
}
