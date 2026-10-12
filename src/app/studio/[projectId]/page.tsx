"use client";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Player, type PlayerRef } from "@remotion/player";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Expand,
  Film,
  ImagePlus,
  Layers3,
  Minus,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Settings2,
  Shapes,
  TextCursorInput,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button, ConfirmDialog } from "@/components/ui";
import {
  createProject,
  newShapeLayer,
  newTextLayer,
  templateMeta,
} from "@/lib/templates";
import { getAsset, getProject, saveAsset, saveProject } from "@/lib/db";
import {
  dimensions,
  projectSchema,
  totalFrames,
  uid,
  type Layer,
  type Project,
  type Scene,
  type TemplateId,
} from "@/lib/project";
import { useEditor } from "@/lib/editor-store";
import { browserRenderProvider, downloadBlob } from "@/lib/render";
import { StudioVideo } from "@/video/StudioVideo";

type Tab = "scenes" | "elements" | "templates" | "settings";
const templateIds: TemplateId[] = ["kinetic", "saas", "data", "logo"];
const durationPresets = [5, 10, 15, 30];
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function num(
  value: number,
  change: (n: number) => void,
  min: number,
  max: number,
  step = 1,
) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) change(Math.min(max, Math.max(min, n)));
      }}
    />
  );
}
export default function StudioPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { project, load, edit, undo, redo, past, future } = useEditor();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("scenes");
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [layerId, setLayerId] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [renderState, setRenderState] = useState<
    "idle" | "checking" | "rendering" | "done" | "error" | "cancelled"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [renderError, setRenderError] = useState("");
  const [confirmScene, setConfirmScene] = useState(false);
  const [confirmLayer, setConfirmLayer] = useState(false);
  const [replaceTemplate, setReplaceTemplate] = useState<TemplateId | null>(
    null,
  );
  const playerRef = useRef<PlayerRef>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    getProject(projectId)
      .then(async (value) => {
        if (cancelled) return;
        if (!value) {
          setError(
            "Project not found in this browser. Create a new one from the dashboard.",
          );
          setLoaded(true);
          return;
        }
        load(value);
        setSceneId(value.scenes[0].id);
        setFrame(12);
        const ids = [
          ...new Set(
            value.scenes.flatMap((s) =>
              s.layers.map((l) => l.assetId).filter((id): id is string => !!id),
            ),
          ),
        ];
        const entries = await Promise.all(
          ids.map(async (id) => [id, await getAsset(id)] as const),
        );
        if (!cancelled)
          setAssets(
            Object.fromEntries(
              entries.filter(
                (entry): entry is readonly [string, string] => !!entry[1],
              ),
            ),
          );
        setLoaded(true);
      })
      .catch((e) => {
        setError(String(e));
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, load]);
  useEffect(() => {
    if (!project || !loaded) return;
    const timer = setTimeout(() => {
      saveProject(project).catch((e) =>
        setError(`Autosave failed: ${String(e)}`),
      );
    }, 450);
    return () => clearTimeout(timer);
  }, [project, loaded]);
  const renderProject = useMemo(
    () =>
      project
        ? {
            ...project,
            scenes: project.scenes.map((scene) => ({
              ...scene,
              layers: scene.layers.map((layer) =>
                layer.assetId
                  ? { ...layer, src: assets[layer.assetId] ?? layer.src }
                  : layer,
              ),
            })),
          }
        : null,
    [project, assets],
  );
  const sceneIndex = project?.scenes.findIndex((s) => s.id === sceneId) ?? 0;
  const selectedScene = project?.scenes[Math.max(0, sceneIndex)];
  const selectedLayer = selectedScene?.layers.find((l) => l.id === layerId);
  const frames = project ? totalFrames(project) : 150;
  const size = project ? dimensions[project.aspect] : dimensions.landscape;
  const sceneStart =
    project?.scenes
      .slice(0, Math.max(0, sceneIndex))
      .reduce((a, s) => a + s.duration, 0) ?? 0;
  const selectScene = useCallback(
    (index: number) => {
      if (!project) return;
      const bounded = Math.max(0, Math.min(project.scenes.length - 1, index));
      setSceneId(project.scenes[bounded].id);
      setLayerId(null);
      const at = project.scenes
        .slice(0, bounded)
        .reduce((a, s) => a + s.duration, 0);
      playerRef.current?.seekTo(at);
      setFrame(at);
    },
    [project],
  );
  const editScene = useCallback(
    (change: (scene: Scene) => void) => {
      if (!selectedScene) return;
      edit((p) => {
        const scene = p.scenes.find((s) => s.id === selectedScene.id);
        if (scene) change(scene);
      });
    },
    [selectedScene, edit],
  );
  function editLayer(change: (layer: Layer) => void) {
    if (!selectedLayer) return;
    const id = selectedLayer.id;
    edit((p) => {
      const layer = p.scenes.flatMap((s) => s.layers).find((l) => l.id === id);
      if (layer) change(layer);
    });
  }
  function addLayer(
    type: "text" | "shape" | "image",
    asset?: { id: string; data: string },
  ) {
    if (!selectedScene) return;
    const next =
      type === "shape"
        ? newShapeLayer(selectedScene.duration)
        : newTextLayer(selectedScene.duration);
    if (type === "image" && asset) {
      next.type = "image";
      next.name = "Uploaded image";
      next.assetId = asset.id;
      next.width = 45;
      next.height = 50;
      next.x = 28;
      next.y = 26;
      setAssets((current) => ({ ...current, [asset.id]: asset.data }));
    }
    editScene((scene) => scene.layers.push(next));
    setLayerId(next.id);
    setTab("elements");
  }
  async function upload(file?: File) {
    if (!file) return;
    try {
      const asset = await saveAsset(file);
      addLayer("image", asset);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }
  function addScene() {
    if (!project) return;
    const next: Scene = {
      id: uid(),
      name: `Scene ${project.scenes.length + 1}`,
      duration: 90,
      background: "#151B27",
      backgroundEnd: "#242040",
      layers: [newTextLayer(90)],
    };
    edit((p) => p.scenes.push(next));
    setSceneId(next.id);
    setLayerId(null);
    setTab("scenes");
  }
  function duplicateScene() {
    if (!selectedScene) return;
    const copy = structuredClone(selectedScene);
    copy.id = uid();
    copy.name += " Copy";
    copy.layers.forEach((l: Layer) => (l.id = uid()));
    edit((p) => p.scenes.splice(sceneIndex + 1, 0, copy));
    setSceneId(copy.id);
  }
  function moveScene(delta: number) {
    if (!selectedScene || !project) return;
    const to = sceneIndex + delta;
    if (to < 0 || to >= project.scenes.length) return;
    edit((p) => {
      const [item] = p.scenes.splice(sceneIndex, 1);
      p.scenes.splice(to, 0, item);
    });
  }
  function moveLayer(delta: number) {
    if (!selectedLayer || !selectedScene) return;
    const index = selectedScene.layers.findIndex((l) => l.id === layerId);
    const to = index + delta;
    if (to < 0 || to >= selectedScene.layers.length) return;
    editScene((s) => {
      const [item] = s.layers.splice(index, 1);
      s.layers.splice(to, 0, item);
    });
  }
  function resizeProject(seconds: number) {
    if (!project) return;
    const factor = (seconds * 30) / totalFrames(project);
    edit((p) =>
      p.scenes.forEach((s) => {
        const old = s.duration;
        s.duration = Math.max(15, Math.round(old * factor));
        s.layers.forEach((l) => {
          l.start = Math.min(s.duration - 1, Math.round(l.start * factor));
          l.duration = Math.max(
            1,
            Math.min(s.duration - l.start, Math.round(l.duration * factor)),
          );
          l.animationDuration = Math.max(
            4,
            Math.round(l.animationDuration * factor),
          );
          l.animationDelay = Math.max(0, Math.round(l.animationDelay * factor));
        });
      }),
    );
    setFrame(0);
    playerRef.current?.seekTo(0);
  }
  function changeTemplate(id: TemplateId) {
    if (!project) return;
    const fresh = createProject(id, Math.round(totalFrames(project) / 30));
    edit((p) => {
      p.template = id;
      p.scenes = fresh.scenes;
    });
    setSceneId(fresh.scenes[0].id);
    setLayerId(null);
    setReplaceTemplate(null);
    playerRef.current?.seekTo(0);
  }
  function downloadJson() {
    if (!project || !renderProject) return;
    const blob = new Blob([JSON.stringify(renderProject, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\W+/g, "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  async function importJson(file?: File) {
    if (!file) return;
    try {
      const value = projectSchema.parse(JSON.parse(await file.text()));
      edit((p) => {
        p.title = value.title;
        p.template = value.template;
        p.aspect = value.aspect;
        p.scenes = value.scenes;
      });
      setSceneId(value.scenes[0].id);
      setLayerId(null);
      setError("");
    } catch {
      setError("Import failed. Choose a valid Motion-Vid project JSON file.");
    }
  }
  async function exportVideo() {
    if (!renderProject) return;
    setRenderState("checking");
    setRenderError("");
    setProgress(0);
    try {
      const missing = renderProject.scenes
        .flatMap((s) => s.layers)
        .some((l) => l.type === "image" && !l.src);
      if (missing)
        throw new Error(
          "An uploaded image is missing from local storage. Remove or replace it before export.",
        );
      const supported = await browserRenderProvider.check(renderProject);
      if (!supported.ok)
        throw new Error(
          supported.reason ||
            "This browser cannot encode H.264 MP4. Use a current Chrome, Firefox, or Safari version, or render locally with Remotion CLI.",
        );
      const controller = new AbortController();
      abortRef.current = controller;
      setRenderState("rendering");
      const blob = await browserRenderProvider.render(
        renderProject,
        setProgress,
        controller.signal,
      );
      if (blob.size < 1000)
        throw new Error("The renderer returned an empty MP4.");
      downloadBlob(blob, renderProject);
      setRenderState("done");
    } catch (e) {
      if (abortRef.current?.signal.aborted) {
        setRenderState("cancelled");
      } else {
        setRenderError(e instanceof Error ? e.message : String(e));
        setRenderState("error");
      }
    } finally {
      abortRef.current = null;
    }
  }
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const update = (event: { detail: { frame: number } }) => {
      const current = event.detail.frame;
      setFrame(current);
      if (project) {
        let offset = 0;
        const active = project.scenes.find((scene) => {
          const inScene = current < offset + scene.duration;
          offset += scene.duration;
          return inScene;
        });
        if (active && active.id !== sceneId) {
          setSceneId(active.id);
          setLayerId(null);
        }
      }
    };
    const play = () => setPlaying(true);
    const pause = () => setPlaying(false);
    player.addEventListener("frameupdate", update);
    player.addEventListener("play", play);
    player.addEventListener("pause", pause);
    return () => {
      player.removeEventListener("frameupdate", update);
      player.removeEventListener("play", play);
      player.removeEventListener("pause", pause);
    };
  }, [loaded, project, sceneId]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) ||
        target?.isContentEditable
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.code === "Space") {
        e.preventDefault();
        if (playerRef.current?.isPlaying()) playerRef.current.pause();
        else playerRef.current?.play();
      } else if (e.key === "ArrowLeft") {
        playerRef.current?.seekTo(Math.max(0, frame - 1));
      } else if (e.key === "ArrowRight") {
        playerRef.current?.seekTo(Math.min(frames - 1, frame + 1));
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedLayer
      ) {
        editScene((s) => {
          s.layers = s.layers.filter((l) => l.id !== selectedLayer.id);
        });
        setLayerId(null);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, redo, frame, frames, selectedLayer, editScene]);
  if (!loaded)
    return <div className="studio-loading">Opening your studio…</div>;
  if (!project || !renderProject)
    return (
      <div className="studio-loading">
        <p>{error || "Project not found."}</p>
        <Link className="btn btn-primary" href="/dashboard">
          Back to projects
        </Link>
      </div>
    );
  const tickStep = zoom > 1.5 ? 15 : 30;
  const pxPerFrame = zoom * 2.1;
  function seekAt(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const gutter = e.currentTarget.classList.contains("ruler") ? 125 : 0;
    const next = Math.max(
      0,
      Math.min(
        frames - 1,
        Math.round((e.clientX - rect.left - gutter) / pxPerFrame),
      ),
    );
    playerRef.current?.seekTo(next);
    setFrame(next);
  }
  function dragEdge(
    e: React.PointerEvent,
    layer: Layer,
    edge: "start" | "end",
  ) {
    e.stopPropagation();
    const initial = e.clientX;
    const start = layer.start;
    const duration = layer.duration;
    const move = (event: PointerEvent) => {
      (e.currentTarget as HTMLElement).style.transform =
        `translateX(${event.clientX - initial}px)`;
    };
    const up = (event: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const delta = Math.round((event.clientX - initial) / pxPerFrame);
      edit((p) => {
        const target = p.scenes
          .flatMap((s) => s.layers)
          .find((l) => l.id === layer.id);
        if (!target) return;
        if (edge === "start") {
          const end = start + duration;
          target.start = Math.max(0, Math.min(end - 1, start + delta));
          target.duration = end - target.start;
        } else
          target.duration = Math.max(
            1,
            Math.min(selectedScene!.duration - start, duration + delta),
          );
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  return (
    <main className="studio">
      <header className="studio-header">
        <div className="studio-header-left">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="icon-button"
          >
            <ArrowLeft size={18} />
          </Link>
          <Brand compact />
          <div className="header-divider" />
          <input
            className="title-input"
            value={project.title}
            onChange={(e) =>
              edit((p) => {
                p.title = e.target.value || "Untitled project";
              })
            }
            aria-label="Project title"
          />
          <span className="save-state">
            <Save size={13} />
            Autosave on
          </span>
        </div>
        <div className="studio-header-right">
          <button
            className="icon-button"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={18} />
          </button>
          <div className="header-divider" />
          <Button variant="secondary" onClick={downloadJson}>
            <Download size={16} /> Project JSON
          </Button>
          <Button
            onClick={() => void exportVideo()}
            disabled={renderState === "checking" || renderState === "rendering"}
          >
            <Film size={17} />{" "}
            {renderState === "rendering"
              ? `${Math.round(progress * 100)}%`
              : "Export MP4"}
          </Button>
        </div>
      </header>
      <div className="studio-mobile-tabs">
        <button
          className={tab === "scenes" ? "active" : ""}
          onClick={() => setTab("scenes")}
        >
          Scenes
        </button>
        <button
          className={tab === "elements" ? "active" : ""}
          onClick={() => setTab("elements")}
        >
          Elements
        </button>
        <button
          className={tab === "templates" ? "active" : ""}
          onClick={() => setTab("templates")}
        >
          Templates
        </button>
        <button
          className={tab === "settings" ? "active" : ""}
          onClick={() => setTab("settings")}
        >
          Settings
        </button>
      </div>
      <div className="studio-layout">
        <aside className="editor-sidebar">
          <div className="sidebar-tabs">
            <button
              className={tab === "scenes" ? "active" : ""}
              onClick={() => setTab("scenes")}
              title="Scenes"
            >
              <Layers3 size={18} /> Scenes
            </button>
            <button
              className={tab === "elements" ? "active" : ""}
              onClick={() => setTab("elements")}
              title="Elements"
            >
              <Shapes size={18} /> Elements
            </button>
            <button
              className={tab === "templates" ? "active" : ""}
              onClick={() => setTab("templates")}
              title="Templates"
            >
              <Film size={18} /> Templates
            </button>
            <button
              className={tab === "settings" ? "active" : ""}
              onClick={() => setTab("settings")}
              title="Settings"
            >
              <Settings2 size={18} /> Settings
            </button>
          </div>
          <div className="sidebar-content">
            {tab === "scenes" && (
              <>
                <div className="panel-heading">
                  <div>
                    <small>STORYBOARD</small>
                    <h2>
                      Scenes <span>{project.scenes.length}</span>
                    </h2>
                  </div>
                  <button
                    className="icon-button"
                    title="Add scene"
                    onClick={addScene}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="scene-list">
                  {project.scenes.map((scene, i) => (
                    <button
                      className={`scene-item ${scene.id === sceneId ? "selected" : ""}`}
                      key={scene.id}
                      onClick={() => selectScene(i)}
                    >
                      <span className="scene-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="scene-mini"
                        style={{
                          background: `linear-gradient(135deg,${scene.background},${scene.backgroundEnd})`,
                        }}
                      >
                        {scene.layers
                          .find((l) => l.type === "text")
                          ?.text.slice(0, 14)}
                      </span>
                      <span className="scene-description">
                        <strong>{scene.name}</strong>
                        <small>
                          {(scene.duration / 30).toFixed(1)}s ·{" "}
                          {scene.layers.length} layers
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="sidebar-actions">
                  <Button variant="secondary" onClick={addScene}>
                    <Plus size={16} /> Add scene
                  </Button>
                  <Button variant="ghost" onClick={duplicateScene}>
                    <Copy size={15} /> Duplicate
                  </Button>
                </div>
                {selectedScene && (
                  <div className="sidebar-actions">
                    <button
                      onClick={() => moveScene(-1)}
                      disabled={sceneIndex === 0}
                    >
                      <ChevronUp size={16} /> Move up
                    </button>
                    <button
                      onClick={() => moveScene(1)}
                      disabled={sceneIndex === project.scenes.length - 1}
                    >
                      <ChevronDown size={16} /> Move down
                    </button>
                    <button
                      onClick={() => setConfirmScene(true)}
                      disabled={project.scenes.length === 1}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === "elements" && (
              <>
                <div className="panel-heading">
                  <div>
                    <small>YOUR BUILDING BLOCKS</small>
                    <h2>Elements</h2>
                  </div>
                </div>
                <div className="element-add">
                  <button onClick={() => addLayer("text")}>
                    <TextCursorInput size={21} />
                    <span>Text layer</span>
                    <Plus size={15} />
                  </button>
                  <button onClick={() => addLayer("shape")}>
                    <Shapes size={21} />
                    <span>Shape layer</span>
                    <Plus size={15} />
                  </button>
                  <button onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={21} />
                    <span>Upload image</span>
                    <Plus size={15} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => void upload(e.target.files?.[0])}
                  />
                </div>
                <div className="panel-heading minor">
                  <div>
                    <small>CURRENT SCENE</small>
                    <h2>Layers</h2>
                  </div>
                </div>
                <div className="layer-list">
                  {selectedScene?.layers.map((l, i) => (
                    <button
                      key={l.id}
                      className={l.id === layerId ? "selected" : ""}
                      onClick={() => setLayerId(l.id)}
                    >
                      <span>
                        {l.type === "text" || l.type === "kpi" ? (
                          <TextCursorInput size={16} />
                        ) : l.type === "image" ? (
                          <ImagePlus size={16} />
                        ) : (
                          <Shapes size={16} />
                        )}
                      </span>
                      <strong>{l.name}</strong>
                      <small>{i + 1}</small>
                    </button>
                  ))}
                </div>
                {selectedLayer && (
                  <div className="sidebar-actions">
                    <button
                      onClick={() => moveLayer(-1)}
                      disabled={selectedScene?.layers[0].id === layerId}
                    >
                      <ChevronUp size={16} /> Up
                    </button>
                    <button
                      onClick={() => moveLayer(1)}
                      disabled={selectedScene?.layers.at(-1)?.id === layerId}
                    >
                      <ChevronDown size={16} /> Down
                    </button>
                    <button onClick={() => setConfirmLayer(true)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === "templates" && (
              <>
                <div className="panel-heading">
                  <div>
                    <small>STARTING POINTS</small>
                    <h2>Templates</h2>
                  </div>
                </div>
                <p className="panel-hint">
                  Switching templates replaces the current scene layout. Your
                  project title and settings stay.
                </p>
                <div className="template-list">
                  {templateIds.map((id) => (
                    <button
                      key={id}
                      className={project.template === id ? "selected" : ""}
                      onClick={() => setReplaceTemplate(id)}
                    >
                      <span className={`template-swatch template-${id}`}>
                        {id === "data"
                          ? "84%"
                          : id === "logo"
                            ? "A"
                            : id === "saas"
                              ? "N"
                              : "M"}
                      </span>
                      <span>
                        <strong>{templateMeta[id].title}</strong>
                        <small>{templateMeta[id].category}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === "settings" && (
              <>
                <div className="panel-heading">
                  <div>
                    <small>VIDEO SETUP</small>
                    <h2>Project settings</h2>
                  </div>
                </div>
                <div className="settings-list">
                  <Field label="Aspect ratio">
                    <select
                      value={project.aspect}
                      onChange={(e) =>
                        edit((p) => {
                          p.aspect = e.target.value as Project["aspect"];
                        })
                      }
                    >
                      <option value="landscape">Landscape · 16:9</option>
                      <option value="vertical">Vertical · 9:16</option>
                      <option value="square">Square · 1:1</option>
                    </select>
                  </Field>
                  <Field label="Duration preset">
                    <select
                      value={
                        durationPresets.includes(Math.round(frames / 30))
                          ? Math.round(frames / 30)
                          : ""
                      }
                      onChange={(e) => resizeProject(Number(e.target.value))}
                    >
                      <option value="" disabled>
                        Custom · {(frames / 30).toFixed(1)}s
                      </option>
                      {durationPresets.map((n) => (
                        <option key={n} value={n}>
                          {n} seconds
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Frame rate">
                    <div className="readonly">30 FPS</div>
                  </Field>
                  <Field label="Resolution">
                    <div className="readonly">
                      {size.width} × {size.height}
                    </div>
                  </Field>
                  <Button
                    variant="secondary"
                    onClick={() => jsonRef.current?.click()}
                  >
                    <UploadIcon /> Import project JSON
                  </Button>
                  <input
                    ref={jsonRef}
                    hidden
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => void importJson(e.target.files?.[0])}
                  />
                </div>
              </>
            )}
          </div>
        </aside>
        <section className="preview-column">
          <div className="workspace-label">
            <span>COMPOSITION PREVIEW</span>
            <span>
              {size.width} × {size.height} · 30 FPS
            </span>
          </div>
          <div ref={previewRef} className="preview-stage">
            <div
              className="player-wrap"
              style={{
                aspectRatio: `${size.width}/${size.height}`,
                maxHeight:
                  project.aspect === "vertical"
                    ? "min(56vh, 560px)"
                    : undefined,
              }}
            >
              <Player
                ref={playerRef}
                component={StudioVideo}
                inputProps={{ project: renderProject }}
                durationInFrames={Math.max(1, frames)}
                compositionWidth={size.width}
                compositionHeight={size.height}
                fps={30}
                initialFrame={Math.min(12, frames - 1)}
                controls={false}
                autoPlay={false}
                acknowledgeRemotionLicense
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
          <div className="preview-controls">
            <div className="play-group">
              <button
                className="icon-button"
                title="Restart"
                onClick={() => playerRef.current?.seekTo(0)}
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="play-button"
                aria-label={playing ? "Pause" : "Play"}
                onClick={() =>
                  playing
                    ? playerRef.current?.pause()
                    : playerRef.current?.play()
                }
              >
                {playing ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
              </button>
              <span className="timecode">
                {`${String(Math.floor(frame / 1800)).padStart(2, "0")}:${String(Math.floor((frame % 1800) / 30)).padStart(2, "0")}:${String(frame % 30).padStart(2, "0")}`}{" "}
                <i>/</i> {(frames / 30).toFixed(1)}s
              </span>
            </div>
            <div className="play-group">
              <span className="preview-chip">
                {project.aspect.toUpperCase()}
              </span>
              <button
                className="icon-button"
                title="Fullscreen preview"
                aria-label="Fullscreen preview"
                onClick={() => void previewRef.current?.requestFullscreen?.()}
              >
                <Expand size={18} />
              </button>
            </div>
          </div>
          {error && (
            <div className="notice error">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          )}
          {renderState !== "idle" && (
            <div className={`render-status ${renderState}`}>
              <div>
                <strong>
                  {renderState === "checking"
                    ? "Checking browser support…"
                    : renderState === "rendering"
                      ? `Rendering MP4 · ${Math.round(progress * 100)}%`
                      : renderState === "done"
                        ? "MP4 downloaded"
                        : renderState === "cancelled"
                          ? "Export cancelled"
                          : "Export failed"}
                </strong>
                <small>
                  {renderState === "error"
                    ? renderError
                    : renderState === "rendering"
                      ? "Keep this tab open while frames are encoded in your browser."
                      : renderState === "done"
                        ? "The video is ready in your downloads."
                        : ""}
                </small>
              </div>
              {renderState === "rendering" ? (
                <Button
                  variant="secondary"
                  onClick={() => abortRef.current?.abort()}
                >
                  Cancel
                </Button>
              ) : (
                <button
                  className="icon-button"
                  aria-label="Dismiss export status"
                  onClick={() => setRenderState("idle")}
                >
                  <X size={16} />
                </button>
              )}
              {renderState === "rendering" && (
                <div className="render-progress">
                  <span style={{ width: `${progress * 100}%` }} />
                </div>
              )}
            </div>
          )}
        </section>
        <aside className="inspector">
          <div className="panel-heading">
            <div>
              <small>PROPERTIES</small>
              <h2>
                {selectedLayer
                  ? selectedLayer.name
                  : selectedScene?.name || "Inspector"}
              </h2>
            </div>
          </div>
          <div className="inspector-scroll">
            {selectedLayer ? (
              <>
                <div className="inspector-section">
                  <h3>Content</h3>
                  <Field label="Layer name">
                    <input
                      value={selectedLayer.name}
                      onChange={(e) =>
                        editLayer((l) => {
                          l.name = e.target.value;
                        })
                      }
                    />
                  </Field>
                  {(selectedLayer.type === "text" ||
                    selectedLayer.type === "kpi") && (
                    <Field label="Text">
                      <textarea
                        value={selectedLayer.text}
                        rows={3}
                        onChange={(e) =>
                          editLayer((l) => {
                            l.text = e.target.value;
                          })
                        }
                      />
                    </Field>
                  )}
                  {(selectedLayer.type === "bars" ||
                    selectedLayer.type === "line") && (
                    <Field label="Values · comma separated">
                      <input
                        value={selectedLayer.values.join(", ")}
                        onChange={(e) =>
                          editLayer((l) => {
                            l.values = e.target.value
                              .split(",")
                              .map(Number)
                              .filter(Number.isFinite)
                              .slice(0, 12);
                          })
                        }
                      />
                    </Field>
                  )}
                </div>
                <div className="inspector-section">
                  <h3>Appearance</h3>
                  <div className="field-grid">
                    <Field label="Color">
                      <input
                        type="color"
                        value={selectedLayer.color}
                        onChange={(e) =>
                          editLayer((l) => {
                            l.color = e.target.value;
                          })
                        }
                      />
                    </Field>
                    <Field label="Fill">
                      <input
                        type="color"
                        value={selectedLayer.background}
                        onChange={(e) =>
                          editLayer((l) => {
                            l.background = e.target.value;
                          })
                        }
                      />
                    </Field>
                  </div>
                  {(selectedLayer.type === "text" ||
                    selectedLayer.type === "kpi") && (
                    <>
                      <Field label="Font">
                        <select
                          value={selectedLayer.fontFamily}
                          onChange={(e) =>
                            editLayer((l) => {
                              l.fontFamily = e.target
                                .value as Layer["fontFamily"];
                            })
                          }
                        >
                          <option>Inter</option>
                          <option>Arial</option>
                          <option>Georgia</option>
                        </select>
                      </Field>
                      <div className="field-grid">
                        <Field label="Size">
                          {num(
                            selectedLayer.fontSize,
                            (n) =>
                              editLayer((l) => {
                                l.fontSize = n;
                              }),
                            12,
                            180,
                          )}
                        </Field>
                        <Field label="Weight">
                          <select
                            value={selectedLayer.fontWeight}
                            onChange={(e) =>
                              editLayer((l) => {
                                l.fontWeight = Number(e.target.value);
                              })
                            }
                          >
                            {[300, 400, 500, 600, 700, 800, 900].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <Field label="Alignment">
                        <select
                          value={selectedLayer.align}
                          onChange={(e) =>
                            editLayer((l) => {
                              l.align = e.target.value as Layer["align"];
                            })
                          }
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </Field>
                    </>
                  )}
                </div>
                <div className="inspector-section">
                  <h3>Transform</h3>
                  <div className="field-grid">
                    <Field label="Position X %">
                      {num(
                        selectedLayer.x,
                        (n) =>
                          editLayer((l) => {
                            l.x = n;
                          }),
                        0,
                        100,
                      )}
                    </Field>
                    <Field label="Position Y %">
                      {num(
                        selectedLayer.y,
                        (n) =>
                          editLayer((l) => {
                            l.y = n;
                          }),
                        0,
                        100,
                      )}
                    </Field>
                    <Field label="Width %">
                      {num(
                        selectedLayer.width,
                        (n) =>
                          editLayer((l) => {
                            l.width = n;
                          }),
                        5,
                        100,
                      )}
                    </Field>
                    {(selectedLayer.type === "shape" ||
                      selectedLayer.type === "image") && (
                      <Field label="Height %">
                        {num(
                          selectedLayer.height,
                          (n) =>
                            editLayer((l) => {
                              l.height = n;
                            }),
                          1,
                          100,
                        )}
                      </Field>
                    )}
                    <Field label="Scale">
                      {num(
                        selectedLayer.scale,
                        (n) =>
                          editLayer((l) => {
                            l.scale = n;
                          }),
                        0.1,
                        4,
                        0.1,
                      )}
                    </Field>
                    <Field label="Rotation">
                      {num(
                        selectedLayer.rotation,
                        (n) =>
                          editLayer((l) => {
                            l.rotation = n;
                          }),
                        -360,
                        360,
                      )}
                    </Field>
                    <Field label="Opacity">
                      {num(
                        selectedLayer.opacity,
                        (n) =>
                          editLayer((l) => {
                            l.opacity = n;
                          }),
                        0,
                        1,
                        0.05,
                      )}
                    </Field>
                  </div>
                </div>
                <div className="inspector-section">
                  <h3>Timing & motion</h3>
                  <Field label="Animation">
                    <select
                      value={selectedLayer.animation}
                      onChange={(e) =>
                        editLayer((l) => {
                          l.animation = e.target.value as Layer["animation"];
                        })
                      }
                    >
                      {["fade", "slide", "scale", "type", "pop", "none"].map(
                        (value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <div className="field-grid">
                    <Field label="Start frame">
                      {num(
                        selectedLayer.start,
                        (n) =>
                          editLayer((l) => {
                            l.start = n;
                            l.duration = Math.min(
                              l.duration,
                              selectedScene!.duration - n,
                            );
                          }),
                        0,
                        selectedScene!.duration - 1,
                      )}
                    </Field>
                    <Field label="Length · frames">
                      {num(
                        selectedLayer.duration,
                        (n) =>
                          editLayer((l) => {
                            l.duration = n;
                          }),
                        1,
                        selectedScene!.duration - selectedLayer.start,
                      )}
                    </Field>
                    <Field label="Anim. frames">
                      {num(
                        selectedLayer.animationDuration,
                        (n) =>
                          editLayer((l) => {
                            l.animationDuration = n;
                          }),
                        1,
                        150,
                      )}
                    </Field>
                    <Field label="Delay · frames">
                      {num(
                        selectedLayer.animationDelay,
                        (n) =>
                          editLayer((l) => {
                            l.animationDelay = n;
                          }),
                        0,
                        150,
                      )}
                    </Field>
                  </div>
                </div>
              </>
            ) : selectedScene ? (
              <>
                <div className="inspector-section">
                  <h3>Scene</h3>
                  <Field label="Name">
                    <input
                      value={selectedScene.name}
                      onChange={(e) =>
                        editScene((s) => {
                          s.name = e.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Duration · frames">
                    {num(
                      selectedScene.duration,
                      (n) =>
                        editScene((s) => {
                          s.duration = n;
                          s.layers.forEach((l) => {
                            l.start = Math.min(l.start, n - 1);
                            l.duration = Math.min(l.duration, n - l.start);
                          });
                        }),
                      15,
                      900,
                    )}
                  </Field>
                  <div className="field-grid">
                    <Field label="Background">
                      <input
                        type="color"
                        value={selectedScene.background}
                        onChange={(e) =>
                          editScene((s) => {
                            s.background = e.target.value;
                          })
                        }
                      />
                    </Field>
                    <Field label="Gradient end">
                      <input
                        type="color"
                        value={selectedScene.backgroundEnd}
                        onChange={(e) =>
                          editScene((s) => {
                            s.backgroundEnd = e.target.value;
                          })
                        }
                      />
                    </Field>
                  </div>
                  <p className="panel-hint">
                    Select a layer in the Elements panel or timeline to edit its
                    properties.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </aside>
      </div>
      <section className="timeline-panel">
        <div className="timeline-header">
          <div>
            <strong>TIMELINE</strong>
            <span>
              {project.scenes.length} SCENES · {frames} FRAMES
            </span>
          </div>
          <div>
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              aria-label="Zoom out"
            >
              <Minus size={16} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              aria-label="Zoom in"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="timeline-scroll" ref={timelineRef}>
          <div
            className="timeline-content"
            style={{ width: Math.max(650, 125 + frames * pxPerFrame) }}
          >
            <div className="ruler" onClick={seekAt}>
              {Array.from(
                { length: Math.ceil(frames / tickStep) + 1 },
                (_, i) => i * tickStep,
              )
                .filter((n) => n <= frames)
                .map((n) => (
                  <span key={n} style={{ left: 125 + n * pxPerFrame }}>
                    {(n / 30).toFixed(0)}s
                  </span>
                ))}
            </div>
            <div className="scene-track">
              {project.scenes.map((s, i) => (
                <button
                  key={s.id}
                  className={s.id === sceneId ? "active" : ""}
                  style={{
                    width: s.duration * pxPerFrame,
                    background: `linear-gradient(90deg,${s.background},${s.backgroundEnd})`,
                  }}
                  onClick={() => selectScene(i)}
                >
                  <span>
                    {String(i + 1).padStart(2, "0")} · {s.name}
                  </span>
                </button>
              ))}
            </div>
            {selectedScene?.layers.map((l) => (
              <div className="track-row" key={l.id}>
                <span
                  className="track-name"
                  onClick={() => {
                    setLayerId(l.id);
                    setTab("elements");
                  }}
                >
                  {l.type} · {l.name}
                </span>
                <div className="track-lane" onClick={seekAt}>
                  <button
                    className={`track-clip ${l.id === layerId ? "active" : ""}`}
                    style={{
                      left: (sceneStart + l.start) * pxPerFrame,
                      width: Math.max(18, l.duration * pxPerFrame),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLayerId(l.id);
                      setTab("elements");
                    }}
                  >
                    <span
                      className="resize-handle"
                      onPointerDown={(e) => dragEdge(e, l, "start")}
                    />
                    <span className="clip-label">{l.name}</span>
                    <span
                      className="resize-handle"
                      onPointerDown={(e) => dragEdge(e, l, "end")}
                    />
                  </button>
                </div>
              </div>
            ))}
            <div
              className="playhead"
              style={{ left: 125 + frame * pxPerFrame }}
            >
              <span />
            </div>
          </div>
        </div>
        <div className="timeline-foot">
          SPACE · PLAY/PAUSE <i /> ← → · STEP FRAME <i /> CTRL+Z · UNDO <i />{" "}
          DRAG CLIP EDGES · TRIM
        </div>
      </section>
      <ConfirmDialog
        open={confirmScene}
        onOpenChange={setConfirmScene}
        title="Delete scene?"
        description="This removes the selected scene and all of its layers."
        confirm="Delete scene"
        onConfirm={() => {
          if (!selectedScene) return;
          edit((p) => {
            p.scenes = p.scenes.filter((s) => s.id !== selectedScene.id);
          });
          setSceneId(project.scenes[Math.max(0, sceneIndex - 1)]?.id || null);
          setLayerId(null);
        }}
      />
      <ConfirmDialog
        open={confirmLayer}
        onOpenChange={setConfirmLayer}
        title="Delete layer?"
        description="This removes the selected element from the scene."
        confirm="Delete layer"
        onConfirm={() => {
          if (!selectedLayer) return;
          editScene((s) => {
            s.layers = s.layers.filter((l) => l.id !== selectedLayer.id);
          });
          setLayerId(null);
        }}
      />
      <ConfirmDialog
        open={!!replaceTemplate}
        onOpenChange={(open) => !open && setReplaceTemplate(null)}
        title="Replace this template?"
        description="This replaces the current scenes. You can undo it with Ctrl+Z."
        confirm="Replace scenes"
        onConfirm={() => {
          if (replaceTemplate) changeTemplate(replaceTemplate);
        }}
      />
    </main>
  );
}
function UploadIcon() {
  return <Download size={16} style={{ transform: "rotate(180deg)" }} />;
}
