"use client";

import { useMemo } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import type { Touchpoint, Channel } from "@/lib/types";

// --- Semanas (arrancan lunes, igual que el Excel "Sem D/M") ---

function weekKeyOf(dateStr: string): string {
  const d = startOfWeek(new Date(dateStr), { weekStartsOn: 1 });
  return format(d, "yyyy-MM-dd");
}

function weekLabel(key: string): { label: string; range: string } {
  const start = new Date(key);
  const end = addDays(start, 5); // lunes a sábado, como el Excel
  const label = `Sem ${format(start, "d/M")}`;
  const range = `${format(start, "d/M", { locale: es })}-${format(end, "d/M", { locale: es })}`;
  return { label, range };
}

const CHANNEL_ORDER: Channel[] = ["email", "linkedin", "whatsapp", "call"];
const CHANNEL_LABELS: Record<Channel, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  call: "Llamadas",
};

interface ChannelStats {
  enviados: number;
  replies: number;
  reuniones: number;
}

interface WeekRow {
  key: string;
  label: string;
  range: string;
  byChannel: Record<Channel, ChannelStats>;
  totalTps: number;
  totalReplies: number;
  totalReuniones: number;
}

function isReply(outcome?: Touchpoint["outcome"]): boolean {
  return outcome === "respondio" || outcome === "reunion_agendada";
}

function computeWeeklyRows(touchpoints: Touchpoint[]): WeekRow[] {
  const weeks = new Map<string, WeekRow>();

  for (const tp of touchpoints) {
    if (!tp.date) continue;
    const key = weekKeyOf(tp.date);
    if (!weeks.has(key)) {
      const { label, range } = weekLabel(key);
      weeks.set(key, {
        key,
        label,
        range,
        byChannel: {
          email: { enviados: 0, replies: 0, reuniones: 0 },
          linkedin: { enviados: 0, replies: 0, reuniones: 0 },
          whatsapp: { enviados: 0, replies: 0, reuniones: 0 },
          call: { enviados: 0, replies: 0, reuniones: 0 },
        },
        totalTps: 0,
        totalReplies: 0,
        totalReuniones: 0,
      });
    }
    const row = weeks.get(key)!;
    const stats = row.byChannel[tp.channel];
    if (!stats) continue;
    stats.enviados += 1;
    row.totalTps += 1;
    if (isReply(tp.outcome)) {
      stats.replies += 1;
      row.totalReplies += 1;
    }
    if (tp.outcome === "reunion_agendada") {
      stats.reuniones += 1;
      row.totalReuniones += 1;
    }
  }

  return Array.from(weeks.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function pct(part: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

function ChannelCell({ stats }: { stats: ChannelStats }) {
  return (
    <div className="text-center">
      <div className="text-sm font-semibold text-[var(--emi-navy)] dark:text-white">
        {stats.enviados}
      </div>
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {stats.replies} resp · {pct(stats.replies, stats.enviados)} · {stats.reuniones} reu
      </div>
    </div>
  );
}

export default function OutreachTracker({ touchpoints }: { touchpoints: Touchpoint[] }) {
  const rows = useMemo(() => computeWeeklyRows(touchpoints), [touchpoints]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-xl border border-[var(--emi-blue)]/20 bg-[var(--emi-blue-soft)] p-4 text-sm text-zinc-700 dark:text-zinc-300">
        Esta tabla se calcula en vivo a partir de los touchpoints registrados en el CRM,
        semana a semana (lunes a sábado). No incluye Open Rate porque el CRM no trackea
        aperturas de email. Si varias reuniones históricas se importaron con una misma
        fecha, esas semanas antiguas van a verse concentradas — a partir de ahora, cada
        touchpoint que registres con su fecha real va a reflejarse correctamente semana
        a semana.
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--emi-navy)] text-white">
              <th className="px-3 py-2 text-left font-medium">Semana</th>
              {CHANNEL_ORDER.map((ch) => (
                <th key={ch} className="px-3 py-2 text-center font-medium">
                  {CHANNEL_LABELS[ch]}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium">Total TPs</th>
              <th className="px-3 py-2 text-center font-medium">Total Replies</th>
              <th className="px-3 py-2 text-center font-medium">Reply % Total</th>
              <th className="px-3 py-2 text-center font-medium">Reuniones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                  Todavía no hay touchpoints registrados.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-t border-zinc-200 odd:bg-zinc-50 dark:border-zinc-800 dark:odd:bg-zinc-900/40"
              >
                <td className="px-3 py-2">
                  <div className="font-medium text-[var(--emi-navy)] dark:text-white">
                    {row.label}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{row.range}</div>
                </td>
                {CHANNEL_ORDER.map((ch) => (
                  <td key={ch} className="px-3 py-2">
                    <ChannelCell stats={row.byChannel[ch]} />
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-semibold text-[var(--emi-navy)] dark:text-white">
                  {row.totalTps}
                </td>
                <td className="px-3 py-2 text-center">{row.totalReplies}</td>
                <td className="px-3 py-2 text-center">
                  {pct(row.totalReplies, row.totalTps)}
                </td>
                <td className="px-3 py-2 text-center font-semibold text-[var(--emi-blue)]">
                  {row.totalReuniones}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
