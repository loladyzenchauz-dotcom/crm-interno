import AppHeader from "@/components/AppHeader";
import MeetingsTable from "@/components/MeetingsTable";
import { listMeetings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReunionesPage() {
  const meetings = await listMeetings();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader
        current="/reuniones"
        title="Reuniones"
        subtitle="Tracker de reuniones agendadas — estado, AE y calificación"
      />
      <MeetingsTable initial={meetings} />
    </div>
  );
}
