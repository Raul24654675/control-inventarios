---
name: project-context
description: "Use when: you need the shared context of the Inventario Industrial project, current backend architecture, validated endpoints, database baseline, role rules, or the current development status. This is the general agent that all contributors should keep updated when a change affects the whole project."
---

# Inventario Industrial - Agente General del Proyecto

Este es el agente general compartido del proyecto. Resume el estado actual validado del backend, las reglas funcionales, el baseline de datos y el protocolo para mantener sincronizados los agentes personales.

## Alcance actual del proyecto

- Estado actual: backend NestJS funcional y frontend React/Vite implementado.
- Ruta raiz actual: `GET /` responde `Hello World!`.
- Frontend: disponible en `frontend/` con login, layout protegido, pantalla de equipos e historial.
- La antigua ruta `/tester` fue eliminada.
- Base de datos: PostgreSQL con Prisma.
- Ultima validacion fuerte conocida: build backend OK, unit tests 6/6, e2e 16/16, pruebas negativas verificadas y build frontend OK.

## Estructura principal

- `backend/src/app.module.ts`: modulo raiz.
- `backend/src/main.ts`: bootstrap NestJS con CORS habilitado para `http://localhost:5173`.
- `backend/src/auth/`: autenticacion, JWT y roles.
- `backend/src/equipo/`: CRUD de equipos con restricciones por rol.
- `backend/src/historial/`: consulta de historial de cambios.
- `backend/src/prisma/`: acceso a PostgreSQL mediante Prisma.
- `backend/prisma/schema.prisma`: modelos `Usuario`, `Equipo`, `HistorialCambios` y enums.
- `backend/test/app.e2e-spec.ts`: suite e2e principal.
- `backend/scripts/seedAdminOperariosEquipos.js`: restauracion del baseline fijo.
- `backend/scripts/negative-checks.ps1`: validacion manual de errores y restricciones.
- `frontend/src/App.tsx`: rutas protegidas React Router.
- `frontend/src/AuthContext.tsx`: estado de sesion con `localStorage`.
- `frontend/src/api.ts`: cliente axios con JWT en `Authorization`.
- `frontend/src/components/Layout.tsx`: header, navegacion y logout.
- `frontend/src/pages/Login.tsx`: pantalla de acceso actual.
- `frontend/src/pages/Equipos.tsx`: listado, filtros, modal CRUD y restricciones por rol.
- `frontend/src/pages/Historial.tsx`: consulta visual del historial.
- `frontend/src/assets/rajaski-logo.svg`: logo activo del login.
- `frontend/vite.config.ts`: Vite en puerto `5173` con proxy hacia backend.

## Frontend actual validado

- Stack: React + TypeScript + Vite + React Router + Axios.
- Carpeta principal: `frontend/`.
- Puerto esperado: `http://localhost:5173`.
- Proxy Vite configurado:
  - `/auth` -> `http://localhost:3000`
  - `/equipos` -> `http://localhost:3000`
  - `/historial` -> `http://localhost:3000`
- Estado de autenticacion persistido en `localStorage`:
  - `token`
  - `rol`
  - `email`

## Pantallas frontend existentes

### Login

- Archivo: `frontend/src/pages/Login.tsx`
- Tiene tabs `Administrador` y `Operador`.
- Inputs actuales:
  - placeholder usuario: `ingresa tu usuario`
  - placeholder password: `ingresa tu contraseña`
- Iconos actuales dentro de inputs:
  - usuario: `👤`
  - password: `🔒`
- Boton principal: `Iniciar sesión`.
- Logo actual: `frontend/src/assets/rajaski-logo.svg`.
- El logo esta centrado arriba del recuadro del formulario, fuera de la tarjeta.
- Paleta actual del login: verdes claros y oscuros sobre fondo claro.

### Layout protegido

- Archivo: `frontend/src/components/Layout.tsx`
- Navegacion superior con rutas:
  - `/equipos`
  - `/historial`
- Muestra `rol`, `email` y boton `Cerrar sesión`.

### Equipos

- Archivo: `frontend/src/pages/Equipos.tsx`
- Funciones visibles:
  - listar equipos
  - filtrar por nombre, sector, estado y ubicacion
  - paginacion simple
  - crear, editar y eliminar desde modal
- Restriccion frontend alineada con backend:
  - `ADMIN`: crear y eliminar
  - `OPERADOR`: editar campos permitidos

### Historial

