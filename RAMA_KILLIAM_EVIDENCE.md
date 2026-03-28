# 📋 RAMA_KILLIAM - DOCUMENTO DE EVIDENCIA

**Fecha de creación:** 28 de marzo de 2026  
**Rama:** RAMA_KILLIAM  
**Basada en:** master (commit c636bcda963b61e6082d50506bb467593fee80f5)  
**Usuario:** Killiam  
**Dispositivo:** Windows - C:\Users\killi\Desktop\inventario-industrial\inventario-industrial

---

## 🎯 PROPÓSITO DE ESTA RAMA

Esta rama **RAMA_KILLIAM** sirve como punto de partida documentado para el trabajo de Killiam en el proyecto Inventario Industrial. Contiene evidencia consolidada de:
- Estado completo del proyecto
- Implementaciones validadas
- Cambios de seguridad y roles
- Endpoints documentados
- Pruebas y validaciones
- Baseline de datos

---

## ✅ ESTADO DEL PROYECTO AL CREAR RAMA_KILLIAM

### Servidores
- ✅ **Backend NestJS:** Operativo en puerto 3000
- ✅ **Frontend React/Vite:** Operativo en puerto 5173
- ✅ **PostgreSQL:** Estable y configurado
- ✅ **Prisma ORM:** Migraciones aplicadas, cliente generado

### Validación
- ✅ **Build:** OK
- ✅ **Unit Tests:** 6/6 PASANDO
- ✅ **E2E Tests:** 16/16 PASANDO
- ✅ **Pruebas Negativas:** Validadas

---

## 🛠️ IMPLEMENTACIONES COMPLETADAS

### 1. Autenticación y Seguridad
- ✅ JWT con ciclo de vida configurable
- ✅ Guard de autenticación en rutas protegidas
- ✅ Guard de roles (ADMIN/OPERADOR)
- ✅ Tokens almacenados en localStorage del navegador
- ✅ Logout funcional

**Archivos clave:**
- [backend/src/auth/jwt.strategy.ts](backend/src/auth/jwt.strategy.ts) — Estrategia JWT
- [backend/src/auth/jwt-auth.guard.ts](backend/src/auth/jwt-auth.guard.ts) — Guard de autenticación
- [backend/src/auth/roles.guard.ts](backend/src/auth/roles.guard.ts) — Guard de roles
- [backend/src/auth/roles.decorator.ts](backend/src/auth/roles.decorator.ts) — Decorator @Roles()

### 2. Endpoints de Autenticación

**POST /auth/login/admin**
- Usuario: `AdminMaster@inventario.local`
- Contraseña: `ADMIN2026`
- Retorna: JWT con rol ADMIN

**POST /auth/login/operador**
- Usuario: `OperarioA1@inventario.local` (a OperarioA15)
- Contraseña: `OPERADOR2026`
- Retorna: JWT con rol OPERADOR

**POST /auth/register**
- Protegido: solo ADMIN puede crear nuevos usuarios
- Requiere: JWT de ADMIN

### 3. CRUD de Equipos

**GET /equipos**
- Devuelve listado con paginación y filtros
- Parámetros: `sector`, `estado`, `nombre`, `page`, `limit`
- Acceso: Todos (ADMIN y OPERADOR)

**GET /equipos/:id**
- Obtiene detalle de un equipo
- Acceso: Todos

**POST /equipos**
- Crea nuevo equipo
- Acceso: Solo ADMIN
- Retorna 403 Forbidden si no es ADMIN

**PATCH /equipos/:id**
- Actualización con restricciones por rol:
  - **ADMIN:** Sin restricciones
  - **OPERADOR:** No puede cambiar `sector` y `estado`
- Retorna 403 si operador intenta cambiar campo restringido

**DELETE /equipos/:id**
- Elimina equipo
- Acceso: Solo ADMIN
- Retorna 403 Forbidden si no es ADMIN

### 4. Historial de Cambios

**GET /historial**
- Lista TODOS los cambios registrados
- Campos: `id`, `equipoId`, `tipoOperacion`, `campo`, `valorAnterior`, `valorNuevo`, `usuarioId`, `fecha`

**GET /historial?equipoId=<id>**
- Filtra historial por equipo
- Muestra todos los cambios de ese equipo

