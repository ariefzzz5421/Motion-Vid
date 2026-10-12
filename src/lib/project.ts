import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const layerSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "shape", "image", "bars", "line", "kpi"]),
  name: z.string(),
  text: z.string().default(""),
  assetId: z.string().optional(),
  src: z.string().optional(),
  values: z.array(z.number()).default([]),
  color,
  background: color,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(5).max(100),
  height: z.number().min(1).max(100).default(20),
  fontSize: z.number().min(12).max(180),
  fontWeight: z.number().min(100).max(900),
  fontFamily: z.enum(["Inter", "Arial", "Georgia"]).default("Inter"),
  align: z.enum(["left", "center", "right"]).default("left"),
  scale: z.number().min(0.1).max(4),
  rotation: z.number().min(-360).max(360),
  opacity: z.number().min(0).max(1),
  start: z.number().int().min(0),
  duration: z.number().int().min(1),
  animation: z.enum(["fade", "slide", "scale", "type", "pop", "none"]),
  animationDuration: z.number().int().min(1),
  animationDelay: z.number().int().min(0),
});
export const sceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number().int().min(15).max(900),
  background: color,
  backgroundEnd: color,
  layers: z.array(layerSchema).max(30),
});
export const projectSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  title: z.string().min(1).max(100),
  template: z.enum(["kinetic", "saas", "data", "logo"]),
  aspect: z.enum(["landscape", "vertical", "square"]),
  fps: z.literal(30),
  scenes: z.array(sceneSchema).min(1).max(30),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Layer = z.infer<typeof layerSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Project = z.infer<typeof projectSchema>;
export type TemplateId = Project["template"];
export type Aspect = Project["aspect"];
export const dimensions: Record<Aspect, { width: number; height: number }> = {
  landscape: { width: 1280, height: 720 },
  vertical: { width: 720, height: 1280 },
  square: { width: 900, height: 900 },
};
export const totalFrames = (project: Project) =>
  project.scenes.reduce((sum, scene) => sum + scene.duration, 0);
export const uid = () => crypto.randomUUID();
export const cloneProject = (project: Project): Project =>
  structuredClone(project);
export const safeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "motion-video";
