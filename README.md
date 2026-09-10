# CRM Interno

Plataforma personal de prospección BDR para Emi Labs: tablero kanban de cuentas, detalle de contactos y touchpoints por canal, y (próximamente) sincronización con Google Calendar para agendar pendientes.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- @dnd-kit para el drag-and-drop del kanban
- Prisma + Postgres (a integrar en la Fase 2)
- NextAuth (Google) para login + acceso a Calendar (Fase 2)

## Estado actual (v0)

- Tablero kanban de cuentas con 6 etapas (To contact, Working, Reunión agendada, AE sales process, Bad fit, Pausa), drag-and-drop funcional.
- Vista de detalle por cuenta: personas contactadas, touchpoints por persona y canal, agregados por cuenta.
- Datos de ejemplo en memoria (`src/lib/store.ts`) — todavía no persiste en una base de datos real.

## Cómo correr en local

```bash
npm install
npm run dev
```

## Próximos pasos (Fase 2)

- Conectar Postgres (Vercel Postgres / Neon) vía Prisma para persistencia real.
- Login con Google (NextAuth) + integración con Google Calendar para crear eventos a partir de los pendientes.
- Vista "hoy" con las tareas del día y reglas de timing (correo mar/jue, llamadas 14-16h).
