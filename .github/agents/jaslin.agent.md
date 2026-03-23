---
name: jaslin
description: "Use when: you need Jaslin's branch context for future edits, pending work log, decisions made by Jaslin, and synchronization notes with the general project agent."
---

# Jaslin - Rama Personal del Proyecto

Este agente queda preparado para que Jaslin cargue aqui sus cambios futuros.

## Estado inicial de esta rama personal

- Sin cambios propios documentados todavia.
- Debe tomar como base el agente general `project-context`.
- Debe revisar tambien la rama `killiam` para entender el estado ya implementado antes de continuar.
- El proyecto ya no es solo backend: existe frontend React completo en `frontend/`.
- El login activo esta en `frontend/src/pages/Login.tsx` con logo `Rajaski`.

## Que debe cargarse aqui

- Nuevos endpoints o modificaciones de endpoints hechas por Jaslin.
- Cambios en DTOs, servicios, controladores, scripts o pruebas realizados por Jaslin.
- Decisiones tecnicas tomadas por Jaslin que afecten su linea de trabajo.
- Riesgos, pendientes, pruebas ejecutadas y resultados.

## Regla de sincronizacion

- Si Jaslin hace un cambio local de su rama, se documenta aqui.
- Si ese cambio afecta al proyecto completo, tambien debe actualizar el agente general `project-context`.
- Si el cambio modifica baseline, arquitectura, reglas de rol o comportamiento global, la actualizacion del agente general es obligatoria.

## Plantilla de actualizacion sugerida

- Fecha del cambio
- Archivos modificados
- Objetivo del cambio
- Endpoints impactados
- Pruebas ejecutadas
- Riesgos o pendientes

## Referencia de instalacion en maquina nueva

- Para que una IA instale todo en una maquina nueva (backend + frontend React + dependencias + baseline), usar:
	- `project-context.agent.md` -> seccion `Runbook IA: instalacion en maquina nueva (backend + React frontend)`.

## Protocolo minimo antes de codificar

- Leer `project-context.agent.md` completo para entender arquitectura, endpoints y reglas.
- Confirmar `backend/.env` valido antes de instalar o ejecutar migraciones.
- Instalar dependencias con comandos desde raiz (`npm --prefix backend install`, `npm --prefix frontend install`).
- Ejecutar Prisma (`migrate deploy` + `generate`) y luego seed baseline.
- Levantar backend y frontend, y validar login admin en entorno local.

Checklist express para IA:

1. `npm --prefix backend install`
2. `npm --prefix frontend install`
3. `npm --prefix backend exec prisma migrate deploy`
4. `npm --prefix backend exec prisma generate`
5. `cd backend; node scripts/seedAdminOperariosEquipos.js; cd ..`
6. `npm --prefix backend run start:dev`
7. `npm --prefix frontend run dev`

Si Jaslin detecta una mejora de onboarding o dependencia nueva, registrar aqui y sincronizar tambien el agente general.