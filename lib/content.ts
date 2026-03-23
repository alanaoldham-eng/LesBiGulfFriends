import fs from "node:fs";
import path from "node:path";

export function readJson<T>(relativePath: string): T {
  const filePath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
