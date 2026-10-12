import { registerRoot } from "remotion";
import "@fontsource-variable/inter";
import { Composition } from "remotion";
import { StudioVideo } from "./StudioVideo";
import { createProject } from "../lib/templates";
import { dimensions, totalFrames } from "../lib/project";
const defaultProject = createProject("kinetic");
const Root = () => (
  <Composition
    id="StudioVideo"
    component={StudioVideo}
    durationInFrames={totalFrames(defaultProject)}
    fps={30}
    width={dimensions.landscape.width}
    height={dimensions.landscape.height}
    defaultProps={{ project: defaultProject }}
  />
);
registerRoot(Root);
