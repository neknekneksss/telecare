import { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-neutral-off shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 shrink-0 rounded-xl bg-brand-light/30 text-brand-dark flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-mid font-medium">{label}</p>
        <p className="text-sm font-bold text-neutral-ink truncate">{value}</p>
        {hint && (
          <p className="text-[11px] text-neutral-mid truncate">{hint}</p>
        )}
      </div>
    </div>
  );
}
