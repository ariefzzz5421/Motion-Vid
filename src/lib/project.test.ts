import { describe, expect, it } from "vitest";
import { createProject } from "./templates";
import {
  dimensions,
  projectSchema,
  totalFrames,
  type TemplateId,
} from "./project";
describe("project templates", () => {
  it.each(["kinetic", "saas", "data", "logo"] as TemplateId[])(
    "%s has editable validated scenes",
    (template) => {
      const project = createProject(template);
      expect(projectSchema.parse(project)).toEqual(project);
      expect(totalFrames(project)).toBe(450);
      expect(project.scenes.length).toBeGreaterThanOrEqual(3);
      expect(project.scenes.every((scene) => scene.layers.length > 0)).toBe(
        true,
      );
    },
  );
  it("uses five scenes for a product launch", () =>
    expect(createProject("saas").scenes).toHaveLength(5));
  it("keeps dimensions even for MP4 encoding", () =>
    Object.values(dimensions).forEach(({ width, height }) => {
      expect(width % 2).toBe(0);
      expect(height % 2).toBe(0);
    }));
  it("rejects unknown project versions", () =>
    expect(
      projectSchema.safeParse({ ...createProject("logo"), version: 2 }).success,
    ).toBe(false));
  it("labels illustrative data in the data template", () =>
    expect(
      createProject("data").scenes[0].layers.some((layer) =>
        layer.text.includes("SAMPLE DATA"),
      ),
    ).toBe(true));
});
