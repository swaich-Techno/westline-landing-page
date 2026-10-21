import { build } from "vite";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function buildFunctions(root = process.cwd()) {
  await build({
    configFile: false,
    root,
    publicDir: false,
    build: {
      outDir: "dist",
      emptyOutDir: false,
      target: "es2022",
      minify: true,
      lib: {
        entry: resolve(root, "functions/worker.ts"),
        formats: ["es"],
        fileName: () => "_worker.js",
      },
    },
  });
  await writeFile(
    resolve(root, "dist/_routes.json"),
    `${JSON.stringify({ version: 1, include: ["/api/*"], exclude: [] }, null, 2)}\n`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  await buildFunctions();
}
