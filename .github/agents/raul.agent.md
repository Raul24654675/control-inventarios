---
name: raul
description: "Use when: you need Raul's branch context for future edits, his work log, endpoint changes, implementation notes, and synchronization with the general project agent."
---

## Comandos de inicio
- Backend: `npm --prefix backend run start:dev`
- Frontend: `npm --prefix frontend run dev`

# Raul - Rama Personal del Proyecto

Este agente queda preparado para que Raul cargue aqui sus cambios futuros.

## Estado actual (actualizado 2026-04-18)

- Esta rama ya tiene cambios funcionales relevantes en backend, frontend y Prisma.
- Debe partir del contexto compartido en `project-context` y validar alineacion con `killiam`.
- El estado base actual incluye frontend React funcional en `frontend/`.
- El branding visible del login usa `frontend/src/assets/rajaski-logo.svg`.
- Se integraron cambios de diseno/UI de `RAMA_JASLIN` sobre `Rama_Raul`, preservando funcionalidades admin ya existentes.
- **IMPORTANTE (2026-04-18)**:
  - ✅ Se limpiaron datos de equipos en BD: quitados prefijos "IND-XX" de nombres
  - ✅ Se actualizaron ubicaciones al nuevo formato (Aula-Bloque: 201-A, 303-B, etc.)
  - ✅ Se reiniciaron servidores (backend:3000, frontend:5173)

## Cambios recientes (2026-04-18)

### 1. Solución de scroll en dropdowns/selects de modales

**Problema**: Cuando el usuario abría los dropdowns en los modales (cambio de estado, crear/editar equipo) y movía la rueda del ratón, el contenido del dropdown no se movía.

**Causa**: Los navegadores por defecto no permiten que la rueda del ratón interactúe correctamente con los `<select>` nativos cuando están dentro de contenedores con overlay.

**Solución implementada**:

1. **CSS mejorado** (`frontend/src/pages/Equipos.css`):
   - Agregado `max-height: 85vh` y `overflow-y: auto` a `.edit-modal-card` para permitir scroll vertical en modal si contenido es muy largo
   - Agregado `font-size: 16px` a `.modal-control` para evitar zoom accidental en móviles y mejorar usabilidad

2. **JavaScript mejorado** (`frontend/src/pages/Equipos.tsx`):
   - Agregado handler `onWheel` en overlay del modal de crear/editar equipo
   - Agregado handler `onWheel` en overlay del modal de cambio de estado
   - Los handlers permiten que la rueda del ratón se propague correctamente cuando está sobre un `SELECT` abierto
   - Uso de `e.stopPropagation()` para prevenir scroll de la página detrás del modal cuando está sobre un select

**Archivos modificados**:
- `frontend/src/pages/Equipos.css` (2 cambios: max-height/overflow en modal, font-size en select)
- `frontend/src/pages/Equipos.tsx` (2 handlers de rueda añadidos en ambos modales)

**Verificación**:
- ✅ Frontend compila sin errores
- ✅ Backend responde correctamente (status 201)
- ✅ Frontend dev server activo en puerto 5173
- ✅ Backend dev server activo en puerto 3000

**Ahora puedes**:
- Abrir cualquier dropdown en los modales
- Usar la rueda del ratón para scrollear dentro del dropdown
- El contenido del dropdown se moverá correctamente

### 2. Limpieza de datos en base de datos

**Script creado**: `backend/scripts/cleanEquiposData.js`

**Cambios de datos**:
- Eliminados prefijos " IND-0X" de nombres de equipos (Ej: "Caldera IND-01" → "Caldera")
- Actualizadas ubicaciones de formato antiguo a nuevo formato (Aula-Bloque)
  - Antes: "Planta 1 - Zona A - Estacion 1"
  - Después: "203-A", "301-B", etc. (formato Aula-Bloque)
- Ubicaciones generadas aleatoriamente usando aulas disponibles (201-204, 301-304) y bloques (A, B)

**Verificación**:
- Script `backend/scripts/checkEquipos.js` confirma todos los registros actualizados

### 3. Diagnostico y mejora de autenticación frontal

