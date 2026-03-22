---
name: project-context
description: "Use when: you need the shared context of the Inventario Industrial project, current backend architecture, validated endpoints, database baseline, role rules, or the current development status. This is the general agent that all contributors should keep updated when a change affects the whole project."
---

# Inventario Industrial - Agente General del Proyecto

Este es el agente general compartido del proyecto. Resume el estado actual validado del backend, las reglas funcionales, el baseline de datos y el protocolo para mantener sincronizados los agentes personales.

## Alcance actual del proyecto

- Estado actual: backend NestJS funcional, sin interfaz web embebida de pruebas.
- Ruta raiz actual: `GET /` responde `Hello World!`.
- Frontend: pendiente para una etapa posterior. La antigua ruta `/tester` fue eliminada.
- Base de datos: PostgreSQL con Prisma.
- Ultima validacion fuerte conocida: build OK, pruebas unitarias 6/6, e2e 16/16, pruebas negativas verificadas.

## Estructura principal

- `backend/src/app.module.ts`: modulo raiz.
- `backend/src/auth/`: autenticacion, JWT y roles.
- `backend/src/equipo/`: CRUD de equipos con restricciones por rol.
- `backend/src/historial/`: consulta de historial de cambios.
- `backend/src/prisma/`: acceso a PostgreSQL mediante Prisma.
- `backend/prisma/schema.prisma`: modelos `Usuario`, `Equipo`, `HistorialCambios` y enums.
- `backend/test/app.e2e-spec.ts`: suite e2e principal.
- `backend/scripts/seedAdminOperariosEquipos.js`: restauracion del baseline fijo.
- `backend/scripts/negative-checks.ps1`: validacion manual de errores y restricciones.

## Endpoints validados

### Salud basica

- `GET /`
  - Respuesta actual: `Hello World!`

### Autenticacion

- `POST /auth/login/admin`
  - Login exclusivo para usuarios con rol `ADMIN`.
- `POST /auth/login/operador`
  - Login exclusivo para usuarios con rol `OPERADOR`.
- `POST /auth/register`
  - Requiere token JWT valido.
  - Requiere rol `ADMIN`.
  - Permite crear usuarios con rol `ADMIN` u `OPERADOR` segun payload.
  - Devuelve mensaje `Usuario creado con exito` y el usuario sin password.

### Equipos

- `GET /equipos`
  - Requiere `ADMIN` u `OPERADOR`.
  - Soporta filtros por `id`, `sector`, `estado`, `nombre`, `ubicacion`, `page`, `limit`.
- `GET /equipos/:id`
  - Requiere `ADMIN` u `OPERADOR`.
  - Valida que `id` sea entero positivo.
- `POST /equipos`
  - Solo `ADMIN`.
  - Requiere `nombre`, `sector`, `estado`.
  - Registra historial de creacion.
- `PATCH /equipos/:id`
  - `ADMIN` y `OPERADOR`.
  - El `OPERADOR` no puede cambiar `sector` ni `estado`.
  - Registra historial de actualizacion.
- `DELETE /equipos/:id`
  - Solo `ADMIN`.
  - Borra historial asociado antes del delete para evitar error por FK.

### Historial

- `GET /historial`
  - Requiere `ADMIN` u `OPERADOR`.
  - Devuelve historial enriquecido con equipo, usuario, accion, cambios y resumen.
- `GET /historial?equipoId=<id>`
  - Requiere `ADMIN` u `OPERADOR`.
  - Valida que `equipoId` sea entero positivo.

## Reglas de negocio confirmadas

- El backend opera con roles `ADMIN` y `OPERADOR`.
- Un `OPERADOR` no puede crear equipos.
- Un `OPERADOR` no puede eliminar equipos.
- Un `OPERADOR` no puede registrar usuarios.
- Un `OPERADOR` puede listar equipos, consultar equipos y editar campos permitidos.
- Los mensajes de error estan centralizados en `backend/src/common/error-messages.ts`.
- `JwtAuthGuard` devuelve mensajes claros para token requerido, invalido o expirado.
- `RolesGuard` devuelve `La accion no esta permitida para este rol` cuando corresponde.

## Baseline fijo de PostgreSQL

Este baseline no debe borrarse ni alterarse sin una decision explicita del equipo.

- 1 administrador unico esperado por baseline:
  - `AdminMaster@inventario.local`
- 15 operarios esperados por baseline:
  - `OperarioA1@inventario.local` hasta `OperarioA15@inventario.local`
- 30 equipos con datos completos.
- Claves esperadas:
  - Admin: `ADMIN2026`
  - Operarios: `OPERADOR2026`

Script oficial de restauracion:

```bash
cd backend
node scripts/seedAdminOperariosEquipos.js
```

## Validaciones ya realizadas

- Compilacion NestJS: OK.
- Unit tests: `npm test -- --runInBand` -> 6/6 OK.
- E2E: `npm run test:e2e -- --runInBand` -> 16/16 OK.
- Validaciones negativas cubiertas:
  - login con usuario inexistente
  - clave incorrecta
  - login por endpoint de rol equivocado
  - acceso sin token
  - token invalido
  - ID de equipo invalido
  - equipo inexistente
  - rol invalido en registro
  - sector invalido
  - `equipoId` invalido en historial

## Flujo de trabajo para agentes

- Todo cambio que afecte al proyecto completo debe reflejarse aqui, en este agente general.
- Cada colaborador mantiene ademas su agente personal como rama de trabajo documental.
- Si un cambio personal impacta arquitectura, endpoints, reglas, scripts, baseline o pruebas, tambien debe actualizarse este agente general.
- Antes de trabajar en una feature nueva, revisar este agente y luego el agente personal correspondiente.

## Agentes personales asociados

- `killiam`: historial consolidado de lo ya implementado y validado.
- `jaslin`: rama personal para futuros cambios de Jaslin.
- `raul`: rama personal para futuros cambios de Raul.
