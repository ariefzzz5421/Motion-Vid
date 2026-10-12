import {
  type Layer,
  type Project,
  type Scene,
  type TemplateId,
  uid,
} from "./project";

type LayerOptions = Partial<Layer> & Pick<Layer, "name" | "type">;
const layer = ({ name, type, ...rest }: LayerOptions): Layer => ({
  id: uid(),
  name,
  type,
  text: "",
  values: [],
  color: "#FFFFFF",
  background: "#8B5CF6",
  x: 10,
  y: 35,
  width: 80,
  height: 20,
  fontSize: 78,
  fontWeight: 800,
  fontFamily: "Inter",
  align: "left",
  scale: 1,
  rotation: 0,
  opacity: 1,
  start: 0,
  duration: 150,
  animation: "slide",
  animationDuration: 22,
  animationDelay: 0,
  ...rest,
});
const scene = (
  name: string,
  duration: number,
  background: string,
  backgroundEnd: string,
  layers: Layer[],
): Scene => ({
  id: uid(),
  name,
  duration,
  background,
  backgroundEnd,
  layers: layers.map((item) => ({
    ...item,
    duration: Math.min(item.duration, duration),
  })),
});
export const templateMeta: Record<
  TemplateId,
  { title: string; category: string; description: string; accent: string }
