---
name: base-de-datos
description: "Use when: you need database migration context, Prisma schema updates, seeding rules, local-to-new-machine database sync, and validation steps to replicate DB behavior in a different codebase."
---

# Base de Datos - Portabilidad Entre Maquinas

Este agente centraliza el contexto de base de datos para que una nueva IA pueda replicar el comportamiento funcional en otra maquina, incluso si el codigo base destino es diferente.

## Objetivo principal

- Documentar cambios de esquema y migraciones de forma operativa.
- Guiar a una IA para aplicar equivalencias de DB en otro proyecto.
- Evitar perdida de historial de datos y errores de compatibilidad entre entornos.

## Alcance

- Prisma schema y migraciones SQL.
- Seeds y datos base requeridos para levantar el sistema.
- Reglas de integridad (FK, nullable, onDelete, indices).
- Validaciones minimas para confirmar que la DB quedo operativa.

## Estado base actual (inventario-industrial)

- ORM principal: Prisma.
- Ubicacion de schema: `backend/prisma/schema.prisma`.
- Carpeta de migraciones: `backend/prisma/migrations/`.
- Seed operativo actual: `backend/scripts/seedAdminOperariosEquipos.js`.

## Estructura detallada de la base de datos

Esta es la estructura que debe replicarse funcionalmente en otra maquina. Si el motor/ORM cambia, mantener la semantica.

### 1) Entidad `Usuario`

- Tabla/modelo: `Usuario`
- Campos:
  - `id`: `Int`, PK, autoincrement.
  - `nombre`: `String`, obligatorio.
  - `email`: `String`, obligatorio, unico.
  - `password`: `String`, obligatorio (hash, nunca texto plano).
  - `rol`: enum `Rol`, obligatorio (`ADMIN` o `OPERADOR`).
  - `creadoEn`: `DateTime`, default `now()`.
- Relaciones:
  - 1:N con `HistorialCambios` (`usuarioId`).
- Reglas:
  - No permitir emails duplicados.
  - El seed debe crear al menos un admin y uno o mas operadores.

### 2) Entidad `Equipo`

- Tabla/modelo: `Equipo`
- Campos:
  - `id`: `Int`, PK, autoincrement.
  - `nombre`: `String`, obligatorio.
  - `sector`: enum `Sector`, obligatorio (`Electrica`, `Neumatica`, `Electronica`).
  - `descripcion`: `String?`, opcional.
  - `estado`: enum `Estado`, obligatorio (`Activo`, `Inactivo`, `EnMantenimiento`).
  - `ubicacion`: `String?`, opcional.
  - `creadoEn`: `DateTime`, default `now()`.
  - `actualizadoEn`: `DateTime`, autoupdate (`@updatedAt`).
- Relaciones:
  - 1:N con `HistorialCambios` (`equipoId`).
- Reglas:
  - `actualizadoEn` debe cambiar automaticamente en cada update.

### 3) Entidad `HistorialCambios`

- Tabla/modelo: `HistorialCambios`
- Campos:
  - `id`: `Int`, PK, autoincrement.
  - `equipoId`: `Int?`, FK nullable a `Equipo.id`.
  - `usuarioId`: `Int`, FK obligatoria a `Usuario.id`.
  - `campo`: `String`, obligatorio (puede ser nombre de campo o accion logica).
  - `valorAnterior`: `String?`, opcional (snapshot previo).
  - `valorNuevo`: `String?`, opcional (snapshot nuevo).
  - `fecha`: `DateTime`, default `now()`.
- Relaciones:
  - N:1 a `Equipo` con `onDelete: SetNull`.
  - N:1 a `Usuario`.
- Reglas criticas:
  - Si se elimina un equipo, el historial debe conservarse (`equipoId` pasa a `null`).
  - La lectura de historial debe tolerar `equipoId = null` sin romper UI/API.

### 4) Enums obligatorios

- `Rol`:
  - `ADMIN`
  - `OPERADOR`
- `Sector`:
  - `Electrica`
  - `Neumatica`
  - `Electronica`
- `Estado`:
  - `Activo`
  - `Inactivo`
  - `EnMantenimiento`
  - Nota: en Prisma existe `@map("En mantenimiento")`; si otro ORM no soporta map, mantener equivalencia semantica.

### 5) Relaciones y cardinalidad (resumen)

