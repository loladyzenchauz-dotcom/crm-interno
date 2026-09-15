"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";
import {
  Account,
  CHANNELS,
  MeetingScheduledThisWeek,
  STAGES,
  Stage,
  Summary,
} from "@/lib/types";
import NewAccountForm from "./NewAccountForm";
import { format } from "date-fns";

function SummaryBar({ summary }: { summary: Summary | null }) {
  if (!summary) return null;

  const byChannel: Record<string, MeetingScheduledThisWeek[]> = {};
  for (const m of summary.meetingsThisWeek) {
    (byChannel[m.channel] ??= []).push(m);
  }

  return (
    <div className="mx-6 mt-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-2xl font-semibold">{summary.accountsProspecting}</p>
          <p className="text-xs text-neutral-500">Cuentas en prospección activa</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">
            {summary.meetingsThisWeek.length}
          </p>
          <p className="text-xs text-neutral-500">
            Reuniones agendadas esta semana
          </p>
        </div>
        {CHANNELS.map((c) => (
          <div key={c.id}>
            <p className="text-2xl font-semibold">
              {(byChannel[c.id] ?? []).length}
            </p>
            <p className="text-xs text-neutral-500">Por {c.label}</p>
          </div>
        ))}
      </div>
      {summary.meetingsThisWeek.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-neutral-500">
            Ver detalle
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {summary.meetingsThisWeek.map((m) => (
              <li
                key={m.touchpointId}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-24 shrink-0 text-xs text-neutral-500">
                  {format(new Date(m.date), "dd/MM/yyyy")}
                </span>
                <span className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
                  {CHANNELS.find((c) => c.id === m.channel)?.label}
                </span>
                <Link
                  href={`/accounts/${m.accountId}`}
                  className="font-medium hover:underline"
                >
                  {m.accountName}
                </Link>
                <span className="text-neutral-500">— {m.contactName}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function AccountCard({ account }: { account: Account }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: account.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-neutral-900 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/accounts/${account.id}`}
          onClick={(e) => isDragging && e.preventDefault()}
          className="font-medium hover:underline"
        >
          {account.name}
        </Link>
        {account.salesNavigatorUrl && (
          <a
            href={account.salesNavigatorUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Stakeholder map (Sales Navigator)"
            className="shrink-0 text-xs text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            🔗
          </a>
        )}
      </div>
      {account.industry && (
        <p className="mt-1 text-xs text-neutral-500">{account.industry}</p>
      )}
    </div>
  );
}

function Column({
  stage,
  label,
  accounts,
}: {
  stage: Stage;
  label: string;
  accounts: Account[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-2 rounded-xl p-3 transition-colors ${
        isOver ? "bg-black/5 dark:bg-white/10" : "bg-black/[.03] dark:bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="text-xs text-neutral-500">{accounts.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function reload() {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data);
        setLoading(false);
      });
    fetch("/api/summary")
      .then((r) => r.json())
      .then(setSummary);
  }

  useEffect(() => {
    reload();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const newStage = over.id as Stage;
    const accountId = active.id as string;
    const account = accounts.find((a) => a.id === accountId);
    if (!account || account.stage === newStage) return;

    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, stage: newStage } : a))
    );

    await fetch(`/api/accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
  }

  if (loading) {
    return <p className="p-6 text-sm text-neutral-500">Cargando cuentas...</p>;
  }

  const activeAccount = accounts.find((a) => a.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center justify-end px-6 pt-4">
        <NewAccountForm onCreated={reload} />
      </div>
      <SummaryBar summary={summary} />
      <div className="flex gap-3 overflow-x-auto p-6">
        {STAGES.map((s) => (
          <Column
            key={s.id}
            stage={s.id}
            label={s.label}
            accounts={accounts.filter((a) => a.stage === s.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeAccount ? (
          <div className="w-64 rounded-lg border border-black/10 bg-white p-3 shadow-md dark:border-white/10 dark:bg-neutral-900">
            <p className="font-medium">{activeAccount.name}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
