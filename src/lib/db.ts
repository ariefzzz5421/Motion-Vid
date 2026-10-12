import { openDB } from "idb";
import { projectSchema, type Project } from "./project";
const db = () =>
  openDB("motion-vid-studio", 1, {
    upgrade(database) {
      database.createObjectStore("projects", { keyPath: "id" });
      database.createObjectStore("assets", { keyPath: "id" });
    },
  });
export async function listProjects(): Promise<Project[]> {
  const all = await (await db()).getAll("projects");
  return all
    .map((item) => projectSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function getProject(id: string): Promise<Project | null> {
  const value = await (await db()).get("projects", id);
  const parsed = projectSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
export async function saveProject(project: Project) {
  await (await db()).put("projects", projectSchema.parse(project));
}
export async function deleteProject(id: string) {
  await (await db()).delete("projects", id);
}
export async function saveAsset(
  file: File,
): Promise<{ id: string; data: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 8 * 1024 * 1024)
    throw new Error("Images must be smaller than 8 MB.");
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const id = crypto.randomUUID();
  await (await db()).put("assets", { id, data, name: file.name });
  return { id, data };
}
export async function getAsset(id: string): Promise<string | undefined> {
  return (await (await db()).get("assets", id))?.data;
}
