# Motion-Vid Studio

A local-first motion graphics studio built with Next.js and Remotion. Create a project from a template, edit scenes and layers, preview the same composition used for rendering, and download an MP4 directly from a supported browser. The repository retains its original MIT license.

## What works

- Four editable compositions: Kinetic Typography, SaaS Product Launch, Data Explainer, and Minimal Logo Reveal. The data template explicitly marks its values as illustrative sample data.
- A project dashboard with search, rename, duplicate, delete confirmation, import, and recent edit times.
- A responsive editor with scene and layer editing, playback, frame seeking, timeline zoom, clip-edge trimming, scene and layer reordering, undo/redo, and keyboard shortcuts.
- Text, shape, image, bar chart, line chart, and KPI layers with frame-based animation presets.
- IndexedDB autosave for projects and uploaded images. No account or API key is needed.
- Versioned Zod project validation and portable JSON export. Exported JSON embeds uploaded images so it can be rendered on another machine.
- Browser-side H.264 MP4 export with support checks, real progress, cancellation, and an error message when rendering is unavailable.

## Stack and architecture

Next.js App Router, strict TypeScript, React, Tailwind CSS, shadcn/ui components built on Radix UI, Lucide, Zustand, IndexedDB (`idb`), Zod, Remotion, `@remotion/player`, and `@remotion/web-renderer`.

`src/lib/project.ts` defines the normalized, versioned project schema. `src/lib/templates.ts` creates template scene/layer data. `src/video/StudioVideo.tsx` is the sole composition for both Player preview and MP4 rendering. `src/lib/render.ts` defines a render-provider interface and implements browser rendering. `src/lib/db.ts` stores local projects and images. `src/lib/editor-store.ts` manages edit history. Routes live in `src/app/`.

AI Director is a future feature. The proposed boundary is prompt → server-generated JSON → Zod validation → user editing/confirmation → normal Remotion render. No AI calls or API keys are present in this MVP.

## Run locally

Use Node.js 20.9 or newer.

```powershell
cd D:\Hobby\Motion-Vid
npm install
npm run dev
```

For the official Remotion Agent Skills used during development, run `npx -y skills@latest add remotion-dev/skills`. The generated `.agents/` directory is local tooling and is not required to run the app.

Open `http://localhost:3000`. Create a project from the dashboard or a homepage template. Projects are saved in the current browser profile; clearing site data removes them. Use **Project JSON** to back up a project.

Checks:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

The end-to-end suite checks creation, live editing, refresh persistence, browser MP4 download, video metadata, and changes between two decoded frames. It writes a verified sample to `output/verified-logo-reveal.mp4`.

## Render locally with Node.js

The browser editor has **Project JSON** in its header. Download that file first. Then run:

```powershell
npm run render:project -- .\my-project.json .\out\my-project.mp4
```

The local script passes the same project data to the Remotion CLI and adjusts duration and output dimensions from the JSON. It needs images embedded in exported JSON. To render the bundled default composition:

```powershell
npm run render:local
```

Local CLI rendering uses Node/Chrome and is separate from the browser exporter. For a later cloud queue, add another implementation of the `RenderProvider` interface rather than running long renders in a Next.js request handler.

## Browser export and compatibility

The editor checks `canRenderMediaOnWeb()` before export, then calls `renderMediaOnWeb()` with the same project object given to the Player. It uses MP4/H.264 and no audio. A secure browser context (`https://` or `localhost`) and WebCodecs support are required. Remotion lists Chrome 94+, Firefox 130+, and Safari 26+ as minimums; actual H.264 encoding support also depends on the device and browser configuration. Keep the tab open during export. Long, high-resolution projects may use significant memory.

If the browser reports that MP4 encoding is unavailable, use the local Node rendering command above. The UI reports the precise compatibility or rendering failure rather than offering a fake download.

Current browser-renderer styling support is narrower than full Chrome screenshots. Templates use supported layout, color, gradient, transform, and opacity properties, and avoid unsupported 3D effects. See [Remotion client-side rendering](https://www.remotion.dev/docs/client-side-rendering), [limitations](https://www.remotion.dev/docs/client-side-rendering/limitations), and [renderMediaOnWeb](https://www.remotion.dev/docs/web-renderer/render-media-on-web).

## Deploy to Vercel

Import `ariefzzz5421/Motion-Vid` as a Next.js project in Vercel. Use the default build command `npm run build` and output settings. No environment variables or backend services are needed. Deploy over HTTPS so WebCodecs is available. Projects remain in each visitor's browser, so they do not sync across devices. Browser rendering happens on the visitor's machine; Vercel Functions do not perform long-running renders.

Remotion has [separate licensing terms](https://www.remotion.dev/docs/license/pricing) from this repository's MIT license. Review its current Free, Company, and Automators requirements before commercial use or offering video creation to others. In particular, team size and automated video-product usage may require a paid license.

## Limitations and roadmap

- Projects and uploads live only in IndexedDB. There is no account, cross-device sync, or shared cloud storage.
- Audio tracks, video uploads, AI Director, and cloud rendering are not in this MVP.
- JSON imports containing image references without embedded image data will show a missing-media error at export.
- Aspect changes preserve normalized layer positions, but very long text may still need manual typography adjustment for vertical layouts.
- The advanced timeline supports selecting, reordering, and trimming, but not keyframe curves or waveform editing.
- `npm audit` still reports five high advisories in the development-only Next.js ESLint dependency chain (`fast-glob` → `micromatch` → `braces`). The installed versions are currently the newest compatible releases; `npm audit --omit=dev` reports zero production advisories. Recheck for upstream fixes before extending the tooling.

The next major improvement is an optional cloud render provider with a durable queue and persisted media library. This would enable large exports and cross-device projects without changing the scene schema.
