import { CodeGraph, FileNode } from "./types";

// ════════════════════════════════════════════════════════════════════════════
//  TYPES — Output schema
// ════════════════════════════════════════════════════════════════════════════

export type ArchLayer = "API" | "CORE" | "DATA" | "AUTH" | "INFRASTRUCTURE" | "UI";
export type Importance = "high" | "medium";

export interface ArchitectureJSON {
  project: {
    name: string;
    type: string;
    framework: string[];
    entry: string;
  };
  layers: ArchLayer[];
  modules: ArchModule[];
  services: ArchService[];
  routes: ArchRoute[];
  database: { type: string; models: string[] };
  auth: { type: string };
  externalApis: ArchExternalApi[];
  flows: ArchFlow[];
  nodes: ArchNode[];
  edges: ArchEdge[];
}

export interface ArchModule {
  id: string;
  name: string;
  type: "module";
  layer: ArchLayer;
  description: string;
  importance: Importance;
}

export interface ArchService {
  id: string;
  name: string;
  layer: ArchLayer;
  responsibility: string;
  importance: Importance;
}

export interface ArchRoute {
  path: string;
  method: string;
  controller: string;
}

export interface ArchExternalApi {
  name: string;
  purpose: string;
}

export interface ArchFlow {
  from: string;
  to: string;
  type: string;
}

export interface ArchNode {
  id: string;
  name: string;
  type: "module" | "service" | "database" | "auth" | "externalApi";
  layer: ArchLayer;
  importance: Importance;
}

export interface ArchEdge {
  source: string;
  target: string;
  label: string;
}

// ════════════════════════════════════════════════════════════════════════════
//  DETECTION MAPS
// ════════════════════════════════════════════════════════════════════════════

const FRAMEWORK_MAP: Record<string, { type: string; label: string }> = {
  express:          { type: "backend",   label: "Express" },
  fastify:          { type: "backend",   label: "Fastify" },
  koa:              { type: "backend",   label: "Koa" },
  "@hapi/hapi":     { type: "backend",   label: "Hapi" },
  "@nestjs/core":   { type: "backend",   label: "NestJS" },
  "@nestjs/common": { type: "backend",   label: "NestJS" },
  react:            { type: "frontend",  label: "React" },
  "react-dom":      { type: "frontend",  label: "React" },
  "@angular/core":  { type: "frontend",  label: "Angular" },
  vue:              { type: "frontend",  label: "Vue" },
  svelte:           { type: "frontend",  label: "Svelte" },
  next:             { type: "fullstack", label: "Next.js" },
  "next/server":    { type: "fullstack", label: "Next.js" },
  nuxt:             { type: "fullstack", label: "Nuxt" },
  electron:         { type: "desktop",   label: "Electron" },
};

const DB_MAP: Record<string, string> = {
  mongoose:         "MongoDB",
  mongodb:          "MongoDB",
  typeorm:          "SQL (TypeORM)",
  "@prisma/client": "SQL (Prisma)",
  sequelize:        "SQL (Sequelize)",
  knex:             "SQL (Knex)",
  pg:               "PostgreSQL",
  mysql:            "MySQL",
  mysql2:           "MySQL",
  "better-sqlite3": "SQLite",
  sqlite3:          "SQLite",
  "neo4j-driver":   "Neo4j",
  redis:            "Redis",
  ioredis:          "Redis",
  "drizzle-orm":    "SQL (Drizzle)",
};

const AUTH_MAP: Record<string, string> = {
  passport:              "Passport.js",
  jsonwebtoken:          "JWT",
  "passport-jwt":        "JWT (Passport)",
  bcrypt:                "bcrypt",
  bcryptjs:              "bcrypt",
  "@auth0/auth0-react":  "Auth0",
  "next-auth":           "NextAuth",
  "firebase-admin":      "Firebase Auth",
  "@supabase/supabase-js": "Supabase Auth",
};

