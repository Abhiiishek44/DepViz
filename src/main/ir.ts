import { SourceFile, Node, SyntaxKind, ts } from "ts-morph";
import { CodeAnalyzer } from "./analyzer";

export type FunctionNode = {
  id: string;            // filePath::functionName
  name: string;
  file: string;
  params: string[];
  calls: string[];       // function IDs
};

export type FileNode = {
  id: string;
  path: string;
  functions: string[];   // function IDs
  imports: string[];     // file IDs
};

export type CodeGraph = {
  functions: Map<string, FunctionNode>;
  files: Map<string, FileNode>;
};

export class IRBuilder {
  private graph: CodeGraph = {
    functions: new Map(),
    files: new Map()
  };

  /**
   * Convert ts-morph files into our IR and return the graph
   */
  public buildIR(analyzer: CodeAnalyzer): CodeGraph {
    this.graph.functions.clear();
    this.graph.files.clear();

    const files = analyzer.getFiles();

    for (const file of files) {
      this.processFile(file, analyzer);
    }

    // Secondary pass to resolve function calls using definitions
    this.resolveCalls();

    return this.graph;
  }

  /**
   * Return the raw internal graph data directly
   */
  public getRawGraph(): CodeGraph {
    return this.graph;
  }

  /**
   * Delete a file and its nodes from the graph
   */
  public removeFile(filePath: string) {
    const fileNode = this.graph.files.get(filePath);
    if (!fileNode) return;

    // Remove all associated functions
    for (const fnId of fileNode.functions) {
      this.graph.functions.delete(fnId);
    }
    
    // Remove the file itself
    this.graph.files.delete(filePath);
  }

  /**
   * Incrementally update or add a file
   */
  public updateFile(filePath: string, analyzer: CodeAnalyzer) {
    this.removeFile(filePath);
    
    const file = analyzer.getFiles().find(f => f.getFilePath() === filePath);
    if (file) {
      this.processFile(file, analyzer);
      this.resolveCalls(); // Re-run resolve calls globally
    }
  }

  private processFile(file: SourceFile, analyzer: CodeAnalyzer) {
    const filePath = file.getFilePath();
    
    // Create base file node
    const fileNode: FileNode = {
      id: filePath,
      path: filePath,
      functions: [],
      imports: []
    };

    // Process imports
    const imports = analyzer.extractImports(file);
    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      const sourceFile = imp.getModuleSpecifierSourceFile();
      if (sourceFile) {
        fileNode.imports.push(sourceFile.getFilePath());
      } else {
        // Fallback for external/unresolved
        fileNode.imports.push(moduleSpecifier);
      }
    }

    // Process functions
    const rawFunctions = analyzer.extractFunctions(file);
    for (const rawFn of rawFunctions) {
      let name = "";
      if (Node.isVariableDeclaration(rawFn)) {
        name = rawFn.getName();
      } else {
        name = rawFn.getName() || "anonymous";
      }

      const fnId = `${filePath}::${name}`;
      fileNode.functions.push(fnId);

      let params: string[] = [];
      if ("getParameters" in rawFn) {
        params = rawFn.getParameters().map(p => p.getName());
      } else if (Node.isVariableDeclaration(rawFn)) {
        const init = rawFn.getInitializer();
        if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
           params = init.getParameters().map(p => p.getName());
        }
      }
      
      const fnNode: FunctionNode = {
        id: fnId,
        name,
        file: filePath,
        params,
        calls: []
      };

      // Extract accurate calls utilizing the TypeChecker
      const callsSet = new Set<string>();

      rawFn.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
        try {
          const expression = callExpr.getExpression();
          
          let symbol = expression.getSymbol();
          if (!symbol) {
             const type = expression.getType();
             symbol = type.getSymbol() || type.getAliasSymbol();
          }

          if (symbol) {
            // Resolve actual originating symbol if it's an alias/import
            if (symbol.getFlags() & ts.SymbolFlags.Alias) {
              const tc = callExpr.getProject().getTypeChecker();
              symbol = tc.getAliasedSymbol(symbol) || symbol;
            }

            const decls = symbol?.getDeclarations();
            if (decls && decls.length > 0) {
              const decl = decls[0];
              const targetFile = decl.getSourceFile().getFilePath();

              // Only map internal usages
              if (!targetFile.includes("node_modules")) {
                let targetName = "";
                
                if (Node.isFunctionDeclaration(decl) || Node.isMethodDeclaration(decl)) {
                  targetName = decl.getName() || "";
                } else if (Node.isVariableDeclaration(decl)) {
                  targetName = decl.getName();
                }

                if (targetName) {
                  callsSet.add(`${targetFile}::${targetName}`);
                }
              }
            }
          }
        } catch (err) {
          // Gracefully continue on partial parsing issues
        }
      });

      fnNode.calls = Array.from(callsSet);
      this.graph.functions.set(fnId, fnNode);
    }

    this.graph.files.set(filePath, fileNode);
  }

  /**
   * Second pass: Clean up edges so we only keep references to functions
   * that actually exist in our workspace graph (drops unknown/partial matches)
   */
  private resolveCalls() {
    for (const fn of this.graph.functions.values()) {
      const validCalls = new Set<string>();

      for (const callTargetId of fn.calls) {
        if (this.graph.functions.has(callTargetId)) {
          validCalls.add(callTargetId);
        }
      }

      fn.calls = Array.from(validCalls);
    }
  }
}
