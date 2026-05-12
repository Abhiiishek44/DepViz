import fs from "node:fs";
import path from "node:path";
import type { CodeGraph } from "../types";
import type { TechnologySummary } from "./types";
import { collectExternalImports } from "./utils";

const FRONTEND_MAP: Record<string, string> = {
  react: "React",
  "react-dom": "React",
  vue: "Vue",
  svelte: "Svelte",
  "@angular/core": "Angular",
  next: "Next.js",
};

const BACKEND_MAP: Record<string, string> = {
  express: "Express",
  fastify: "Fastify",
  koa: "Koa",
  "@nestjs/core": "NestJS",
  "@nestjs/common": "NestJS",
};

const DATABASE_MAP: Record<string, string> = {
  mongoose: "MongoDB",
  mongodb: "MongoDB",
  "@prisma/client": "Prisma",
  sequelize: "Sequelize",
  pg: "PostgreSQL",
  mysql: "MySQL",
  mysql2: "MySQL",
  sqlite3: "SQLite",
  "better-sqlite3": "SQLite",
  "neo4j-driver": "Neo4j",
  redis: "Redis",
};

const AUTH_MAP: Record<string, string> = {
  passport: "Passport.js",
  jsonwebtoken: "JWT",
  "passport-jwt": "JWT",
  bcrypt: "bcrypt",
  bcryptjs: "bcrypt",
  "next-auth": "NextAuth",
  "@auth0/auth0-react": "Auth0",
};

const RUNTIME_MAP: Record<string, string> = {
  electron: "Electron",
  node: "Node.js",
};

const detect = (imports: Set<string>, map: Record<string, string>) => {
  const hits = new Set<string>();
  for (const imp of imports) {
    const pkg = imp.startsWith("@") ? imp.split("/").slice(0, 2).join("/") : imp.split("/")[0];
    if (map[pkg]) hits.add(map[pkg]);
  }
  return Array.from(hits);
};

const readPackageDeps = (projectPath: string) => {
  try {
    const pkgPath = path.join(projectPath, "package.json");
    const raw = fs.readFileSync(pkgPath, "utf-8");
    const parsed = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return new Set<string>([
      ...Object.keys(parsed.dependencies || {}),
      ...Object.keys(parsed.devDependencies || {}),
    ]);
  } catch {
    return new Set<string>();
  }
};

export const analyzeTechnology = (graph: CodeGraph, projectPath: string): TechnologySummary => {
  const externalImports = collectExternalImports(graph);
  const packageDeps = readPackageDeps(projectPath);
  const combined = new Set<string>([...externalImports, ...packageDeps]);

  const configHits = Array.from(graph.files.keys()).map((filePath) => path.basename(filePath));
  if (configHits.some((name) => name.startsWith("next.config"))) {
    combined.add("next");
  }
  if (configHits.some((name) => name.startsWith("vite.config"))) {
    combined.add("vite");
  }
  if (configHits.some((name) => name.startsWith("tailwind.config"))) {
    combined.add("tailwindcss");
  }

  const runtime = detect(combined, RUNTIME_MAP);
  if (packageDeps.size > 0 && !runtime.includes("Node.js")) {
    runtime.push("Node.js");
  }

  return {
    frontend: detect(combined, FRONTEND_MAP),
    backend: detect(combined, BACKEND_MAP),
    database: detect(combined, DATABASE_MAP),
    auth: detect(combined, AUTH_MAP),
    deployment: [],
    runtime,
  };
};
