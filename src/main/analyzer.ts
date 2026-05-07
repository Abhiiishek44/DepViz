import { Project, SourceFile } from "ts-morph";

export class CodeAnalyzer {
  private project: Project;

  constructor() {
    this.project = new Project();
  }

  /**
   * Load all .ts/.js files from a target directory (ignoring node_modules, dist, etc.)
   */
  public loadProject(folderPath: string) {
    this.project.addSourceFilesAtPaths([
      `${folderPath}/**/*.{ts,js,tsx,jsx}`,
      `!${folderPath}/node_modules/**/*`,
      `!${folderPath}/dist/**/*`,
      `!${folderPath}/.git/**/*`
    ]);
    console.log(`[Analyzer] Loaded ${this.project.getSourceFiles().length} files from ${folderPath}`);
  }

  /**
   * Add or update a single file
   */
  public addOrUpdateFile(filePath: string) {
    this.project.addSourceFileAtPath(filePath);
  }

  /**
   * Remove a file from the project instance
   */
  public removeFile(filePath: string) {
    const file = this.project.getSourceFile(filePath);
    if (file) {
      this.project.removeSourceFile(file);
    }
  }

  /**
   * Get all source files in the project
   */
  public getFiles(): SourceFile[] {
    return this.project.getSourceFiles();
  }

  /**
   * Extract basic info: function declarations, variable-bound arrow functions, and method declarations
   */
  public extractFunctions(file: SourceFile) {
    const functions = [];

    // Standard functions: function foo() {}
    for (const fn of file.getFunctions()) {
      if (fn.getName()) {
        functions.push(fn);
      }
    }

    // Classes & methods: class Foo { bar() {} }
    for (const cls of file.getClasses()) {
      for (const method of cls.getMethods()) {
        if (method.getName()) {
          functions.push(method);
        }
      }
    }

    // Arrow functions assigned to variables: const foo = () => {}
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

  /**
   * Extract module specifiers from import declarations
   */
  public extractImports(file: SourceFile) {
    return file.getImportDeclarations();
  }
}
