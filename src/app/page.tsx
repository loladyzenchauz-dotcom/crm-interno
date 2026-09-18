import AppHeader from "@/components/AppHeader";
import PanelPrincipal from "@/components/PanelPrincipal";
import {
  getWeekMeetings,
  getMultithreadingAccounts,
  getWorkingFloorStatus,
  getTodayTouchpointPlan,
} from "@/lib/store";

// Lee estado en vivo de la DB en cada visita — no prerenderizar en build.
export const dynamic = "force-dynamic";

export default async function PanelDeControl() {
  const [weekMeetings, multithreading, workingFloor, touchpointPlan] =
    await Promise.all([
      getWeekMeetings(),
      getMultithreadingAccounts(),
      getWorkingFloorStatus(),
      getTodayTouchpointPlan(),
    ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader
        title="Panel principal"
        subtitle="Tu semana de un vistazo — reuniones, a quién tocarle hoy y multithreading pendiente"
      />
      <PanelPrincipal
        weekMeetings={weekMeetings}
        multithreading={multithreading}
        workingFloor={workingFloor}
        touchpointPlan={touchpointPlan}
      />
    </div>
  );
}
