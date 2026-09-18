import KanbanBoard from "@/components/KanbanBoard";
import AppHeader from "@/components/AppHeader";

export default function CrmPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader
        title="CRM Interno"
        subtitle="Cuentas en prospección — arrastrá las tarjetas entre etapas"
      />
      <KanbanBoard />
    </div>
  );
}
