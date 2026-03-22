---
name: killiam
description: "Use when: you need Killiam's branch context, the validated endpoint work, backend hardening history, PostgreSQL baseline setup, test status, and the changes already completed in this project."
---

# Killiam - Rama Personal del Proyecto

Este agente concentra todo lo que ya quedo implementado y validado por Killiam hasta el estado actual del proyecto.

## Estado consolidado cargado en esta rama

- Backend NestJS operativo con Prisma y PostgreSQL.
- Conexion a base de datos corregida y estable.
- Cliente Prisma regenerado y errores de tipos corregidos.
- Autenticacion separada por rol con endpoints dedicados.
- Registro protegido para uso administrativo.
- Reglas de autorizacion por rol reforzadas.
- CRUD de equipos ajustado con restricciones para `OPERADOR`.
- Historial de cambios enriquecido y sin valores nulos en creacion.
- Filtros y paginacion de equipos funcionales.
- Mensajes de error centralizados en espanol.
- Interfaz `/tester` eliminada para dejar el backend limpio.
- Ruta raiz restaurada a `GET /` con respuesta simple.

## Endpoints y validaciones cargadas en Killiam

### Auth

- `POST /auth/login/admin`
- `POST /auth/login/operador`
- `POST /auth/register`

### Equipos

- `GET /equipos`
- `GET /equipos/:id`
- `POST /equipos`
- `PATCH /equipos/:id`
- `DELETE /equipos/:id`

### Historial

- `GET /historial`
- `GET /historial?equipoId=<id>`

### Resultado de validacion conocido

- Build: OK.
- Unit tests: 6/6 OK.
- E2E: 16/16 OK.
- Pruebas negativas: verificadas.
- Baseline restaurado despues de ejecutar e2e.

## Baseline de datos que esta documentado en esta rama

- Admin baseline: `AdminMaster@inventario.local`
- Password admin: `ADMIN2026`
- Operarios baseline: `OperarioA1@inventario.local` a `OperarioA15@inventario.local`
- Password operarios: `OPERADOR2026`
- Equipos baseline: 30 registros completos.

## Referencias de implementacion asociadas

- `backend/src/auth/`
- `backend/src/equipo/`
- `backend/src/historial/`
- `backend/src/common/error-messages.ts`
- `backend/test/app.e2e-spec.ts`
- `backend/scripts/seedAdminOperariosEquipos.js`
- `backend/scripts/negative-checks.ps1`

## Ultimo hito cargado

- Commit de referencia del backend endurecido y sin tester UI: `83af167`

## Regla de mantenimiento para esta rama

- Todo lo que Killiam implemente o valide en su linea de trabajo debe anotarse aqui.
- Si el cambio tambien afecta al proyecto completo, debe reflejarse ademas en el agente general `project-context`.