- Archivo: `frontend/src/pages/Historial.tsx`
- Permite listar historial y filtrar por `equipoId`.

## Assets y archivos importantes para otra IA

- Asset activo del branding actual:
  - `frontend/src/assets/rajaski-logo.svg`
- Assets historicos o residuales presentes pero no activos en el login actual:
  - `frontend/src/assets/login-brand.png`
  - `frontend/src/assets/login-logo-source.png`
  - `frontend/src/assets/hero.png`
  - `frontend/src/assets/react.svg`
  - `frontend/src/assets/vite.svg`
- Archivo residual de scaffold que ya no participa en la app activa:
  - `frontend/src/App.css`
- Assets publicos heredados de Vite presentes en `frontend/public/`:
  - `favicon.svg`
  - `icons.svg`

## Estado de validacion reciente

- Backend:
  - autenticacion y autorizacion validadas en vivo
  - pruebas de roles validadas
  - CORS configurado para frontend local
- Frontend:
  - `npm run build` OK
  - login, layout, equipos e historial compilan correctamente
  - proxy y conexion con backend fueron validados previamente

## Nota de operacion para otra IA

- Si el usuario pide modificar el login, el punto de entrada real es `frontend/src/pages/Login.tsx`.
- Si pide modificar el logo, el asset activo hoy es `frontend/src/assets/rajaski-logo.svg`.
- Si una IA encuentra `login-brand.png` o `login-logo-source.png`, debe asumir que son intentos anteriores y no el branding activo final.
- Si una IA encuentra archivos de Vite por defecto (`App.css`, `hero.png`, `react.svg`, `vite.svg`, `icons.svg`, `favicon.svg`), debe revisar primero si realmente estan en uso antes de editarlos.

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

## Runbook IA: instalacion en maquina nueva (backend + React frontend)

Esta seccion esta escrita para que otra inteligencia artificial pueda preparar el proyecto desde cero sin suposiciones.

### Protocolo obligatorio para una nueva IA

- Leer este archivo completo antes de ejecutar comandos.
- Ejecutar todo desde la raiz del repo: `C:\Users\Lorena\Desktop\inventario-industrial`.
- Usar comandos con `npm --prefix ...` para evitar errores por carpeta equivocada.
- Si hay duda de estado de datos, resembrar baseline oficial antes de probar login.

### Matriz de dependencias y herramientas

- Runtime Node.js: `20.x LTS` o superior.
- Gestor de paquetes: `npm` (no asumir `pnpm` ni `yarn`).
- Backend framework: `NestJS` (TypeScript).
- ORM: `Prisma`.
- Base de datos: `PostgreSQL`.
- Frontend: `React + Vite + TypeScript`.
- Librerias funcionales clave frontend: `react-router-dom`, `axios`.

### Objetivo

- Dejar backend y frontend listos para ejecutar localmente.
- Instalar todas las dependencias de Node.
- Verificar conectividad backend <-> frontend.

### Prerequisitos de la maquina

- Sistema operativo: Windows (comandos PowerShell).
- Node.js 20 LTS o superior.
- npm (incluido con Node.js).
- PostgreSQL en ejecucion.
- Repositorio clonado en: `C:\Users\Lorena\Desktop\inventario-industrial`.

### Estructura esperada

- `backend/package.json`
- `frontend/package.json`
- `backend/prisma/schema.prisma`
- `backend/.env` (obligatorio)

### Paso 1: abrir el workspace en la ruta raiz

```powershell
cd "C:\Users\Lorena\Desktop\inventario-industrial"
```

### Paso 2: validar herramientas

```powershell
node -v
npm -v
```

Si falla alguno, instalar Node.js LTS y volver a ejecutar.

### Paso 3: configurar variables de entorno del backend

Crear o verificar `backend/.env` con al menos:

```env
DATABASE_URL=postgresql://postgres:raul123@localhost:5432/inventario_db
JWT_SECRET=dev_secret_local
```

Si `inventario_db` no existe, crearla en PostgreSQL antes de continuar.

### Paso 4: instalar dependencias del backend

```powershell
npm --prefix backend install
```

### Paso 5: instalar dependencias del frontend (React)

```powershell
npm --prefix frontend install
```

Nota: el frontend React ya esta creado en `frontend/`; no hay que ejecutar `create-vite` de nuevo.

### Paso 6: preparar base de datos Prisma

Aplicar migraciones:

```powershell
npm --prefix backend exec prisma migrate deploy
```

