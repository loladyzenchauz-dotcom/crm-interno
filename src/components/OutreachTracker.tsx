"use client";

import { useMemo, useState } from "react";
import { format, addDays, parseISO } from "date-fns";
import type { OutreachWeek } from "@/lib/types";

// --- Helpers ---

function weekLabel(weekStart: string): string {
  const d = parseISO(weekStart);
  return `Sem ${format(d, "d/M")}`;
}

function monthKeyOf(weekStart: string): string {
  return weekStart.slice(0, 7); // "YYYY-MM"
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const label = format(new Date(y, m - 1, 1), "MMMM");
  return label.toUpperCase();
}

function pct(part?: number, total?: number): string {
  if (!total) return "—";
  return `${Math.round(((part ?? 0) / total) * 100)}%`;
}

function sum(...vals: (number | undefined)[]): number {
  return vals.reduce((acc: number, v) => acc + (v ?? 0), 0);
}

function n(v?: number): string {
  return v === undefined || v === null ? "—" : String(v);
}

// Campos editables a mano (igual que en el Excel: se completan semana a semana).
interface RawFields {
  emailEnviados: string;
  emailOpenRate: string;
  emailReplies: string;
  emailReuniones: string;
  linkedinEnviados: string;
  linkedinReplies: string;
  linkedinReuniones: string;
  whatsappEnviados: string;
  whatsappReplies: string;
  whatsappReuniones: string;
  llamadasEnviados: string;
  llamadasReplies: string;
  llamadasReuniones: string;
}

const RAW_FIELD_KEYS = [
  "emailEnviados",
  "emailOpenRate",
  "emailReplies",
  "emailReuniones",
  "linkedinEnviados",
  "linkedinReplies",
  "linkedinReuniones",
  "whatsappEnviados",
  "whatsappReplies",
  "whatsappReuniones",
  "llamadasEnviados",
  "llamadasReplies",
  "llamadasReuniones",
] as const;

function toDraft(w: OutreachWeek): RawFields {
  const draft = {} as RawFields;
  for (const key of RAW_FIELD_KEYS) {
    const v = w[key];
    draft[key] = v === undefined || v === null ? "" : String(v);
  }
  return draft;
}

function parseDraftValue(raw: string): number | null {
  if (raw.trim() === "") return null;
  const v = Number(raw);
  return Number.isNaN(v) ? null : v;
}

