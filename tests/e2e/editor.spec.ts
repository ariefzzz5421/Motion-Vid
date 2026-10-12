import { test, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
test("create, edit, preview, and persist a project", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Make your ideas move/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open Studio" }).first().click();
  await expect(
    page.getByRole("heading", { name: "My projects." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Kinetic Typography Words in motion/ })
    .click();
  await expect(page.getByText("COMPOSITION PREVIEW")).toBeVisible();
  await page.getByRole("button", { name: "Elements" }).first().click();
  await page.getByRole("button", { name: "Headline 2" }).click();
  await page
    .getByRole("textbox", { name: "Text", exact: true })
    .fill("BUILD THE FUTURE.");
  await page.getByRole("combobox", { name: "Animation" }).selectOption("slide");
  await page.getByRole("spinbutton", { name: "Anim. frames" }).fill("12");
  await page.getByText("1s", { exact: true }).click();
  await expect(
    page.getByText("BUILD THE FUTURE.", { exact: true }).first(),
  ).toBeVisible();
  await page.waitForTimeout(650);
  await page.reload();
  await page.getByRole("button", { name: "Elements" }).first().click();
  await page.getByRole("button", { name: "Headline 2" }).click();
  await expect(
    page.getByRole("textbox", { name: "Text", exact: true }),
  ).toHaveValue("BUILD THE FUTURE.");
  await expect(page.getByRole("combobox", { name: "Animation" })).toHaveValue(
    "slide",
  );
  await expect(
    page.getByRole("spinbutton", { name: "Anim. frames" }),
  ).toHaveValue("12");
  await page.getByText("1s", { exact: true }).click();
  await expect(
    page.getByText("BUILD THE FUTURE.", { exact: true }).first(),
  ).toBeVisible();
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Project JSON", exact: true }).click();
  await mkdir("output", { recursive: true });
  await (await jsonDownload).saveAs("output/verified-project.json");
  await page.goto("/dashboard");
  await page
    .locator('input[type="file"][accept="application/json,.json"]')
    .setInputFiles("output/verified-project.json");
  await expect(page.getByText("Kinetic Typography Imported")).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("pages remain usable without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('video source[src^="/examples/"]')).toHaveCount(4);
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width + 1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await mkdir("output", { recursive: true });
  await page.screenshot({ path: "output/mobile-home.png" });
  await page.goto("/dashboard");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(391);
  await page.screenshot({ path: "output/mobile-dashboard.png" });
  await page.getByRole("button", { name: /Data Explainer Numbers/ }).click();
  await expect(page.getByText("COMPOSITION PREVIEW")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(391);
  await page.screenshot({ path: "output/mobile-editor.png" });
});

test("dashboard search, rename, duplicate, and confirmed deletion", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: /Minimal Logo Reveal An elegant identity/ })
    .click();
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Rename Minimal Logo Reveal" })
    .click();
  await page.getByRole("textbox", { name: "Project name" }).fill("Launch Mark");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(
    page.getByRole("button", { name: "Launch Mark", exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search projects" }).fill("Launch");
  await page.getByRole("button", { name: "Duplicate Launch Mark" }).click();
  await expect(
    page.getByRole("button", { name: "Launch Mark Copy", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete Launch Mark Copy" }).click();
  await expect(
    page.getByRole("heading", { name: "Delete this project?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete project" }).click();
  await expect(
    page.getByRole("button", { name: "Launch Mark Copy", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Launch Mark", exact: true }),
  ).toBeVisible();
});

for (const format of [
  { aspect: "vertical", width: 720, height: 1280 },
  { aspect: "square", width: 900, height: 900 },
])
  test(`exports ${format.aspect} MP4 at the selected aspect ratio`, async ({
    page,
  }) => {
    test.setTimeout(240000);
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: /Kinetic Typography Words in motion/ })
      .click();
    await page.getByRole("button", { name: "Settings" }).first().click();
    await page.getByLabel("Aspect ratio").selectOption(format.aspect);
    await page.getByLabel("Duration preset").selectOption("5");
    await expect(
      page.getByText(`${format.width} × ${format.height} · 30 FPS`),
    ).toBeVisible();
    const downloadPromise = page.waitForEvent("download", { timeout: 210000 });
    await page.getByRole("button", { name: "Export MP4" }).click();
    const download = await downloadPromise;
    await mkdir("output", { recursive: true });
    await download.saveAs(`output/verified-${format.aspect}.mp4`);
    const bytes = await readFile(await download.path());
    expect(bytes.byteLength).toBeGreaterThan(10000);
    const metadata = await page.evaluate(async (base64) => {
      const binary = atob(base64);
      const data = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("MP4 playback failed"));
      });
      const result = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      };
      URL.revokeObjectURL(url);
      return result;
    }, bytes.toString("base64"));
    expect(metadata.width).toBe(format.width);
    expect(metadata.height).toBe(format.height);
    expect(metadata.duration).toBeGreaterThan(4.8);
  });

test("uploaded images survive refresh and render in MP4", async ({ page }) => {
  test.setTimeout(240000);
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: /Minimal Logo Reveal An elegant identity/ })
    .click();
  await page.getByRole("button", { name: "Elements" }).first().click();
  await page
    .locator('input[type="file"][accept="image/*"]')
    .setInputFiles("tests/fixtures/sample.png");
  await expect(
    page.getByRole("button", { name: /Uploaded image/ }).first(),
  ).toBeVisible();
  await page.getByText("1s", { exact: true }).click();
  await expect(page.locator(".player-wrap img")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
  await page.waitForTimeout(650);
  await page.reload();
  await page.getByText("1s", { exact: true }).click();
  await expect(page.locator(".player-wrap img")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
  await page.getByRole("button", { name: "Settings" }).first().click();
  await page.getByLabel("Duration preset").selectOption("5");
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Project JSON", exact: true }).click();
  await mkdir("output", { recursive: true });
  await (await jsonDownload).saveAs("output/verified-image-project.json");
  const imported = JSON.parse(
    await readFile("output/verified-image-project.json", "utf8"),
  );
  expect(
    imported.scenes[0].layers.some(
      (layer: { type: string; src?: string }) =>
        layer.type === "image" && layer.src?.startsWith("data:image/png"),
    ),
  ).toBe(true);
  const downloadPromise = page.waitForEvent("download", { timeout: 210000 });
  await page.getByRole("button", { name: "Export MP4" }).click();
  const download = await downloadPromise;
  await download.saveAs("output/verified-image.mp4");
  const bytes = await readFile(await download.path());
  expect(bytes.byteLength).toBeGreaterThan(10000);
});

for (const sample of [
  {
    id: "kinetic",
    name: /Kinetic Typography Words in motion/,
    file: "verified-kinetic.mp4",
  },
  {
    id: "saas",
    name: /SaaS Product Launch A complete/,
    file: "verified-saas.mp4",
  },
  { id: "data", name: /Data Explainer Numbers/, file: "verified-data.mp4" },
  {
    id: "logo",
    name: /Minimal Logo Reveal An elegant identity/,
    file: "verified-logo-reveal.mp4",
  },
])
  test(`exports playable ${sample.id} MP4 with changing frames`, async ({
    page,
  }) => {
    test.setTimeout(240000);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: sample.name }).click();
    await page.getByRole("button", { name: "Settings" }).first().click();
    await page.getByLabel("Duration preset").selectOption("5");
    const downloadPromise = page.waitForEvent("download", { timeout: 210000 });
    await page.getByRole("button", { name: "Export MP4" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.mp4$/);
    await mkdir("output", { recursive: true });
    await download.saveAs(`output/${sample.file}`);
    const bytes = await readFile(await download.path());
    expect(bytes.byteLength).toBeGreaterThan(10000);
    const metadata = await page.evaluate(async (base64) => {
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([array], { type: "video/mp4" }));
      const video = document.createElement("video");
      video.muted = true;
      video.src = url;
      video.preload = "auto";
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("MP4 playback failed"));
      });
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 36;
      const ctx = canvas.getContext("2d")!;
      const frameAt = async (time: number) => {
        video.currentTime = time;
        await new Promise<void>((resolve, reject) => {
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error("Seeking failed"));
        });
        ctx.drawImage(video, 0, 0, 64, 36);
        return Array.from(ctx.getImageData(0, 0, 64, 36).data);
      };
      const first = await frameAt(0.15);
      const second = await frameAt(1.5);
      const difference = first.reduce(
        (sum, value, index) => sum + Math.abs(value - second[index]),
        0,
      );
      const result = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        difference,
      };
      URL.revokeObjectURL(url);
      return result;
    }, bytes.toString("base64"));
    expect(metadata.width).toBe(1280);
    expect(metadata.height).toBe(720);
    expect(metadata.duration).toBeGreaterThan(4.8);
    expect(metadata.duration).toBeLessThan(5.2);
    expect(metadata.difference).toBeGreaterThan(1000);
  });
