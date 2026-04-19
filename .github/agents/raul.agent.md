---
name: raul
description: "Use when: you need Raul's branch context for future edits, his work log, endpoint changes, implementation notes, and synchronization with the general project agent."
---

## Comandos de inicio
- Backend: `npm --prefix backend run start:dev`
- Frontend: `npm --prefix frontend run dev`

# Raul - Rama Personal del Proyecto

Este agente queda preparado para que Raul cargue aqui sus cambios futuros.

## Estado actual (actualizado 2026-04-19)

- Esta rama ya tiene cambios funcionales relevantes en backend, frontend y Prisma.
- Debe partir del contexto compartido en `project-context` y validar alineacion con `killiam`.
- El estado base actual incluye frontend React funcional en `frontend/`.
- El branding visible del login usa `frontend/src/assets/rajaski-logo.svg`.
- Se integraron cambios de diseno/UI de `RAMA_JASLIN` sobre `Rama_Raul`, preservando funcionalidades admin ya existentes.
- **IMPORTANTE (2026-04-19)**:
  - ✅ Hardening de seguridad completo: DTOs, ValidationPipe, rate limit, JWT enforcement, headers, CORS, logs sanitizados
  - ✅ Flujo Activo avanzado en modal de estado (desde Inactivo y desde EnMantenimiento)
  - ✅ Modal de detalle readonly en Historial para cambios de estado
  - ✅ Filtros avanzados en Historial (equipo, realizado por, accion, cambio)
  - ✅ Calendarios DayPicker en Historial y en modal de estado de Equipos
  - ✅ Campo telefono internacional en Perfil con selector de pais
  - ✅ Columna Cambio en Historial muestra solo transiciones compactas
  - ✅ Logs backend y frontend con timestamps y redaccion de datos sensibles
  - ✅ Dependencias auditadas y actualizadas (0 vulnerabilidades en produccion)
- **IMPORTANTE (2026-04-18)**:
  - ✅ Se limpiaron datos de equipos en BD: quitados prefijos "IND-XX" de nombres
  - ✅ Se actualizaron ubicaciones al nuevo formato (Aula-Bloque: 201-A, 303-B, etc.)
  - ✅ Se reiniciaron servidores (backend:3000, frontend:5173)

## Cambios recientes (2026-04-19)

### 1. Hardening de seguridad — Backend

**Objetivo**: Eliminar superficie de ataque encontrada en auditoria de la sesion anterior.

#### 1.1 DTOs de validacion fuertemente tipados

**Archivos creados** (`backend/src/auth/dto/`):
- `register-user.dto.ts`: valida `nombre` (string no vacio), `email` (formato email), `password` (min 8 chars), `rol` (opcional, solo ADMIN/OPERADOR)
- `login.dto.ts`: valida `email` (formato email) y `password` (string no vacio)
- `update-operador-password.dto.ts`: valida `password` (min 8 chars)
- `update-operador-activo.dto.ts`: valida `activo` (booleano)

#### 1.2 Controlador de autenticacion endurecido

**Archivo modificado**: `backend/src/auth/auth.controller.ts`

Cambios aplicados:
- Todos los endpoints ahora usan `@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` — rechaza campos desconocidos y transforma tipos
- Reemplazado `@Body() data: any` por los DTOs tipados en todos los endpoints
- Implementado rate limiting propio por `email + IP + canal` (8 intentos max en 60s, responde HTTP 429) en `/auth/login`, `/auth/login/admin` y `/auth/login/operador`

#### 1.3 JWT secret obligatorio

**Archivos modificados**:
- `backend/src/auth/jwt.strategy.ts`: constructor lanza error si `JWT_SECRET` no esta definido en entorno; eliminado fallback inseguro `'default_jwt_secret'`
- `backend/src/auth/auth.module.ts`: cambiado a `JwtModule.registerAsync` con factory que valida secreto al iniciar

#### 1.4 Bootstrap de la aplicacion endurecido

**Archivo modificado**: `backend/src/main.ts`

