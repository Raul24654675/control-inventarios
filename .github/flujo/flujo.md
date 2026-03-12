# Flujo de la aplicación (Operador y Admin)

Este documento describe cómo fluye la aplicación desde el punto de vista de los dos roles principales (Admin y Operador), y qué hace cada librería clave que usa el backend.

---

## 1) Autenticación y autorización (flujo común)

1. El usuario (Operador o Admin) hace `POST /auth/login` con `email` y `password`.
2. El backend valida las credenciales y, si son correctas, genera un JWT:
   - `AuthService.login()` busca el usuario por email.
   - Compara la contraseña con bcrypt.
   - Si la validación es correcta, retorna `{ access_token }` firmado con `JWT_SECRET`.
3. El cliente envía el token en todas las peticiones protegidas como:
   `Authorization: Bearer <token>`.
4. El servidor valida el token en cada petición protegida usando `JwtAuthGuard`.
5. Una vez validado, `request.user` contiene `{ userId, email, rol }`.
6. El guard de roles `RolesGuard` verifica el rol del usuario usando el decorador `@Roles(...)`.

---

## 2) Flujo para Admin

### Acciones principales
- **Crear equipos** (`POST /equipos`) → permitido solo para Admin.
- **Eliminar equipos** (`DELETE /equipos/:id`) → permitido solo para Admin.
- **Ver equipos** (`GET /equipos`) → permitido para Admin y Operador.
- **Actualizar equipo** (`PATCH /equipos/:id`) → permitido para ambos.

### Endpoint clave
- `POST /auth/register` (puede usarse para crear un Admin si se registra con `rol: ADMIN`).
- Los endpoints del módulo `equipo` están protegidos con `@UseGuards(JwtAuthGuard)` y `@Roles(...)`.

---

## 3) Flujo para Operador

### Acciones principales
- **Ver equipos** (`GET /equipos`) → funciona para Operador.
- **Ver equipo por ID** (`GET /equipos/:id`) → funciona para Operador.
- **Actualizar equipo** (`PATCH /equipos/:id`) → funciona para Operador.
- **Crear o eliminar** ➜ bloqueado (403 Forbidden).

---

## 4) Librerías principales y qué hacen

### NestJS
- Framework principal del backend.
- Proporciona módulos, controladores, servicios y guards.
- Gestiona el ciclo de vida de la aplicación y la inyección de dependencias.

### Prisma
- ORM para interactuar con la base de datos (PostgreSQL).
- Define el esquema (`schema.prisma`) y genera el cliente (`@prisma/client`).
- Se usa en `PrismaService` para acceder a `prisma.usuario`, `prisma.equipo`, etc.

### bcrypt
- Utilizado para hashear contraseñas antes de guardarlas.
- Comparar contraseñas en el login.

### Passport + passport-jwt
- `passport` es el framework de autenticación.
- `passport-jwt` valida JWTs recibidos en el header `Authorization`.
- `JwtStrategy` implementa esta validación.

### @nestjs/jwt
- Envuelve `jsonwebtoken` para firmar tokens en NestJS.
- Se configura con `JWT_SECRET` y `expiresIn`.

### Jest
- Framework de pruebas que permite crear tests unitarios y e2e.
- El proyecto ya incluye configuración base en `test/`.

---

## 5) Nota de implementación

- Si se agregan nuevos endpoints, siempre verificar si necesitan autenticación y roles.
- Si se amplía el modelo de datos (Prisma), ejecutar:
  - `npx prisma migrate dev`
  - `npx prisma generate`

---

> Este documento está diseñado para ayudar a cualquier desarrollador o IA a comprender rápidamente cómo opera el backend desde la perspectiva de los roles y qué responsabilidades tienen las librerías usadas.