Regenerar cliente Prisma (recomendado en maquina nueva):

```powershell
npm --prefix backend exec prisma generate
```

Restaurar baseline oficial (admin + operarios + equipos):

```powershell
cd backend
node scripts/seedAdminOperariosEquipos.js
cd ..
```

### Paso 7: iniciar backend correctamente

```powershell
npm --prefix backend run start:dev
```

Esperado: escucha en `http://localhost:3000`.

### Paso 8: iniciar frontend React correctamente

En una segunda terminal:

```powershell
cd "C:\Users\Lorena\Desktop\inventario-industrial"
npm --prefix frontend run dev
```

Esperado: escucha en `http://localhost:5173`.

### Paso 9: verificacion minima de conexion

Health backend:

```powershell
Invoke-RestMethod http://localhost:3000
```

Login admin:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/auth/login/admin -Method Post -ContentType "application/json" -Body '{"email":"AdminMaster@inventario.local","password":"ADMIN2026"}'
```

Abrir frontend en navegador:

- `http://localhost:5173`

### Paso 10: credenciales baseline para pruebas

- Admin: `AdminMaster@inventario.local` / `ADMIN2026`
- Operador: `OperarioA1@inventario.local` / `OPERADOR2026`

### Paso 11: verificacion de build y pruebas

Build backend:

```powershell
npm --prefix backend run build
```

Build frontend:

```powershell
npm --prefix frontend run build
```

Pruebas unitarias backend:

```powershell
npm --prefix backend test -- --runInBand
```

Pruebas e2e backend:

```powershell
npm --prefix backend run test:e2e -- --runInBand
```

Nota: las e2e mutan datos. Al finalizar, resembrar baseline.

```powershell
cd backend
node scripts/seedAdminOperariosEquipos.js
cd ..
```

### Paso 12: checklist rapido para IA (todo en orden)

1. Confirmar `node -v` y `npm -v`.
2. Confirmar `backend/.env` con `DATABASE_URL` y `JWT_SECRET`.
3. Ejecutar `npm --prefix backend install`.
4. Ejecutar `npm --prefix frontend install`.
5. Ejecutar `npm --prefix backend exec prisma migrate deploy`.
6. Ejecutar `npm --prefix backend exec prisma generate`.
7. Ejecutar seed baseline oficial.
8. Levantar backend y frontend.
9. Probar `GET /` y login admin.
10. Ejecutar build backend/frontend.

### Troubleshooting para IA

- Error `ENOENT ... package.json`:
  - Causa: comando ejecutado en carpeta incorrecta.
  - Solucion: usar `npm --prefix backend ...` o `npm --prefix frontend ...` desde la raiz.

- Puerto ocupado `3000` o `5173`:
  - Cerrar listeners actuales:

```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3000,5173 } | Select-Object LocalPort, OwningProcess
```

- Frontend no conecta al backend:
  - Verificar backend en `:3000`.
  - Verificar frontend en `:5173`.
  - Verificar CORS en `backend/src/main.ts` con origen `http://localhost:5173`.

- Login falla con 401:
  - Re-ejecutar seed baseline:

```powershell
cd backend
node scripts/seedAdminOperariosEquipos.js
cd ..
```

- Error de Prisma al conectar:
  - Verificar que PostgreSQL este corriendo.
  - Verificar `DATABASE_URL` en `backend/.env`.
  - Verificar existencia de base `inventario_db`.

- Error `P1001` o timeout a DB:
  - Confirmar host/puerto de PostgreSQL en `DATABASE_URL`.
  - Confirmar credenciales correctas de PostgreSQL.

- Frontend inicia pero API falla en browser:
  - Confirmar proxy en `frontend/vite.config.ts`.
  - Confirmar backend activo en `http://localhost:3000`.
  - Confirmar token guardado en `localStorage` tras login.

### Referencia rapida de arranque diario

Terminal 1 (backend):

```powershell
cd "C:\Users\Lorena\Desktop\inventario-industrial"
npm --prefix backend run start:dev
```

Terminal 2 (frontend):

```powershell
cd "C:\Users\Lorena\Desktop\inventario-industrial"
npm --prefix frontend run dev
```

### Regla de actualizacion documental

- Si cambian dependencias, scripts de arranque, versiones de Node o variables de entorno, esta seccion debe actualizarse el mismo dia.
- Si un agente personal detecta un nuevo error recurrente de instalacion, debe agregarlo aqui en `Troubleshooting para IA`.
