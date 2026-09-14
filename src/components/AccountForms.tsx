"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CHANNELS, Contact } from "@/lib/types";

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
      body: JSON.stringify({ contactId, accountId, channel, date }),
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