const HTTP_CLIENT_MAP: Record<string, string> = {
  axios:       "HTTP Client (Axios)",
  "node-fetch":"HTTP Client (node-fetch)",
  got:         "HTTP Client (Got)",
  superagent:  "HTTP Client (Superagent)",
  ky:          "HTTP Client (Ky)",
};

// ════════════════════════════════════════════════════════════════════════════
//  LAYER INFERENCE — keyword → layer mapping
// ════════════════════════════════════════════════════════════════════════════

type LayerRule = { keywords: string[]; layer: ArchLayer };

const LAYER_RULES: LayerRule[] = [
  // Order matters — first match wins; most specific first.
  { keywords: ["auth", "guard", "permission", "jwt", "passport", "session", "token", "oauth", "acl"], layer: "AUTH" },
  { keywords: ["route", "router", "controller", "handler", "endpoint", "api", "rest", "graphql", "resolver"], layer: "API" },
  { keywords: ["repository", "repo", "model", "schema", "entity", "migration", "seed", "dao", "database", "orm", "prisma", "typeorm"], layer: "DATA" },
  { keywords: ["queue", "worker", "scheduler", "cron", "job", "websocket", "gateway", "adapter", "socket", "event", "listener", "emitter", "mailer", "email", "notification", "logger", "cache", "redis", "messaging", "pubsub"], layer: "INFRASTRUCTURE" },
  { keywords: ["page", "component", "view", "screen", "layout", "widget", "hook", "store", "state", "context", "provider", "theme", "style", "ui", "render", "template"], layer: "UI" },
  { keywords: ["service", "manager", "processor", "engine", "analyzer", "builder", "factory", "strategy", "interactor", "usecase", "use-case", "domain", "core", "business", "logic"], layer: "CORE" },
];

// Folders that are noise and should be collapsed / excluded
const NOISE_DIRS = new Set([
  "node_modules", "dist", "build", ".git", "__tests__", "__test__",
  "test", "tests", "spec", "coverage", "__mocks__", "__fixtures__",
  ".next", ".nuxt", ".cache", ".turbo",
]);

const COLLAPSIBLE_DIRS = new Set([
  "util", "utils", "helper", "helpers", "lib", "common", "shared",
  "config", "configs", "constant", "constants", "type", "types",
  "interface", "interfaces", "dto", "dtos", "enum", "enums",
  "decorator", "decorators", "pipe", "pipes", "interceptor", "interceptors",
  "filter", "filters", "exception", "exceptions", "error", "errors",
  "asset", "assets", "public", "static",
]);

// ════════════════════════════════════════════════════════════════════════════
//  BUSINESS RESPONSIBILITY INFERENCE
// ════════════════════════════════════════════════════════════════════════════

type ResponsibilityRule = { pattern: RegExp; responsibility: string };

