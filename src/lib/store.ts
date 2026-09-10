import { Account, Contact, Touchpoint, Task, Stage } from "./types";

interface Store {
  accounts: Account[];
  contacts: Contact[];
  touchpoints: Touchpoint[];
  tasks: Task[];
}

function seed(): Store {
  const accounts: Account[] = [
    {
      id: "acc-kellanova",
      name: "Kellanova",
      industry: "Consumo masivo",
      stage: "working",
      notes: "Prospección activa, contacto principal Cynthia.",
      createdAt: "2026-08-01",
    },
    {
      id: "acc-banregio",
      name: "Banregio",
      industry: "Banca",
      stage: "meeting_scheduled",
      notes: "Reunión agendada con AE, contacto Rosario (Rossy).",
      createdAt: "2026-07-20",
    },
    {
      id: "acc-sede-cafe",
      name: "Sede Café",
      industry: "Retail / cafeterías",
      stage: "to_contact",
      notes: "CHRO Javi identificado, pendiente primer contacto.",
      createdAt: "2026-09-05",
    },
    {
      id: "acc-grupo-costeno",
      name: "Grupo Costeño",
      industry: "Industrial",
      stage: "working",
      notes: "Multithreading con Julián Mora y Sofía Wohler.",
      createdAt: "2026-08-15",
    },
  ];

  const contacts: Contact[] = [
    { id: "c-cynthia", accountId: "acc-kellanova", name: "Cynthia", role: "RRHH", isPrimary: true },
    { id: "c-rosario", accountId: "acc-banregio", name: "Rosario (Rossy)", role: "RRHH", isPrimary: true },
    { id: "c-javi", accountId: "acc-sede-cafe", name: "Javi", role: "CHRO", isPrimary: true },
    { id: "c-julian", accountId: "acc-grupo-costeno", name: "Julián Mora", role: "Gerente Nacional de Reclutamiento", isPrimary: true },
    { id: "c-sofia", accountId: "acc-grupo-costeno", name: "Sofía Wohler", role: "Directora de RH", isPrimary: false },
  ];

  const touchpoints: Touchpoint[] = [
    { id: "tp-1", contactId: "c-cynthia", accountId: "acc-kellanova", channel: "email", date: "2026-09-01", outcome: "no_respondio" },
    { id: "tp-2", contactId: "c-cynthia", accountId: "acc-kellanova", channel: "linkedin", date: "2026-09-03", outcome: "respondio" },
    { id: "tp-3", contactId: "c-rosario", accountId: "acc-banregio", channel: "call", date: "2026-09-02", outcome: "respondio" },
    { id: "tp-4", contactId: "c-julian", accountId: "acc-grupo-costeno", channel: "whatsapp", date: "2026-09-04", outcome: "respondio" },
    { id: "tp-5", contactId: "c-sofia", accountId: "acc-grupo-costeno", channel: "email", date: "2026-09-08", outcome: "pendiente" },
  ];

  const tasks: Task[] = [
    { id: "t-1", accountId: "acc-kellanova", contactId: "c-cynthia", channel: "email", scheduledDate: "2026-09-15", done: false },
    { id: "t-2", accountId: "acc-sede-cafe", contactId: "c-javi", channel: "linkedin", scheduledDate: "2026-09-11", done: false },
    { id: "t-3", accountId: "acc-grupo-costeno", contactId: "c-julian", channel: "call", scheduledDate: "2026-09-15", done: false },
    { id: "t-4", accountId: "acc-grupo-costeno", contactId: "c-sofia", channel: "email", scheduledDate: "2026-09-17", done: false },
  ];

  return { accounts, contacts, touchpoints, tasks };
}

const globalForStore = globalThis as unknown as { __crmStore?: Store };

export function getStore(): Store {
  if (!globalForStore.__crmStore) {
    globalForStore.__crmStore = seed();
  }
  return globalForStore.__crmStore;
}

export function updateAccountStage(accountId: string, stage: Stage) {
  const store = getStore();
  const account = store.accounts.find((a) => a.id === accountId);
  if (account) account.stage = stage;
  return account;
}

export function getAccountWithRelations(accountId: string) {
  const store = getStore();
  const account = store.accounts.find((a) => a.id === accountId);
  if (!account) return null;
  return {
    ...account,
    contacts: store.contacts.filter((c) => c.accountId === accountId),
    touchpoints: store.touchpoints.filter((t) => t.accountId === accountId),
    tasks: store.tasks.filter((t) => t.accountId === accountId),
  };
}
