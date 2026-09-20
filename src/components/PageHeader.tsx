"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-16 py-3 flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="w-9 h-9 shrink-0 rounded-xl border border-gray-200 flex items-center justify-center text-[#808080] hover:text-[#3566AB] hover:border-[#3566AB]/30 transition"
            >
              <ArrowLeft size={18} />
            </Link>
          )}

          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#1C1C1C] truncate">
              {title}
            </h1>

            {subtitle && (
              <p className="text-[11px] text-[#808080] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
