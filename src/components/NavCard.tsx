import Link from "next/link";
import { LucideIcon } from "lucide-react";

export function NavCard({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-4 rounded-2xl border border-neutral-off shadow-sm flex items-center gap-4 hover:border-brand transition-colors"
    >
      <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-light/30 text-brand-dark flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-ink truncate">
          {title}
        </p>
        <p className="text-xs text-neutral-mid truncate">{subtitle}</p>
      </div>
    </Link>
  );
}
