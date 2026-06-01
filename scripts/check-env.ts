import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const envFiles = [".env", ".env.example"]
const sourceFiles = [
  "Dockerfile",
  "nuxt.config.ts",
  "prisma.config.ts",
  "server",
  "pages",
  "components",
  "layouts",
  "middleware",
  "scripts"
]

const ignoredDirectories = new Set(["node_modules", ".git", ".nuxt", ".output"])
const sourceExtensions = new Set([".ts", ".vue", ".js", ".mjs", ".cjs"])

function readEnvKeys(file: string) {
  const path = join(root, file)
  if (!existsSync(path)) {
    return new Set<string>()
  }

  return new Set(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1])
      .filter((key): key is string => Boolean(key))
  )
}

function listFiles(path: string): string[] {
  const fullPath = join(root, path)
  if (!existsSync(fullPath)) {
    return []
  }

  const stat = statSync(fullPath)
  if (stat.isFile()) {
    return [fullPath]
  }

  return readdirSync(fullPath).flatMap((entry) => {
    if (ignoredDirectories.has(entry)) {
      return []
    }

    const child = join(path, entry)
    const childPath = join(root, child)
    const childStat = statSync(childPath)

    if (childStat.isDirectory()) {
      return listFiles(child)
    }

    if (child === "Dockerfile" || [...sourceExtensions].some((extension) => child.endsWith(extension))) {
      return [childPath]
    }

    return []
  })
}

function readUsedEnvKeys() {
  const keys = new Set<string>()
  const processEnvDot = /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g
  const processEnvBracket = /process\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g
  const dockerEnv = /^\s*ENV\s+([A-Za-z_][A-Za-z0-9_]*)=/gm

  for (const file of sourceFiles.flatMap(listFiles)) {
    const source = readFileSync(file, "utf8")

    for (const match of source.matchAll(processEnvDot)) {
      keys.add(match[1])
    }

    for (const match of source.matchAll(processEnvBracket)) {
      keys.add(match[1])
    }

    if (file.endsWith("Dockerfile")) {
      for (const match of source.matchAll(dockerEnv)) {
        keys.add(match[1])
      }
    }
  }

  return keys
}

function difference(left: Set<string>, right: Set<string>) {
  return [...left].filter((key) => !right.has(key)).sort()
}

const envKeys = Object.fromEntries(envFiles.map((file) => [file, readEnvKeys(file)]))
const usedKeys = readUsedEnvKeys()
let failed = false

for (const file of envFiles) {
  if (!existsSync(join(root, file))) {
    console.error(`${file} is missing.`)
    failed = true
  }
}

const missingFromExample = difference(envKeys[".env"], envKeys[".env.example"])
const missingFromEnv = difference(envKeys[".env.example"], envKeys[".env"])
const usedMissingFromEnv = difference(usedKeys, envKeys[".env"])
const usedMissingFromExample = difference(usedKeys, envKeys[".env.example"])

if (missingFromExample.length) {
  console.error(`.env.example is missing: ${missingFromExample.join(", ")}`)
  failed = true
}

if (missingFromEnv.length) {
  console.error(`.env is missing: ${missingFromEnv.join(", ")}`)
  failed = true
}

if (usedMissingFromEnv.length) {
  console.error(`.env is missing variables used by the project: ${usedMissingFromEnv.join(", ")}`)
  failed = true
}

if (usedMissingFromExample.length) {
  console.error(`.env.example is missing variables used by the project: ${usedMissingFromExample.join(", ")}`)
  failed = true
}

if (failed) {
  process.exit(1)
}

console.log("Environment files are in sync.")
