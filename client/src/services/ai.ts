import { apiRequest } from "../lib/queryClient";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ApiKey {
  id: string;
  provider: string;
  keyHint: string;
  isActive: boolean;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  models: string[];
}

/**
 * AI Service - Frontend client for BYOK AI API
 * Handles API key management and chat requests
 */
export const aiService = {
  /**
   * Get list of supported AI providers
   */
  async getProviders(): Promise<Provider[]> {
    const res = await apiRequest("GET", "/api/ai/providers");
    return res.json();
  },

  /**
   * Get user's stored API keys (returns hints only)
   */
  async getApiKeys(): Promise<ApiKey[]> {
    const res = await apiRequest("GET", "/api/ai/keys");
    return res.json();
  },

  /**
   * Save a new API key (encrypted server-side)
   */
  async saveApiKey(provider: string, apiKey: string): Promise<ApiKey> {
    const res = await apiRequest("POST", "/api/ai/keys", {
      provider,
      apiKey,
    });
    return res.json();
  },

  /**
   * Delete an API key
   */
  async deleteApiKey(keyId: string): Promise<void> {
    await apiRequest("DELETE", `/api/ai/keys/${keyId}`);
  },

  /**
   * Toggle key active status
   */
  async toggleKeyStatus(keyId: string, isActive: boolean): Promise<ApiKey> {
    const res = await apiRequest("POST", `/api/ai/keys/${keyId}/toggle`, {
      isActive,
    });
    return res.json();
  },

  /**
   * Test an API key without storing it
   */
  async testApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; message?: string }> {
    const res = await apiRequest("POST", "/api/ai/keys/test", {
      provider,
      apiKey,
    });
    return res.json();
  },

  /**
   * Send a chat completion request (non-streaming)
   */
  async chat(params: {
    provider: string;
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<any> {
    const res = await apiRequest("POST", "/api/ai/chat", {
      ...params,
      stream: false,
    });
    return res.json();
  },

  /**
   * Send a streaming chat completion request
   * Returns an async generator that yields content chunks
   */
  async* streamChat(params: {
    provider: string;
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
  }): AsyncGenerator<string, void, unknown> {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        stream: true,
      }),
    });

    if (!res.body) {
      throw new Error("No response body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  },
};