**Registro automático:**
- CREATE: Registra cada campo del nuevo equipo
- UPDATE: Registra SOLO los campos modificados
- DELETE: Registra la eliminación del equipo

### 5. Control de Acceso por Rol

| Acción | ADMIN | OPERADOR |
|--------|-------|----------|
| Ver equipos | ✅ | ✅ |
| Ver detalle | ✅ | ✅ |
| Crear equipo | ✅ | ❌ |
| Actualizar *cualquier campo* | ✅ | ✅ |
| Actualizar sector/estado | ✅ | ❌ |
| Eliminar equipo | ✅ | ❌ |
| Crear usuario | ✅ | ❌ |

### 6. Mensajes de Error Centralizados

Archivo: [backend/src/common/error-messages.ts](backend/src/common/error-messages.ts)

Todos los errores devuelven en español:
- `ERR_INVALID_CREDENTIALS` — Credenciales inválidas
- `ERR_NOT_FOUND` — Recurso no encontrado
- `ERR_FORBIDDEN` — Acceso denegado
- `ERR_VALIDATION` — Error de validación
- `ERR_ALREADY_EXISTS` — Ya existe
- Y más...

---

## 📊 DATA BASELINE (SELLADO)

**Protección:** Esta baseline NO debe ser modificada

| Recurso | Cantidad | Detalles |
|---------|----------|----------|
| **Admin** | 1 | `AdminMaster@inventario.local` / `ADMIN2026` |
| **Operadores** | 15 | `OperarioA1@inventario.local` a `OperarioA15@inventario.local` / `OPERADOR2026` |
| **Equipos** | 30 | Todos con campos completos (nombre, sector, estado, etc.) |

**Script de seed:** [backend/scripts/seedAdminOperariosEquipos.js](backend/scripts/seedAdminOperariosEquipos.js)

---

## 🎨 FRONTEND IMPLEMENTADO

### Páginas
1. **Login** ([frontend/src/pages/Login.tsx](frontend/src/pages/Login.tsx))
   - Tabs: Administrador | Operador
   - Logo Rajaski
   - Styling profesional
   - JWT almacenado en localStorage

2. **Equipos** ([frontend/src/pages/Equipos.tsx](frontend/src/pages/Equipos.tsx))
   - Listado con paginación
   - Filtros: sector, estado, nombre
   - Modal de creación (solo ADMIN)
   - Modal de edición
   - Botón eliminar (solo ADMIN)

3. **Historial** ([frontend/src/pages/Historial.tsx](frontend/src/pages/Historial.tsx))
   - Listado de cambios
   - Filtro por equipoId
   - Timestamps y usuarios

### Componentes
- **Layout** ([frontend/src/components/Layout.tsx](frontend/src/components/Layout.tsx)) — Barra de navegación, datos de sesión, logout
- **AuthContext** ([frontend/src/AuthContext.tsx](frontend/src/AuthContext.tsx)) — Gestión de autenticación
- **API Client** ([frontend/src/api.ts](frontend/src/api.ts)) — Cliente HTTP con proxy

### Configuración
- **CORS:** Habilitado para `http://localhost:5173`
- **Proxy:** Backend en `http://localhost:3000`
- **Build:** Vite con soporte TypeScript React

---

## 🧪 PRUEBAS Y VALIDACIONES

### Unit Tests (Backend)
**Archivo:** [backend/src/app.controller.spec.ts](backend/src/app.controller.spec.ts) y similares

```
✅ app.controller.spec.ts
✅ app.service.spec.ts
✅ auth.controller.spec.ts
✅ auth.service.spec.ts
✅ equipo.controller.spec.ts
✅ equipo.service.spec.ts

Total: 6/6 PASANDO
```

Comando para ejecutar:
```bash
npm --prefix backend run test
```

### E2E Tests (Backend)
**Archivo:** [backend/test/app.e2e-spec.ts](backend/test/app.e2e-spec.ts)

```
✅ Autenticación admin
✅ Autenticación operador
✅ Registro protegido
✅ Creación equipos (solo admin)
✅ Actualización equipos (restricciones por rol)
✅ Eliminación equipos (solo admin)
✅ Filtrado y búsqueda
✅ Paginación
✅ Historial completo
✅ Historial filtrado
✅ Validaciones negativas (x6)

Total: 16/16 PASANDO
```