// Input compacto para editar una celda del grid (semana x métrica).
function cellInput(
  value: string,
  onChange: (v: string) => void,
  opts?: { step?: string; placeholder?: string }
) {
  return (
    <input
      type="number"
      step={opts?.step ?? "1"}
      placeholder={opts?.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 rounded border border-zinc-300 bg-white px-1 py-0.5 text-center text-xs text-[var(--emi-navy)] focus:border-[var(--emi-blue)] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
    />
  );
}

interface Column {
  type: "week";
  week: OutreachWeek;
}
interface TotalColumn {
  type: "total";
  key: string;
  label: string;
  weeks: OutreachWeek[];
}
type GridColumn = Column | TotalColumn;

function buildColumns(weeks: OutreachWeek[]): GridColumn[] {
  const cols: GridColumn[] = [];
  let i = 0;
  while (i < weeks.length) {
    const key = monthKeyOf(weeks[i].weekStart);
    const group: OutreachWeek[] = [];
    while (i < weeks.length && monthKeyOf(weeks[i].weekStart) === key) {
      cols.push({ type: "week", week: weeks[i] });
      group.push(weeks[i]);
      i += 1;
    }
    cols.push({ type: "total", key, label: monthLabel(key), weeks: group });
  }
  return cols;
}

// Suma un campo crudo a lo largo de varias semanas (para la columna de total del mes).
function sumField(weeks: OutreachWeek[], field: keyof OutreachWeek): number {
  return sum(...weeks.map((w) => w[field] as number | undefined));
}

export default function OutreachTracker({ initial }: { initial: OutreachWeek[] }) {
  const [weeks, setWeeks] = useState<OutreachWeek[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RawFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingDate, setAddingDate] = useState("");
  const [adding, setAdding] = useState(false);

  const sorted = useMemo(
    () => [...weeks].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    [weeks]
  );
  const columns = useMemo(() => buildColumns(sorted), [sorted]);

  async function reload() {
    const res = await fetch("/api/outreach-weeks");
    if (res.ok) setWeeks(await res.json());
  }

  function startEdit(week: OutreachWeek) {
    setEditingId(week.id);
    setDraft(toDraft(week));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    setSaving(true);
    const body: Record<string, number | null> = {};
    for (const key of RAW_FIELD_KEYS) {
      body[key] = parseDraftValue(draft[key]);
    }
    const res = await fetch(`/api/outreach-weeks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      await reload();
      setEditingId(null);
      setDraft(null);
    }
  }

  async function addWeek() {
    if (!addingDate) return;
    setAdding(true);
    const res = await fetch("/api/outreach-weeks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: addingDate }),
    });
    setAdding(false);
    if (res.ok) {
      const created = await res.json();
      await reload();
      setAddingDate("");
      startEdit(created);
    }
  }

  function draftField(field: keyof RawFields) {
    return draft?.[field] ?? "";
  }
  function setDraftField(field: keyof RawFields, value: string) {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
  }

  // --- Renderiza una celda para una columna dada (semana editable, o total de mes calculado) ---

  function rawCell(col: GridColumn, field: keyof OutreachWeek, draftKey: keyof RawFields) {
    if (col.type === "total") {
      return <span>{n(sumField(col.weeks, field))}</span>;
    }
    const week = col.week;
    if (editingId === week.id && draft) {
      return cellInput(draftField(draftKey), (v) => setDraftField(draftKey, v));
    }
    return <span>{n(week[field] as number | undefined)}</span>;
  }

  function openRateCell(col: GridColumn) {
    if (col.type === "total") {
      // Promedio simple de las semanas con dato cargado.
      const vals = col.weeks
        .map((w) => w.emailOpenRate)
        .filter((v): v is number => v !== undefined && v !== null);
      if (vals.length === 0) return <span>—</span>;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return <span>{Math.round(avg * 100)}%</span>;
    }
    const week = col.week;
    if (editingId === week.id && draft) {
      return cellInput(draftField("emailOpenRate"), (v) => setDraftField("emailOpenRate", v), {
        step: "0.01",
        placeholder: "0-1",
      });
    }
    return <span>{week.emailOpenRate === undefined ? "—" : `${Math.round(week.emailOpenRate * 100)}%`}</span>;
  }

  function replyPctCell(col: GridColumn, enviadosField: keyof OutreachWeek, repliesField: keyof OutreachWeek) {
    if (col.type === "total") {
      const enviados = sumField(col.weeks, enviadosField);
      const replies = sumField(col.weeks, repliesField);
      return <span>{pct(replies, enviados)}</span>;
    }
    const week = col.week;
    return (
      <span>
        {pct(week[repliesField] as number | undefined, week[enviadosField] as number | undefined)}
      </span>
    );
  }

  function totalTps(col: GridColumn): number | undefined {
    const w = col.type === "total" ? null : col.week;
    if (w) {
      return sum(w.emailEnviados, w.linkedinEnviados, w.whatsappEnviados, w.llamadasEnviados);
    }
    const grp = (col as TotalColumn).weeks;
    return sum(
      ...grp.map((w) => sum(w.emailEnviados, w.linkedinEnviados, w.whatsappEnviados, w.llamadasEnviados))
    );
  }

  function totalReplies(col: GridColumn): number | undefined {
    const w = col.type === "total" ? null : col.week;
    if (w) {
      return sum(w.emailReplies, w.linkedinReplies, w.whatsappReplies, w.llamadasReplies);
    }
    const grp = (col as TotalColumn).weeks;
    return sum(
      ...grp.map((w) => sum(w.emailReplies, w.linkedinReplies, w.whatsappReplies, w.llamadasReplies))
    );
  }

  function totalReuniones(col: GridColumn): number | undefined {
    const w = col.type === "total" ? null : col.week;
    if (w) {
      return sum(w.emailReuniones, w.linkedinReuniones, w.whatsappReuniones, w.llamadasReuniones);
    }
    const grp = (col as TotalColumn).weeks;
    return sum(
      ...grp.map((w) => sum(w.emailReuniones, w.linkedinReuniones, w.whatsappReuniones, w.llamadasReuniones))
    );
  }

  const sectionHeaderCls =
    "sticky left-0 z-10 bg-[var(--emi-navy)] px-3 py-1.5 text-left text-xs font-bold uppercase tracking-wide text-white";
  const rowLabelCls =
    "sticky left-0 z-10 bg-white px-3 py-1.5 text-left text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400";
  const weekHeadCls =
    "border-l border-zinc-200 px-2 py-1.5 text-center text-xs font-medium text-[var(--emi-navy)] dark:border-zinc-800 dark:text-white";
  const totalHeadCls =
    "border-l-2 border-[var(--emi-blue)] bg-[var(--emi-blue-soft)] px-2 py-1.5 text-center text-xs font-bold text-[var(--emi-navy)] dark:text-white";
  const cellCls = "border-l border-zinc-100 px-2 py-1.5 text-center text-xs dark:border-zinc-900";
  const totalCellCls =
    "border-l-2 border-[var(--emi-blue)] bg-[var(--emi-blue-soft)] px-2 py-1.5 text-center text-xs font-semibold dark:bg-[var(--emi-blue-soft)]";

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-xl border border-[var(--emi-blue)]/20 bg-[var(--emi-blue-soft)] p-4 text-sm text-zinc-700 dark:text-zinc-300">
        Misma estructura que tu Excel: semanas como columnas, agrupadas por canal, con el total del
        mes al final de cada grupo. Enviados, Open Rate, Replies y Reuniones se cargan a mano — el
        Reply % y los totales se calculan solos.
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">+ Agregar semana:</span>
        <input
          type="date"
          value={addingDate}
          onChange={(e) => setAddingDate(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
        <button
          onClick={addWeek}
          disabled={adding || !addingDate}
          className="rounded-lg bg-[var(--emi-blue)] px-3 py-1 text-sm font-medium text-white hover:bg-[var(--emi-blue-hover)] disabled:opacity-50"
        >
          {adding ? "Agregando…" : "Agregar"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-[var(--emi-navy)] px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-white">
                Métrica
              </th>
              {columns.map((col) =>
                col.type === "week" ? (
                  <th key={col.week.id} className={weekHeadCls}>
                    <div>{weekLabel(col.week.weekStart)}</div>
                    <div className="mt-1">
                      {editingId === col.week.id ? (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => saveEdit(col.week.id)}
                            disabled={saving}
                            className="rounded bg-[var(--emi-blue)] px-1.5 py-0.5 text-[10px] font-medium text-white"
                          >
                            {saving ? "…" : "Guardar"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(col.week)}
                          className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-[var(--emi-navy)] hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </th>
                ) : (
                  <th key={col.key} className={totalHeadCls}>
                    {col.label}
                    <div className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">TOTAL</div>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {/* EMAIL */}
            <tr>
              <td colSpan={columns.length + 1} className={sectionHeaderCls}>
                Email
              </td>
            </tr>
            {[
              { label: "Enviados", render: (c: GridColumn) => rawCell(c, "emailEnviados", "emailEnviados") },
              { label: "Open Rate", render: (c: GridColumn) => openRateCell(c) },
              { label: "Replies", render: (c: GridColumn) => rawCell(c, "emailReplies", "emailReplies") },
              { label: "Reply %", render: (c: GridColumn) => replyPctCell(c, "emailEnviados", "emailReplies") },
              { label: "Reuniones", render: (c: GridColumn) => rawCell(c, "emailReuniones", "emailReuniones") },
            ].map((row) => (
              <tr key={row.label} className="odd:bg-zinc-50 dark:odd:bg-zinc-900/40">
                <td className={rowLabelCls}>{row.label}</td>
                {columns.map((col) => (
                  <td key={col.type === "week" ? col.week.id : col.key} className={col.type === "total" ? totalCellCls : cellCls}>
                    {row.render(col)}
                  </td>
                ))}
              </tr>
            ))}

            {/* LINKEDIN */}
            <tr>
              <td colSpan={columns.length + 1} className={sectionHeaderCls}>
                LinkedIn
              </td>
            </tr>
            {[
              { label: "Enviados", render: (c: GridColumn) => rawCell(c, "linkedinEnviados", "linkedinEnviados") },
              { label: "Replies", render: (c: GridColumn) => rawCell(c, "linkedinReplies", "linkedinReplies") },
              { label: "Reply %", render: (c: GridColumn) => replyPctCell(c, "linkedinEnviados", "linkedinReplies") },
              { label: "Reuniones", render: (c: GridColumn) => rawCell(c, "linkedinReuniones", "linkedinReuniones") },
            ].map((row) => (
              <tr key={row.label} className="odd:bg-zinc-50 dark:odd:bg-zinc-900/40">
                <td className={rowLabelCls}>{row.label}</td>
                {columns.map((col) => (
                  <td key={col.type === "week" ? col.week.id : col.key} className={col.type === "total" ? totalCellCls : cellCls}>
                    {row.render(col)}
                  </td>
                ))}
              </tr>
            ))}

            {/* WHATSAPP */}
            <tr>
              <td colSpan={columns.length + 1} className={sectionHeaderCls}>
                WhatsApp
              </td>
            </tr>
            {[
              { label: "Enviados", render: (c: GridColumn) => rawCell(c, "whatsappEnviados", "whatsappEnviados") },
              { label: "Replies", render: (c: GridColumn) => rawCell(c, "whatsappReplies", "whatsappReplies") },
              { label: "Reply %", render: (c: GridColumn) => replyPctCell(c, "whatsappEnviados", "whatsappReplies") },
              { label: "Reuniones", render: (c: GridColumn) => rawCell(c, "whatsappReuniones", "whatsappReuniones") },
            ].map((row) => (
              <tr key={row.label} className="odd:bg-zinc-50 dark:odd:bg-zinc-900/40">
                <td className={rowLabelCls}>{row.label}</td>
                {columns.map((col) => (
                  <td key={col.type === "week" ? col.week.id : col.key} className={col.type === "total" ? totalCellCls : cellCls}>
                    {row.render(col)}
                  </td>
                ))}
              </tr>
            ))}

            {/* LLAMADAS */}
            <tr>
              <td colSpan={columns.length + 1} className={sectionHeaderCls}>
                Llamadas
              </td>
            </tr>
            {[
              { label: "Realizadas", render: (c: GridColumn) => rawCell(c, "llamadasEnviados", "llamadasEnviados") },
              { label: "Replies", render: (c: GridColumn) => rawCell(c, "llamadasReplies", "llamadasReplies") },
              { label: "Reply %", render: (c: GridColumn) => replyPctCell(c, "llamadasEnviados", "llamadasReplies") },
              { label: "Reuniones", render: (c: GridColumn) => rawCell(c, "llamadasReuniones", "llamadasReuniones") },
            ].map((row) => (
              <tr key={row.label} className="odd:bg-zinc-50 dark:odd:bg-zinc-900/40">
                <td className={rowLabelCls}>{row.label}</td>
                {columns.map((col) => (
                  <td key={col.type === "week" ? col.week.id : col.key} className={col.type === "total" ? totalCellCls : cellCls}>
                    {row.render(col)}
                  </td>
                ))}
              </tr>
            ))}

            {/* TOTALES */}
            <tr>
              <td colSpan={columns.length + 1} className={sectionHeaderCls}>
                Totales
              </td>
            </tr>
            {[
              { label: "Total TPs", render: (c: GridColumn) => <span>{n(totalTps(c))}</span> },
              { label: "Total Replies", render: (c: GridColumn) => <span>{n(totalReplies(c))}</span> },
              {
                label: "Reply % Total",
                render: (c: GridColumn) => <span>{pct(totalReplies(c), totalTps(c))}</span>,
              },
              { label: "Total Reuniones", render: (c: GridColumn) => <span>{n(totalReuniones(c))}</span> },
            ].map((row) => (
              <tr key={row.label} className="odd:bg-zinc-50 font-semibold dark:odd:bg-zinc-900/40">
                <td className={rowLabelCls}>{row.label}</td>
                {columns.map((col) => (
                  <td key={col.type === "week" ? col.week.id : col.key} className={col.type === "total" ? totalCellCls : cellCls}>
                    {row.render(col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="p-6 text-center text-sm text-zinc-500">
            Todavía no hay semanas cargadas.
          </div>
        )}
      </div>
    </div>
  );
}
