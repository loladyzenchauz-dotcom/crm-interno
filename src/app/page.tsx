import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/10 px-6 py-4 dark:border-white/10">
        <h1 className="text-lg font-semibold">CRM Interno</h1>
        <p className="text-sm text-neutral-500">
          Cuentas en prospección — arrastrá las tarjetas entre etapas
        </p>
      </header>
      <KanbanBoard />
    </div>
  );
}
