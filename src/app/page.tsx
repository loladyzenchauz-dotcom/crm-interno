import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b-4 border-[var(--emi-blue)] bg-[var(--emi-navy)] px-6 py-4">
        <h1 className="text-lg font-semibold text-white">
          CRM Interno
        </h1>
        <p className="text-sm text-white/60">
          Cuentas en prospección — arrastrá las tarjetas entre etapas
        </p>
      </header>
      <KanbanBoard />
    </div>
  );
}