const RESPONSIBILITY_RULES: ResponsibilityRule[] = [
  { pattern: /user/i,           responsibility: "User management" },
  { pattern: /auth/i,           responsibility: "Authentication & authorization" },
  { pattern: /login|signin/i,   responsibility: "User authentication" },
  { pattern: /register|signup/i,responsibility: "User registration" },
  { pattern: /payment|billing|invoice|stripe|checkout/i, responsibility: "Payment processing" },
  { pattern: /order/i,          responsibility: "Order management" },
  { pattern: /product|catalog|inventory/i, responsibility: "Product catalog" },
  { pattern: /cart|basket/i,    responsibility: "Shopping cart" },
  { pattern: /notification|notify|alert/i, responsibility: "Notification delivery" },
  { pattern: /email|mail|mailer/i, responsibility: "Email service" },
  { pattern: /message|chat|conversation/i, responsibility: "Messaging" },
  { pattern: /file|upload|storage|media|image/i, responsibility: "File management" },
  { pattern: /search|index|elastic/i, responsibility: "Search engine" },
  { pattern: /report|analytics|dashboard|metric/i, responsibility: "Analytics & reporting" },
  { pattern: /log|audit|track/i,responsibility: "Logging & auditing" },
  { pattern: /cache|redis/i,    responsibility: "Caching layer" },
  { pattern: /queue|job|worker|task/i, responsibility: "Background job processing" },
  { pattern: /schedule|cron/i,  responsibility: "Task scheduling" },
  { pattern: /webhook/i,        responsibility: "Webhook handling" },
  { pattern: /socket|realtime|ws/i, responsibility: "Real-time communication" },
  { pattern: /setting|config|preference/i, responsibility: "Configuration management" },
  { pattern: /role|permission|access|acl|policy/i, responsibility: "Access control" },
  { pattern: /token|session|jwt/i, responsibility: "Token management" },
  { pattern: /database|db|migration|seed/i, responsibility: "Database management" },
  { pattern: /health|status|ping/i, responsibility: "Health checks" },
  { pattern: /validation|validator|sanitize/i, responsibility: "Input validation" },
  { pattern: /transform|convert|map|serialize/i, responsibility: "Data transformation" },
  { pattern: /repo|repository/i,responsibility: "Data access" },
  { pattern: /project/i,        responsibility: "Project management" },
  { pattern: /comment/i,        responsibility: "Comment management" },
  { pattern: /tag|label|category/i, responsibility: "Categorization" },
  { pattern: /team|group|org/i, responsibility: "Team management" },
  { pattern: /subscription|plan/i, responsibility: "Subscription management" },
  { pattern: /graph|network|dependency/i, responsibility: "Graph analysis" },
  { pattern: /code|source|ast|parse|analyz/i, responsibility: "Code analysis" },
  { pattern: /build|compile|bundle/i, responsibility: "Build pipeline" },
  { pattern: /deploy|release|publish/i, responsibility: "Deployment management" },
  { pattern: /test|spec/i,      responsibility: "Testing" },
  { pattern: /middleware/i,     responsibility: "Request pipeline" },
  { pattern: /gateway/i,        responsibility: "API gateway" },
  { pattern: /proxy|forward/i,  responsibility: "Request proxying" },
  { pattern: /app/i,            responsibility: "Application orchestration" },
];

function inferBusinessResponsibility(name: string): string {
  const cleaned = name
    .replace(/\.(service|controller|repository|provider|manager|handler|middleware|guard|resolver|gateway|adapter|client|worker)$/i, "")
    .replace(/[-_.]/g, " ")
    .trim();

  for (const rule of RESPONSIBILITY_RULES) {
    if (rule.pattern.test(cleaned)) return rule.responsibility;
  }

  // Fallback: humanize the name itself
  const humanized = cleaned
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return `${humanized} management`;
}

// ════════════════════════════════════════════════════════════════════════════
//  EXTRACTOR
// ════════════════════════════════════════════════════════════════════════════

export class ArchitectureExtractor {
  private externalImports = new Set<string>();
  /** filePath → inferred layer */
  private fileLayerCache = new Map<string, ArchLayer>();

  constructor(
    private graph: CodeGraph,
    private projectPath: string,
  ) {
    this.collectExternalImports();
    this.warmLayerCache();
  }

  // ─── Bootstrap ─────────────────────────────────────────

  private collectExternalImports() {
    for (const file of this.graph.files.values()) {
      for (const imp of file.imports) {
        if (!this.graph.files.has(imp) && !imp.startsWith(".") && !imp.startsWith("/")) {
          this.externalImports.add(imp);
        }
      }
    }
  }

  private warmLayerCache() {
    for (const filePath of this.graph.files.keys()) {
      this.fileLayerCache.set(filePath, this.inferLayer(filePath));
    }
  }

  // ═══════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════

