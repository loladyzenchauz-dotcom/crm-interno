"use client";

import { useState } from "react";

export default function NewAccountForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [salesNavigatorUrl, setSalesNavigatorUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        industry: industry || undefined,
        salesNavigatorUrl: salesNavigatorUrl || undefined,
      }),
    });
    setSaving(false);
    setName("");
    setIndustry("");
    setSalesNavigatorUrl("");
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
      >
        + Nueva cuenta
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-neutral-900"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la cuenta"
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      />
      <input
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
        placeholder="Industria (opcional)"
        className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      />
      <input
        value={salesNavigatorUrl}
        onChange={(e) => setSalesNavigatorUrl(e.target.value)}
        placeholder="Link Sales Navigator (opcional)"
        className="w-56 rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-black px-2 py-1 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? "Guardando..." : "Crear"}
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
