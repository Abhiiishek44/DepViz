import path from "node:path";
import { ArchitectureExtractor } from "../src/main/analysis/architectureExtractor";
import { CodeAnalyzer } from "../src/main/analysis/codeAnalyzer";
import { IRBuilder } from "../src/main/analysis/irBuilder";
import { writeArchitectureJson } from "../src/main/analysis/architectureWriter";

const run = async () => {
  const projectPath = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

  try {
    const analyzer = new CodeAnalyzer();
    const builder = new IRBuilder();

    analyzer.loadProject(projectPath);
    const graph = builder.buildIR(analyzer);

    if (graph.files.size === 0) {
      throw new Error("No source files found to analyze.");
    }

    const extractor = new ArchitectureExtractor(graph, projectPath);
    const architecture = extractor.extract();

    await writeArchitectureJson(architecture, { outputDir: process.cwd() });

    console.log(
      `[ArchitectureExtractor] Extraction complete. Files: ${graph.files.size}, Functions: ${graph.functions.size}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ArchitectureExtractor] Extraction failed: ${message}`);
    process.exitCode = 1;
  }
};

void run();