  public extract(): ArchitectureJSON {
    const modules = this.buildModules();
    const services = this.buildServices();
    const database = this.buildDatabase();
    const auth = this.buildAuth();
    const externalApis = this.buildExternalApis();
    const routes = this.buildRoutes();
    const flows = this.buildFlows();
    const layers = this.computeActiveLayers(modules, services);
    const { nodes, edges } = this.buildGraph(modules, services, database, auth, externalApis, flows);

    return {
      project: this.buildProject(),
      layers,
      modules,
      services,
      routes,
      database,
      auth,
      externalApis,
      flows,
      nodes,
      edges,
    };
  }

  // ═══════════════════════════════════════════════════════
  //  1. LAYER INFERENCE
  // ═══════════════════════════════════════════════════════

  private inferLayer(filePath: string): ArchLayer {
    const rel = this.rel(filePath).toLowerCase();
    // Check every segment of the path + the base filename
    const segments = rel.split("/");
    const base = (segments.pop() || "").replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
    const all = [...segments, base];

    for (const rule of LAYER_RULES) {
      for (const segment of all) {
        if (rule.keywords.some((kw) => segment.includes(kw))) {
          return rule.layer;
        }
      }
    }

    return "CORE"; // default layer
  }

  // ═══════════════════════════════════════════════════════
  //  2. PROJECT METADATA
  // ═══════════════════════════════════════════════════════

  private buildProject() {
    const frameworks = this.detectFrameworks();
    return {
      name: this.projectPath.split(/[/\\]/).pop() || "unknown",
      type: this.inferProjectType(frameworks),
      framework: [...new Set(frameworks.map((f) => f.label))],
      entry: this.findEntryPoint(),
    };
  }

  private detectFrameworks() {
    const hits: Array<{ type: string; label: string }> = [];
    for (const [pkg, meta] of Object.entries(FRAMEWORK_MAP)) {
      if (this.hasImport(pkg)) hits.push(meta);
    }
    return hits;
  }

  private inferProjectType(frameworks: Array<{ type: string }>): string {
    const types = new Set(frameworks.map((f) => f.type));
    if (types.has("fullstack")) return "fullstack";
    if (types.has("desktop"))   return "desktop";
    if (types.has("backend") && types.has("frontend")) return "fullstack";
    if (types.has("backend"))   return "backend";
    if (types.has("frontend"))  return "frontend";
    return "library";
  }

  private findEntryPoint(): string {
    const candidates = [
      "index.ts", "index.js", "main.ts", "main.js",
      "app.ts", "app.js", "server.ts", "server.js",
      "src/index.ts", "src/main.ts", "src/app.ts", "src/server.ts",
    ];
    for (const fp of this.graph.files.keys()) {
      const rel = this.rel(fp);
      if (candidates.includes(rel)) return rel;
    }
    const first = this.graph.files.keys().next().value;
    return first ? this.rel(first) : "";
  }

  // ═══════════════════════════════════════════════════════
  //  3. SMART MODULE GROUPING  (target: 5–15 modules)
  // ═══════════════════════════════════════════════════════

  private buildModules(): ArchModule[] {
    // Pass 1 — group files by semantic directory
    const groups = new Map<string, string[]>();

    for (const filePath of this.graph.files.keys()) {
      const rel = this.rel(filePath);
      const dir = this.semanticDir(rel);

      if (NOISE_DIRS.has(dir)) continue;

      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir)!.push(filePath);
    }

    // Pass 2 — collapse tiny / noise folders into "Shared" bucket
    const MIN_MODULE_SIZE = 2;
    const collapsed: string[] = [];
    const significant = new Map<string, string[]>();

    for (const [dir, files] of groups) {
      const isCollapsible = COLLAPSIBLE_DIRS.has(dir.toLowerCase());
      if (isCollapsible || files.length < MIN_MODULE_SIZE) {
        collapsed.push(...files);
      } else {
        significant.set(dir, files);
      }
    }

    if (collapsed.length > 0) {
      significant.set("shared", collapsed);
    }

