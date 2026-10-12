import type { Project } from "./project";
import { dimensions, safeName, totalFrames } from "./project";
import { StudioVideo } from "@/video/StudioVideo";

export type RenderProgress = (fraction: number) => void;
export interface RenderProvider {
  check(project: Project): Promise<{ ok: boolean; reason?: string }>;
  render(
    project: Project,
    onProgress: RenderProgress,
    signal: AbortSignal,
  ): Promise<Blob>;
}
export const browserRenderProvider: RenderProvider = {
  async check(project) {
    const { canRenderMediaOnWeb } = await import("@remotion/web-renderer");
    const result = await canRenderMediaOnWeb({
      ...dimensions[project.aspect],
      container: "mp4",
      videoCodec: "h264",
      muted: true,
    });
    return {
      ok: result.canRender,
      reason: result.issues.map((issue) => issue.message).join(" "),
    };
  },
  async render(project, onProgress, signal) {
    const { renderMediaOnWeb } = await import("@remotion/web-renderer");
    const { getBlob } = await renderMediaOnWeb({
      composition: {
        id: "StudioVideo",
        component: StudioVideo,
        ...dimensions[project.aspect],
        fps: 30,
        durationInFrames: totalFrames(project),
        defaultProps: { project },
      },
      inputProps: { project },
      container: "mp4",
      videoCodec: "h264",
      muted: true,
      signal,
      onProgress: ({ progress }) => onProgress(progress),
      pageResponsiveness: "high",
    });
    return getBlob();
  },
};
export function downloadBlob(blob: Blob, project: Project) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(project.title)}.mp4`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
