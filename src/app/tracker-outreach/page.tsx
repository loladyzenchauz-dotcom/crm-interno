import AppHeader from "@/components/AppHeader";
import OutreachTracker from "@/components/OutreachTracker";
import { listAllTouchpoints } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TrackerOutreachPage() {
  const touchpoints = await listAllTouchpoints();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader
        current="/tracker-outreach"
        title="Tracker Outreach"
        subtitle="Evolución semana a semana de tu outreach por canal"
      />
      <OutreachTracker touchpoints={touchpoints} />
    </div>
  );
}