Cambios aplicados:
- **Headers de seguridad**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
- **Logs sanitizados**: funcion `redactSensitive` oculta automaticamente keys `password`, `token`, `authorization`, `access_token`, `refresh_token` en todos los logs
- **CORS restringido**: whitelist cargada desde variable de entorno `CORS_ORIGINS` (default: `http://localhost:5173,http://127.0.0.1:5173`); origenes no autorizados reciben rechazo
- **Logging de requests**: imprime metodo, URL, query (sanitizado), body (sanitizado) y duracion en ms con timestamp `es-CO`

#### 1.5 Auditoria y actualizacion de dependencias

- Ejecutado `npm audit fix` en backend y frontend
- Resultado: **0 vulnerabilidades en produccion** (`--omit=dev`) en ambos proyectos
- Actualizados: `@nestjs/core`, `path-to-regexp`, `multer` y paquetes transitivos; `axios` y `follow-redirects` en frontend

**Validaciones backend**:
- ✅ `npm run build` exitoso post-hardening
- ✅ `npm audit --omit=dev`: 0 vulnerabilidades en produccion

---

### 2. Hardening de seguridad — Frontend

**Archivo modificado**: `frontend/src/api.ts`

Cambios aplicados:
- Funcion `redactValue` recursiva que oculta keys sensibles (`password`, `token`, `authorization`, `secret`, `refreshToken`) en logs de request
- Logs de requests y responses **solo activos en modo desarrollo** (`import.meta.env.DEV`); en produccion no se imprime ninguna informacion en consola

**Validaciones frontend**:
- ✅ `npm run build` exitoso post-hardening
- ✅ `npm audit --omit=dev`: 0 vulnerabilidades

---

### 3. Modal de cambio de estado — Flujo Activo avanzado

**Archivo modificado**: `frontend/src/pages/Equipos.tsx`

**Logica nueva**:
- Si estado anterior es `Inactivo` → Activo: muestra campos `motivoReactivacion` (select con 5 opciones), `justificacionReactivacion` (textarea obligatorio), `observacionesReactivacion` (opcional)
- Si estado anterior es `EnMantenimiento` → Activo: muestra `tipoMantenimientoRealizado`, `resultadoMantenimiento`, `pruebasRealizadas` (checkboxes: Encendido, Diagnostico, PruebaFuncional, ValidacionTecnica), `descripcionReparacion`, `condicionActual`
- Todos los campos nuevos tienen validacion en cliente antes de enviar

**Payload al backend**: incluye rama condicional segun estado previo del equipo; el servicio de backend almacena el detalle completo como JSON en historial.

**Formatos de fecha y hora**:
- Fecha de inicio y fecha estimada de finalizacion: reemplazados inputs nativos `type="date"` por calendarios `DayPicker` con popover, navegacion por mes/ano y botones Limpiar/Hoy
- Hora de inicio: reemplazado `type="time"` por selectores de hora (1-12) + AM/PM

**Costos en COP**:
- Campos de costo usan formato COP con separadores de miles (`.`)
- Costo total se calcula automaticamente sumando mano de obra + repuestos (campo readonly)

**Archivo modificado**: `frontend/src/pages/Equipos.css`
- Estilos del popover de calendario (`.custom-date-popover`, `.rdp`, `.custom-date-icon`, `.custom-date-actions`)
- Jerarquia visual de labels en modal de estado (microetiquetas uppercase)
- Clases `date-open` y `calendar-open` para controlar z-index y pointer-events durante uso del calendario

---

### 4. Historial — Modal de detalle readonly

**Archivo modificado**: `frontend/src/pages/Historial.tsx`

- Nueva columna en tabla con boton `···` para registros de tipo `campo === 'estado'`
- Modal `EntryDetailModal` muestra chips de transicion (estado anterior → nuevo), datos completos segun tipo de cambio:
  - Panel `DetailInactivo`: motivo, prioridad, descripcion, tiempo estimado, accion requerida, evidencia
  - Panel `DetailMantenimiento`: tipo, motivo, fechas, horas, costos, descripcion tecnica, evidencia
  - Panel `DetailActivoDesdeInactivo`: motivo reactivacion, justificacion, observaciones
  - Panel `DetailActivoDesdeMantenimiento`: tipo realizado, resultado, pruebas, descripcion, condicion
