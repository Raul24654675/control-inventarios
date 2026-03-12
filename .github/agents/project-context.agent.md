---
name: project-context
description: Agent content describing the full structure of the Inventario Industrial project, including backend modules, database schema, authentication flow, and development commands. Use this for understanding where code lives and how to implement new features.
---

# Inventario Industrial - Proyecto Backend (NestJS + Prisma)

Este proyecto implementa un backend en **NestJS** para un sistema de inventario industrial.

## Estructura de carpetas clave

- **backend/**: Código principal del servidor.
  - **src/**: Código fuente TypeScript.
    - **app.module.ts**: Módulo raíz que importa los demás módulos.
    - **main.ts**: Punto de arranque del servidor.
    - **auth/**: Módulo de autenticación JWT.
      - `auth.controller.ts` - Endpoints de login/registro.
      - `auth.service.ts` - Lógica de auth, hashing de contraseñas, generación de tokens.
      - `jwt.strategy.ts` - Estrategia de Passport/JWT.
      - `jwt-auth.guard.ts` - Guarda JWT.
      - `roles.decorator.ts` - Decorador para roles.
      - `roles.guard.ts` - Valida roles de usuario.
    - **equipo/**: Módulo de gestión de equipos.
      - `equipo.controller.ts` - Endpoints CRUD para equipos.
      - `equipo.service.ts` - Lógica de acceso a datos.
    - **prisma/**: Módulo que expone el cliente Prisma.
      - `prisma.service.ts` - Inicializa Prisma.
      - `prisma.module.ts` - Exporta el servicio.
  - **prisma/**: Definición de la base de datos.
    - `schema.prisma` - Modelos `Usuario`, `Equipo`, `HistorialCambios`, enums para `Rol`, `Sector`, `Estado`.
    - `migrations/` - Migraciones generadas por Prisma.
  - **test/**: Pruebas end-to-end.
  - `.env` - Variables de entorno (DB URL, JWT secret). 

## Flujo de autenticación

1. Registro (`POST /auth/register`) guarda usuario con password hasheada (bcrypt).
2. Login (`POST /auth/login`) verifica credenciales y devuelve JWT.
3. El JWT se envía en el header `Authorization: Bearer <token>`.
4. Guardas (`JwtAuthGuard`) validan token y exponen `request.user`.
5. Guardas de roles (`RolesGuard`) validan `user.rol` frente a decorador `@Roles(...)`.

## Cómo ejecutar el proyecto

### Instalar dependencias

```bash
cd backend
npm install
```

### Configurar variables de entorno

Asegúrate de tener:

```
DATABASE_URL="postgresql://<user>:<pass>@localhost:5432/inventario_db"
JWT_SECRET="tu_secreto"
```

### Levantar servidor (desarrollo)

```bash
npm run start:dev
```

### Pruebas

```bash
npm run test
npm run test:e2e
```

## Puntos importantes para desarrollar nuevas features

- Los datos se acceden a través de Prisma (usar `this.prisma.<modelo>`).
- Si agregas nuevos campos en `schema.prisma`, recuerda correr `npx prisma migrate dev` y `npx prisma generate`.
- Usa los guards (`JwtAuthGuard` + `RolesGuard`) para proteger rutas.
- Si agregas nuevas rutas, actualiza los controladores y servicios correspondientes.
