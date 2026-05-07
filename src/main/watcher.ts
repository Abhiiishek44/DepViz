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

  private pendingUpdateTimeout: NodeJS.Timeout | null = null;
  private lastGraphSnapshot: ReturnType<IRBuilder['getRawGraph']> | null = null;

  private handleFileChange(filePath: string, type: "add" | "change" | "unlink") {
    console.log(`[Watcher] File ${type}: ${filePath}`);
    
    // Store snapshot before mutation if we don't have one
    if (!this.lastGraphSnapshot) {
      this.lastGraphSnapshot = {
        functions: new Map(this.builder.getRawGraph().functions),
        files: new Map(this.builder.getRawGraph().files)
      };
    }
    
    // Let ts-morph know
    if (type === "unlink") {
      this.analyzer.removeFile(filePath);
      this.builder.removeFile(filePath);
    } else {
      this.analyzer.addOrUpdateFile(filePath);
      this.builder.updateFile(filePath, this.analyzer);
    }

    if (this.pendingUpdateTimeout) {
      clearTimeout(this.pendingUpdateTimeout);
    }

    this.pendingUpdateTimeout = setTimeout(async () => {
      // Calculate diff dynamically and emit
      if (this.lastGraphSnapshot) {
        // dynamic import to avoid circular dependency
        const { computeGraphPatch } = await import("./patchManager");
        const patch = computeGraphPatch(this.lastGraphSnapshot, this.builder.getRawGraph());
        
        // Ping renderer with the PATCH
        this.onGraphUpdated({
          type: 'PATCH',
          timestamp: Date.now(),
          patch
        });
      }

      this.pendingUpdateTimeout = null;
      this.lastGraphSnapshot = null; // Clear snapshot to start fresh for next batch
    }, 300);
  }

  public stop() {
    if (this.pendingUpdateTimeout) clearTimeout(this.pendingUpdateTimeout);
    this.watcher?.close();
  }
}