- `Usuario (1) -> (N) HistorialCambios`
- `Equipo (1) -> (N) HistorialCambios`
- `HistorialCambios (N) -> (1) Usuario`
- `HistorialCambios (N) -> (0..1) Equipo` (porque `equipoId` es nullable)

### 6) Restricciones minimas a respetar

- PK autoincrement en las 3 tablas.
- Unicidad de `Usuario.email`.
- FK de `HistorialCambios.usuarioId` obligatoria.
- FK de `HistorialCambios.equipoId` nullable con `SET NULL` al borrar equipo.
- Timestamps:
  - `creadoEn` default actual.
  - `actualizadoEn` autoupdate en `Equipo`.

### 7) Datos baseline requeridos (seed)

- Usuario admin de prueba (login funcional).
- Al menos 1 operador para validar cambio de clave admin->operador.
- Equipos de ejemplo para validar:
  - listados/filtros
  - creacion/edicion
  - historial al actualizar/eliminar

### 8) Pruebas de estructura recomendadas

1. Crear equipo -> debe existir registro en `Equipo` y evento en historial.
2. Editar multiples campos de equipo -> historial consolidado en un evento.
3. Eliminar equipo -> `Equipo` se elimina y `HistorialCambios.equipoId` queda `null`.
4. Consultar historial posterior a eliminacion -> no debe fallar.
5. Verificar unicidad de email en `Usuario`.

## Cambios DB criticos que deben replicarse

### 1) Preservacion de historial al eliminar equipos

- La relacion `HistorialCambios -> Equipo` debe permitir mantener historial aunque el equipo sea eliminado.
- Regla aplicada en este proyecto:
  - `equipoId` nullable.
  - relacion opcional.
  - `onDelete: SetNull`.
- Migracion de referencia:
  - `backend/prisma/migrations/20260329190000_historial_equipo_set_null/migration.sql`.

### 2) Compatibilidad de historial para lectura posterior

- El historial no debe depender de que el registro de equipo exista en tiempo real.
- Debe poder reconstruirse con snapshots (`valorAnterior`/`valorNuevo`) cuando la FK este en null.

### 3) Baseline de usuarios y equipos

- Se requiere seed para tener usuarios admin/operador y equipos de prueba.
- Script principal actual:
  - `backend/scripts/seedAdminOperariosEquipos.js`.

## Protocolo de replicacion en otra maquina (mismo repo)

1. `npm --prefix backend install`
2. `npm --prefix backend exec prisma migrate deploy`
3. `npm --prefix backend exec prisma generate`
4. `cd backend; node scripts/seedAdminOperariosEquipos.js; cd ..`
5. Levantar backend y validar endpoints DB-dependientes.

## Protocolo de portabilidad a codigo distinto

Si la nueva maquina usa otro repositorio/arquitectura, la IA debe seguir este orden:

1. Identificar tecnologia de persistencia destino (Prisma, TypeORM, Sequelize, SQL directo).
2. Mapear entidades equivalentes:
   - Usuario
   - Equipo
   - HistorialCambios
3. Replicar reglas funcionales, no solo nombres:
   - Historial sobrevive a eliminacion de equipo.
   - Relacion historica tolera FK nula.
   - Existe semilla minima para login y pruebas.
4. Crear migraciones equivalentes en el motor destino.
5. Ajustar servicios/API para no romper al consultar historial de entidades eliminadas.
6. Ejecutar pruebas de humo y documentar diferencias inevitables.

## Checklist de validacion minima

- Migraciones aplicadas sin errores.
- Cliente ORM generado (si aplica).
- Seed ejecutado correctamente.
- Login admin y operador funcional.
- Consulta de historial funcional antes y despues de eliminar un equipo.
- Sin errores de FK al borrar equipo con historial existente.

## Evidencia que debe dejar la IA en cada cambio

- Fecha.
- Objetivo del cambio DB.
- Archivos de schema/migracion tocados.
- Comando exacto usado para migrar.
- Resultado de validacion.
- Riesgos o pendientes.

## Plantilla rapida de actualizacion

- Fecha:
- Objetivo:
- Schema/migraciones modificadas:
- Seed afectado:
- Comandos ejecutados:
- Resultado:
- Pendientes:

## Regla de sincronizacion

- Todo cambio estructural de DB se registra aqui y tambien en `project-context.agent.md`.
- Si el cambio impacta endpoints, documentar adicionalmente en `raul.agent.md` (o agente de la rama activa).
