import { AIOutputSchema, AIOutput } from './schemas';
import { ValidationError } from './errors';

export class ResponseFormatter {
  /**
   * Cleans the AI response (removes markdown backticks) and parses JSON.
   */
  format(rawResponse: string): AIOutput {
    try {
      // Remove markdown blocks if present
      const cleanJson = rawResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanJson);
      
      // Validate structure with Zod
      const validated = AIOutputSchema.safeParse(parsed);
      
      if (!validated.success) {
        console.error('AI Response Validation Failed:', JSON.stringify(validated.error.format(), null, 2));
        console.debug('Raw Response:', rawResponse);
        throw new ValidationError(
          'AI response failed validation',
          validated.error.format()
        );
      }

      return validated.data;
    } catch (error: unknown) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('Failed to parse AI response as JSON', error);
    }
  }
}
