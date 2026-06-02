import { join } from "path";
import { existsSync, rmSync, mkdirSync } from "fs";
import { tmpdir } from "os";

export function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `${prefix}-${crypto.randomUUID()}`);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function cleanupTempDir(dir: string): void {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}
