export type Stage =
  | "to_contact"
  | "working"
  | "meeting_scheduled"
  | "ae_sales_process"
  | "bad_fit"
  | "paused"
  | "disqualified";

export const STAGES: { id: Stage; label: string }[] = [
  { id: "to_contact", label: "To contact" },
  { id: "working", label: "Working" },
  { id: "meeting_scheduled", label: "Reunión agendada" },
  { id: "ae_sales_process", label: "AE sales process" },
  { id: "bad_fit", label: "Bad fit" },
  { id: "paused", label: "Pausa" },
  { id: "disqualified", label: "Disqualified" },
];

// Stages that count as "en prospección activa" para el resumen del tablero:
// solo cuentas donde ya hay trabajo en curso (working, reunión agendada, AE sales process).
export const ACTIVE_PROSPECTING_STAGES: Stage[] = [
  "working",
  "meeting_scheduled",
  "ae_sales_process",
];

export type Channel = "whatsapp" | "linkedin" | "email" | "call";

export const CHANNELS: { id: Channel; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "email", label: "Correo" },
  { id: "call", label: "Llamada" },
];

export type Outcome = "respondio" | "no_respondio" | "pendiente" | "reunion_agendada";

// "no_respondio" primero: es el resultado por default al registrar un touchpoint
// (si no hay respuesta todavía no hace falta tocar nada); se cambia a mano si respondió.
export const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: "no_respondio", label: "Sin respuesta" },
  { id: "respondio", label: "Respondió" },
  { id: "reunion_agendada", label: "Reunión agendada" },
  { id: "pendiente", label: "Pendiente" },
];

export interface Touchpoint {
  id: string;
  contactId: string;
  accountId: string;
  channel: Channel;
  date: string; // ISO date
  notes?: string;
  outcome?: Outcome;
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  role?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export type TaskType = "outreach" | "ae_brief";

export interface Task {
  id: string;
  accountId: string;
  // Los pendientes de "outreach" (contactar a alguien) tienen contacto y canal;
  // los de "ae_brief" (preparar el brief para el AE antes de la reunión) no.
  type: TaskType;
  contactId?: string;
  channel?: Channel;
  scheduledDate: string; // ISO date
  done: boolean;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  industry?: string;
  stage: Stage;
  notes?: string;
  // Link al stakeholder map de Sales Navigator para esta cuenta.
  salesNavigatorUrl?: string;
  // Brief para el AE con contexto previo a la reunión agendada.
  aeBrief?: string;
  createdAt: string;
}

export interface AccountWithRelations extends Account {
  contacts: Contact[];
  touchpoints: Touchpoint[];
  tasks: Task[];
}

export interface MeetingScheduledThisWeek {
  touchpointId: string;
  date: string;
  channel: Channel;
  accountId: string;
  accountName: string;
  contactId: string;
  contactName: string;
}

export interface Summary {
  accountsProspecting: number;
  meetingsThisWeek: MeetingScheduledThisWeek[];
}
