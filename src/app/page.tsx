"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Clapperboard,
  Layers3,
  Play,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import dynamic from "next/dynamic";
import { TemplateCard } from "@/components/TemplateCard";
import { createProject } from "@/lib/templates";
import { saveProject } from "@/lib/db";
import type { TemplateId } from "@/lib/project";
const HeroVideo = dynamic(() => import("@/components/HeroVideo"), {
  ssr: false,
  loading: () => <div className="hero-video-loading">Preparing preview…</div>,
});
export default function Home() {
  const router = useRouter();
  async function create(template: TemplateId) {
    const project = createProject(template);
    await saveProject(project);
    router.push(`/studio/${project.id}`);
  }
  return (
    <main className="landing">
      <header className="site-nav wrap">
        <Brand />
        <nav>
          <a href="#templates">Templates</a>
          <a href="#how-it-works">How it works</a>
          <a
            href="https://github.com/ariefzzz5421/Motion-Vid"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ArrowUpRight size={14} />
          </a>
        </nav>
        <Link className="nav-cta" href="/dashboard">
          Open Studio <ArrowRight size={16} />
        </Link>
      </header>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> THE MOTION GRAPHICS WORKSPACE
          </div>
          <h1>
            Make your
            <br />
            <em>ideas move.</em>
          </h1>
          <p>
            Create cinematic launch films, kinetic typography, and data stories
            in a studio powered by code. Edit every layer. Preview every frame.
            Export the real thing.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/dashboard">
              Open Studio <ArrowRight size={18} />
            </Link>
            <a className="text-link" href="#templates">
              Explore templates <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="hero-proof">
            <span>
              <i /> FOUR EDITABLE TEMPLATES
            </span>
            <span>
              <i /> FRAME-ACCURATE PREVIEW
            </span>
            <span>
              <i /> MP4 EXPORT
            </span>
          </div>
        </div>
        <div className="hero-showcase">
          <div className="showcase-top">
            <span>
              <i />
              <i />
              <i /> LIVE REMOTION PREVIEW
            </span>
            <span>15 SEC · 30 FPS</span>
          </div>
          <div className="showcase-canvas">
            <HeroVideo />
          </div>
          <div className="showcase-timeline">
            <Play size={14} fill="currentColor" />
            <div className="timeline-decoration">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span>1280 × 720</span>
          </div>
          <div className="showcase-badge">
            <Sparkles size={15} /> MADE WITH MOTION-VID
          </div>
        </div>
      </section>
      <section className="template-section wrap" id="templates">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / START WITH A SPARK</span>
            <h2>
              Choose a direction.
              <br />
              <em>Make it yours.</em>
            </h2>
          </div>
          <p>
            Every template is a real, editable composition. Change the message,
            timing, colors and motion to match your vision.
          </p>
        </div>
        <div className="template-grid">
          {(["kinetic", "saas", "data", "logo"] as TemplateId[]).map((id) => (
            <TemplateCard key={id} id={id} onChoose={create} />
          ))}
        </div>
      </section>
      <section className="examples wrap" id="examples">
        <div className="section-heading">
          <div>
            <span className="eyebrow">02 / RENDERED WITH THE STUDIO</span>
            <h2>
              Made to move.
              <br />
              <em>Made here.</em>
            </h2>
          </div>
          <p>
            These playable MP4 examples were exported from the same templates
            you can edit in the studio.
          </p>
        </div>
        <div className="example-grid">
          {(
            [
              { id: "kinetic", title: "Kinetic Typography" },
              { id: "saas", title: "SaaS Product Launch" },
              { id: "data", title: "Animated Data Explainer" },
              { id: "logo-reveal", title: "Minimal Logo Reveal" },
            ] as const
          ).map((sample) => (
            <article key={sample.id}>
              <video
                controls
                playsInline
                preload="none"
                poster={`/examples/${sample.id}.png`}
                aria-label={`${sample.title} video example`}
              >
                <source src={`/examples/${sample.id}.mp4`} type="video/mp4" />
              </video>
              <div>
                <strong>{sample.title}</strong>
                <span>05 SEC · MP4</span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="workflow wrap" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="eyebrow">03 / THE WORKFLOW</span>
            <h2>
              From first frame
              <br />
              <em>to final film.</em>
            </h2>
          </div>
        </div>
        <div className="workflow-grid">
          <article>
            <span>01</span>
            <Clapperboard />
            <h3>Pick a starting point</h3>
            <p>Choose a motion template and create a project in seconds.</p>
          </article>
          <article>
            <span>02</span>
            <Layers3 />
            <h3>Shape every detail</h3>
            <p>
              Adjust scenes, typography, graphics, timing and animation in the
              editor.
            </p>
          </article>
          <article>
            <span>03</span>
            <WandSparkles />
            <h3>Render and share</h3>
            <p>
              Preview the same composition you export, then download an MP4.
            </p>
          </article>
        </div>
      </section>
      <section className="closing wrap">
        <span className="eyebrow">YOUR NEXT FRAME STARTS HERE</span>
        <h2>
          Ready to create
          <br />
          <em>something moving?</em>
        </h2>
        <Link className="btn btn-primary" href="/dashboard">
          Launch Motion-Vid Studio <ArrowRight size={18} />
        </Link>
      </section>
      <footer className="wrap footer">
        <Brand />
        <span>CODE-POWERED VIDEO CREATION</span>
        <a
          href="https://github.com/ariefzzz5421/Motion-Vid"
          target="_blank"
          rel="noreferrer"
        >
          GITHUB <ArrowUpRight size={14} />
        </a>
      </footer>
    </main>
  );
}
