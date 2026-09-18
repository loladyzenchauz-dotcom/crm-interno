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

// Color de acento por etapa, usado en columnas y tarjetas del tablero.
// Combina la marca Emi (azul, violeta) con semáforo estándar para los
// estados de salida (verde = avance, rojo = perdido, ámbar = pausado, gris = neutro).
export const STAGE_COLORS: Record<Stage, string> = {
  to_contact: "#71717a",
  working: "#3366ff",
  meeting_scheduled: "#10b981",
  ae_sales_process: "#6549f5",
  bad_fit: "#e11d48",
  paused: "#ff7a45",
  disqualified: "#3f3f46",
};

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

// --- Panel principal: multithreading, piso de Working, plan del día ---

// Cuenta con reunión agendada pero todavía una sola reunión registrada —
// falta multithreadear (sumar más gente de la cuenta antes de la primera
// reunión, e idealmente conseguir una segunda reunión previo a esa primera).
export interface MultithreadingAccount {
  accountId: string;
  accountName: string;
  meetingDate?: string;
  contactName?: string;
}

// Estado del piso de 10 cuentas en Working: si faltan, trae candidatas de
// "To contact" (las más antiguas primero) para promover hoy.
export interface WorkingFloorStatus {
  workingCount: number;
  floor: number;
  needed: number;
  suggestions: Account[];
}

// Sugerencia de a quién tocarle hoy dentro de las cuentas en Working, según
// la cadencia de 7-8 touchpoints totales, mínimo 2 días entre touchpoints
// del mismo canal, y sin email lunes/viernes.
export interface TouchpointSuggestion {
  accountId: string;
  accountName: string;
  contactId: string;
  contactName: string;
  channel: Channel;
  touchpointsSoFar: number;
}

// --- Reuniones (tracker de "Reuniones Agendadas" del Excel) ---

export type MeetingType = "Inbound" | "Outbound";

export const MEETING_TYPES: MeetingType[] = ["Inbound", "Outbound"];

export type MeetingStatus =
  | "Reunión Agendada"
  | "Discovery BDR"
  | "Reunión Completada"
  | "No-show"
  | "Cancelled";

export const MEETING_STATUSES: MeetingStatus[] = [
  "Reunión Agendada",
  "Discovery BDR",
  "Reunión Completada",
  "No-show",
  "Cancelled",
];

// Color por estado, mismo criterio semántico que STAGE_COLORS.
export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  "Reunión Agendada": "#3366ff",
  "Discovery BDR": "#71717a",
  "Reunión Completada": "#10b981",
  "No-show": "#ff7a45",
  Cancelled: "#e11d48",
};

// "Calificada" es un seguimiento que cambia con el tiempo (arranca en blanco,
// se va definiendo), por eso también es editable como dropdown.
export type QualifiedStatus = "Si" | "No" | "En proceso";

export const QUALIFIED_OPTIONS: QualifiedStatus[] = ["Si", "No", "En proceso"];

export const QUALIFIED_COLORS: Record<QualifiedStatus, string> = {
  Si: "#10b981",
  No: "#e11d48",
  "En proceso": "#3366ff",
};

// Segunda columna de calificación del Excel: si Nacho (el manager) ya
// registró/revisó esa reunión. Distinta de "Calificada" (si la oportunidad
// en sí está calificada) — por eso va en su propia columna editable.
export type NachoReviewStatus = "Si" | "No";

export const NACHO_REVIEW_OPTIONS: NachoReviewStatus[] = ["Si", "No"];

export const NACHO_REVIEW_COLORS: Record<NachoReviewStatus, string> = {
  Si: "#10b981",
  No: "#71717a",
};

// --- Tracker Outreach (evolución semanal de outreach por canal, igual al Excel) ---

export interface OutreachWeek {
  id: string;
  weekStart: string; // ISO date del primer día de la semana (como en el Excel)
  emailEnviados?: number;
  emailOpenRate?: number; // fracción 0-1
  emailReplies?: number;
  emailReuniones?: number;
  linkedinEnviados?: number;
  linkedinReplies?: number;
  linkedinReuniones?: number;
  whatsappEnviados?: number;
  whatsappReplies?: number;
  whatsappReuniones?: number;
  llamadasEnviados?: number; // "Realizadas" en el Excel
  llamadasReplies?: number;
  llamadasReuniones?: number;
  createdAt: string;
}

export interface Meeting {
  id: string;
  forMonth?: string; // "Para que mes va el SQC"
  meetingDate?: string; // ISO date
  company: string;
  // Link a la cuenta del CRM (autocompletado por nombre al crear la reunión).
  // Puede quedar sin resolver si el nombre de "company" no matchea ninguna cuenta.
  accountId?: string;
  contactName?: string;
  contactRole?: string;
  linkedinUrl?: string;
  type?: MeetingType;
  channel?: string;
  status?: MeetingStatus;
  ae?: string;
  sqcValue?: number;
  note?: string;
  qualified?: string; // "Calificada" (Si/No)
  qualifiedByNacho?: string;
  createdAt: string;
}
