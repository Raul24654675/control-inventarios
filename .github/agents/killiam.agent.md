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
- Frontend React/Vite creado e integrado con proxy al backend.
- CORS habilitado en backend para `http://localhost:5173`.
- Login frontend personalizado con branding `Rajaski` y tabs por rol.
- Pantallas frontend operativas para `Equipos` e `Historial`.

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
- `backend/src/main.ts`
- `frontend/src/App.tsx`
- `frontend/src/AuthContext.tsx`
- `frontend/src/api.ts`
- `frontend/src/components/Layout.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Equipos.tsx`
- `frontend/src/pages/Historial.tsx`
- `frontend/src/assets/rajaski-logo.svg`
- `frontend/vite.config.ts`

## Estado actual del frontend documentado en Killiam

- Login:
	- tabs `Administrador` y `Operador`
	- placeholders: `ingresa tu usuario` / `ingresa tu contraseña`
	- iconos `👤` y `🔒`
	- boton `Iniciar sesión`
	- logo grande centrado arriba del formulario
- Auth:
	- JWT guardado en `localStorage`
	- redireccion a `/equipos` despues de login exitoso
- Layout:
	- barra superior con `Equipos`, `Historial`, rol, email y logout
- Equipos:
	- filtros, paginacion, modal de alta/edicion y borrado para admin
- Historial:
	- listado y filtro por `equipoId`

## Archivos residuales que no deben confundirse con la version activa

- `frontend/src/assets/login-brand.png`
- `frontend/src/assets/login-logo-source.png`
- `frontend/src/App.css`
- assets heredados de Vite (`hero.png`, `react.svg`, `vite.svg`, `public/icons.svg`, `public/favicon.svg`)

## Resultado de validacion conocido mas reciente

- Backend directo: autenticacion, proteccion de rutas y roles validados.
- Proxy frontend -> backend: validado.
- Build frontend: OK.
- Asset de logo activo: `rajaski-logo.svg`.

## Ultimo hito cargado

- Commit de referencia del backend endurecido y sin tester UI: `83af167`

## Regla de mantenimiento para esta rama

- Todo lo que Killiam implemente o valide en su linea de trabajo debe anotarse aqui.
- Si el cambio tambien afecta al proyecto completo, debe reflejarse ademas en el agente general `project-context`.

## Referencia de instalacion en maquina nueva

- Para que una IA prepare entorno desde cero (instalar React/frontend, backend, Prisma y baseline), seguir el runbook:
	- `project-context.agent.md` -> seccion `Runbook IA: instalacion en maquina nueva (backend + React frontend)`.

## Protocolo de arranque para otra IA en maquina nueva

- Paso 1: leer primero `project-context.agent.md` completo.
- Paso 2: ejecutar instalaciones solo desde la raiz del repo con `npm --prefix`.
- Paso 3: configurar `backend/.env` antes de correr Prisma o Nest.
- Paso 4: aplicar `prisma migrate deploy`, luego `prisma generate`, luego seed baseline.
- Paso 5: validar con `GET /`, login admin y build frontend/backend.

Checklist rapido recomendado:

1. `npm --prefix backend install`
2. `npm --prefix frontend install`
3. `npm --prefix backend exec prisma migrate deploy`
4. `npm --prefix backend exec prisma generate`
5. `cd backend; node scripts/seedAdminOperariosEquipos.js; cd ..`
6. `npm --prefix backend run start:dev`
7. `npm --prefix frontend run dev`

Si esta rama personal detecta nuevos errores de onboarding, documentarlos aqui y en `project-context.agent.md` para mantener un unico estandar.