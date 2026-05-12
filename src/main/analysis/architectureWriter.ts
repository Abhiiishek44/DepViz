import fs from "node:fs/promises";
import path from "node:path";
import type { ArchitectureJSON } from "./architectureExtractor";

export type WriteArchitectureOptions = {
  outputDir?: string;
  fileName?: string;
  logger?: Pick<Console, "info" | "error" | "log">;
};

export const writeArchitectureJson = async (
  architecture: ArchitectureJSON,
  options: WriteArchitectureOptions = {}
): Promise<string> => {
  const outputDir = options.outputDir ?? process.cwd();
  const fileName = options.fileName ?? "architecture.json";
  const logger = options.logger ?? console;

  const outputPath = path.resolve(outputDir, fileName);
  const outputFolder = path.dirname(outputPath);

  try {
    await fs.mkdir(outputFolder, { recursive: true });
    await fs.access(outputFolder);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[ArchitectureExtractor] Output directory is not accessible: ${outputFolder}`);
    throw new Error(`Output directory is not accessible: ${outputFolder}. ${message}`);
  }

  try {
    const payload = JSON.stringify(architecture, null, 2);
    await fs.writeFile(outputPath, payload, "utf-8");
    logger.log(`[ArchitectureExtractor] Wrote architecture JSON to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[ArchitectureExtractor] Failed to write architecture JSON: ${message}`);
    throw new Error(`Failed to write architecture JSON to ${outputPath}: ${message}`);
  }
};
