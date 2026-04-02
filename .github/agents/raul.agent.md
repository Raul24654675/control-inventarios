---
name: raul
description: "Use when: you need Raul's branch context for future edits, his work log, endpoint changes, implementation notes, and synchronization with the general project agent."
---

# Raul - Rama Personal del Proyecto

Este agente queda preparado para que Raul cargue aqui sus cambios futuros.

## Estado actual (actualizado 2026-04-02)

- Esta rama ya tiene cambios funcionales relevantes en backend, frontend y Prisma.
- Debe partir del contexto compartido en `project-context` y validar alineacion con `killiam`.
- El estado base actual incluye frontend React funcional en `frontend/`.
- El branding visible del login usa `frontend/src/assets/rajaski-logo.svg`.
- Se integraron cambios de diseno/UI de `RAMA_JASLIN` sobre `Rama_Raul`, preservando funcionalidades admin ya existentes.

## Cambios recientes (2026-04-02)

### 1) Integracion de ramas (Rama_Raul + RAMA_JASLIN)

- Se incorporo el rediseño de frontend proveniente de `RAMA_JASLIN` y se mantuvieron capacidades funcionales de `Rama_Raul`.
- Se unifico navegacion para soportar ambas rutas:
	- `/usuarios` (gestion admin de usuarios)
	- `/perfil` (perfil de usuario)
- Se resolvieron conflictos de merge en:
	- `frontend/src/App.tsx`
	- `frontend/src/components/Layout.tsx`
	- `frontend/src/pages/Equipos.tsx`
	- `frontend/src/pages/Historial.tsx`

### 2) UI/UX agregada desde RAMA_JASLIN

- Nuevos/modificados para experiencia de perfil y layout:
	- `frontend/src/pages/Profile.tsx`
	- `frontend/src/pages/Profile.css`
	- `frontend/src/profile-storage.ts`
	- `frontend/src/useAuth.ts`
	- `frontend/src/components/Layout.css`
	- `frontend/src/App.css`
	- `frontend/src/index.css`
	- `frontend/src/main.tsx`
- `Layout.tsx` quedo con menu de usuario (avatar, perfil, cerrar sesion) y opcion admin para ir a `Usuarios`.

### 3) Correccion de textos con codificacion danada

- Se corrigieron cadenas con caracteres extranos (mojibake) en:
	- `frontend/src/pages/Login.tsx`
	- `frontend/src/pages/Profile.tsx`
- Objetivo: evitar textos tipo `sesi├│n`, `contrase├▒a` y mostrar strings legibles.

### 4) Estado funcional tras integracion

- Build backend OK.
- Build frontend OK.
- Rama limpia y sincronizada con remoto (`origin/Rama_Raul`) al cierre de la integracion.

## Resumen de cambios implementados hoy

### 1) Equipos y filtros

- Filtro de `ID` en equipos cambiado a coincidencia parcial (contains): escribir `1` devuelve `1`, `10`, `100`, etc.
- Orden del listado de equipos unificado por `id` ascendente tanto con como sin filtros.
- Creacion de equipo endurecida: ahora exige `nombre`, `sector`, `estado`, `descripcion` y `ubicacion`.
- En frontend de equipos:
	- Validacion en cliente para bloquear creacion si faltan `descripcion` o `ubicacion`.
	- Cuadro informativo en modal reubicado debajo de `Descripcion`.
	- Cuadro de error ubicado debajo de `Descripcion` y encima de botones.

### 2) Historial

- Se corrigio la carga de historial para tolerar registros donde la relacion `equipo` no este presente.
- En eliminacion de equipos se registra evento `ELIMINACION` en historial con snapshot del equipo.
- Actualizaciones de equipo ahora se registran en un solo evento consolidado (`ACTUALIZACION`) con JSON de cambios antes/despues.
- Formato en frontend para columna `Cambio`:
	- `CREACION` => `Equipo creado`.
	- `ELIMINACION` => `Equipo eliminado`.
	- `ACTUALIZACION` => detalle por campo (`campo: anterior -> nuevo`) con saltos de linea.
- Se agrego borrado total de historial con confirmacion en UI.
- Si historial esta vacio:
	- Vista principal muestra `historial vacio`.
	- Modal de borrar historial muestra `historial vacio` en lugar de confirmacion.

### 3) Usuarios (nueva pantalla admin)

- Se agrego pestaña `Usuarios` junto a `Equipos` e `Historial` (visible para `ADMIN`).
- Nueva ruta frontend: `/usuarios`.
- Nueva pagina `frontend/src/pages/Usuarios.tsx` con tabla y columnas:
	- `ID`, `nombre`, `email`, `rol`, `creadoEn`.
- Filtros en `Usuarios`:
	- `ID` (solo numeros en input, no letras).
	- `nombre` (barra de texto).
	- `correo` (barra de texto).
- Filtro por `ID` en usuarios tambien es por coincidencia parcial (contains).

### 4) Cambio de clave de operadores por admin

- Se agrego accion en tabla de usuarios para filas con `rol=OPERADOR`:
	- Boton `Editar contraseña` abre modal.
	- Admin ingresa nueva clave y guarda.
- Backend valida que:
	- El usuario objetivo exista.
	- El usuario objetivo sea `OPERADOR`.
	- La nueva clave no sea vacia.
	- La nueva clave sea distinta a la actual (comparada contra hash).
- Mensaje requerido implementado al repetir clave:
	- `ingresa una contraseña diferente a la actual`.
