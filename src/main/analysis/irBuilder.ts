import { Node, SourceFile, SyntaxKind, ts } from "ts-morph";
import { CodeAnalyzer } from "./codeAnalyzer";
import { CodeGraph, FileNode, FunctionNode } from "./types";

export class IRBuilder {
  private graph: CodeGraph = {
    functions: new Map(),
    files: new Map()
  };

  public buildIR(analyzer: CodeAnalyzer): CodeGraph {
    this.graph.functions.clear();
    this.graph.files.clear();

    const files = analyzer.getFiles();

    for (const file of files) {
      this.processFile(file, analyzer);
    }

    this.resolveCalls();

    return this.graph;
  }

  public getRawGraph(): CodeGraph {
    return this.graph;
  }

  public removeFile(filePath: string) {
    const fileNode = this.graph.files.get(filePath);
    if (!fileNode) return;

    for (const fnId of fileNode.functions) {
      this.graph.functions.delete(fnId);
    }

    this.graph.files.delete(filePath);
  }

  public updateFile(filePath: string, analyzer: CodeAnalyzer) {
    this.removeFile(filePath);

    const file = analyzer.getFiles().find((sourceFile) => sourceFile.getFilePath() === filePath);
    if (file) {
      this.processFile(file, analyzer);
      this.resolveCalls();
    }
  }

  private processFile(file: SourceFile, analyzer: CodeAnalyzer) {
    const filePath = file.getFilePath();

    const fileNode: FileNode = {
      id: filePath,
      path: filePath,
      functions: [],
      imports: []
    };

    for (const imp of analyzer.extractImports(file)) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      const sourceFile = imp.getModuleSpecifierSourceFile();
      fileNode.imports.push(sourceFile ? sourceFile.getFilePath() : moduleSpecifier);
    }

    for (const rawFn of analyzer.extractFunctions(file)) {
      const name = Node.isVariableDeclaration(rawFn)
        ? rawFn.getName()
        : rawFn.getName() || "anonymous";

      const fnId = `${filePath}::${name}`;
      fileNode.functions.push(fnId);

      const fnNode: FunctionNode = {
        id: fnId,
        name,
        file: filePath,
        params: this.getFunctionParams(rawFn),
        calls: this.extractInternalCalls(rawFn)
      };

      this.graph.functions.set(fnId, fnNode);
    }

    this.graph.files.set(filePath, fileNode);
  }             

  private getFunctionParams(rawFn: ReturnType<CodeAnalyzer["extractFunctions"]>[number]) {
    if ("getParameters" in rawFn) {
      return rawFn.getParameters().map((param) => param.getName());
    }

    if (Node.isVariableDeclaration(rawFn)) {
      const init = rawFn.getInitializer();
      if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
        return init.getParameters().map((param) => param.getName());
      }
    }

    return [];
  }

  private extractInternalCalls(rawFn: ReturnType<CodeAnalyzer["extractFunctions"]>[number]) {
    const callsSet = new Set<string>();

    rawFn.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr) => {
      try {
        const expression = callExpr.getExpression();
        let symbol = expression.getSymbol();

        if (!symbol) {
          const type = expression.getType();
          symbol = type.getSymbol() || type.getAliasSymbol();
        }

        if (!symbol) return;

        if (symbol.getFlags() & ts.SymbolFlags.Alias) {
          const typeChecker = callExpr.getProject().getTypeChecker();
          symbol = typeChecker.getAliasedSymbol(symbol) || symbol;
        }

        const decl = symbol.getDeclarations()?.[0];
        if (!decl) return;

        const targetFile = decl.getSourceFile().getFilePath();
        if (targetFile.includes("node_modules")) return;

        const targetName = this.getTargetNameFromDeclaration(decl);
        if (targetName) {
          callsSet.add(`${targetFile}::${targetName}`);
        }
      } catch {
        // ts-morph can throw on incomplete files while the watcher is processing edits.
      }
    });

    return Array.from(callsSet);
  }

  private getTargetNameFromDeclaration(decl: Node) {
    if (Node.isFunctionDeclaration(decl) || Node.isMethodDeclaration(decl)) {
      return decl.getName() || "";
    }

    if (Node.isVariableDeclaration(decl)) {
      return decl.getName();
    }

    return "";
  }

  private resolveCalls() {
    for (const fn of this.graph.functions.values()) {
      fn.calls = fn.calls.filter((callTargetId) => this.graph.functions.has(callTargetId));
    }
  }
}
