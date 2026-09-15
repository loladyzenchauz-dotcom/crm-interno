import Link from "next/link";

const TABS = [
  { href: "/", label: "Panel de control" },
  { href: "/crm", label: "CRM Interno" },
  { href: "/reuniones", label: "Reuniones" },
] as const;

export default function AppNav({ current }: { current: string }) {
  return (
    <nav className="flex gap-1 px-6 pt-3">
      {TABS.map((tab) => {
        const active = tab.href === current;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-t-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-50 text-[var(--emi-navy)] dark:bg-black dark:text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
