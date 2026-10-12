import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Layer, Project, Scene } from "@/lib/project";

export type VideoProps = { project: Project };
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const mix = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], clamp);

function LayerView({
  layer,
  frame,
  sceneDuration,
  narrow,
}: {
  layer: Layer;
  frame: number;
  sceneDuration: number;
  narrow: boolean;
}) {
  if (
    frame < layer.start ||
    frame >= Math.min(sceneDuration, layer.start + layer.duration)
  )
    return null;
  const local = Math.max(0, frame - layer.start - layer.animationDelay);
  const progress = mix(local, 0, Math.max(1, layer.animationDuration));
  const exitFrames = Math.min(
    12,
    Math.max(3, Math.round(sceneDuration * 0.08)),
  );
  const exit = interpolate(
    frame,
    [sceneDuration - exitFrames, sceneDuration],
    [1, 0],
    clamp,
  );
  const animatedOpacity = layer.animation === "none" ? 1 : progress;
  const slide = layer.animation === "slide" ? (1 - progress) * 70 : 0;
  const scale =
    layer.animation === "scale" || layer.animation === "pop"
      ? (layer.animation === "pop" ? 0.65 : 0.82) +
        progress * (layer.animation === "pop" ? 0.35 : 0.18)
      : 1;
  const text =
    layer.animation === "type"
      ? layer.text.slice(0, Math.floor(layer.text.length * progress))
      : layer.text;
  const fontSize = layer.fontSize * (narrow ? 0.72 : 1);
  const base: React.CSSProperties = {
    position: "absolute",
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.width}%`,
    opacity: layer.opacity * animatedOpacity * exit,
    transform: `translateY(${slide}px) scale(${layer.scale * scale}) rotate(${layer.rotation}deg)`,
    transformOrigin: "center center",
    color: layer.color,
    textAlign: layer.align,
    fontSize,
    fontWeight: layer.fontWeight,
    fontFamily: `${layer.fontFamily === "Inter" ? '"Inter Variable"' : layer.fontFamily}, Arial, sans-serif`,
    lineHeight: 1.05,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  };
  if (layer.type === "text") return <div style={base}>{text}</div>;
  if (layer.type === "kpi") {
    const target = Number(layer.text);
    return (
      <div style={base}>
        {Number.isFinite(target) ? Math.round(target * progress) : layer.text}
      </div>
    );
  }
  if (layer.type === "shape")
    return (
      <div
        style={{
          ...base,
          height: `${layer.height ?? 20}%`,
          borderRadius: layer.height <= 2 ? 4 : 24,
          background: layer.background,
          boxShadow: `0 22px 80px ${layer.background}55`,
          border: layer.height <= 2 ? 0 : "1px solid #ffffff33",
        }}
      />
    );
  // Native images are kept in the Remotion tree so the Player and web renderer see the same source.
  if (layer.type === "image")
    return layer.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        src={layer.src}
        style={{
          ...base,
          height: `${layer.height}%`,
          objectFit: "contain",
          borderRadius: 18,
        }}
      />
    ) : null;
  if (layer.type === "bars")
    return (
      <div
        style={{
          ...base,
          height: narrow ? 390 : 260,
          display: "flex",
          alignItems: "end",
          gap: "4%",
        }}
      >
        {layer.values.map((value, i) => (
          <div
            key={i}
            style={{
              width: `${100 / Math.max(1, layer.values.length)}%`,
              height: `${Math.max(2, value * progress)}%`,
              background:
                i === layer.values.length - 1
                  ? layer.background
                  : `${layer.background}88`,
              borderRadius: "10px 10px 2px 2px",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                bottom: -35,
                left: "20%",
                fontSize: 20,
                color: "#ffffffaa",
              }}
            >
              Q{i + 1}
            </span>
          </div>
        ))}
      </div>
    );
  if (layer.type === "line") {
    const points = layer.values
      .map(
        (v, i) =>
          `${(i / Math.max(1, layer.values.length - 1)) * 100},${100 - v * progress}`,
      )
      .join(" ");
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ ...base, height: narrow ? 100 : 75, overflow: "visible" }}
      >
        <polyline
          points={points}
          fill="none"
          stroke={layer.background}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return null;
}
function SceneView({
  scene,
  frame,
  sample,
}: {
  scene: Scene;
  frame: number;
  sample: boolean;
}) {
  const { width, height } = useVideoConfig();
  const narrow = height > width;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${scene.background}, ${scene.backgroundEnd})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "8%",
          border: "1px solid #ffffff18",
          borderRadius: 32,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-12%",
          top: "-28%",
          width: "65%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: "#ffffff06",
        }}
      />
      {scene.layers.map((l) => (
        <LayerView
          key={l.id}
          layer={l}
          frame={frame}
          sceneDuration={scene.duration}
          narrow={narrow}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: "10%",
          bottom: "7%",
          color: "#ffffff88",
          fontFamily: "Arial, sans-serif",
          fontSize: narrow ? 18 : 16,
          letterSpacing: 3,
        }}
      >
        MOTION / VID
      </div>
      {sample && (
        <div
          style={{
            position: "absolute",
            right: "10%",
            bottom: "7%",
            color: "#ffffff88",
            fontFamily: "Arial, sans-serif",
            fontSize: narrow ? 18 : 16,
            letterSpacing: 2,
          }}
        >
          ILLUSTRATIVE SAMPLE DATA
        </div>
      )}
    </AbsoluteFill>
  );
}
export const StudioVideo: React.FC<VideoProps> = ({ project }) => {
  const frame = useCurrentFrame();
  let offset = 0;
  for (const scene of project.scenes) {
    if (frame < offset + scene.duration)
      return (
        <SceneView
          scene={scene}
          frame={frame - offset}
          sample={project.template === "data"}
        />
      );
    offset += scene.duration;
  }
  return (
    <SceneView
      scene={project.scenes[project.scenes.length - 1]}
      frame={0}
      sample={project.template === "data"}
    />
  );
};
