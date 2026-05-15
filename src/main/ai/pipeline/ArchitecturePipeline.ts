import { GeminiProvider } from './GeminiProvider';
import { PromptBuilder } from './PromptBuilder';
import { ResponseFormatter } from './ResponseFormatter';
import { GraphTransformer } from './GraphTransformer';
import { ArchitectureJSON, ReactFlowGraph } from './types';
import { ArchitectureJSONSchema } from './schemas';
import { ValidationError, AppError } from './errors';
import { IAIProvider } from './AIProvider.interface';

export class ArchitecturePipeline {
  private provider: IAIProvider;
  private promptBuilder: PromptBuilder;
  private formatter: ResponseFormatter;
  private transformer: GraphTransformer;

  constructor(apiKey: string) {
    this.provider = new GeminiProvider(apiKey);
    this.promptBuilder = new PromptBuilder();
    this.formatter = new ResponseFormatter();
    this.transformer = new GraphTransformer();
  }

  /**
   * Executes the full AI architecture generation pipeline.
   */
  async run(input: unknown): Promise<ReactFlowGraph> {
    try {
      console.log('[ArchitecturePipeline] Starting generation...');
      
      // 1. Validate Input
      const validatedInput = this.validateInput(input);

      // 2. Build Prompt
      const systemPrompt = this.promptBuilder.getSystemPrompt();
      const userPrompt = this.promptBuilder.build(validatedInput);

      // 3. Call AI
      const rawResponse = await this.provider.generateCompletion(systemPrompt, userPrompt);

      // 4. Format & Validate Output
      const formattedOutput = this.formatter.format(rawResponse);

      // 5. Transform to React Flow
      const graph = this.transformer.transform(formattedOutput);
      
      console.log('[ArchitecturePipeline] Generation successful');
      return graph;
    } catch (error: unknown) {
      console.error('[ArchitecturePipeline] pipeline execution failed:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('PIPELINE_ERROR', 'An unexpected error occurred in the ArchitecturePipeline', error);
    }
  }

  private validateInput(input: unknown): ArchitectureJSON {
    const result = ArchitectureJSONSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError('Invalid input architecture JSON', result.error.format());
    }
    return result.data as ArchitectureJSON;
  }
}