- Validacion tecnica hecha: cambio via endpoint, hash en BD modificado, login con clave anterior falla y con clave nueva funciona.

## Cambios de base de datos / Prisma

- Relacion `HistorialCambios -> Equipo` actualizada para preservar historial al eliminar equipo:
	- `equipoId` nullable.
	- `onDelete: SetNull`.
- Nueva migracion aplicada en BD local:
	- `backend/prisma/migrations/20260329190000_historial_equipo_set_null/migration.sql`.

## Endpoints relevantes (estado actual)

- `GET /auth/users` (ADMIN): lista usuarios, soporta filtros `id`, `nombre`, `email`.
- `PATCH /auth/users/:id/password` (ADMIN): cambia clave de un `OPERADOR`.
- `DELETE /historial` (ADMIN): elimina todo el historial.
- `GET /historial` y `GET /historial?equipoId=`: historial general / por equipo.

## Archivos clave tocados

- Backend:
	- `backend/src/equipo/equipo.service.ts`
	- `backend/src/historial/historial.controller.ts`
	- `backend/src/historial/historial.service.ts`
	- `backend/src/auth/auth.controller.ts`
	- `backend/src/auth/auth.service.ts`
	- `backend/src/common/error-messages.ts`
	- `backend/prisma/schema.prisma`
	- `backend/prisma/migrations/20260301184741_init/migration.sql`
	- `backend/prisma/migrations/20260329190000_historial_equipo_set_null/migration.sql`
- Frontend:
	- `frontend/src/components/Layout.tsx`
	- `frontend/src/components/Layout.css`
	- `frontend/src/App.tsx`
	- `frontend/src/App.css`
	- `frontend/src/index.css`
	- `frontend/src/main.tsx`
	- `frontend/src/pages/Equipos.tsx`
	- `frontend/src/pages/Equipos.css`
	- `frontend/src/pages/Historial.tsx`
	- `frontend/src/pages/Historial.css`
	- `frontend/src/pages/Usuarios.tsx`
	- `frontend/src/pages/Login.tsx`
	- `frontend/src/pages/Profile.tsx`
	- `frontend/src/pages/Profile.css`
	- `frontend/src/profile-storage.ts`
	- `frontend/src/useAuth.ts`

## Validaciones ejecutadas

- Builds exitosos repetidos:
	- `npm --prefix backend run build`
	- `npm --prefix frontend run build`
- Pruebas negativas API sobre auth/equipos/historial (401, 403, 404, 400 esperados).
- Verificacion end-to-end de cambio de clave de operador desde admin.

## Notas operativas para IA en maquina nueva

- Ejecutar comandos desde la raiz del repo.
- Si ya estas dentro de `backend/`, no usar `npm --prefix backend ...` porque busca `backend/backend/package.json`.
- En Windows puede aparecer lock intermitente de Prisma DLL; si ocurre, cerrar procesos Node y regenerar Prisma client.
- Confirmar backend escuchando en `http://localhost:3000` antes de validar frontend.

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

## Runbook para replicar en codigo totalmente distinto

Objetivo: que una IA externa pueda llevar este comportamiento a otro repositorio aunque estructura, estilos y nombres cambien.

### Fase A - Levantamiento inicial

1. Identificar stack real del repositorio destino (framework backend, framework frontend, ORM, auth).
2. Mapear equivalencias contra este proyecto:
	- Auth/login/roles
	- CRUD de equipos
	- Historial de cambios
	- Modulo de usuarios admin
	- Perfil de usuario
3. Detectar restricciones (nombres de tablas, convenciones API, tipado, router, UI kit).

### Fase B - Portabilidad funcional minima (orden recomendado)

1. Implementar roles y guardas equivalentes a `ADMIN` y `OPERADOR`.
2. Implementar endpoints de usuarios:
	- `GET /auth/users` con filtros `id`, `nombre`, `email`.
	- `PATCH /auth/users/:id/password` restringido a admin y solo objetivo operador.
3. Implementar historial robusto:
	- Soportar eliminacion de equipo sin perder historial (FK nullable + `SetNull` o equivalente).
	- Consolidar cambios multiples de update en un solo evento de historial.
4. Implementar frontend de `Usuarios` (tabla, filtros, cambio de clave por modal).
5. Implementar frontend de `Perfil` y menu de usuario en layout.
6. Corregir textos/encoding en todas las vistas para evitar mojibake.

### Fase C - UI parity minima

1. Garantizar rutas funcionales:
	- `/equipos`
	- `/historial`
	- `/usuarios` (solo admin)
	- `/perfil`
2. Validar que la navegacion no rompa por cambios de provider/auth hook.
3. Mantener consistencia visual sin exigir pixel-perfect (priorizar comportamiento).

### Fase D - Criterios de aceptacion (Done)

1. Login admin y operador funcional.
2. Admin puede listar usuarios filtrando por ID parcial, nombre y correo.
3. Admin puede cambiar clave de operador y backend rechaza clave repetida.
4. Historial muestra creacion, actualizacion consolidada y eliminacion sin romper cuando equipo fue borrado.
5. Frontend compila y backend compila en entorno destino.
6. Sin textos corruptos de codificacion en UI.

### Entregables minimos que la nueva IA debe dejar

1. Lista de archivos modificados en backend y frontend del repo destino.
2. Lista de endpoints nuevos/ajustados con reglas de autorizacion.
3. Migraciones o cambios de esquema aplicados.
4. Evidencia de build/test basicos ejecutados.
5. Notas de diferencias inevitables respecto a este repo (si las hay).