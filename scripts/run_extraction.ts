import * as path from 'path';
import * as fs from 'fs';
import { CodeAnalyzer } from '../src/main/analysis/codeAnalyzer';
import { IRBuilder } from '../src/main/analysis/irBuilder';
import { ArchitectureExtractor } from '../src/main/analysis/architectureExtractor';

async function run() {
  const projectPath = path.resolve('/home/abhishek/voxora/apps');
  console.log(`Analyzing project at: ${projectPath}`);

  const analyzer = new CodeAnalyzer();
  analyzer.loadProject(projectPath);

  const builder = new IRBuilder();
  const graph = builder.buildIR(analyzer);

  const extractor = new ArchitectureExtractor(graph, projectPath);
  const archJson = extractor.extract();

  const outputPath = path.resolve(projectPath, 'architecture.json');
  fs.writeFileSync(outputPath, JSON.stringify(archJson, null, 2));

  console.log(`Architecture JSON written to: ${outputPath}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
