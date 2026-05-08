import chokidar from "chokidar";
import { CodeAnalyzer } from "../analysis/codeAnalyzer";
import { computeGraphPatch } from "../analysis/graphPatch";
import { IRBuilder } from "../analysis/irBuilder";
import { CodeGraph } from "../analysis/types";

export class CodeWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private pendingUpdateTimeout: NodeJS.Timeout | null = null;
  private lastGraphSnapshot: CodeGraph | null = null;

  constructor(
    private analyzer: CodeAnalyzer,
    private builder: IRBuilder,
    private onGraphUpdated: (graph: unknown) => void
  ) {}

  public watch(folderPath: string) {
    if (this.watcher) {
      this.watcher.close();
    }

    console.log(`[Watcher] Starting watch on ${folderPath}/**/*.ts|js`);

    this.watcher = chokidar.watch(`${folderPath}/**/*.{ts,tsx,js,jsx}`, {
      ignored: /(node_modules|\.git|dist|build)/,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on("add", (path: string) => this.handleFileChange(path, "add"))
      .on("change", (path: string) => this.handleFileChange(path, "change"))
      .on("unlink", (path: string) => this.handleFileChange(path, "unlink"));
  }

  public stop() {
    if (this.pendingUpdateTimeout) clearTimeout(this.pendingUpdateTimeout);
    this.watcher?.close();
  }

  private handleFileChange(filePath: string, type: "add" | "change" | "unlink") {
    console.log(`[Watcher] File ${type}: ${filePath}`);

    if (!this.lastGraphSnapshot) {
      this.lastGraphSnapshot = {
        functions: new Map(this.builder.getRawGraph().functions),
        files: new Map(this.builder.getRawGraph().files)
      };
    }

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

    this.pendingUpdateTimeout = setTimeout(() => this.flushPatch(), 300);
  }

  private flushPatch() {
    if (this.lastGraphSnapshot) {
      const patch = computeGraphPatch(this.lastGraphSnapshot, this.builder.getRawGraph());

      this.onGraphUpdated({
        type: "PATCH",
        timestamp: Date.now(),
        patch
      });
    }

    this.pendingUpdateTimeout = null;
    this.lastGraphSnapshot = null;
  }
}