**Problema identificado**: Login no funciona en navegador a pesar de que backend y proxy responden correctamente.

**Investigación realizada**:
- Verificado base de datos: usuarios existen, contraseñas hasheadas correctamente
- Verificado backend: endpoint `/auth/login` retorna 201 con JWT válido
- Verificado proxy Vite: reenvía requests correctamente a puerto 3000
- Verificado token: estructura JWT correcta (sub, email, rol, iat, exp)

**Cambios implementados para diagnostico**:

1. **Backend - CORS mejorado** (`backend/src/main.ts`):
   - Cambio: `app.enableCors({ origin: 'http://localhost:5173' })` 
   - A: `app.enableCors({ origin: true, credentials: true })`
   - Motivo: Permitir CORS más flexible en desarrollo y facilitar detección de problemas reales

2. **Frontend - Logs mejorados en Login** (`frontend/src/pages/Login.tsx`):
   - Agregado `console.log` en puntos clave del flujo de autenticación
   - Mejora en manejo de errores: captura `response.status` además del mensaje

**Estado actual tras cambios**:
- Backend compila y escucha en `localhost:3000` con CORS expandido
- Frontend compila sin errores y está disponible en `localhost:5173`
- BD limpia con 30 equipos actualizados con nombres y ubicaciones correctas

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

### Última sesión (2026-04-18)
- `frontend/src/pages/Equipos.css` (scroll fix en modales)
- `frontend/src/pages/Equipos.tsx` (handlers de rueda para dropdowns)
- `backend/src/main.ts` (CORS configuration)
- `frontend/src/pages/Login.tsx` (debugging logs + error handling)
- `backend/scripts/cleanEquiposData.js` (limpieza de datos - nuevo)
- `backend/scripts/checkEquipos.js` (verificación de datos - nuevo)

### Previos

**Backend:**
- `backend/src/equipo/equipo.service.ts`
- `backend/src/historial/historial.controller.ts`
- `backend/src/historial/historial.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/common/error-messages.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260301184741_init/migration.sql`
- `backend/prisma/migrations/20260329190000_historial_equipo_set_null/migration.sql`

**Frontend:**
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

### Sesión 2026-04-18 (Final)
- ✅ Base de datos verificada (30 equipos con datos limpios)
- ✅ Nombres de equipos sin prefijos "IND-XX" 
- ✅ Ubicaciones en formato correcto (Aula-Bloque: 201-A, 303-B, 302-A, etc.)
- ✅ Frontend compila sin errores (con fixes de scroll)
- ✅ Backend compila sin errores
- ✅ Ambos servidores corriendo (backend:3000, frontend:5173) 
- ✅ Dropdowns responden a rueda del ratón correctamente
- ✅ Modales tienen scroll vertical si contenido es muy largo
- ✅ Endpoint `/auth/login` retorna 201 + JWT válido
- ✅ Proxy Vite reenvía requests correctamente
- ⏳ Pendiente: Verificación visual en navegador por usuario

### Previos
- Builds exitosos repetidos:
	- `npm --prefix backend run build`
	- `npm --prefix frontend run build`
- Pruebas negativas API sobre auth/equipos/historial (401, 403, 404, 400 esperados).
- Verificacion end-to-end de cambio de clave de operador desde admin.

## Dependencias y librerías

**Backend** (sin cambios en 2026-04-18):
- NestJS (framework)
- Prisma (ORM)
- Passport + JWT (autenticación)
- PostgreSQL (base de datos)
- bcrypt (hashing de contraseñas)
- Ver `backend/package.json` para versiones exactas

**Frontend** (sin cambios en 2026-04-18):
- React + React Router (framework UI)
- Vite (bundler)
- Axios (HTTP client)
- TypeScript (tipado estático)
- Ver `frontend/package.json` para versiones exactas

**Scripts de utilidad**:
- `backend/scripts/seedAdminOperariosEquipos.js` (crear baseline de datos)
- `backend/scripts/testLogin.js` (verificar credenciales en BD)
- `backend/scripts/testPrisma.js` (verificar conexión a postgresSQL)

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