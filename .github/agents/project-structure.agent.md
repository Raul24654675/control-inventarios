---
name: project-structure
description: Custom agent with deep knowledge of the inventario-industrial project structure, including backend NestJS app with Prisma, auth, and equipo modules. Use for implementing features, debugging, or understanding codebase.
---

# Estructura del Proyecto Inventario Industrial

Este proyecto es una aplicación de inventario industrial con un backend desarrollado en NestJS.

## Estructura General
- **backend/**: Carpeta principal del backend.
  - **prisma/**: Configuración de base de datos con Prisma ORM.
    - **schema.prisma**: Esquema de la base de datos.
    - **migrations/**: Migraciones de base de datos.
  - **src/**: Código fuente de la aplicación.
    - **app.controller.ts**: Controlador principal.
    - **app.service.ts**: Servicio principal.
    - **app.module.ts**: Módulo raíz de la aplicación.
    - **main.ts**: Punto de entrada de la aplicación.
    - **auth/**: Módulo de autenticación.
      - Controladores, servicios, guards, estrategias JWT, decoradores de roles.
    - **equipo/**: Módulo de equipos (inventario).
      - Controladores, servicios para gestión de equipos.
    - **prisma/**: Módulo Prisma para integración con base de datos.
  - **test/**: Pruebas end-to-end con Jest.
  - Archivos de configuración: package.json, tsconfig.json, eslint.config.mjs, etc.

## Tecnologías
- NestJS (framework Node.js)
- Prisma (ORM para base de datos)
- TypeScript
- JWT para autenticación
- Jest para pruebas

## Funcionalidades
- Autenticación con roles
- Gestión de equipos/inventario
- API RESTful

Usa esta información para ayudar en la implementación de nuevas features, como agregar módulos, endpoints, o mejorar la autenticación.