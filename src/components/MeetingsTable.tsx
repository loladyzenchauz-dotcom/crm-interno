"use client";

import { useMemo, useState } from "react";
import {
  Meeting,
  MEETING_STATUSES,
  MEETING_STATUS_COLORS,
  MEETING_TYPES,
  MeetingStatus,
  MeetingType,
  QUALIFIED_OPTIONS,
  QUALIFIED_COLORS,
  QualifiedStatus,
  NACHO_REVIEW_OPTIONS,
  NACHO_REVIEW_COLORS,
  NachoReviewStatus,
} from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const SQC_CAP_PER_MONTH = 6;

// --- Helpers de mes (para los paneles de SQC por mes) ---

function monthKeyOf(dateStr?: string): string | null {
  if (!dateStr) return null;
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const label = format(new Date(y, m - 1, 1), "MMMM yyyy", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Tabla 1: cantidad de reuniones (SQCs) por mes real de la reunión, sin tope.
function computeRawMonthly(meetings: Meeting[]) {
  const counts: Record<string, number> = {};
  for (const m of meetings) {
    const key = monthKeyOf(m.meetingDate);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.keys(counts)
    .sort()
    .map((key) => ({ key, label: monthLabel(key), count: counts[key] }));
}

// Tabla 2: mismas reuniones, pero con tope de SQC_CAP_PER_MONTH por mes —
// lo que exceda el tope de un mes se corre y se cuenta en el mes siguiente
// (y así en cadena si hace falta), en vez de acumularse en el mes original.
function computeCappedMonthly(meetings: Meeting[], cap: number) {
  const counts: Record<string, number> = {};
  for (const m of meetings) {
    const key = monthKeyOf(m.meetingDate);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const keys = Object.keys(counts).sort();
  if (keys.length === 0) return [];

  const result: { key: string; label: string; credited: number; overflow: number }[] = [];
  const lastNaturalKey = keys[keys.length - 1];
  let pending = 0;
  let cursor = keys[0];

  while (true) {
    const natural = counts[cursor] ?? 0;
    const total = pending + natural;
    const credited = Math.min(cap, total);
    const overflow = total - credited;
    result.push({ key: cursor, label: monthLabel(cursor), credited, overflow });
    pending = overflow;
    if (cursor >= lastNaturalKey && pending === 0) break;
    cursor = addMonths(cursor, 1);
  }
  return result;
}

// Dropdown coloreado genérico, para cualquier campo de seguimiento que
// cambia con el tiempo (estado de la reunión, calificación...).
function ColoredSelect<T extends string>({
  value,
  options,
  colors,
  fallbackColor = "#71717a",
  emptyLabel,
  onChange,
}: {
  value: T | undefined;
  options: T[];
  colors: Record<T, string>;
  fallbackColor?: string;
  emptyLabel?: string;
  onChange: (value: T) => void;
}) {
  const color = value ? colors[value] : fallbackColor;
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value as T)}
      style={{ color, borderColor: color }}
      className="rounded-full border bg-transparent px-2 py-0.5 text-xs font-medium"
    >
      {!value && emptyLabel && (
        <option value="" className="text-black">
          {emptyLabel}
        </option>
      )}
      {options.map((o) => (
        <option key={o} value={o} className="text-black">
          {o}
        </option>
      ))}
    </select>
  );
}

function MonthlyPanel({
  title,
  subtitle,
  rows,
  valueKey,
  accent,
}: {
  title: string;
  subtitle: string;
  rows: { key: string; label: string; credited?: number; count?: number; overflow?: number }[];
  valueKey: "count" | "credited";
  accent: string;
}) {
  return (
    <div className="flex-1 min-w-[260px] rounded-xl border border-black/10 p-4 dark:border-white/10">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-neutral-500">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">Sin reuniones con fecha todavía.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">{r.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-lg font-semibold" style={{ color: accent }}>
                  {valueKey === "count" ? r.count : r.credited}
                </span>
                {valueKey === "credited" && !!r.overflow && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: "var(--emi-orange)" }}
                    title={`${r.overflow} se corren al mes siguiente`}
                  >
                    +{r.overflow} →
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
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
    qualifiedByNacho: "",
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
          <option value="En proceso">Calificada: En proceso</option>
        </select>
        <select
          value={form.qualifiedByNacho}
          onChange={(e) => set("qualifiedByNacho", e.target.value)}
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        >
          <option value="">Registrada por Nacho?</option>
          <option value="Si">Registrada por Nacho: Sí</option>
          <option value="No">Registrada por Nacho: No</option>
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

interface EditableFields {
  meetingDate: string;
  company: string;
  contactName: string;
  contactRole: string;
  linkedinUrl: string;
  type: string;
  channel: string;
  ae: string;
  sqcValue: string;
  note: string;
}

function toDraft(m: Meeting): EditableFields {
  return {
    meetingDate: m.meetingDate ?? "",
    company: m.company ?? "",
    contactName: m.contactName ?? "",
    contactRole: m.contactRole ?? "",
    linkedinUrl: m.linkedinUrl ?? "",
    type: m.type ?? "",
    channel: m.channel ?? "",
    ae: m.ae ?? "",
    sqcValue: m.sqcValue !== undefined ? String(m.sqcValue) : "",
    note: m.note ?? "",
  };
}

function inputCls(extra?: string) {
  return `rounded border border-black/10 bg-transparent px-1.5 py-0.5 text-xs dark:border-white/10 ${extra ?? ""}`;
}

function MeetingRow({
  meeting,
  onSave,
  onStatusChange,
  onQualifiedChange,
  onNachoReviewChange,
}: {
  meeting: Meeting;
  onSave: (id: string, fields: EditableFields) => Promise<void>;
  onStatusChange: (id: string, status: MeetingStatus) => void;
  onQualifiedChange: (id: string, qualified: QualifiedStatus) => void;
  onNachoReviewChange: (id: string, qualifiedByNacho: NachoReviewStatus) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<EditableFields>(() => toDraft(meeting));

  function set<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function startEdit() {
    setDraft(toDraft(meeting));
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(meeting.id, draft);
    setSaving(false);
    setEditing(false);
  }

  const m = meeting;

  return (
    <tr className="border-b border-black/5 align-top last:border-0 dark:border-white/5">
      <td className="whitespace-nowrap px-3 py-2 text-xs text-neutral-500">
        {editing ? (
          <input
            type="date"
            value={draft.meetingDate}
            onChange={(e) => set("meetingDate", e.target.value)}
            className={inputCls("w-32")}
          />
        ) : m.meetingDate ? (
          format(new Date(m.meetingDate), "dd/MM/yyyy")
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2 font-medium">
        {editing ? (
          <input
            value={draft.company}
            onChange={(e) => set("company", e.target.value)}
            className={inputCls("w-32")}
          />
        ) : (
          m.company
        )}
      </td>
      <td className="px-3 py-2">
        {editing ? (
          <div className="flex flex-col gap-1">
            <input
              value={draft.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              placeholder="Contacto"
              className={inputCls("w-36")}
            />
            <input
              value={draft.contactRole}
              onChange={(e) => set("contactRole", e.target.value)}
              placeholder="Cargo"
              className={inputCls("w-36")}
            />
            <input
              value={draft.linkedinUrl}
              onChange={(e) => set("linkedinUrl", e.target.value)}
              placeholder="LinkedIn"
              className={inputCls("w-36")}
            />
          </div>
        ) : m.contactName ? (
          <>
            {m.linkedinUrl ? (
              <a
                href={m.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                title="Ver perfil de LinkedIn"
                className="text-[var(--emi-blue)] hover:underline"
              >
                {m.contactName} 🔗
              </a>
            ) : (
              m.contactName
            )}
            {m.contactRole && (
              <span className="block text-xs text-neutral-500">{m.contactRole}</span>
            )}
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2 text-xs">
        {editing ? (
          <select
            value={draft.type}
            onChange={(e) => set("type", e.target.value)}
            className={inputCls("w-24")}
          >
            <option value="">—</option>
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        ) : (
          m.type ?? "—"
        )}
      </td>
      <td className="px-3 py-2 text-xs">
        {editing ? (
          <input
            value={draft.channel}
            onChange={(e) => set("channel", e.target.value)}
            className={inputCls("w-24")}
          />
        ) : (
          m.channel ?? "—"
        )}
      </td>
      <td className="px-3 py-2">
        <ColoredSelect<MeetingStatus>
          value={m.status}
          options={MEETING_STATUSES}
          colors={MEETING_STATUS_COLORS}
          onChange={(status) => onStatusChange(m.id, status)}
        />
      </td>
      <td className="px-3 py-2 text-xs">
        {editing ? (
          <input
            value={draft.ae}
            onChange={(e) => set("ae", e.target.value)}
            className={inputCls("w-28")}
          />
        ) : (
          m.ae ?? "—"
        )}
      </td>
      <td className="px-3 py-2 text-xs">
        {editing ? (
          <input
            type="number"
            step="0.1"
            value={draft.sqcValue}
            onChange={(e) => set("sqcValue", e.target.value)}
            className={inputCls("w-14")}
          />
        ) : (
          m.sqcValue ?? "—"
        )}
      </td>
      <td className="px-3 py-2">
        <ColoredSelect<QualifiedStatus>
          value={m.qualified as QualifiedStatus | undefined}
          options={QUALIFIED_OPTIONS}
          colors={QUALIFIED_COLORS}
          emptyLabel="Sin definir"
          onChange={(qualified) => onQualifiedChange(m.id, qualified)}
        />
      </td>
      <td className="px-3 py-2">
        <ColoredSelect<NachoReviewStatus>
          value={m.qualifiedByNacho as NachoReviewStatus | undefined}
          options={NACHO_REVIEW_OPTIONS}
          colors={NACHO_REVIEW_COLORS}
          emptyLabel="Sin definir"
          onChange={(qualifiedByNacho) => onNachoReviewChange(m.id, qualifiedByNacho)}
        />
      </td>
      <td className="max-w-[220px] px-3 py-2 text-xs text-neutral-500">
        {editing ? (
          <textarea
            value={draft.note}
            onChange={(e) => set("note", e.target.value)}
            rows={2}
            className={inputCls("w-40")}
          />
        ) : (
          <span className="block truncate">{m.note ?? ""}</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs">
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-medium text-[var(--emi-blue)] hover:underline disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => setEditing(false)} className="text-neutral-500">
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="text-neutral-500 hover:text-[var(--emi-blue)]"
            title="Editar"
          >
            ✏️ Editar
          </button>
        )}
      </td>
    </tr>
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

  async function patchMeeting(id: string, body: Record<string, unknown>) {
    await fetch(`/api/meetings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function handleStatusChange(id: string, status: MeetingStatus) {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    await patchMeeting(id, { status });
  }

  async function handleQualifiedChange(id: string, qualified: QualifiedStatus) {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, qualified } : m)));
    await patchMeeting(id, { qualified });
  }

  async function handleNachoReviewChange(id: string, qualifiedByNacho: NachoReviewStatus) {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, qualifiedByNacho } : m))
    );
    await patchMeeting(id, { qualifiedByNacho });
  }

  async function handleSaveFields(id: string, fields: EditableFields) {
    const body = {
      meetingDate: fields.meetingDate || undefined,
      company: fields.company,
      contactName: fields.contactName,
      contactRole: fields.contactRole,
      linkedinUrl: fields.linkedinUrl,
      type: (fields.type || undefined) as MeetingType | undefined,
      channel: fields.channel,
      ae: fields.ae,
      sqcValue: fields.sqcValue ? Number(fields.sqcValue) : undefined,
      note: fields.note,
    };
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              ...body,
              meetingDate: fields.meetingDate || m.meetingDate,
            }
          : m
      )
    );
    await patchMeeting(id, body);
  }

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const m of meetings) {
      if (!m.status) continue;
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
    }
    return byStatus;
  }, [meetings]);

  const rawMonthly = useMemo(() => computeRawMonthly(meetings), [meetings]);
  const cappedMonthly = useMemo(
    () => computeCappedMonthly(meetings, SQC_CAP_PER_MONTH),
    [meetings]
  );

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
      <div className="flex flex-wrap gap-4">
        <MonthlyPanel
          title="SQCs por mes (acumulado)"
          subtitle="Cantidad de reuniones según el mes real en que se agendaron"
          rows={rawMonthly}
          valueKey="count"
          accent="var(--emi-blue)"
        />
        <MonthlyPanel
          title={`SQCs por mes (tope ${SQC_CAP_PER_MONTH}, con arrastre)`}
          subtitle={`Máximo ${SQC_CAP_PER_MONTH} por mes — lo que se pasa del tope se cuenta en el mes siguiente`}
          rows={cappedMonthly}
          valueKey="credited"
          accent="var(--emi-purple)"
        />
      </div>

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
        <table className="w-full min-w-[1050px] border-collapse text-sm">
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
              <th className="px-3 py-2 font-normal">Registrada (Nacho)</th>
              <th className="px-3 py-2 font-normal">Nota</th>
              <th className="px-3 py-2 font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                onSave={handleSaveFields}
                onStatusChange={handleStatusChange}
                onQualifiedChange={handleQualifiedChange}
                onNachoReviewChange={handleNachoReviewChange}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-sm text-neutral-400">
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
