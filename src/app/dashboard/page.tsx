"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Film,
  Plus,
  Search,
  Trash2,
  Pencil,
  Upload,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button, ConfirmDialog, TextInputDialog } from "@/components/ui";
import { TemplateCard } from "@/components/TemplateCard";
import { createProject, templateMeta } from "@/lib/templates";
import { deleteProject, listProjects, saveProject } from "@/lib/db";
import {
  cloneProject,
  projectSchema,
  uid,
  type Project,
  type TemplateId,
} from "@/lib/project";
export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [remove, setRemove] = useState<Project | null>(null);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState("");
  async function refresh() {
    setProjects(await listProjects());
    setLoading(false);
  }
  useEffect(() => {
    void listProjects()
      .then((items) => {
        setProjects(items);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);
  async function create(template: TemplateId) {
    const project = createProject(template);
    await saveProject(project);
    router.push(`/studio/${project.id}`);
  }
  async function duplicate(project: Project) {
    const copy = cloneProject(project);
    copy.id = uid();
    copy.title = `${copy.title} Copy`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = copy.createdAt;
    copy.scenes.forEach((scene) => {
      scene.id = uid();
      scene.layers.forEach((layer) => (layer.id = uid()));
    });
    await saveProject(copy);
    await refresh();
  }
  async function rename(project: Project, title: string) {
    await saveProject({
      ...project,
      title,
      updatedAt: new Date().toISOString(),
    });
    await refresh();
    setRenameTarget(null);
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      const parsed = projectSchema.parse(JSON.parse(await file.text()));
      const project = {
        ...parsed,
        id: uid(),
        title: `${parsed.title} Imported`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveProject(project);
      await refresh();
      setError("");
    } catch {
      setError("Import failed. Choose a valid Motion-Vid project JSON file.");
    }
  }
  const visible = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main className="dashboard">
      <header className="app-header">
        <Brand />
        <div className="header-actions">
          <Link href="/" className="subtle-link">
            <ArrowLeft size={15} /> Website
          </Link>
          <label className="btn btn-secondary">
            <Upload size={16} /> Import JSON
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => void importFile(e.target.files?.[0])}
            />
          </label>
        </div>
      </header>
      <div className="dashboard-content">
        <div className="dash-title">
          <div>
            <div className="eyebrow">YOUR CREATIVE WORKSPACE</div>
            <h1>
              My projects<span>.</span>
            </h1>
            <p>
              Every story starts somewhere. Pick up where you left off, or start
              a new composition.
            </p>
          </div>
          <Button
            onClick={() =>
              document
                .getElementById("templates")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Plus size={17} /> New project
          </Button>
        </div>
        {error && <div className="notice error">{error}</div>}
        <section className="project-section">
          <div className="row-heading">
            <div>
              <h2>Recent projects</h2>
              <span>{projects.length} projects</span>
            </div>
            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects"
                aria-label="Search projects"
              />
            </label>
          </div>
          {loading ? (
            <div className="empty-state">Loading projects…</div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <Film size={31} />
              <h3>
                {search
                  ? "No matching projects"
                  : "Your next story starts here"}
              </h3>
              <p>
                {search
                  ? "Try a different search term."
                  : "Choose a template below to create your first motion graphic."}
              </p>
            </div>
          ) : (
            <div className="project-grid">
              {visible.map((project) => (
                <article
                  className={`project-card template-${project.template}`}
                  key={project.id}
                >
                  <button
                    className="project-thumb"
                    onClick={() => router.push(`/studio/${project.id}`)}
                  >
                    <div className="thumb-orbit" />
                    <span>
                      {project.scenes[0].layers.find((l) => l.type === "text")
                        ?.text || templateMeta[project.template].title}
                    </span>
                    <small>
                      {project.aspect.toUpperCase()} ·{" "}
                      {Math.round(
                        project.scenes.reduce((a, s) => a + s.duration, 0) / 30,
                      )}{" "}
                      SEC
                    </small>
                  </button>
                  <div className="project-info">
                    <div>
                      <button
                        className="project-name"
                        onClick={() => router.push(`/studio/${project.id}`)}
                      >
                        {project.title}
                      </button>
                      <p>
                        {templateMeta[project.template].title} · Edited{" "}
                        {new Date(project.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="project-actions">
                      <button
                        title="Rename"
                        aria-label={`Rename ${project.title}`}
                        onClick={() => {
                          setRenameTarget(project);
                          setRenameValue(project.title);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        title="Duplicate"
                        aria-label={`Duplicate ${project.title}`}
                        onClick={() => void duplicate(project)}
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        title="Delete"
                        aria-label={`Delete ${project.title}`}
                        onClick={() => setRemove(project)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="project-section" id="templates">
          <div className="row-heading">
            <div>
              <h2>Start from a template</h2>
              <span>Professional motion, ready to make your own</span>
            </div>
          </div>
          <div className="template-grid">
            {(["kinetic", "saas", "data", "logo"] as TemplateId[]).map((id) => (
              <TemplateCard key={id} id={id} onChoose={create} />
            ))}
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(open) => !open && setRemove(null)}
        title="Delete this project?"
        description="This removes the project from this browser. This action cannot be undone."
        confirm="Delete project"
        onConfirm={() => {
          if (remove) void deleteProject(remove.id).then(refresh);
        }}
      />
      <TextInputDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        title="Rename project"
        label="Project name"
        value={renameValue}
        onValueChange={setRenameValue}
        confirm="Save name"
        onConfirm={(title) => {
          if (renameTarget)
            void rename(renameTarget, title).catch((error) =>
              setError(String(error)),
            );
        }}
      />
    </main>
  );
}