> = {
  kinetic: {
    title: "Kinetic Typography",
    category: "Typography",
    description: "Words in motion, built to command attention.",
    accent: "#A78BFA",
  },
  saas: {
    title: "SaaS Product Launch",
    category: "Product",
    description: "A complete five-scene launch story.",
    accent: "#38BDF8",
  },
  data: {
    title: "Data Explainer",
    category: "Data",
    description: "Numbers, growth, and insight in motion.",
    accent: "#34D399",
  },
  logo: {
    title: "Minimal Logo Reveal",
    category: "Brand",
    description: "An elegant identity reveal with a polished finish.",
    accent: "#F4B267",
  },
};
export function createProject(template: TemplateId, seconds = 15): Project {
  const accent = templateMeta[template].accent;
  let scenes: Scene[];
  if (template === "kinetic")
    scenes = [
      scene("Opening impact", 150, "#111026", "#25205B", [
        layer({
          name: "Eyebrow",
          type: "text",
          text: "MOTION / REIMAGINED",
          y: 21,
          fontSize: 27,
          color: accent,
          animation: "fade",
        }),
        layer({
          name: "Headline",
          type: "text",
          text: "MAKE IT MOVE.",
          y: 38,
          fontSize: 104,
          animation: "type",
        }),
        layer({
          name: "Underline",
          type: "shape",
          y: 69,
          width: 42,
          height: 1,
          background: accent,
          animation: "scale",
        }),
      ]),
      scene("The message", 150, "#241352", "#0C1B38", [
        layer({
          name: "Headline",
          type: "text",
          text: "Every frame has a purpose.",
          y: 36,
          fontSize: 83,
          animation: "slide",
        }),
        layer({
          name: "Supporting copy",
          type: "text",
          text: "Build stories that stay with people.",
          y: 62,
          fontSize: 34,
          fontWeight: 400,
          color: "#C4B5FD",
          animation: "fade",
          animationDelay: 12,
        }),
      ]),
      scene("Final statement", 150, "#0D1737", "#111026", [
        layer({
          name: "Closing line",
          type: "text",
          text: "CREATE THE MOMENT.",
          y: 38,
          fontSize: 99,
          animation: "pop",
        }),
        layer({
          name: "Accent",
          type: "shape",
          y: 67,
          width: 30,
          height: 1,
          background: accent,
          animation: "slide",
        }),
      ]),
    ];
  else if (template === "saas")
    scenes = [
      scene("Brand introduction", 90, "#0D1E31", "#132C44", [
        layer({
          name: "Brand mark",
          type: "shape",
          x: 44,
          y: 34,
          width: 12,
          background: accent,
          animation: "pop",
        }),
        layer({
          name: "Brand name",
          type: "text",
          text: "NOVA",
          x: 30,
          y: 55,
          width: 40,
          align: "center",
          fontSize: 86,
          animation: "fade",
        }),
      ]),
      scene("Main headline", 90, "#132C44", "#091928", [
        layer({
          name: "Headline",
          type: "text",
          text: "Your work. In flow.",
          y: 38,
          fontSize: 98,
          animation: "slide",
        }),
        layer({
          name: "Subhead",
          type: "text",
          text: "One space for everything that matters.",
          y: 60,
          fontSize: 33,
          fontWeight: 400,
          color: "#A8CDE2",
          animation: "fade",
          animationDelay: 12,
        }),
      ]),
      scene("Product screenshot", 90, "#091928", "#103B57", [
        layer({
          name: "Product window",
          type: "shape",
          x: 16,
          y: 20,
          width: 68,
          height: 52,
          background: "#1E3652",
          animation: "scale",
        }),
        layer({
          name: "Screenshot prompt",
          type: "text",
          text: "Add your product screenshot",
          x: 23,
          y: 43,
          width: 54,
          fontSize: 44,
          align: "center",
          animation: "fade",
        }),
      ]),
      scene("Feature highlights", 90, "#103B57", "#12223E", [
        layer({
          name: "Feature title",
          type: "text",
          text: "Designed for momentum.",
          y: 24,
          fontSize: 70,
          animation: "slide",
        }),
        layer({
          name: "Feature one",
          type: "text",
          text: "01  Focus on the work",
          y: 55,
          fontSize: 34,
          animation: "fade",
          animationDelay: 8,
        }),
        layer({
          name: "Feature two",
          type: "text",
          text: "02  Move faster together",
          y: 67,
          fontSize: 34,
          animation: "fade",
          animationDelay: 20,
        }),
      ]),
      scene("Call to action", 90, "#12223E", "#0D1E31", [
        layer({
          name: "CTA",
          type: "text",
          text: "Start something great.",
          y: 37,
          fontSize: 94,
          animation: "pop",
        }),
        layer({
          name: "Website",
          type: "text",
          text: "yourbrand.com",
          y: 62,
          fontSize: 34,
          color: accent,
          animation: "fade",
          animationDelay: 14,
        }),
      ]),
    ];
  else if (template === "data")
    scenes = [
      scene("Data opener", 150, "#091D25", "#0B2830", [
        layer({
          name: "Eyebrow",
          type: "text",
          text: "SAMPLE DATA / QUARTERLY REPORT",
          y: 21,
          fontSize: 25,
          color: accent,
          animation: "fade",
        }),
        layer({
          name: "Title",
          type: "text",
          text: "The numbers tell a story.",
          y: 41,
          fontSize: 88,
          animation: "slide",
        }),
      ]),
      scene("Growth chart", 150, "#0B2830", "#102B35", [
        layer({
          name: "Chart title",
          type: "text",
          text: "Quarterly growth",
          y: 15,
          fontSize: 55,
          animation: "fade",
        }),
        layer({
          name: "Bars",
          type: "bars",
          values: [25, 43, 58, 81, 96],
          x: 12,
          y: 34,
          width: 76,
          background: accent,
          animation: "scale",
        }),
      ]),
      scene("Performance KPI", 150, "#102B35", "#091D25", [
        layer({
          name: "Metric",
          type: "kpi",
          text: "84",
          x: 20,
          y: 28,
          width: 60,
          align: "center",
          fontSize: 150,
          color: accent,
          animation: "pop",
        }),
        layer({
          name: "Metric label",
          type: "text",
          text: "% year-over-year growth",
          y: 67,
          align: "center",
          fontSize: 40,
          animation: "fade",
          animationDelay: 12,
        }),
        layer({
          name: "Trend",
          type: "line",
          values: [12, 24, 22, 42, 58, 53, 84],
          x: 16,
          y: 76,
          width: 68,
          background: accent,
        }),
      ]),
    ];
  else
    scenes = [
      scene("Shape emergence", 150, "#11131B", "#262132", [
        layer({
          name: "Revealing shape",
          type: "shape",
          x: 43,
          y: 33,
          width: 14,
          background: accent,
          animation: "pop",
        }),
      ]),
      scene("Identity", 150, "#262132", "#171722", [
        layer({
          name: "Logo shape",
          type: "shape",
          x: 45,
          y: 23,
          width: 10,
          background: accent,
          animation: "scale",
        }),
        layer({
          name: "Brand",
          type: "text",
          text: "AURA",
          x: 25,
          y: 48,
          width: 50,
          align: "center",
          fontSize: 120,
          animation: "slide",
        }),
        layer({
          name: "Tagline",
          type: "text",
          text: "Made to be remembered.",
          y: 68,
          align: "center",
          fontSize: 31,
          fontWeight: 400,
          color: "#C6BDD0",
          animation: "fade",
          animationDelay: 14,
        }),
      ]),
      scene("Sign off", 150, "#171722", "#0B0F17", [
        layer({
          name: "Closing brand",
          type: "text",
          text: "AURA",
          x: 30,
          y: 40,
          width: 40,
          align: "center",
          fontSize: 114,
          animation: "pop",
        }),
        layer({
          name: "Closing line",
          type: "text",
          text: "A new point of view.",
          y: 62,
          align: "center",
          fontSize: 30,
          color: accent,
          animation: "fade",
        }),
      ]),
    ];
  const factor =
    (seconds * 30) / scenes.reduce((sum, item) => sum + item.duration, 0);
  scenes = scenes.map((item) => ({
    ...item,
    duration: Math.max(15, Math.round(item.duration * factor)),
    layers: item.layers.map((l) => ({
      ...l,
      duration: Math.max(1, Math.round(item.duration * factor)),
      animationDuration: Math.max(4, Math.round(l.animationDuration * factor)),
      animationDelay: Math.max(0, Math.round(l.animationDelay * factor)),
    })),
  }));
  const now = new Date().toISOString();
  return {
    version: 1,
    id: uid(),
    title: templateMeta[template].title,
    template,
    aspect: "landscape",
    fps: 30,
    scenes,
    createdAt: now,
    updatedAt: now,
  };
}
export const newTextLayer = (duration: number) =>
  layer({ name: "New text", type: "text", text: "Your message", duration });
export const newShapeLayer = (duration: number) =>
  layer({
    name: "New shape",
    type: "shape",
    x: 44,
    y: 40,
    width: 12,
    duration,
  });
