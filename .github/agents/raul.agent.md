---
name: raul
description: "Use when: you need Raul's branch context for future edits, his work log, endpoint changes, implementation notes, and synchronization with the general project agent."
---

# Raul - Rama Personal del Proyecto

Este agente queda preparado para que Raul cargue aqui sus cambios futuros.

## Estado inicial de esta rama personal

- Sin cambios propios documentados todavia.
- Debe partir del contexto compartido en `project-context`.
- Debe revisar la rama `killiam` para conocer el trabajo ya validado.
- El estado base actual incluye frontend React funcional en `frontend/`.
- El branding visible del login usa `frontend/src/assets/rajaski-logo.svg`.

## Que debe cargarse aqui

- Cambios implementados por Raul en backend, base de datos, validaciones, scripts o pruebas.
- Nuevos endpoints o ajustes a endpoints existentes.
- Decisiones tecnicas, supuestos, limitaciones y resultados de validacion.
- Registro de lo pendiente cuando Raul deje una tarea a medio camino.

## Regla de sincronizacion

- Todo cambio propio de Raul se documenta en esta rama personal.
- Todo cambio que impacte el proyecto general tambien se replica en `project-context`.
- Si cambia una regla transversal, este agente y el general deben quedar alineados el mismo dia.

## Plantilla de actualizacion sugerida

- Fecha del cambio
- Objetivo
- Archivos modificados
- Endpoints afectados
- Validaciones ejecutadas
- Proximo paso

## Referencia de instalacion en maquina nueva

- Para instalacion guiada por IA en una maquina nueva (backend + frontend React + Prisma + baseline), revisar:
	- `project-context.agent.md` -> seccion `Runbook IA: instalacion en maquina nueva (backend + React frontend)`.

## Protocolo minimo para onboarding en maquina nueva

- Usar como fuente de verdad el runbook del agente general (`project-context`).
- Ejecutar comandos desde la raiz del repositorio para evitar errores de rutas.
- Asegurar configuracion de `backend/.env` antes de Prisma/Nest.
- Aplicar migraciones, generar cliente Prisma y sembrar baseline oficial.
- Verificar backend y frontend activos antes de comenzar cambios funcionales.

Checklist express para IA:

1. `npm --prefix backend install`
2. `npm --prefix frontend install`
3. `npm --prefix backend exec prisma migrate deploy`
4. `npm --prefix backend exec prisma generate`
5. `cd backend; node scripts/seedAdminOperariosEquipos.js; cd ..`
6. `npm --prefix backend run start:dev`
7. `npm --prefix frontend run dev`

Si Raul encuentra un bloqueo nuevo de instalacion o versionado, documentarlo aqui y en el agente general para mantener continuidad entre maquinas.