Comando para ejecutar:
```bash
npm --prefix backend run test:e2e
```

### Pruebas Negativas
**Script:** [backend/scripts/negative-checks.ps1](backend/scripts/negative-checks.ps1)

Valida:
- ❌ Acceso sin JWT
- ❌ Crear equipo como OPERADOR
- ❌ Cambiar sector como OPERADOR
- ❌ Cambiar estado como OPERADOR
- ❌ Eliminar como OPERADOR
- ❌ Rutas no existentes

---

## 🚀 RUNBOOK: Arrancar en Esta Máquina

### Paso 1: Instalar Dependencias
```powershell
npm --prefix backend install
npm --prefix frontend install
```

### Paso 2: Configurar Base de Datos
```powershell
npm --prefix backend exec prisma migrate deploy
npm --prefix backend exec prisma generate
```

### Paso 3: Seed de Baseline
```powershell
cd backend
node scripts/seedAdminOperariosEquipos.js
cd ..
```

### Paso 4: Iniciar Servidores
Terminal 1 (Backend):
```powershell
npm --prefix backend run start:dev
```

Terminal 2 (Frontend):
```powershell
npm --prefix frontend run dev
```

### Paso 5: Acceder
- **Backend:** `http://localhost:3000`
- **Frontend:** `http://localhost:5173`

### Credenciales de Prueba
**Admin:**
- Usuario: `AdminMaster@inventario.local`
- Contraseña: `ADMIN2026`

**Operador:**
- Usuario: `OperarioA1@inventario.local` (hasta A15)
- Contraseña: `OPERADOR2026`

---

## 📂 ESTRUCTURA DE CARPETAS

```
inventario-industrial/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── equipo/
│   │   ├── historial/
│   │   ├── prisma/
│   │   ├── common/
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── scripts/
│   │   ├── seedAdminOperariosEquipos.js
│   │   ├── negative-checks.ps1
│   │   └── ...
│   ├── test/
│   │   └── app.e2e-spec.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Equipos.tsx
│   │   │   └── Historial.tsx
│   │   ├── components/
│   │   │   └── Layout.tsx
│   │   ├── AuthContext.tsx
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── RAMA_KILLIAM_EVIDENCE.md (este archivo)
```

---

## 📋 CHECKLIST DE SINCRONIZACIÓN

Al realizar cambios en RAMA_KILLIAM:

- [ ] Ejecutar `npm --prefix backend run test` — Verificar tests
- [ ] Ejecutar `npm --prefix backend run test:e2e` — Verificar E2E
- [ ] Ejecutar `backend/scripts/negative-checks.ps1` — Verificar seguridad
- [ ] Actualizar este documento con cambios
- [ ] Hacer commit con mensaje descriptivo
- [ ] Sincronizar con proyecto general si afecta integridad
- [ ] Mantener baseline intacto (NO modificar)

---

## ⚠️ RESTRICCIONES Y NOTAS

1. **Baseline de datos:** Sellado. No se puede modificar sin consentimiento explícito.
2. **Assets no usados:** `login-brand.png`, `react.svg`, `vite.svg`, etc. — Conservar, no usar.
3. **Mensajes de error:** Siempre en [backend/src/common/error-messages.ts](backend/src/common/error-messages.ts)
4. **Historial:** Automático en todas las operaciones de equipos
5. **Roles:** ADMIN vs OPERADOR. No crear roles adicionales sin synchronización.

---

## 🔗 REFERENCIAS DE COMMITS

- **Inicio proyecto:** Raul (Rama_Raul)
- **Consolidación actual:** Killiam
- **Commit HEAD (master):** `c636bcda963b61e6082d50506bb467593fee80f5`

---

## ✨ PRÓXIMAS ACCIONES SUGERIDAS

1. Revisar documentación en [backend/README.md](backend/README.md)
2. Leer [branch_summary.md](branch_summary.md) para contexto general
3. Consultar `.github/agents/killiam.agent.md` para estado de agente
4. Ejecutar pruebas completas antes de cambios

---

**Documento generado:** 28 de marzo de 2026  
**Usuario:** Killiam  
**Estado:** ✅ RAMA_KILLIAM Creada y Documentada