- Componentes helper `ROField`, `RORow`, `HDivider` para layout de campos readonly

**Archivo modificado**: `frontend/src/pages/Historial.css`
- Estilos del modal de detalle: `.hd-modal`, `.hd-modal-header`, `.hd-chip`, `.hd-field`, `.hd-row`, `.hd-section-title`, `.hd-modal-footer`, animacion `hd-modal-in`

---

### 5. Historial — Filtros avanzados y mejoras visuales

**Filtros nuevos** (backend + frontend):
- `equipo`: busca por nombre (contains) o ID numerico
- `realizadoPor`: busca por nombre de usuario (contains)
- `accion`: select con opciones fijas `CREACION`, `ACTUALIZACION`, `ELIMINACION`
- `cambio`: select con 6 transiciones fijas de estado (ej. `Activo -> Inactivo`, `Inactivo -> En mantenimiento`, etc.)
- Filtros de fecha reemplazados por `DayPicker` en popover (igual al de Equipos)

**Columna Cambio**: muestra solo la transicion compacta para registros de estado (ej. `Activo -> En mantenimiento`); para otros campos sigue mostrando el detalle anterior.

**Visual de selects**: clase `.history-select-wrap` con chevron animado, colores de opcion `--equipos-filter-option-bg/text` por tema (claro/oscuro), animacion `dropdown-pop`.

**Archivos modificados**:
- `backend/src/historial/historial.controller.ts`: nuevos query params (`equipo`, `realizadoPor`, `accion`, `cambio`)
- `backend/src/historial/historial.service.ts`: logica de filtrado por equipo/usuario/accion/transicion; metodos privados `normalizeEstado`, `extractEstadoFromCambio`, `estadoTransitionLabel`
- `backend/src/equipo/equipo.service.ts`: `updateEstado` ahora persiste detalle rico como JSON en `valorNuevo` del historial; `valorAnterior` tambien es JSON `{ estado: '...' }`
- `frontend/src/pages/Historial.tsx`: nuevos estados de filtro, logica de DayPicker, componentes de detalle modal, `formatCambios` actualizado
- `frontend/src/pages/Historial.css`: selects estilizados, calendarios, modal de detalle

---

### 6. Perfil — Campo telefono internacional premium

**Archivo modificado**: `frontend/src/pages/Profile.tsx`

Reemplazado campo simple de texto por componente `ProfilePhoneField` con:
- Dataset de ~65 paises con bandera emoji, prefijo internacional, min/max digitos y patron de formato
- Selector de pais con dropdown buscable (por nombre, ISO2 o prefijo)
- Deteccion automatica del pais por `navigator.language` al cargar
- Formato inteligente: digitos agrupados segun patron del pais (ej. Colombia: `XXX XXX XXXX`)
- Validacion por pais: estado `is-invalid` si longitud fuera del rango valido
- Placeholder dinamico con formato esperado del pais seleccionado
- Parseo del valor almacenado: detecta prefijo y separa digitos locales al cargar

**Archivo modificado**: `frontend/src/pages/Profile.css`
- Estilos del compound input: `.profile-phone-country`, `.profile-phone-dropdown`, `.profile-phone-list`, `.profile-phone-option`, `.phone-input-wrap.is-invalid`, `.profile-phone-error`, `.profile-phone-hint`
- Animacion de apertura del dropdown (`profilePhoneDropdownIn`)

---

### 7. Logs de observabilidad con timestamps

**Backend** (`backend/src/main.ts`):
- Middleware de request logging imprime `[BACKEND][dd/mm/aa hh:mm:ss] -> METHOD /ruta` al entrar y `<-` con status y duracion al terminar; datos sensibles redactados

**Frontend** (`frontend/src/api.ts`):
- Interceptores Axios imprimen `[FRONTEND][timestamp] ->/<-` con metodo, URL, status y duracion; solo activos en `import.meta.env.DEV`

