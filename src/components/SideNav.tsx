"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SLIDES = [
  { href: "/", label: "Panel principal" },
  { href: "/crm", label: "CRM Interno" },
  { href: "/reuniones", label: "Reuniones agendadas" },
  { href: "/tracker-outreach", label: "Tracker Outreach" },
] as const;

export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-black/10 bg-[var(--emi-navy)] p-4 dark:border-white/10">
      <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-white/40">
        CRM Interno
      </div>
      {SLIDES.map((slide) => {
        const active =
          slide.href === "/" ? pathname === "/" : pathname.startsWith(slide.href);
        return (
          <Link
            key={slide.href}
            href={slide.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {slide.label}
          </Link>
        );
      })}
    </nav>
  );
}
