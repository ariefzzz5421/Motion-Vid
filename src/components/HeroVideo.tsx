"use client";
import { useMemo } from "react";
import { Player } from "@remotion/player";
import { createProject } from "@/lib/templates";
import { totalFrames } from "@/lib/project";
import { StudioVideo } from "@/video/StudioVideo";
export default function HeroVideo() {
  const project = useMemo(() => createProject("kinetic"), []);
  return (
    <Player
      component={StudioVideo}
      inputProps={{ project }}
      compositionWidth={1280}
      compositionHeight={720}
      durationInFrames={totalFrames(project)}
      fps={30}
      initialFrame={24}
      autoPlay
      loop
      clickToPlay={false}
      acknowledgeRemotionLicense
      style={{ width: "100%", aspectRatio: "16/9" }}
    />
  );
}
