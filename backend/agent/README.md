# Agent Folder

Este directorio está destinado a proporcionar documentación y explicaciones del código del proyecto de backend para que una inteligencia artificial (o cualquier desarrollador) pueda comprender su funcionamiento.

## Estructura del proyecto Backend

El backend está implementado utilizando el framework NestJS, que estructura la aplicación en módulos, controladores y servicios.

### Módulos
- **app.module.ts**: Módulo raíz que importa y configura otros módulos de la aplicación.
- **auth/module.ts**: Maneja la lógica de autenticación.
- **equipo/module.ts**: Relacionado con la gestión de equipos u otros recursos.
- **prisma/module.ts**: Proporciona acceso a la base de datos mediante Prisma.

### Controladores
Los controladores (`*.controller.ts`) exponen rutas HTTP y definen endpoints para recibir solicitudes del cliente. Cada uno delega la lógica al servicio correspondiente.

### Servicios
Los servicios (`*.service.ts`) contienen la lógica de negocio y se comunican con la base de datos o con otros componentes.

### Autenticación
El módulo `auth` utiliza JWT para autenticar usuarios.
- `jwt.strategy.ts` define cómo validar tokens.
- `jwt-auth.guard.ts` protege rutas que requieren autenticación.
- `roles.guard.ts`, `roles.decorator.ts` manejan autorización basada en roles.

### Prisma
- `prisma.service.ts` configura el cliente Prisma para interactuar con la base de datos definida en `prisma/schema.prisma`.

### Testing
Escritura de pruebas unitarias (`*.spec.ts`) para controladores y servicios, y pruebas end-to-end en `test/app.e2e-spec.ts`.

## Flujo general
1. Un cliente realiza una solicitud a un endpoint definido por un controlador.
2. El controlador valida datos de entrada (a través de DTOs en `dto/` si existen) y llama a un método del servicio.
3. El servicio ejecuta la lógica de negocio, suele interactuar con Prisma para leer/escribir en la base de datos.
4. El resultado se devuelve al controlador, que lo envía al cliente.

## Notas para una IA
- El proyecto sigue convenciones de NestJS; buscar clases decoradas con `@Module`, `@Controller`, `@Injectable` ayuda a entender la estructura.
- La carpeta `src` contiene todo el código fuente.
- Los archivos de configuración (`tsconfig.json`, `package.json`, `nest-cli.json`) establecen el entorno de compilación.

Este README es un punto de partida; se pueden añadir más detalles específicos según se necesite.
