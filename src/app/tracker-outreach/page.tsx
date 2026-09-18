import AppHeader from "@/components/AppHeader";
import OutreachTracker from "@/components/OutreachTracker";
import { listOutreachWeeks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TrackerOutreachPage() {
  const weeks = await listOutreachWeeks();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader
        title="Tracker Outreach"
        subtitle="Evolución semana a semana de tu outreach por canal"
      />
      <OutreachTracker initial={weeks} />
    </div>
  );
}
