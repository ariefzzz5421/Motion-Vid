import { create } from "zustand";
import { cloneProject, type Project } from "./project";

type State = {
  project: Project | null;
  past: Project[];
  future: Project[];
  load: (project: Project) => void;
  edit: (change: (project: Project) => void) => void;
  undo: () => void;
  redo: () => void;
};
export const useEditor = create<State>((set) => ({
  project: null,
  past: [],
  future: [],
  load: (project) => set({ project, past: [], future: [] }),
  edit: (change) =>
    set((state) => {
      if (!state.project) return state;
      const next = cloneProject(state.project);
      change(next);
      next.updatedAt = new Date().toISOString();
      return {
        project: next,
        past: [...state.past.slice(-49), state.project],
        future: [],
      };
    }),
  undo: () =>
    set((state) =>
      state.project && state.past.length
        ? {
            project: state.past[state.past.length - 1],
            past: state.past.slice(0, -1),
            future: [state.project, ...state.future],
          }
        : state,
    ),
  redo: () =>
    set((state) =>
      state.project && state.future.length
        ? {
            project: state.future[0],
            past: [...state.past, state.project],
            future: state.future.slice(1),
          }
        : state,
    ),
}));
