"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CHANNELS,
  Meeting,
  MultithreadingAccount,
  WorkingFloorStatus,
  TouchpointSuggestion,
} from "@/lib/types";

function channelLabel(channel: string): string {
  return CHANNELS.find((c) => c.id === channel)?.label ?? channel;
}

function dayLabel(iso: string): string {
  return format(parseISO(iso), "EEEE d/M", { locale: es });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PanelPrincipal({
  weekMeetings,
  multithreading,
  workingFloor,
  touchpointPlan,
}: {
  weekMeetings: Meeting[];
  multithreading: MultithreadingAccount[];
  workingFloor: WorkingFloorStatus;
  touchpointPlan: TouchpointSuggestion[];
}) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <WeekMeetingsCard meetings={weekMeetings} />
      <div className="grid gap-6 lg:grid-cols-2">
        <WorkingPlanCard workingFloor={workingFloor} touchpointPlan={touchpointPlan} />
        <MultithreadingCard accounts={multithreading} />
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <h2 className="text-base font-semibold text-[var(--emi-navy)] dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function WeekMeetingsCard({ meetings }: { meetings: Meeting[] }) {
  return (
    <Card
      title="Reuniones de esta semana"
      subtitle={`${meetings.length} reunión(es) agendada(s), lunes a domingo`}
    >
      {meetings.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No hay reuniones agendadas con fecha esta semana.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {meetings.map((m) => (
            <div
              key={m.id}
              className="min-w-[200px] flex-1 rounded-lg border border-black/10 p-3 dark:border-white/10"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--emi-blue)]">
                {m.meetingDate ? dayLabel(m.meetingDate) : "Sin fecha"}
              </p>
              <p className="mt-1 font-medium text-[var(--emi-navy)] dark:text-white">
                {m.accountId ? (
                  <Link href={`/accounts/${m.accountId}`} className="hover:underline">
                    {m.company}
                  </Link>
                ) : (
                  m.company
                )}
              </p>
              {m.contactName && (
                <p className="text-sm text-neutral-500">{m.contactName}</p>
              )}
              {m.channel && (
                <p className="mt-1 text-xs text-neutral-400">{m.channel}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function WorkingPlanCard({
  workingFloor,
  touchpointPlan,
}: {
  workingFloor: WorkingFloorStatus;
  touchpointPlan: TouchpointSuggestion[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function promote(accountId: string) {
    setBusyId(accountId);
    await fetch(`/api/accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "working" }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function markContacted(s: TouchpointSuggestion) {
    setBusyId(s.contactId);
    await fetch(`/api/touchpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: s.contactId,
        accountId: s.accountId,
        channel: s.channel,
        date: todayISO(),
        outcome: "no_respondio",
      }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function addAsTask(s: TouchpointSuggestion) {
    setBusyId(s.contactId + "-task");
    await fetch(`/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: s.accountId,
        type: "outreach",
        contactId: s.contactId,
        channel: s.channel,
        scheduledDate: todayISO(),
      }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <Card
      title="Working — a quién tocarle hoy"
      subtitle={`${workingFloor.workingCount}/${workingFloor.floor} cuentas en Working`}
    >
      {workingFloor.needed > 0 && (
        <div className="mb-4 rounded-lg border border-[var(--emi-orange)]/30 bg-[var(--emi-orange)]/10 p-3">
          <p className="text-sm font-medium text-[var(--emi-navy)] dark:text-white">
            Faltan {workingFloor.needed} cuenta(s) para llegar a {workingFloor.floor}{" "}
            en Working — empezá a prospectar:
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {workingFloor.suggestions.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2">
                <Link href={`/accounts/${a.id}`} className="text-sm hover:underline">
                  {a.name}
                </Link>
                <button
                  onClick={() => promote(a.id)}
                  disabled={busyId === a.id}
                  className="shrink-0 rounded bg-[var(--emi-orange)] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  {busyId === a.id ? "..." : "Empezar a prospectar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {touchpointPlan.length === 0 ? (
        <p className="text-sm text-neutral-400">
          Nadie te toca contactar hoy según la cadencia.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {touchpointPlan.map((s) => (
            <div
              key={s.contactId}
              className="flex items-center justify-between gap-2 rounded-lg border border-black/10 p-2 dark:border-white/10"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--emi-navy)] dark:text-white">
                  {s.contactName}{" "}
                  <span className="font-normal text-neutral-500">
                    · {s.accountName}
                  </span>
                </p>
                <p className="text-xs text-neutral-400">
                  {channelLabel(s.channel)} · touchpoint {s.touchpointsSoFar + 1}/8
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => addAsTask(s)}
                  disabled={busyId === s.contactId + "-task"}
                  className="rounded border border-black/10 px-2 py-1 text-xs font-medium text-neutral-600 disabled:opacity-50 dark:border-white/10 dark:text-neutral-300"
                >
                  Pendiente
                </button>
                <button
                  onClick={() => markContacted(s)}
                  disabled={busyId === s.contactId}
                  className="rounded bg-[var(--emi-blue)] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  {busyId === s.contactId ? "..." : "Ya lo contacté"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MultithreadingCard({ accounts }: { accounts: MultithreadingAccount[] }) {
  return (
    <Card
      title="Multithreading pendiente"
      subtitle="Cuentas con reunión agendada y una sola persona contactada hasta ahora"
    >
      {accounts.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No hay cuentas con reunión agendada que necesiten multithreading ahora.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((a) => (
            <div
              key={a.accountId}
              className="flex items-center justify-between gap-2 rounded-lg border border-black/10 p-2 dark:border-white/10"
            >
              <div className="min-w-0">
                <Link
                  href={`/accounts/${a.accountId}`}
                  className="truncate text-sm font-medium text-[var(--emi-navy)] hover:underline dark:text-white"
                >
                  {a.accountName}
                </Link>
                <p className="text-xs text-neutral-400">
                  {a.contactName ? `Reunión con ${a.contactName}` : "Reunión agendada"}
                  {a.meetingDate ? ` · ${dayLabel(a.meetingDate)}` : ""}
                </p>
              </div>
              <Link
                href={`/accounts/${a.accountId}`}
                className="shrink-0 rounded border border-[var(--emi-purple)]/40 px-2 py-1 text-xs font-medium text-[var(--emi-purple)]"
              >
                Sumar contacto
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
