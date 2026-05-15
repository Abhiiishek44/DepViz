export interface IAIProvider {
  /**
   * Generates a completion based on system and user prompts.
   * Implementation should handle retries and basic error wrapping.
   */
  generateCompletion(systemPrompt: string, userPrompt: string): Promise<string>;
}
