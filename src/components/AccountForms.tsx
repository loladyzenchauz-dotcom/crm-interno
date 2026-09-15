"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CHANNELS, Contact, OUTCOMES } from "@/lib/types";

export function BriefEditor({
  accountId,
  initialBrief,
}: {
  accountId: string;
  initialBrief?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [brief, setBrief] = useState(initialBrief ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aeBrief: brief }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div>
        {initialBrief ? (
          <p className="whitespace-pre-wrap text-sm">{initialBrief}</p>
        ) : (
          <p className="text-sm text-neutral-400">Todavía no cargaste el brief.</p>
        )}
        <button
          onClick={() => setEditing(true)}
          className="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {initialBrief ? "Editar brief" : "+ Agregar brief"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        autoFocus
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="Contexto para el AE: qué se habló, quién asiste, dolores detectados, próximos pasos sugeridos..."
        rows={5}
        className="w-full rounded border border-black/10 bg-transparent p-2 text-sm dark:border-white/10"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-black px-2 py-1 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setBrief(initialBrief ?? "");
            setEditing(false);
          }}
          className="text-sm text-neutral-500"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function SalesNavigatorEditor({
  accountId,
  initialUrl,
}: {
  accountId: string;
  initialUrl?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salesNavigatorUrl: url }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-1 flex items-center gap-2">
        {initialUrl && (
          <a
            href={initialUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            🔗 Stakeholder map (Sales Navigator)
          </a>
        )}
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {initialUrl ? "Editar link" : "+ Agregar link de Sales Navigator"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Link del stakeholder map de Sales Navigator"
        className="w-72 rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-black px-2 py-1 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => {
          setUrl(initialUrl ?? "");
          setEditing(false);
        }}
        className="text-sm text-neutral-500"
      >
        Cancelar
      </button>
    </div>
  );
}

export function NewContactForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/accounts/${accountId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role: role || undefined }),
    });
    setSaving(false);
    setName("");
    setRole("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        + Agregar contacto
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 p-2 dark:border-white/10"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      />
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Cargo (opcional)"
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-black px-2 py-1 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? "Guardando..." : "Agregar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-neutral-500"
      >
        Cancelar
      </button>
    </form>
  );
}

export function NewTouchpointForm({
  accountId,
  contacts,
}: {
  accountId: string;
  contacts: Contact[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [channel, setChannel] = useState(CHANNELS[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [outcome, setOutcome] = useState(OUTCOMES[0].id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!contacts.some((c) => c.id === contactId)) {
      setContactId(contacts[0]?.id ?? "");
    }
  }, [contacts, contactId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactId) return;
    setSaving(true);
    await fetch("/api/touchpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, accountId, channel, date, outcome }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (contacts.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        + Registrar touchpoint
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 p-2 dark:border-white/10"
    >
      <select
        value={contactId}
        onChange={(e) => setContactId(e.target.value)}
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      >
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value as typeof channel)}
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      >
        {CHANNELS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      />
      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value as typeof outcome)}
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      >
        {OUTCOMES.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-black px-2 py-1 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? "Guardando..." : "Registrar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-neutral-500"
      >
        Cancelar
      </button>
    </form>
  );
}

export function NewTaskForm({
  accountId,
  contacts,
}: {
  accountId: string;
  contacts: Contact[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [channel, setChannel] = useState(CHANNELS[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!contacts.some((c) => c.id === contactId)) {
      setContactId(contacts[0]?.id ?? "");
    }
  }, [contacts, contactId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactId) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        contactId,
        channel,
        scheduledDate: date,
      }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (contacts.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        + Agendar pendiente
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 p-2 dark:border-white/10"
    >
      <select
        value={contactId}
        onChange={(e) => setContactId(e.target.value)}
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      >
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value as typeof channel)}
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      >
        {CHANNELS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-black px-2 py-1 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? "Guardando..." : "Agendar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-neutral-500"
      >
        Cancelar
      </button>
    </form>
  );
}
