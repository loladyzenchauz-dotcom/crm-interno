import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { getSummary, listMeetings } from "@/lib/store";
import { MEETING_STATUSES, MEETING_STATUS_COLORS } from "@/lib/types";

// Lee estado en vivo de la DB en cada visita — no prerenderizar en build.
export const dynamic = "force-dynamic";

export default async function PanelDeControl() {
  const [summary, meetings] = await Promise.all([getSummary(), listMeetings()]);

  const meetingCounts: Record<string, number> = {};
  for (const m of meetings) {
    if (!m.status) continue;
    meetingCounts[m.status] = (meetingCounts[m.status] ?? 0) + 1;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader
        current="/"
        title="Panel de control"
        subtitle="Tu punto de partida — accedé al CRM y al tracker de reuniones"
      />

      <div className="flex flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/crm"
            className="group rounded-xl border border-black/10 bg-white p-6 shadow-sm transition-colors hover:border-[var(--emi-blue)] dark:border-white/10 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--emi-navy)] group-hover:text-[var(--emi-blue)] dark:text-white">
                CRM Interno →
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: "var(--emi-blue)" }}
              >
                {summary.accountsProspecting} activas
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Tablero de cuentas en prospección — arrastrá tarjetas entre
              etapas, registrá touchpoints y preparate el brief para el AE.
            </p>
            <p className="mt-4 text-xs text-neutral-500">
              {summary.meetingsThisWeek.length} reunión(es) agendada(s) esta
              semana desde touchpoints
            </p>
          </Link>

          <Link
            href="/reuniones"
            className="group rounded-xl border border-black/10 bg-white p-6 shadow-sm transition-colors hover:border-[var(--emi-purple)] dark:border-white/10 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--emi-navy)] group-hover:text-[var(--emi-purple)] dark:text-white">
                Reuniones →
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: "var(--emi-purple)" }}
              >
                {meetings.length} total
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Tracker de reuniones agendadas — estado, AE, canal y
              calificación, como en tu Excel de Reuniones Agendadas.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {MEETING_STATUSES.map((s) => (
                <span key={s} className="text-xs" style={{ color: MEETING_STATUS_COLORS[s] }}>
                  {meetingCounts[s] ?? 0} {s.toLowerCase()}
                </span>
              ))}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
