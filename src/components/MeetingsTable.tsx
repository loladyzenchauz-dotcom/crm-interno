"use client";

import { useMemo, useState } from "react";
import {
  Meeting,
  MEETING_STATUSES,
  MEETING_STATUS_COLORS,
  MEETING_TYPES,
  MeetingStatus,
} from "@/lib/types";
import { format } from "date-fns";

function StatusBadgeSelect({
  meeting,
  onChange,
}: {
  meeting: Meeting;
  onChange: (status: MeetingStatus) => void;
}) {
  const color = meeting.status ? MEETING_STATUS_COLORS[meeting.status] : "#71717a";
  return (
    <select
      value={meeting.status ?? ""}
      onChange={(e) => onChange(e.target.value as MeetingStatus)}
      style={{ color, borderColor: color }}
      className="rounded-full border bg-transparent px-2 py-0.5 text-xs font-medium"
    >
      {MEETING_STATUSES.map((s) => (
        <option key={s} value={s} className="text-black">
          {s}
        </option>
      ))}
    </select>
  );
}

function NewMeetingForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company: "",
    contactName: "",
    contactRole: "",
    linkedinUrl: "",
    meetingDate: new Date().toISOString().slice(0, 10),
    type: MEETING_TYPES[1],
    channel: "",
    status: MEETING_STATUSES[0] as MeetingStatus,
    ae: "",
    sqcValue: "",
    note: "",
    qualified: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) return;
    setSaving(true);
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sqcValue: form.sqcValue ? Number(form.sqcValue) : undefined,
      }),
    });
    setSaving(false);
    setOpen(false);
    setForm((f) => ({ ...f, company: "", contactName: "", contactRole: "", linkedinUrl: "", note: "" }));
    onCreated();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--emi-blue)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--emi-blue-hover)]"
      >
        + Agregar reunión
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-900"
    >
      <div className="flex flex-wrap gap-2">
        <input
          autoFocus
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
          placeholder="Empresa"
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        />
        <input
          value={form.contactName}
          onChange={(e) => set("contactName", e.target.value)}
          placeholder="Contacto (opcional)"
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        />
        <input
          value={form.contactRole}
          onChange={(e) => set("contactRole", e.target.value)}
          placeholder="Cargo (opcional)"
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        />
        <input
          value={form.linkedinUrl}
          onChange={(e) => set("linkedinUrl", e.target.value)}
          placeholder="LinkedIn (opcional)"
          className="w-48 rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={form.meetingDate}
          onChange={(e) => set("meetingDate", e.target.value)}
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        />
        <select
          value={form.type}
          onChange={(e) => set("type", e.target.value as (typeof MEETING_TYPES)[number])}
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        >
          {MEETING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={form.channel}
          onChange={(e) => set("channel", e.target.value)}
          placeholder="Canal (Linkedin, Mail...)"
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        />
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value as MeetingStatus)}
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        >
          {MEETING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={form.ae}
          onChange={(e) => set("ae", e.target.value)}
          placeholder="AE"
          className="w-32 rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        />
        <input
          value={form.sqcValue}
          onChange={(e) => set("sqcValue", e.target.value)}
          placeholder="Valor SQC"
          type="number"
          step="0.1"
          className="w-24 rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        />
        <select
          value={form.qualified}
          onChange={(e) => set("qualified", e.target.value)}
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        >
          <option value="">Calificada?</option>
          <option value="Si">Calificada: Sí</option>
          <option value="No">Calificada: No</option>
        </select>
      </div>
      <textarea
        value={form.note}
        onChange={(e) => set("note", e.target.value)}
        placeholder="Nota (opcional)"
        rows={2}
        className="w-full rounded border border-black/10 bg-transparent p-2 text-sm dark:border-white/10"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-[var(--emi-blue)] px-2 py-1 text-sm font-medium text-white transition-colors hover:bg-[var(--emi-blue-hover)] disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-neutral-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function MeetingsTable({ initial }: { initial: Meeting[] }) {
  const [meetings, setMeetings] = useState<Meeting[]>(initial);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  function reload() {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then(setMeetings);
  }

  async function handleStatusChange(id: string, status: MeetingStatus) {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
    await fetch(`/api/meetings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const m of meetings) {
      if (!m.status) continue;
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
    }
    return byStatus;
  }, [meetings]);

  const filtered = meetings.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (
      search &&
      !`${m.company} ${m.contactName ?? ""} ${m.ae ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-black/10 bg-[var(--emi-blue-soft)] p-4 dark:border-white/10">
        <div>
          <p className="text-2xl font-semibold text-[var(--emi-blue)]">
            {meetings.length}
          </p>
          <p className="text-xs text-neutral-500">Reuniones totales</p>
        </div>
        {MEETING_STATUSES.map((s) => (
          <div key={s}>
            <p
              className="text-2xl font-semibold"
              style={{ color: MEETING_STATUS_COLORS[s] }}
            >
              {counts[s] ?? 0}
            </p>
            <p className="text-xs text-neutral-500">{s}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa, contacto o AE..."
            className="w-64 rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
          >
            <option value="all">Todos los estados</option>
            {MEETING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <NewMeetingForm onCreated={reload} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/[.03] text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-white/10 dark:bg-white/5">
              <th className="px-3 py-2 font-normal">Fecha</th>
              <th className="px-3 py-2 font-normal">Empresa</th>
              <th className="px-3 py-2 font-normal">Contacto</th>
              <th className="px-3 py-2 font-normal">Tipo</th>
              <th className="px-3 py-2 font-normal">Canal</th>
              <th className="px-3 py-2 font-normal">Estado</th>
              <th className="px-3 py-2 font-normal">AE</th>
              <th className="px-3 py-2 font-normal">SQC</th>
              <th className="px-3 py-2 font-normal">Calificada</th>
              <th className="px-3 py-2 font-normal">Nota</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="border-b border-black/5 last:border-0 dark:border-white/5"
              >
                <td className="whitespace-nowrap px-3 py-2 text-xs text-neutral-500">
                  {m.meetingDate
                    ? format(new Date(m.meetingDate), "dd/MM/yyyy")
                    : "—"}
                </td>
                <td className="px-3 py-2 font-medium">{m.company}</td>
                <td className="px-3 py-2">
                  {m.contactName ? (
                    <>
                      {m.linkedinUrl ? (
                        <a
                          href={m.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--emi-blue)] hover:underline"
                        >
                          {m.contactName}
                        </a>
                      ) : (
                        m.contactName
                      )}
                      {m.contactRole && (
                        <span className="block text-xs text-neutral-500">
                          {m.contactRole}
                        </span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-xs">{m.type ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{m.channel ?? "—"}</td>
                <td className="px-3 py-2">
                  <StatusBadgeSelect
                    meeting={m}
                    onChange={(status) => handleStatusChange(m.id, status)}
                  />
                </td>
                <td className="px-3 py-2 text-xs">{m.ae ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{m.sqcValue ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{m.qualified ?? "—"}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-xs text-neutral-500">
                  {m.note ?? ""}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-sm text-neutral-400">
                  No hay reuniones que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
