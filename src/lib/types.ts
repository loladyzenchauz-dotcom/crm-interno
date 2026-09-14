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

export type Channel = "whatsapp" | "linkedin" | "email" | "call";

export const CHANNELS: { id: Channel; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "email", label: "Correo" },
  { id: "call", label: "Llamada" },
];

export interface Touchpoint {
  id: string;
  contactId: string;
  accountId: string;
  channel: Channel;
  date: string; // ISO date
  notes?: string;
  outcome?: "respondio" | "no_respondio" | "pendiente";
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

export interface Task {
  id: string;
  accountId: string;
  contactId: string;
  channel: Channel;
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
  createdAt: string;
}

export interface AccountWithRelations extends Account {
  contacts: Contact[];
  touchpoints: Touchpoint[];
  tasks: Task[];
}
