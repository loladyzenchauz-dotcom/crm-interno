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
import { Account, STAGES, Stage } from "@/lib/types";

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
      <Link
        href={`/accounts/${account.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
        className="font-medium hover:underline"
      >
        {account.name}
      </Link>
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data);
        setLoading(false);
      });
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
