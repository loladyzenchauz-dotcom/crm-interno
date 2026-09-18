export default function AppHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="border-b-4 border-[var(--emi-blue)] bg-[var(--emi-navy)]">
      <div className="px-6 py-4">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>
    </header>
  );
}
