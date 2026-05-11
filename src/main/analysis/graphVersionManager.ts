import { EdgeDelta, EdgeMetadata, GraphPatch, GraphSnapshot, NodeDelta, NodeMetadata } from "../../shared/protocol";
import { HashState, createHashState } from "./graphHasher";

export type PatchOptions = {
  batchId?: string;
  transactionId?: string;
  timestamp?: number;
};

export class GraphVersionManager {
  private version = 0;
  private hashState: HashState = createHashState();
  private transactionCounter = 0;
  private batchCounter = 0;

  public getVersion() {
    return this.version;
  }

  public getHashState(): HashState {
    return this.hashState;
  }

  public updateHashes(next: HashState) {
    this.hashState = next;
  }

  public nextVersion() {
    this.version += 1;
    return this.version;
  }

  public reset() {
    this.version = 0;
    this.hashState = createHashState();
    this.transactionCounter = 0;
    this.batchCounter = 0;
  }

  public createSnapshot(
    nodes: NodeMetadata[],
    edges: EdgeMetadata[],
    options: PatchOptions = {}
  ): GraphSnapshot {
    const version = this.nextVersion();

    return {
      kind: "SNAPSHOT",
      version,
      timestamp: options.timestamp ?? Date.now(),
      batchId: options.batchId,
      transactionId: options.transactionId,
      nodes,
      edges
    };
  }

  public createPatch(
    baseVersion: number,
    nodes: NodeDelta,
    edges: EdgeDelta,
    options: PatchOptions = {}
  ): GraphPatch {
    const version = this.nextVersion();

    return {
      kind: "PATCH",
      baseVersion,
      version,
      timestamp: options.timestamp ?? Date.now(),
      batchId: options.batchId,
      transactionId: options.transactionId,
      nodes,
      edges
    };
  }

  public createTransactionId(prefix = "tx") {
    this.transactionCounter += 1;
    return `${prefix}-${Date.now()}-${this.transactionCounter}`;
  }

  public createBatchId(prefix = "batch") {
    this.batchCounter += 1;
    return `${prefix}-${Date.now()}-${this.batchCounter}`;
  }
}
