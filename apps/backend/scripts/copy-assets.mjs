import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

await mkdir(resolve(root, "dist", "scripts"), { recursive: true });
await cp(resolve(root, "src", "scripts", "php"), resolve(root, "dist", "scripts", "php"), {
  recursive: true
});

await mkdir(
  resolve(root, "dist", "services", "stream", "part-provider", "http-stream", "bypass"),
  { recursive: true }
);
await cp(
  resolve(root, "src", "services", "stream", "part-provider", "http-stream", "bypass", "aes.js"),
  resolve(root, "dist", "services", "stream", "part-provider", "http-stream", "bypass", "aes.js")
);