    // Pass 3 — build module descriptors
    return Array.from(significant.entries()).map(([dir, files]) => {
      const layer = this.dominantLayer(files);
      return {
        id: dir,
        name: this.prettify(dir),
        type: "module" as const,
        layer,
        description: this.describeModule(dir, layer),
        importance: this.moduleImportance(dir, layer, files.length),
      };
    });
  }

  /** Find the 1st or 2nd-level meaningful directory segment. */
  private semanticDir(relPath: string): string {
    const parts = relPath.split("/");
    let idx = 0;
    // skip "src" prefix
    if (parts[0] === "src") idx = 1;
    // if only one segment left, it's root-level
    if (parts.length <= idx + 1) return "root";

    const candidate = parts[idx] || "root";
    // If the first segment is generic ("main", "app"), try one deeper
    const generic = new Set(["main", "app", "src", "lib", "core"]);
    if (generic.has(candidate.toLowerCase()) && parts.length > idx + 2) {
      return parts[idx + 1] || candidate;
    }
    return candidate;
  }

  /** The most common layer among a set of files. */
  private dominantLayer(files: string[]): ArchLayer {
    const counts = new Map<ArchLayer, number>();
    for (const fp of files) {
      const layer = this.fileLayerCache.get(fp) || "CORE";
      counts.set(layer, (counts.get(layer) || 0) + 1);
    }
    let best: ArchLayer = "CORE";
    let max = 0;
    for (const [layer, count] of counts) {
      if (count > max) { best = layer; max = count; }
    }
    return best;
  }

  private describeModule(dir: string, layer: ArchLayer): string {
    const d = dir.toLowerCase();
    const layerDescriptions: Record<ArchLayer, string> = {
      API:            "Request handling and routing",
      CORE:           "Core business logic",
      DATA:           "Data persistence and access",
      AUTH:           "Authentication and authorization",
      INFRASTRUCTURE: "Infrastructure and integrations",
      UI:             "User interface",
    };
    const specificDescriptions: Record<string, string> = {
      route: "API route definitions", router: "API route definitions", routes: "API routes",
      controller: "Request orchestration", controllers: "Request orchestration",
      service: "Business logic services", services: "Business logic services",
      model: "Data models", models: "Data models", schema: "Data schemas", schemas: "Data schemas",
      entity: "Database entities", entities: "Database entities",
      middleware: "Request pipeline", middlewares: "Request pipeline",
      guard: "Access control guards", guards: "Access control guards",
      auth: "Authentication & authorization",
      repository: "Data access layer", repositories: "Data access layer",
      component: "UI components", components: "UI components",
      page: "Application pages", pages: "Application pages",
      view: "Application views", views: "Application views",
      hook: "UI hooks", hooks: "UI hooks",
      store: "State management", stores: "State management",
      shared: "Shared utilities and configuration",
      root: "Application entry",
      analysis: "Code analysis engine",
      persistence: "Data persistence",
      watch: "File system watcher",
      ipc: "Inter-process communication",
      renderer: "Renderer process",
      preload: "Preload bridge",
      features: "Feature modules",
    };

    return specificDescriptions[d] || layerDescriptions[layer];
  }

  private moduleImportance(dir: string, layer: ArchLayer, fileCount: number): Importance {
    const highLayers: ArchLayer[] = ["API", "CORE", "DATA", "AUTH"];
    const d = dir.toLowerCase();
    if (highLayers.includes(layer)) return "high";
    if (d === "shared" || d === "root") return "medium";
    if (fileCount >= 5) return "high";
    return "medium";
  }

  // ═══════════════════════════════════════════════════════
  //  4. SERVICES — business-oriented
  // ═══════════════════════════════════════════════════════

  private buildServices(): ArchService[] {
    const seen = new Set<string>();
    const services: ArchService[] = [];

    const serviceKeywords = [
      "service", "controller", "repository", "provider", "manager",
      "handler", "middleware", "guard", "interceptor", "resolver",
      "gateway", "adapter", "worker", "scheduler", "engine", "processor",
      "analyzer", "builder", "factory",
    ];

    for (const filePath of this.graph.files.keys()) {
      const base = this.baseName(filePath);
      const lower = base.toLowerCase();

      if (seen.has(lower)) continue;
      if (!serviceKeywords.some((kw) => lower.includes(kw))) continue;

      seen.add(lower);
      const layer = this.fileLayerCache.get(filePath) || "CORE";

      services.push({
        id: base,
        name: this.prettify(base),
        layer,
        responsibility: inferBusinessResponsibility(base),
        importance: this.serviceImportance(layer, lower),
      });
    }

    return services;
  }

  private serviceImportance(layer: ArchLayer, name: string): Importance {
    if (layer === "AUTH" || layer === "API") return "high";
    if (name.includes("controller") || name.includes("service")) return "high";
    if (name.includes("repository") || name.includes("gateway")) return "high";
    return "medium";
  }

  // ═══════════════════════════════════════════════════════
  //  5. ROUTES — framework-aware detection
  // ═══════════════════════════════════════════════════════

  private buildRoutes(): ArchRoute[] {
    const routes: ArchRoute[] = [];
    const seen = new Set<string>();

    for (const fn of this.graph.functions.values()) {
      const fnLower = fn.name.toLowerCase();
      const fileLower = this.baseName(fn.file).toLowerCase();
      const fileLayer = this.fileLayerCache.get(fn.file);

      // Strategy 1 — naming convention in route/controller files
      if (fileLayer === "API" || this.isRouteFile(fileLower)) {
        const methodMatch = fnLower.match(/^(get|post|put|patch|delete|handle|create|update|remove|list|find)/);
        if (methodMatch) {
          const raw = methodMatch[1];
          const method = this.normalizeHttpMethod(raw);
          const resource = this.extractResourceName(fn.name, raw);
          const key = `${method}:${resource}`;
          if (seen.has(key)) continue;
          seen.add(key);
          routes.push({ path: `/${resource}`, method, controller: this.prettify(this.baseName(fn.file)) });
        }
      }

      // Strategy 2 — Express-style: router.get / app.post etc.
      for (const callTarget of fn.calls) {
        const callName = this.graph.functions.get(callTarget)?.name || "";
        const routerMatch = callName.match(/^(get|post|put|patch|delete|all|use)$/i);
        if (routerMatch) {
          const method = routerMatch[1].toUpperCase();
          const key = `${method}:${fn.name}`;
          if (seen.has(key)) continue;
          seen.add(key);
          routes.push({ path: `/${fnLower}`, method, controller: this.prettify(this.baseName(fn.file)) });
        }
      }
    }

    // Strategy 3 — Next.js / file-system routing (route.ts, page.tsx)
    for (const filePath of this.graph.files.keys()) {
      const rel = this.rel(filePath);
      const base = this.baseName(filePath).toLowerCase();
      if (base === "route" || base === "page") {
        const pathSegments = rel.split("/").filter((s) => s !== "src" && s !== "app" && !s.startsWith("("));
        pathSegments.pop(); // remove filename
        const routePath = "/" + pathSegments.join("/") || "/";
        const key = `FSR:${routePath}`;
        if (!seen.has(key)) {
          seen.add(key);
          routes.push({ path: routePath, method: base === "route" ? "ALL" : "GET", controller: rel });
        }
      }
    }

    return routes;
  }

  private isRouteFile(name: string): boolean {
    const kw = ["route", "router", "controller", "handler", "endpoint", "api"];
    return kw.some((k) => name.includes(k));
  }

  private normalizeHttpMethod(raw: string): string {
    const map: Record<string, string> = {
      get: "GET", find: "GET", list: "GET",
      post: "POST", create: "POST",
      put: "PUT", update: "PUT",
      patch: "PATCH",
      delete: "DELETE", remove: "DELETE",
      handle: "ALL",
    };
    return map[raw.toLowerCase()] || "ALL";
  }

  private extractResourceName(fnName: string, matchedPrefix: string): string {
    const stripped = fnName.slice(matchedPrefix.length);
    return stripped
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, "")
      .replace(/-+/g, "-") || fnName.toLowerCase();
  }

  // ═══════════════════════════════════════════════════════
  //  6. DATABASE
  // ═══════════════════════════════════════════════════════

  private buildDatabase() {
    let dbType = "none";
    const models: string[] = [];

    for (const imp of this.externalImports) {
      const pkg = this.packageName(imp);
      if (DB_MAP[pkg]) { dbType = DB_MAP[pkg]; break; }
    }

    for (const filePath of this.graph.files.keys()) {
      const lower = this.rel(filePath).toLowerCase();
      const base = this.baseName(filePath);
      if (
        lower.includes("model") || lower.includes("schema") ||
        lower.includes("entity") || lower.includes("migration")
      ) {
        const name = this.prettify(base
          .replace(/\.(model|schema|entity|migration)$/i, "")
        );
        if (!models.includes(name)) models.push(name);
      }
    }

    return { type: dbType, models };
  }

  // ═══════════════════════════════════════════════════════
  //  7. AUTH
  // ═══════════════════════════════════════════════════════

  private buildAuth() {
    for (const imp of this.externalImports) {
      const pkg = this.packageName(imp);
      if (AUTH_MAP[pkg]) return { type: AUTH_MAP[pkg] };
    }
    for (const fp of this.graph.files.keys()) {
      if (fp.toLowerCase().includes("auth")) return { type: "custom" };
    }
    return { type: "none" };
  }

  // ═══════════════════════════════════════════════════════
  //  8. EXTERNAL APIs
  // ═══════════════════════════════════════════════════════

  private buildExternalApis(): ArchExternalApi[] {
    const apis: ArchExternalApi[] = [];
    const seen = new Set<string>();

    for (const imp of this.externalImports) {
      const pkg = this.packageName(imp);
      if (seen.has(pkg)) continue;
      seen.add(pkg);

      if (HTTP_CLIENT_MAP[pkg]) {
        apis.push({ name: pkg, purpose: HTTP_CLIENT_MAP[pkg] });
      } else if (/sdk|api|client/i.test(pkg)) {
        apis.push({ name: pkg, purpose: "External API integration" });
      }
    }

    return apis;
  }

  // ═══════════════════════════════════════════════════════
  //  9. FLOWS — cross-layer only, deduplicated, abstracted
  // ═══════════════════════════════════════════════════════

  private buildFlows(): ArchFlow[] {
    const flowSet = new Set<string>();
    const flows: ArchFlow[] = [];

    const addFlow = (fromLayer: ArchLayer, toLayer: ArchLayer, type: string) => {
      if (fromLayer === toLayer) return; // same-layer → skip
      const key = `${fromLayer}→${toLayer}`;
      if (flowSet.has(key)) return;
      flowSet.add(key);
      flows.push({ from: fromLayer, to: toLayer, type });
    };

    // Import-based cross-layer flows
    for (const file of this.graph.files.values()) {
      const fromLayer = this.fileLayerCache.get(file.id);
      if (!fromLayer) continue;

      for (const imp of file.imports) {
        if (!this.graph.files.has(imp)) continue;
        const toLayer = this.fileLayerCache.get(imp);
        if (!toLayer) continue;
        addFlow(fromLayer, toLayer, "depends");
      }
    }

    // Call-based cross-layer flows
    for (const fn of this.graph.functions.values()) {
      const fromLayer = this.fileLayerCache.get(fn.file);
      if (!fromLayer) continue;

      for (const callTarget of fn.calls) {
        const target = this.graph.functions.get(callTarget);
        if (!target) continue;
        const toLayer = this.fileLayerCache.get(target.file);
        if (!toLayer) continue;
        addFlow(fromLayer, toLayer, "calls");
      }
    }

    // Add external API / database flows
    const activeLayers = new Set(this.fileLayerCache.values());
    if (this.buildDatabase().type !== "none" && activeLayers.has("DATA")) {
      addFlow("DATA", "INFRASTRUCTURE" as ArchLayer, "persists");
    }
    if (this.buildExternalApis().length > 0) {
      const integration = activeLayers.has("INFRASTRUCTURE") ? "INFRASTRUCTURE" : "CORE";
      addFlow(integration as ArchLayer, "INFRASTRUCTURE" as ArchLayer, "external");
    }

    return flows;
  }

  // ═══════════════════════════════════════════════════════
  //  10. VISUALIZATION GRAPH — nodes + edges
  // ═══════════════════════════════════════════════════════

  private buildGraph(
    modules: ArchModule[],
    services: ArchService[],
    database: { type: string; models: string[] },
    auth: { type: string },
    externalApis: ArchExternalApi[],
    flows: ArchFlow[],
  ): { nodes: ArchNode[]; edges: ArchEdge[] } {
    const nodes: ArchNode[] = [];

    // Module nodes (only high + medium importance — LOW excluded by design since we don't emit LOW)
    for (const mod of modules) {
      nodes.push({
        id: `mod:${mod.id}`,
        name: mod.name,
        type: "module",
        layer: mod.layer,
        importance: mod.importance,
      });
    }

    // Service nodes — only high importance (avoid clutter)
    for (const svc of services) {
      if (svc.importance !== "high") continue;
      nodes.push({
        id: `svc:${svc.id}`,
        name: svc.name,
        type: "service",
        layer: svc.layer,
        importance: svc.importance,
      });
    }

    // Database node
    if (database.type !== "none") {
      nodes.push({
        id: "db",
        name: database.type,
        type: "database",
        layer: "DATA",
        importance: "high",
      });
    }

    // Auth node
    if (auth.type !== "none") {
      nodes.push({
        id: "auth",
        name: auth.type,
        type: "auth",
        layer: "AUTH",
        importance: "high",
      });
    }

    // External API nodes
    for (const api of externalApis) {
      nodes.push({
        id: `ext:${api.name}`,
        name: api.name,
        type: "externalApi",
        layer: "INFRASTRUCTURE",
        importance: "high",
      });
    }

    // Edges — derived from flows (layer → layer)
    const edges: ArchEdge[] = flows.map((f) => ({
      source: f.from,
      target: f.to,
      label: f.type,
    }));

    return { nodes, edges };
  }

  // ═══════════════════════════════════════════════════════
  //  ACTIVE LAYERS
  // ═══════════════════════════════════════════════════════

  private computeActiveLayers(modules: ArchModule[], services: ArchService[]): ArchLayer[] {
    const active = new Set<ArchLayer>();
    for (const m of modules) active.add(m.layer);
    for (const s of services) active.add(s.layer);
    // stable ordering
    const order: ArchLayer[] = ["API", "CORE", "DATA", "AUTH", "INFRASTRUCTURE", "UI"];
    return order.filter((l) => active.has(l));
  }

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════

  private hasImport(pkg: string): boolean {
    for (const imp of this.externalImports) {
      if (imp === pkg || imp.startsWith(pkg + "/")) return true;
    }
    return false;
  }

  private packageName(imp: string): string {
    return imp.startsWith("@")
      ? imp.split("/").slice(0, 2).join("/")
      : imp.split("/")[0];
  }

  private rel(filePath: string): string {
    if (filePath.startsWith(this.projectPath)) {
      return filePath.slice(this.projectPath.length).replace(/^\//, "");
    }
    return filePath;
  }

  private baseName(filePath: string): string {
    return (filePath.split("/").pop() || "").replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
  }

  private prettify(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_.]/g, " ")
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
}
