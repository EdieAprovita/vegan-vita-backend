<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<h1 align="center">🌱 VeganVita - Backend</h1>

<p align="center">
  Backend de eCommerce de productos veganos con autenticación JWT, gestión de productos y carrito de compras.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v9.4.3-red?style=flat-square&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-v4.9.5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-v16-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-v0.3.27-orange?style=flat-square" alt="TypeORM" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

## 📋 Descripción

**VeganVita Backend** es una API REST construida con **NestJS** y **TypeORM** para gestionar un eCommerce de productos veganos. Incluye autenticación JWT, gestión de productos, órdenes y preparación para integración con Stripe.

### ✨ Características Implementadas

- ✅ **Autenticación JWT** - Registro y login con bcrypt
- ✅ **Base de datos PostgreSQL** - Con Docker Compose
- ✅ **TypeORM ORM** - Sincronización automática de entidades
- ✅ **Validación de datos** - DTOs con class-validator
- ✅ **Guarde de JWT** - Endpoints protegidos
- ✅ **Manejo de errores** - Excepciones personalizadas
- 📋 **Módulo de Productos** - CRUD en desarrollo
- 📋 **Módulo de Órdenes** - En planificación
- 📋 **Integración Stripe** - En planificación

### 🏗️ Stack Tecnológico

| Tecnología  | Versión   | Uso                    |
| ----------- | --------- | ---------------------- |
| NestJS      | 9.4.3     | Framework backend      |
| TypeScript  | 4.9.5     | Lenguaje               |
| TypeORM     | 0.3.27    | ORM                    |
| PostgreSQL  | 16-alpine | Base de datos          |
| Passport.js | -         | Autenticación          |
| JWT         | 7 días    | Tokens                 |
| Bcrypt      | -         | Hashing de contraseñas |
| Docker      | -         | Containerización       |
| PNPM        | 10+       | Package manager        |

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js v20+
- PNPM v10+
- Docker & Docker Compose
- Git

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/EdieAprovita/vegan-vita-backend.git
cd vegan-vita-backend
```

### 2️⃣ Instalar Dependencias

```bash
pnpm install
```

### 3️⃣ Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=vegan_vita_dev

# JWT
JWT_SECRET=vegan-vita-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
```

### 4️⃣ Iniciar PostgreSQL con Docker

```bash
docker-compose up -d
```

Verificar que la base de datos está corriendo:

```bash
docker-compose ps
```

## 🎯 Ejecutar la Aplicación

### Modo Desarrollo (con auto-reload)

```bash
pnpm run start:dev
```

El servidor estará disponible en `http://localhost:3001`

### Modo Producción

```bash
pnpm run build
pnpm run start:prod
```

## 📡 Endpoints API

### 🔐 Autenticación

```bash
# Registro de usuario
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Obtener datos del usuario autenticado (requiere JWT)
GET /api/auth/me
Authorization: Bearer <token>
```

### 📊 Respuestas Esperadas

**Registro exitoso (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Credenciales inválidas (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

## 📁 Estructura del Proyecto

```
src/
├── app.controller.ts          # Rutas raíz
├── app.module.ts              # Módulo principal
├── app.service.ts             # Servicios raíz
├── main.ts                    # Punto de entrada
└── auth/
    ├── auth.controller.ts     # Rutas de autenticación
    ├── auth.service.ts        # Lógica de autenticación
    ├── auth.module.ts         # Módulo de autenticación
    ├── dto/
    │   ├── login.dto.ts       # DTO de login
    │   └── register.dto.ts    # DTO de registro
    ├── entities/
    │   └── user.entity.ts     # Entidad User
    ├── guards/
    │   └── jwt-auth.guard.ts  # Guard para JWT
    └── strategies/
        └── jwt.strategy.ts    # Estrategia Passport JWT
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm run start:dev        # Inicia en modo watch
pnpm run start            # Inicia en modo normal

# Build
pnpm run build            # Compila TypeScript a JavaScript

# Testing
pnpm run test             # Ejecuta tests unitarios
pnpm run test:e2e         # Ejecuta tests e2e
pnpm run test:cov         # Tests con cobertura

# Linting
pnpm run lint             # Ejecuta ESLint
pnpm run format           # Formatea con Prettier
```

## 📚 Documentación Adicional

- **GUIA_OPTIMIZADA.md** - Guía de desarrollo reorganizada (Backend → Frontend)
- **PROGRESO_PROYECTO.md** - Seguimiento de progreso del proyecto (local)

## 🤝 Contribución

Este es un proyecto personal en desarrollo. Para cambios importantes, abre un issue o contact me.

## 📝 Notas de Desarrollo

### Fase Actual: Autenticación ✅

- Usuario CRUD con bcrypt
- JWT tokens con expiración
- Endpoints protegidos con guards

### Próximas Fases:

1. Módulo de Productos (CRUD)
2. Módulo de Órdenes
3. Integración Stripe
4. Despliegue

## 🐛 Solución de Problemas

### Puerto 5432 en uso

```bash
# Detener PostgreSQL local si está corriendo
brew services stop postgresql@14

# O especificar otro puerto en .env
DB_PORT=5433
```

### Error: "database does not exist"

```bash
# Recrear containers
docker-compose down
docker-compose up -d
```

### TypeORM entities no se cargan

```bash
# Asegurar que entities está en app.module.ts
entities: [User]  // Entidades explícitas
```

## 📞 Contacto

- Email: contact@vegan-vita.dev
- GitHub: [@EdieAprovita](https://github.com/EdieAprovita)

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.
