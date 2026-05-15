import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IAIProvider } from './AIProvider.interface';
import { AIProviderError } from './errors';

export class GeminiProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new AIProviderError('Gemini API Key is missing');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-2.5-flash for fast architectural reasoning
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateCompletion(system: string, user: string): Promise<string> {
    let lastError: Error | undefined;

    // retry logic: 1 retry (total 2 attempts)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const fullPrompt = `${system}\n\nINPUT:\n${user}`;
        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        if (!text) {
          throw new AIProviderError('Empty response from Gemini');
        }

        return text;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Gemini Attempt ${attempt} failed:`, lastError.message);

        // TODO: add exponential backoff if needed
        if (attempt === 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new AIProviderError('Gemini failed after retries', lastError);
  }
}
