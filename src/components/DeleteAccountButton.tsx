"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteAccountButton({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/accounts/${accountId}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:underline dark:text-red-400"
      >
        Borrar cuenta
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-sm">
      <span>¿Borrar &quot;{accountName}&quot; y todo lo asociado?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
      >
        {deleting ? "Borrando..." : "Sí, borrar"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-neutral-500"
      >
        Cancelar
      </button>
    </span>
  );
}
