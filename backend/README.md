# Control de Inventarios - Backend

Sistema de gestión de inventario industrial construido con NestJS, Prisma y PostgreSQL.

## Descripción

Este proyecto es un backend para un sistema de control de inventarios que permite gestionar equipos industriales con autenticación JWT y control de roles.

## Tecnologías

- **NestJS**: Framework de Node.js
- **Prisma**: ORM para base de datos
- **PostgreSQL**: Base de datos
- **JWT**: Autenticación
- **bcrypt**: Hashing de contraseñas

## Instalación y Configuración

### Prerrequisitos

- Node.js (versión 18 o superior)
- PostgreSQL (instalado y ejecutándose)
- npm o yarn

### Clonar el Repositorio

```bash
git clone https://github.com/Raul24654675/control-inventarios.git
cd control-inventarios/backend
```

### Instalar Dependencias

```bash
npm install
```

### Configurar Variables de Entorno

Copia el archivo `.env` de ejemplo y configura las variables:

```bash
cp .env.example .env  # Si existe, o edita .env directamente
```

Asegúrate de tener configurado:

```
DATABASE_URL="postgresql://usuario:password@localhost:5432/inventario_db"
JWT_SECRET="tu_clave_secreta_aqui"
```

### Configurar la Base de Datos

1. Instala Prisma CLI si no lo tienes:
```bash
npm install -g prisma
```

2. Ejecuta las migraciones:
```bash
npx prisma migrate dev
```

3. Genera el cliente de Prisma:
```bash
npx prisma generate
```

## Ejecutar el Proyecto

```bash
# Modo desarrollo (con recarga automática)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto configurado en `.env`).

## Endpoints Principales

### Autenticación
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Iniciar sesión

### Equipos
- `GET /equipos` - Listar equipos (requiere autenticación)
- `POST /equipos` - Crear equipo
- `GET /equipos/:id` - Obtener equipo por ID
- `PUT /equipos/:id` - Actualizar equipo
- `DELETE /equipos/:id` - Eliminar equipo

## Ejecutar Pruebas

```bash
# Pruebas unitarias
npm run test

# Pruebas e2e
npm run test:e2e

# Cobertura de pruebas
npm run test:cov
```

## Scripts Disponibles

- `npm run build` - Compilar el proyecto
- `npm run format` - Formatear código con Prettier
- `npm run lint` - Ejecutar ESLint
- `npm run start` - Iniciar en modo producción
- `npm run start:dev` - Iniciar en modo desarrollo
- `npm run start:debug` - Iniciar en modo debug

## Contribuir

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios y commits
3. Sube la rama: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request

## Licencia

Este proyecto está bajo la licencia UNLICENSED.
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
