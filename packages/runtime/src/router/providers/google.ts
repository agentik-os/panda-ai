import { GoogleAuth } from "google-auth-library";
import type { ModelResponse, ModelUsage } from "@agentik-os/shared";

export interface GoogleConfig {
  apiKey?: string;
  projectId?: string;
  location?: string; // e.g., "us-central1"
}

export class GoogleProvider {
  private projectId: string;
  private location: string;
  private auth: GoogleAuth;

  constructor(config: GoogleConfig) {
    this.projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT || "";
    this.location = config.location || "us-central1";

    this.auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      ...(config.apiKey && { credentials: { client_email: "", private_key: config.apiKey } }),
    });

    if (!this.projectId) {
      throw new Error("Google Cloud project ID is required");
    }
  }

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    model: string, // e.g., "gemini-2.0-flash-exp", "gemini-pro"
    systemPrompt?: string,
    temperature = 0.7,
    maxTokens = 4096
  ): Promise<ModelResponse> {
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:generateContent`;

    const contents = this.formatMessages(messages, systemPrompt);

    const authClient = await this.auth.getClient();
    const accessToken = await authClient.getAccessToken();

    if (!accessToken.token) {
      throw new Error("Failed to obtain Google Cloud access token");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
        finishReason?: string;
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    // Extract content from Gemini response
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text || "";

    // Extract usage metadata
    const usage: ModelUsage = {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    };

    return {
      content,
      usage,
      model,
      finishReason: candidate?.finishReason || "STOP",
    };
  }

  async chatStreaming(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    model: string,
    systemPrompt?: string,
    onChunk?: (text: string) => void,
    temperature = 0.7,
    maxTokens = 4096
  ): Promise<ModelResponse> {
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:streamGenerateContent`;

    const contents = this.formatMessages(messages, systemPrompt);

    const authClient = await this.auth.getClient();
    const accessToken = await authClient.getAccessToken();

    if (!accessToken.token) {
      throw new Error("Failed to obtain Google Cloud access token");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error: ${response.status} ${errorText}`);
    }

    let fullContent = "";
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let finishReason = "STOP";

    // Parse SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is null");
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          // Skip empty lines and event type lines
          if (!line || line.startsWith("data: ")) {
            const jsonStr = line.replace(/^data: /, "").trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);
              const candidate = data.candidates?.[0];
              const text = candidate?.content?.parts?.[0]?.text || "";

              if (text) {
                fullContent += text;
                onChunk?.(text);
              }

              // Update usage if available
              if (data.usageMetadata) {
                totalPromptTokens = data.usageMetadata.promptTokenCount || 0;
                totalCompletionTokens = data.usageMetadata.candidatesTokenCount || 0;
                totalTokens = data.usageMetadata.totalTokenCount || 0;
              }

              if (candidate?.finishReason) {
                finishReason = candidate.finishReason;
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const usage: ModelUsage = {
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens,
    };

    return {
      content: fullContent,
      usage,
      model,
      finishReason,
    };
  }

  private formatMessages(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string
  ) {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add system prompt as first user message if provided
    if (systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: `System: ${systemPrompt}\n\nPlease follow the system instructions above.` }],
      });
    }

    // Convert messages to Gemini format
    for (const msg of messages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    return contents;
  }
}