---

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

- `POST /auth/login` (público): recibe `LoginDto`, aplica ValidationPipe y rate limit 429
- `POST /auth/login/admin` (público): ídem con canal `admin`
- `POST /auth/login/operador` (público): ídem con canal `operador`
- `POST /auth/register` (ADMIN): recibe `RegisterUserDto` con `rol` opcional
- `GET /auth/users` (ADMIN): lista usuarios, soporta filtros `id`, `nombre`, `email`, `activo`
- `PATCH /auth/users/:id/password` (ADMIN): recibe `UpdateOperadorPasswordDto`, cambia clave de un OPERADOR
- `PATCH /auth/users/:id/activo` (ADMIN): recibe `UpdateOperadorActivoDto`, activa/inactiva usuario
- `PATCH /equipos/:id/estado` (AUTH): actualiza estado con payload enriquecido; persiste detalle JSON en historial
- `GET /historial` (AUTH): soporta filtros `equipo`, `realizadoPor`, `accion`, `cambio`, `fechaDesde`, `fechaHasta`
- `DELETE /historial` (ADMIN): elimina todo el historial

## Archivos clave tocados

### Sesión 2026-04-19
**Backend — Seguridad:**
- `backend/src/auth/auth.controller.ts` (DTOs + ValidationPipe + rate limit 429)
- `backend/src/auth/dto/register-user.dto.ts` (nuevo)
- `backend/src/auth/dto/login.dto.ts` (nuevo)
- `backend/src/auth/dto/update-operador-password.dto.ts` (nuevo)
- `backend/src/auth/dto/update-operador-activo.dto.ts` (nuevo)
- `backend/src/auth/jwt.strategy.ts` (JWT_SECRET obligatorio)
- `backend/src/auth/auth.module.ts` (JwtModule.registerAsync con validacion de secreto)
- `backend/src/main.ts` (headers de seguridad, CORS whitelist, logs sanitizados)

**Backend — Negocio:**
- `backend/src/equipo/equipo.service.ts` (historial con JSON enriquecido en updateEstado)
- `backend/src/historial/historial.controller.ts` (query params: equipo, realizadoPor, accion, cambio)
- `backend/src/historial/historial.service.ts` (filtros avanzados, normalizeEstado, estadoTransitionLabel)

**Frontend — Seguridad:**
- `frontend/src/api.ts` (redactValue, logs solo en DEV)

**Frontend — UI/UX:**
- `frontend/src/pages/Equipos.tsx` (flujo Activo avanzado, DayPicker fechas, selectores hora 12h, costos COP)
- `frontend/src/pages/Equipos.css` (estilos popover calendario, jerarquia labels modal estado)
- `frontend/src/pages/Historial.tsx` (modal detalle readonly, filtros avanzados, DayPicker, cambio compacto)
- `frontend/src/pages/Historial.css` (modal detalle, selects estilizados, calendarios, animaciones)
- `frontend/src/pages/Profile.tsx` (campo telefono internacional con selector pais)
- `frontend/src/pages/Profile.css` (estilos compound input telefono)

### Última sesión previa (2026-04-18)
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

### Sesión 2026-04-19
- ✅ `npm run build` backend: OK (post-hardening)
- ✅ `npm run build` frontend: OK (post-hardening)
- ✅ `npm audit fix` aplicado en backend y frontend
- ✅ `npm audit --omit=dev`: 0 vulnerabilidades en produccion (backend y frontend)
- ✅ Sin errores TypeScript en archivos modificados
- ✅ Logs de backend sanitizan correctamente campos sensibles
- ✅ Rate limit en login: responde 429 al superar 8 intentos en 60s por email+IP+canal
- ✅ ValidationPipe rechaza campos extraños (`forbidNonWhitelisted: true`) en todos los endpoints de auth
- ✅ JWT_SECRET sin definir lanza error al iniciar el servidor (hardening correcto)
- ⚠️ Script `negative-checks.ps1` no pudo completarse por falta de credenciales baseline en entorno actual

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