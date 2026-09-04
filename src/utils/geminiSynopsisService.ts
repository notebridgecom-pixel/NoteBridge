export interface SynopsisRequestParams {
  textContent: string;
  title?: string;
  subject?: string;
  unitsCovered?: string;
}

export interface SynopsisResponse {
  synopsis: string;
  isFallback: boolean;
  model: string;
  error?: string;
}

/**
 * Checks if textual content provided by seller is long enough to generate a high-yield AI synopsis.
 */
export function hasSufficientContent(text?: string): boolean {
  if (!text) return false;
  return text.trim().length >= 40;
}

/**
 * Calls backend server endpoint (/api/gemini/synopsis) to generate an AI-powered summary/synopsis
 * using Google Gemini API.
 */
export async function generateNoteSynopsis(params: SynopsisRequestParams): Promise<SynopsisResponse> {
  if (!hasSufficientContent(params.textContent)) {
    throw new Error('Textual content body must be at least 40 characters long for AI synopsis generation.');
  }

  const response = await fetch('/api/gemini/synopsis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  const data: SynopsisResponse = await response.json();
  return data;
}
