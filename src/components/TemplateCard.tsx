"use client";
import { ArrowUpRight } from "lucide-react";
import { templateMeta } from "@/lib/templates";
import type { TemplateId } from "@/lib/project";
export function TemplateCard({
  id,
  onChoose,
}: {
  id: TemplateId;
  onChoose: (id: TemplateId) => void;
}) {
  const t = templateMeta[id];
  return (
    <button
      type="button"
      className={`template-card template-${id}`}
      onClick={() => onChoose(id)}
    >
      <div className="template-art">
        <div className="template-orbit" />
        <span>
          {id === "kinetic"
            ? "MOVE / NOW"
            : id === "saas"
              ? "NOVA"
              : id === "data"
                ? "+84%"
                : "AURA"}
        </span>
        <i />
      </div>
      <div className="template-body">
        <div>
          <small>{t.category}</small>
          <h3>{t.title}</h3>
          <p>{t.description}</p>
        </div>
        <ArrowUpRight size={20} />
      </div>
    </button>
  );
}
