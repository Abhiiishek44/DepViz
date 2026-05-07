import chokidar from "chokidar";
import { CodeAnalyzer } from "./analyzer";
import { IRBuilder } from "./ir";

export class CodeWatcher {
  private watcher: chokidar.FSWatcher | null = null;

  constructor(
    private analyzer: CodeAnalyzer,
    private builder: IRBuilder,
    private onGraphUpdated: (graph: any) => void
  ) {}

  public watch(folderPath: string) {
    if (this.watcher) {
      this.watcher.close();
    }

    console.log(`[Watcher] Starting watch on ${folderPath}/**/*.ts|js`);
    
    this.watcher = chokidar.watch(`${folderPath}/**/*.{ts,tsx,js,jsx}`, {
      ignored: /(node_modules|\.git|dist|build)/,
      persistent: true,
      ignoreInitial: true // we do an initial pass before watching
    });

    this.watcher
      .on("add", (path: string) => this.handleFileChange(path, "add"))
      .on("change", (path: string) => this.handleFileChange(path, "change"))
      .on("unlink", (path: string) => this.handleFileChange(path, "unlink"));
  }

  private handleFileChange(filePath: string, type: "add" | "change" | "unlink") {
    console.log(`[Watcher] File ${type}: ${filePath}`);
    
    // Let ts-morph know
    if (type === "unlink") {
      this.analyzer.removeFile(filePath);
      this.builder.removeFile(filePath);
    } else {
      this.analyzer.addOrUpdateFile(filePath);
      this.builder.updateFile(filePath, this.analyzer);
    }

    // Ping renderer with updated graph (Step 7 mechanism)
    this.onGraphUpdated({
      functions: Object.fromEntries(this.builder.getRawGraph().functions),
      files: Object.fromEntries(this.builder.getRawGraph().files)
    });
  }

  public stop() {
    this.watcher?.close();
  }
}
