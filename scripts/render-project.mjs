import { readFile, writeFile, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

const [, , input, output = "out/motion-vid.mp4"] = process.argv;
if (!input) {
  console.error("Usage: npm run render:project -- <project.json> [output.mp4]");
  process.exit(1);
}
const project = JSON.parse(await readFile(resolve(input), "utf8"));
if (
  project.version !== 1 ||
  !Array.isArray(project.scenes) ||
  !project.scenes.length
)
  throw new Error("Invalid Motion-Vid project JSON");
if (
  project.scenes.some((scene) =>
    scene.layers?.some((layer) => layer.type === "image" && !layer.src),
  )
)
  throw new Error(
    "This JSON has image layers without embedded data. Export JSON again from the editor after the images load.",
  );
const propsPath = join(tmpdir(), `motion-vid-${randomUUID()}.json`);
await writeFile(propsPath, JSON.stringify({ project }));
try {
  const cli = resolve("node_modules/@remotion/cli/remotion-cli.js");
  const result = spawnSync(
    process.execPath,
    [
      cli,
      "render",
      "src/video/entry.tsx",
      "StudioVideo",
      resolve(output),
      `--props=${propsPath}`,
      `--width=${project.aspect === "vertical" ? 720 : project.aspect === "square" ? 900 : 1280}`,
      `--height=${project.aspect === "vertical" ? 1280 : project.aspect === "square" ? 900 : 720}`,
      `--duration=${project.scenes.reduce((sum, scene) => sum + scene.duration, 0)}`,
    ],
    { stdio: "inherit" },
  );
  process.exitCode = result.status ?? 1;
} finally {
  await unlink(propsPath).catch(() => {});
}
