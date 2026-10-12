import Link from "next/link";
import { Aperture } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark">
        <Aperture size={20} />
      </span>
      {!compact && (
        <span>
          MOTION<span className="brand-dot">.</span>VID <small>STUDIO</small>
        </span>
      )}
    </Link>
  );
}
