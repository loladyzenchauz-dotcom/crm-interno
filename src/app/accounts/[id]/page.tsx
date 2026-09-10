import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccountWithRelations } from "@/lib/store";
import { CHANNELS, Channel } from "@/lib/types";
import { format } from "date-fns";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = getAccountWithRelations(id);
  if (!account) notFound();

  const touchpointsByChannel: Record<Channel, number> = {
    whatsapp: 0,
    linkedin: 0,
    email: 0,
    call: 0,
  };
  for (const tp of account.touchpoints) {
    touchpointsByChannel[tp.channel]++;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Volver al tablero
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{account.name}</h1>
      {account.industry && (
        <p className="text-sm text-neutral-500">{account.industry}</p>
      )}
      {account.notes && <p className="mt-2 text-sm">{account.notes}</p>}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Touchpoints agregados
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <p className="text-2xl font-semibold">{account.touchpoints.length}</p>
            <p className="text-xs text-neutral-500">Total</p>
          </div>
          {CHANNELS.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-black/10 p-3 dark:border-white/10"
            >
              <p className="text-2xl font-semibold">
                {touchpointsByChannel[c.id]}
              </p>
              <p className="text-xs text-neutral-500">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Personas contactadas
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {account.contacts.map((contact) => {
            const contactTouchpoints = account.touchpoints.filter(
              (t) => t.contactId === contact.id
            );
            return (
              <div
                key={contact.id}
                className="rounded-lg border border-black/10 p-4 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {contact.name}
                    {contact.isPrimary && (
                      <span className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
                        principal
                      </span>
                    )}
                  </p>
                  {contact.role && (
                    <span className="text-xs text-neutral-500">{contact.role}</span>
                  )}
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {contactTouchpoints
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map((tp) => (
                      <li
                        key={tp.id}
                        className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                      >
                        <span className="w-24 shrink-0 text-xs text-neutral-500">
                          {format(new Date(tp.date), "dd/MM/yyyy")}
                        </span>
                        <span className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
                          {CHANNELS.find((c) => c.id === tp.channel)?.label}
                        </span>
                        {tp.outcome && (
                          <span className="text-xs">
                            {tp.outcome === "respondio"
                              ? "✓ respondió"
                              : tp.outcome === "no_respondio"
                              ? "sin respuesta"
                              : "pendiente"}
                          </span>
                        )}
                      </li>
                    ))}
                  {contactTouchpoints.length === 0 && (
                    <li className="text-sm text-neutral-400">
                      Sin touchpoints registrados
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {account.tasks.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Próximos pendientes
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {account.tasks.map((task) => {
              const contact = account.contacts.find(
                (c) => c.id === task.contactId
              );
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-2 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10"
                >
                  <span className="w-24 shrink-0 text-xs text-neutral-500">
                    {format(new Date(task.scheduledDate), "dd/MM/yyyy")}
                  </span>
                  <span>{contact?.name}</span>
                  <span className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
                    {CHANNELS.find((c) => c.id === task.channel)?.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
