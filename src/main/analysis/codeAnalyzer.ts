import { Project, SourceFile } from "ts-morph";

export class CodeAnalyzer {
  private project: Project;

  constructor() {
    this.project = new Project();
  }

  public loadProject(folderPath: string) {
    this.project.addSourceFilesAtPaths([
      `${folderPath}/**/*.{ts,js,tsx,jsx}`,
      `!${folderPath}/node_modules/**/*`,
      `!${folderPath}/dist/**/*`,
      `!${folderPath}/.git/**/*`
    ]);
    console.log(`[Analyzer] Loaded ${this.project.getSourceFiles().length} files from ${folderPath}`);
  }

  public addOrUpdateFile(filePath: string) {
    this.project.addSourceFileAtPath(filePath);
  }

  public removeFile(filePath: string) {
    const file = this.project.getSourceFile(filePath);
    if (file) {
      this.project.removeSourceFile(file);
    }
  }

  public getFiles(): SourceFile[] {
    return this.project.getSourceFiles();
  }

  public extractFunctions(file: SourceFile) {
    const functions = [];

    for (const fn of file.getFunctions()) {
      if (fn.getName()) {
        functions.push(fn);
      }
    }

    for (const cls of file.getClasses()) {
      for (const method of cls.getMethods()) {
        if (method.getName()) {
          functions.push(method);
        }
      }
    }

    for (const varDecl of file.getVariableDeclarations()) {
      const init = varDecl.getInitializer();
      if (
        init &&
        (init.getKindName() === "ArrowFunction" || init.getKindName() === "FunctionExpression")
      ) {
        functions.push(varDecl);
      }
    }

    return functions;
  }

  public extractImports(file: SourceFile) {
    return file.getImportDeclarations();
  }
}
