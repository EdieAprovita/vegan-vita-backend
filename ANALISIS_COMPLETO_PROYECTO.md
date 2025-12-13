# ANÁLISIS COMPLETO DEL PROYECTO VEGAN VITA BACKEND
## Comparación con ProShop MERN - Plan de Implementación Detallado

**Fecha de análisis:** 01 de noviembre de 2025 (Actualizado: 08 nov 2025)
**Proyecto Base:** Vegan Vita Backend (NestJS + TypeORM + PostgreSQL)
**Proyecto de Referencia:** ProShop MERN (Express + MongoDB)
**Autor del análisis:** Claude AI

---

> **⚠️ NOTA IMPORTANTE:** Este documento es el análisis original del 01 de noviembre.
> Para ver el **ESTADO ACTUAL ACTUALIZADO** del proyecto, consulta:
> **[ESTADO_ACTUAL_PROYECTO.md](ESTADO_ACTUAL_PROYECTO.md)** ⬅️ **DOCUMENTO ACTUALIZADO**
>
> **Progreso actual:** 70% completado (era 40% en este análisis original)

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estado Actual del Proyecto](#2-estado-actual-del-proyecto)
3. [Comparación Detallada](#3-comparación-detallada)
4. [Funcionalidades Faltantes](#4-funcionalidades-faltantes)
5. [Plan de Implementación Cronológico](#5-plan-de-implementación-cronológico)
6. [Estimaciones de Tiempo](#6-estimaciones-de-tiempo)
7. [Recomendaciones Técnicas](#7-recomendaciones-técnicas)
8. [Diagrama de Arquitectura](#8-diagrama-de-arquitectura)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Estado General del Proyecto

**Vegan Vita Backend** es un proyecto **bien estructurado** que ha implementado exitosamente:

- ✅ **70% de funcionalidad completa** respecto a ProShop MERN (actualizado: 08 nov 2025)
- ✅ **Módulos básicos funcionando:** Autenticación, Productos, Categorías, Reseñas
- ✅ **Sistema de Órdenes COMPLETO:** 6 endpoints + notificaciones (NUEVO)
- ✅ **Testing extensivo:** 104 tests unitarios pasando (era 1,307 líneas)
- ✅ **CI/CD completo:** 8 workflows de GitHub Actions
- ✅ **Infraestructura:** Docker, TypeORM, PostgreSQL configurados
- 🆕 **Sistema de Notificaciones:** Emails + webhooks (BONUS)

### 1.2 Funcionalidades Faltantes Críticas

**30% de funcionalidad restante (actualizado: 08 nov 2025):**

1. ✅ **Sistema de Órdenes/Pedidos** - ~~PRIORIDAD ALTA~~ **COMPLETADO** 🎉
2. ✅ **Sistema de Roles y Permisos** - ~~PRIORIDAD MEDIA~~ **COMPLETADO** 🎉
3. ❌ **Sistema de Pagos (PayPal/Stripe)** - PRIORIDAD ALTA (diferido)
4. ❌ **Panel de Administración** - PRIORIDAD ALTA (parcial: órdenes ✅, usuarios ❌)
5. ❌ **Gestión de Usuarios (Admin)** - PRIORIDAD MEDIA
6. ❌ **Upload de Imágenes** - PRIORIDAD MEDIA
7. ❌ **Estadísticas de Productos** - PRIORIDAD BAJA
8. ❌ **Documentación Swagger** - PRIORIDAD ALTA (nuevo)

### 1.3 Tiempo Estimado Total

| Fase | Duración | Estado | Dedicación |
|------|----------|--------|------------|
| **Fase 1: Preparación** | ~~2-3 días~~ | ✅ **COMPLETADA** | Full-time |
| **Fase 2: Sistema de Órdenes** | ~~4-5 días~~ | ✅ **COMPLETADA** | Full-time |
| **Fase 3: Sistema de Pagos** | 3-4 días | ⏸️ **PENDIENTE** | Full-time |
| **Fase 4: Panel Admin** | 3-4 días | 🟡 **PARCIAL (50%)** | Full-time |
| **Fase 5: Features Adicionales** | 4-5 días | 🟡 **PARCIAL (20%)** | Full-time |
| **Fase 6: Testing y Documentación** | 2-3 días | 🟡 **PARCIAL (60%)** | Full-time |
| **TOTAL ORIGINAL** | ~~18-24 días~~ | **70% COMPLETO** | **Full-time (8h/día)** |
| **RESTANTE ESTIMADO** | **6-8 días** | **Para 95%** | **Full-time (8h/día)** |

---

## 2. ESTADO ACTUAL DEL PROYECTO

### 2.1 Lo que YA TIENES Implementado ✅

#### A. AUTENTICACIÓN COMPLETA (100%)
**Ubicación:** `/src/auth/`

| Feature | Estado | Detalles |
|---------|--------|----------|
| Registro de usuarios | ✅ Completo | Email, password, name con validación |
| Login con JWT | ✅ Completo | Tokens de 7 días |
| Validación de tokens | ✅ Completo | JwtAuthGuard + JwtStrategy |
| Hash de passwords | ✅ Completo | bcrypt con salt 10 |
| Obtener perfil | ✅ Completo | GET /api/auth/me |
| Tests completos | ✅ Completo | 259 líneas auth.service.spec.ts |

**Archivos clave:**
- [auth.service.ts](src/auth/auth.service.ts) - Lógica de autenticación
- [auth.controller.ts](src/auth/auth.controller.ts) - Endpoints
- [jwt.strategy.ts](src/auth/strategies/jwt.strategy.ts) - Estrategia JWT
- [jwt-auth.guard.ts](src/auth/guards/jwt-auth.guard.ts) - Guard de protección
- [user.entity.ts](src/auth/entities/user.entity.ts) - Modelo de usuario

**Endpoints disponibles:**
```
POST /api/auth/register  - Registro de nuevo usuario
POST /api/auth/login     - Login y obtención de token
GET  /api/auth/me        - Obtener perfil actual (protegido)
```

#### B. SISTEMA DE PRODUCTOS (85%)
**Ubicación:** `/src/products/`

| Feature | Estado | Detalles |
|---------|--------|----------|
| CRUD de productos | ✅ Completo | Create, Read, Update, Delete |
| Búsqueda y filtros | ✅ Completo | Por nombre, categoría, precio |
| Paginación | ✅ Completo | page, limit, metadata |
| Categorías | ✅ Completo | Modelo separado con relaciones |
| Reseñas | ✅ Completo | Rating 1-5 + comentario |
| Slug único | ✅ Completo | Generado automáticamente |
| Validaciones | ✅ Completo | DTOs con class-validator |
| Tests completos | ✅ Completo | 868 líneas de tests |

**Archivos clave:**
- [products.service.ts](src/products/products.service.ts) - Lógica de negocio
- [products.controller.ts](src/products/products.controller.ts) - Endpoints
- [product.entity.ts](src/products/entities/product.entity.ts) - Modelo producto
- [category.entity.ts](src/products/entities/category.entity.ts) - Modelo categoría
- [review.entity.ts](src/products/entities/review.entity.ts) - Modelo reseña

**Endpoints disponibles:**
```
GET    /api/products              - Listar con filtros (público)
GET    /api/products/categories   - Listar categorías (público)
GET    /api/products/:slug        - Obtener por slug (público)
GET    /api/products/:id/reviews  - Obtener reseñas (público)
POST   /api/products/:id/reviews  - Crear reseña (protegido)
POST   /api/products              - Crear producto (protegido)
PUT    /api/products/:id          - Actualizar producto (protegido)
DELETE /api/products/:id          - Eliminar producto (protegido)
```

#### C. INFRAESTRUCTURA Y CONFIGURACIÓN (100%)

| Componente | Estado | Detalles |
|------------|--------|----------|
| TypeORM + PostgreSQL | ✅ Completo | Configuración async con retry |
| Docker Compose | ✅ Completo | PostgreSQL 16-alpine |
| Dockerfile multi-stage | ✅ Completo | Optimizado para producción |
| Variables de entorno | ✅ Completo | ConfigModule global |
| ESLint + Prettier | ✅ Completo | Configuración estándar |
| GitHub Actions | ✅ Completo | 8 workflows CI/CD |
| Health Check | ✅ Completo | GET /api/health |

**Archivos clave:**
- [app.module.ts](src/app.module.ts) - Módulo raíz
- [main.ts](src/main.ts) - Entry point
- [docker-compose.yml](docker-compose.yml) - Servicios Docker
- [Dockerfile](Dockerfile) - Build multi-stage
- `.github/workflows/` - Pipelines CI/CD

#### D. TESTING (90%)

| Tipo | Cobertura | Archivos |
|------|-----------|----------|
| Tests unitarios Auth | ✅ Completo | 379 líneas |
| Tests unitarios Products | ✅ Completo | 868 líneas |
| Tests E2E | ✅ Parcial | 32 líneas |
| **Total** | **1,307 líneas** | **7 archivos** |

### 2.2 Comparación con ProShop MERN

#### Tabla Comparativa General

| Módulo/Feature | ProShop MERN | Vegan Vita Backend | Estado |
|----------------|--------------|-------------------|--------|
| **Autenticación** | ✅ | ✅ | **COMPLETO** |
| Registro de usuarios | ✅ | ✅ | ✅ |
| Login con JWT | ✅ | ✅ | ✅ |
| Perfil de usuario | ✅ | ✅ | ✅ |
| Actualizar perfil | ✅ | ❌ | **FALTA** |
| **Productos** | ✅ | ✅ | **PARCIAL** |
| CRUD productos | ✅ | ✅ | ✅ |
| Búsqueda/filtros | ✅ | ✅ | ✅ |
| Reseñas | ✅ | ✅ | ✅ |
| Top productos | ✅ | ❌ | **FALTA** |
| Rating promedio | ✅ | ❌ | **FALTA** |
| Upload de imágenes | ✅ | ❌ | **FALTA** |
| **Órdenes/Pedidos** | ✅ | ❌ | **FALTA** |
| Crear orden | ✅ | ❌ | **FALTA** |
| Ver mis órdenes | ✅ | ❌ | **FALTA** |
| Ver orden por ID | ✅ | ❌ | **FALTA** |
| Marcar como pagado | ✅ | ❌ | **FALTA** |
| Marcar como entregado | ✅ | ❌ | **FALTA** |
| **Panel Admin** | ✅ | ❌ | **FALTA** |
| Listar usuarios | ✅ | ❌ | **FALTA** |
| Eliminar usuario | ✅ | ❌ | **FALTA** |
| Actualizar usuario | ✅ | ❌ | **FALTA** |
| Listar órdenes | ✅ | ❌ | **FALTA** |
| **Sistema de Pagos** | ✅ | ❌ | **FALTA** |
| PayPal integration | ✅ | ❌ | **FALTA** |
| **Sistema de Roles** | ✅ | ❌ | **FALTA** |
| isAdmin flag | ✅ | ❌ | **FALTA** |
| Admin middleware | ✅ | ❌ | **FALTA** |

#### Resumen de Completitud

```
IMPLEMENTADO:   ████████████░░░░░░░░░░░░░░  40%
POR IMPLEMENTAR: ░░░░░░░░░░░░██████████████  60%
```

---

## 3. COMPARACIÓN DETALLADA

### 3.1 MODELOS DE DATOS

#### A. User Model

| Campo | ProShop | Vegan Vita | Notas |
|-------|---------|-----------|-------|
| id/\_id | ✅ ObjectId | ✅ UUID | ✅ Ambos OK |
| name | ✅ String | ✅ String | ✅ Igual |
| email | ✅ String unique | ✅ String unique | ✅ Igual |
| password | ✅ String hashed | ✅ String hashed | ✅ Igual |
| **isAdmin** | ✅ Boolean | ❌ **FALTA** | ⚠️ **Crítico para roles** |
| createdAt | ✅ Timestamp | ✅ Timestamp | ✅ Igual |
| updatedAt | ✅ Timestamp | ✅ Timestamp | ✅ Igual |

**🔴 CRÍTICO:** Falta el campo `isAdmin` para sistema de roles.

#### B. Product Model

| Campo | ProShop | Vegan Vita | Notas |
|-------|---------|-----------|-------|
| name | ✅ String | ✅ String | ✅ Igual |
| slug | ❌ No tiene | ✅ String unique | ✅ **Mejora en Vegan Vita** |
| description | ✅ String | ✅ Text | ✅ Igual |
| price | ✅ Number | ✅ Decimal(10,2) | ✅ Mejor precisión en VV |
| image | ✅ String | ✅ String | ✅ Igual |
| **brand** | ✅ String | ❌ **FALTA** | ⚠️ Útil para filtrado |
| category | ✅ String | ✅ Relation | ✅ **Mejor en Vegan Vita** |
| stock/countInStock | ✅ Number | ✅ Number | ✅ Igual |
| **rating** | ✅ Number | ❌ **FALTA** | ⚠️ **Rating promedio calculado** |
| **numReviews** | ✅ Number | ❌ **FALTA** | ⚠️ **Contador de reseñas** |
| reviews | ✅ Embedded | ✅ Relation | ✅ Igual (diferente enfoque) |
| user (owner) | ✅ Ref User | ❌ **FALTA** | ⚠️ Quién creó el producto |

**🟡 IMPORTANTE:** Faltan campos calculados `rating` y `numReviews`.

#### C. Order Model

| Estado | ProShop | Vegan Vita |
|--------|---------|-----------|
| **Implementación** | ✅ **COMPLETO** | ❌ **NO EXISTE** |

**Estructura de Order en ProShop:**

```javascript
{
  user: ObjectId,                  // Usuario que hizo la orden
  orderItems: [                    // Items de la orden
    {
      name: String,
      qty: Number,
      image: String,
      price: Number,
      product: ObjectId
    }
  ],
  shippingAddress: {               // Dirección de envío
    address: String,
    city: String,
    postalCode: String,
    country: String
  },
  paymentMethod: String,           // Método de pago
  paymentResult: {                 // Resultado de PayPal
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  taxPrice: Number,                // Impuestos
  shippingPrice: Number,           // Costo de envío
  totalPrice: Number,              // Precio total
  isPaid: Boolean,                 // Estado de pago
  paidAt: Date,                    // Fecha de pago
  isDelivered: Boolean,            // Estado de entrega
  deliveredAt: Date,               // Fecha de entrega
  createdAt: Date,
  updatedAt: Date
}
```

**🔴 CRÍTICO:** El modelo Order no existe en Vegan Vita.

---

### 3.2 ENDPOINTS DISPONIBLES

#### A. Auth/User Endpoints

| Endpoint | Método | ProShop | Vegan Vita | Prioridad |
|----------|--------|---------|-----------|-----------|
| Registro | POST | `/api/users` | `/api/auth/register` | ✅ OK |
| Login | POST | `/api/users/login` | `/api/auth/login` | ✅ OK |
| Obtener perfil | GET | `/api/users/profile` | `/api/auth/me` | ✅ OK |
| **Actualizar perfil** | PUT | `/api/users/profile` | ❌ | 🟡 **ALTA** |
| **Listar usuarios (Admin)** | GET | `/api/users` | ❌ | 🟡 **ALTA** |
| **Obtener usuario por ID** | GET | `/api/users/:id` | ❌ | 🟡 **MEDIA** |
| **Actualizar usuario (Admin)** | PUT | `/api/users/:id` | ❌ | 🟡 **MEDIA** |
| **Eliminar usuario (Admin)** | DELETE | `/api/users/:id` | ❌ | 🟡 **MEDIA** |

#### B. Product Endpoints

| Endpoint | Método | ProShop | Vegan Vita | Prioridad |
|----------|--------|---------|-----------|-----------|
| Listar productos | GET | `/api/products` | `/api/products` | ✅ OK |
| Obtener producto | GET | `/api/products/:id` | `/api/products/:slug` | ✅ OK |
| Crear producto | POST | `/api/products` | `/api/products` | ✅ OK |
| Actualizar producto | PUT | `/api/products/:id` | `/api/products/:id` | ✅ OK |
| Eliminar producto | DELETE | `/api/products/:id` | `/api/products/:id` | ✅ OK |
| Crear reseña | POST | `/api/products/:id/reviews` | `/api/products/:id/reviews` | ✅ OK |
| **Top productos** | GET | `/api/products/top` | ❌ | 🟢 **BAJA** |

#### C. Order Endpoints

| Endpoint | Método | ProShop | Vegan Vita | Prioridad |
|----------|--------|---------|-----------|-----------|
| **Crear orden** | POST | `/api/orders` | ❌ | 🔴 **CRÍTICA** |
| **Ver mis órdenes** | GET | `/api/orders/myorders` | ❌ | 🔴 **CRÍTICA** |
| **Ver orden por ID** | GET | `/api/orders/:id` | ❌ | 🔴 **CRÍTICA** |
| **Listar órdenes (Admin)** | GET | `/api/orders` | ❌ | 🟡 **ALTA** |
| **Marcar como pagado** | PUT | `/api/orders/:id/pay` | ❌ | 🔴 **CRÍTICA** |
| **Marcar como entregado** | PUT | `/api/orders/:id/deliver` | ❌ | 🟡 **ALTA** |

#### D. Upload Endpoints

| Endpoint | Método | ProShop | Vegan Vita | Prioridad |
|----------|--------|---------|-----------|-----------|
| **Upload imagen** | POST | `/api/upload` | ❌ | 🟡 **MEDIA** |

#### E. Config Endpoints

| Endpoint | Método | ProShop | Vegan Vita | Prioridad |
|----------|--------|---------|-----------|-----------|
| **PayPal Client ID** | GET | `/api/config/paypal` | ❌ | 🟡 **MEDIA** |

---

### 3.3 MIDDLEWARES Y GUARDS

#### ProShop MERN

```javascript
// authMiddleware.js
- protect()       // Verifica JWT, inyecta req.user
- admin()         // Verifica req.user.isAdmin === true
```

#### Vegan Vita Backend

```typescript
// Guards
- JwtAuthGuard    // Verifica JWT, inyecta req.user
- AdminGuard      // ❌ NO EXISTE
```

**🔴 FALTA:** Guard de administrador.

---

## 4. FUNCIONALIDADES FALTANTES

### 4.1 PRIORIDAD CRÍTICA 🔴

#### 1. Sistema de Órdenes/Pedidos Completo

**Descripción:** Implementar todo el flujo de checkout y gestión de órdenes.

**Componentes a crear:**

```
src/orders/
├── orders.module.ts
├── orders.service.ts
├── orders.controller.ts
├── entities/
│   ├── order.entity.ts
│   ├── order-item.entity.ts
│   └── shipping-address.entity.ts
└── dto/
    ├── create-order.dto.ts
    └── update-order-status.dto.ts
```

**Modelo Order.entity.ts:**

```typescript
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { eager: true, cascade: true })
  orderItems: OrderItem[];

  @Column({ type: 'jsonb' })
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentResult: {
    id?: string;
    status?: string;
    update_time?: string;
    email_address?: string;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  itemsPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'boolean', default: false })
  isDelivered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Modelo OrderItem.entity.ts:**

```typescript
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'varchar', length: 500 })
  image: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
```

**Endpoints a implementar:**

```typescript
// OrdersController
@Post()                        // Crear nueva orden
@Get('myorders')               // Obtener órdenes del usuario actual
@Get(':id')                    // Obtener orden por ID
@Put(':id/pay')                // Marcar orden como pagada
@Put(':id/deliver')            // Marcar orden como entregada (Admin)
@Get()                         // Listar todas las órdenes (Admin)
```

**Estimación:** 4-5 días full-time

---

#### 2. Sistema de Pagos (PayPal/Stripe)

**Descripción:** Integración con pasarela de pagos.

**Opciones:**

1. **PayPal** (como ProShop)
   - Instalar: `npm install @paypal/checkout-server-sdk`
   - Configurar credenciales en `.env`
   - Endpoint: `GET /api/config/paypal` (retorna clientId)

2. **Stripe** (alternativa moderna)
   - Instalar: `npm install stripe @nestjs/stripe`
   - Mejor experiencia de desarrollo
   - Más usado en 2025

**Componentes a crear:**

```
src/payments/
├── payments.module.ts
├── payments.service.ts
├── payments.controller.ts
└── dto/
    └── process-payment.dto.ts
```

**Endpoints a implementar:**

```typescript
@Get('config/paypal')          // Obtener PayPal Client ID
@Post('process-payment')       // Procesar pago
@Post('webhooks/paypal')       // Webhook de PayPal
```

**Estimación:** 3-4 días full-time

---

### 4.2 PRIORIDAD ALTA 🟡

#### 3. Sistema de Roles y Permisos

**Descripción:** Implementar roles de usuario (User, Admin).

**Cambios en User.entity.ts:**

```typescript
@Entity('users')
export class User {
  // ... campos existentes ...

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;  // 🆕 NUEVO CAMPO
}
```

**Guard AdminGuard:**

```typescript
// src/auth/guards/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.isAdmin) {
      throw new ForbiddenException('Acceso denegado: se requieren permisos de administrador');
    }

    return true;
  }
}
```

**Uso:**

```typescript
@UseGuards(JwtAuthGuard, AdminGuard)
@Delete(':id')
async deleteUser(@Param('id') id: string) {
  // Solo admins pueden ejecutar esto
}
```

**Estimación:** 1 día

---

#### 4. Panel de Administración (Backend)

**Descripción:** Endpoints para gestionar usuarios, productos y órdenes.

**Endpoints de gestión de usuarios:**

```typescript
// UsersController (nuevo)
@Get()                         // Listar todos los usuarios (Admin)
@Get(':id')                    // Obtener usuario por ID (Admin)
@Put(':id')                    // Actualizar usuario (Admin)
@Delete(':id')                 // Eliminar usuario (Admin)
```

**Endpoints de gestión de órdenes:**

```typescript
// OrdersController
@Get()                         // Listar todas las órdenes (Admin)
@Get('stats')                  // Estadísticas de ventas (Admin)
```

**Estimación:** 3-4 días full-time

---

#### 5. Actualización de Perfil de Usuario

**Descripción:** Permitir al usuario actualizar su perfil.

**Endpoint:**

```typescript
// AuthController
@Put('profile')
@UseGuards(JwtAuthGuard)
async updateProfile(
  @Request() req,
  @Body() updateProfileDto: UpdateProfileDto
) {
  return this.authService.updateProfile(req.user.id, updateProfileDto);
}
```

**DTO:**

```typescript
export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}
```

**Estimación:** 0.5 días

---

### 4.3 PRIORIDAD MEDIA 🟢

#### 6. Upload de Imágenes

**Descripción:** Subida de imágenes de productos.

**Opciones:**

1. **Local storage** (como ProShop)
   - Guardar en `/uploads`
   - Servir con `express.static()`

2. **Cloudinary** (recomendado)
   - CDN gratuito
   - Optimización automática
   - Mejor para producción

3. **AWS S3**
   - Enterprise-grade
   - Más caro

**Implementación con Multer (local):**

```typescript
// upload.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
    };
  }
}
```

**Estimación:** 2 días

---

#### 7. Campo Brand en Productos

**Descripción:** Agregar campo de marca/fabricante.

**Cambio en Product.entity.ts:**

```typescript
@Column({ type: 'varchar', length: 100, nullable: true })
brand: string;  // 🆕 NUEVO CAMPO
```

**Actualizar DTOs:**

```typescript
export class CreateProductDto {
  // ... campos existentes ...

  @IsString()
  @IsOptional()
  brand?: string;  // 🆕 NUEVO CAMPO
}
```

**Estimación:** 0.5 días

---

### 4.4 PRIORIDAD BAJA 🟣

#### 8. Rating Promedio y Contador de Reseñas

**Descripción:** Campos calculados en productos.

**Cambios en Product.entity.ts:**

```typescript
@Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
rating: number;  // 🆕 Rating promedio (ej. 4.5)

@Column({ type: 'int', default: 0 })
numReviews: number;  // 🆕 Total de reseñas
```

**Lógica de cálculo en ProductsService:**

```typescript
async createReview(productId: string, createReviewDto: CreateReviewDto, userId: string) {
  // ... crear reseña ...

  // Recalcular rating
  const reviews = await this.reviewRepository.find({ where: { product: { id: productId } } });
  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);

  product.rating = totalRating / reviews.length;
  product.numReviews = reviews.length;

  await this.productRepository.save(product);
}
```

**Estimación:** 1 día

---

#### 9. Endpoint Top Productos

**Descripción:** Obtener productos mejor valorados.

**Endpoint:**

```typescript
// ProductsController
@Get('top')
async getTopProducts() {
  return this.productsService.findTopRated(3);
}
```

**Service:**

```typescript
async findTopRated(limit: number = 3): Promise<Product[]> {
  return this.productRepository.find({
    order: { rating: 'DESC' },
    take: limit,
  });
}
```

**Estimación:** 0.5 días

---

#### 10. Estadísticas de Admin

**Descripción:** Dashboard con métricas.

**Endpoints:**

```typescript
@Get('stats/overview')         // Resumen general
@Get('stats/sales')            // Ventas por periodo
@Get('stats/products')         // Productos más vendidos
```

**Estimación:** 2 días

---

## 5. PLAN DE IMPLEMENTACIÓN CRONOLÓGICO

### FASE 1: PREPARACIÓN Y ROLES (2-3 días)

#### Día 1: Setup y Sistema de Roles

**Tareas:**
1. ✅ Agregar campo `isAdmin` a User.entity.ts
2. ✅ Crear migración para agregar columna
3. ✅ Crear AdminGuard
4. ✅ Actualizar tests de autenticación
5. ✅ Crear usuario admin en seeder

**Entregables:**
- [user.entity.ts](src/auth/entities/user.entity.ts) actualizado
- [admin.guard.ts](src/auth/guards/admin.guard.ts) creado
- Tests pasando

**Tiempo estimado:** 6-8 horas

---

#### Día 2-3: Gestión de Usuarios

**Tareas:**
1. ✅ Crear UsersModule
2. ✅ Implementar UsersController con endpoints admin
3. ✅ Implementar actualización de perfil
4. ✅ Escribir tests completos
5. ✅ Documentar endpoints

**Endpoints a implementar:**
```
PUT    /api/auth/profile        - Actualizar perfil propio
GET    /api/users               - Listar usuarios (Admin)
GET    /api/users/:id           - Obtener usuario (Admin)
PUT    /api/users/:id           - Actualizar usuario (Admin)
DELETE /api/users/:id           - Eliminar usuario (Admin)
```

**Tiempo estimado:** 10-14 horas

---

### FASE 2: SISTEMA DE ÓRDENES (4-5 días)

#### Día 4-5: Modelos y Relaciones

**Tareas:**
1. ✅ Crear Order.entity.ts
2. ✅ Crear OrderItem.entity.ts
3. ✅ Configurar relaciones TypeORM
4. ✅ Crear DTOs (CreateOrderDto, UpdateOrderStatusDto)
5. ✅ Crear migración de base de datos

**Entregables:**
- [order.entity.ts](src/orders/entities/order.entity.ts)
- [order-item.entity.ts](src/orders/entities/order-item.entity.ts)
- DTOs completos

**Tiempo estimado:** 12-16 horas

---

#### Día 6-7: Lógica de Negocio

**Tareas:**
1. ✅ Crear OrdersService
2. ✅ Implementar createOrder()
   - Validar stock de productos
   - Calcular totales
   - Crear OrderItems
   - Reducir stock automáticamente
3. ✅ Implementar getMyOrders()
4. ✅ Implementar getOrderById()
5. ✅ Implementar updateOrderToPaid()
6. ✅ Implementar updateOrderToDelivered() (Admin)
7. ✅ Implementar getOrders() (Admin)

**Validaciones importantes:**
- Stock suficiente antes de crear orden
- Usuario solo puede ver sus propias órdenes
- Admin puede ver todas las órdenes

**Tiempo estimado:** 14-18 horas

---

#### Día 8: Controller y Tests

**Tareas:**
1. ✅ Crear OrdersController
2. ✅ Implementar todos los endpoints
3. ✅ Aplicar guards (JWT, Admin)
4. ✅ Escribir tests unitarios (service)
5. ✅ Escribir tests E2E (endpoints)

**Endpoints:**
```
POST   /api/orders              - Crear orden
GET    /api/orders/myorders     - Mis órdenes
GET    /api/orders/:id          - Orden por ID
PUT    /api/orders/:id/pay      - Marcar pagado
PUT    /api/orders/:id/deliver  - Marcar entregado (Admin)
GET    /api/orders              - Todas las órdenes (Admin)
```

**Tiempo estimado:** 8-10 horas

---

### FASE 3: SISTEMA DE PAGOS (3-4 días)

#### Día 9-10: Integración PayPal

**Tareas:**
1. ✅ Instalar SDK de PayPal
2. ✅ Configurar variables de entorno
3. ✅ Crear PaymentsModule
4. ✅ Crear PaymentsService
5. ✅ Implementar endpoint config/paypal
6. ✅ Implementar validación de pago

**Variables de entorno (.env):**
```env
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-secret
PAYPAL_MODE=sandbox  # o production
```

**Tiempo estimado:** 14-16 horas

---

#### Día 11-12: Testing de Pagos

**Tareas:**
1. ✅ Configurar PayPal Sandbox
2. ✅ Crear cuentas de prueba
3. ✅ Probar flujo completo de pago
4. ✅ Manejar errores de PayPal
5. ✅ Documentar proceso de configuración

**Tiempo estimado:** 10-14 horas

---

### FASE 4: FEATURES ADICIONALES (4-5 días)

#### Día 13-14: Upload de Imágenes

**Opción A: Local Storage (rápido)**

**Tareas:**
1. ✅ Instalar multer
2. ✅ Crear UploadModule
3. ✅ Configurar storage local
4. ✅ Implementar endpoint POST /api/upload
5. ✅ Servir archivos estáticos
6. ✅ Validar tipos de archivo (jpg, png)
7. ✅ Validar tamaño máximo (5MB)

**Tiempo estimado:** 8-10 horas

**Opción B: Cloudinary (recomendado para producción)**

**Tareas:**
1. ✅ Crear cuenta Cloudinary
2. ✅ Instalar cloudinary SDK
3. ✅ Configurar credenciales
4. ✅ Implementar upload a Cloudinary
5. ✅ Retornar URL pública

**Tiempo estimado:** 10-12 horas

---

#### Día 15-16: Mejoras en Productos

**Tareas:**
1. ✅ Agregar campo `brand` a Product
2. ✅ Agregar campos `rating` y `numReviews`
3. ✅ Implementar cálculo automático de rating
4. ✅ Crear endpoint GET /api/products/top
5. ✅ Actualizar tests
6. ✅ Actualizar seeder con datos de prueba

**Tiempo estimado:** 10-14 horas

---

#### Día 17: Dashboard Admin

**Tareas:**
1. ✅ Crear endpoint GET /api/stats/overview
   - Total de ventas
   - Total de usuarios
   - Total de órdenes
   - Total de productos
2. ✅ Crear endpoint GET /api/stats/sales
   - Ventas por día/semana/mes
3. ✅ Crear endpoint GET /api/stats/products
   - Productos más vendidos

**Tiempo estimado:** 8-10 horas

---

### FASE 5: TESTING Y DOCUMENTACIÓN (2-3 días)

#### Día 18-19: Testing Completo

**Tareas:**
1. ✅ Completar tests unitarios
   - OrdersService (100% cobertura)
   - PaymentsService (100% cobertura)
   - UsersService (100% cobertura)
2. ✅ Completar tests E2E
   - Flujo de checkout completo
   - Flujo de pago
   - Panel admin
3. ✅ Tests de integración
4. ✅ Alcanzar 80%+ cobertura

**Comando:**
```bash
npm run test:cov
```

**Tiempo estimado:** 14-16 horas

---

#### Día 20: Documentación

**Tareas:**
1. ✅ Actualizar README.md
2. ✅ Documentar endpoints con Swagger
   - Instalar @nestjs/swagger
   - Agregar decoradores
   - Configurar SwaggerModule
3. ✅ Crear guía de instalación
4. ✅ Crear guía de deployment
5. ✅ Documentar variables de entorno
6. ✅ Crear CHANGELOG.md

**Swagger Config:**
```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Vegan Vita API')
  .setDescription('API para e-commerce de productos veganos')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Tiempo estimado:** 8-10 horas

---

## 6. ESTIMACIONES DE TIEMPO

### 6.1 Resumen por Fase

| Fase | Descripción | Días | Horas | Prioridad |
|------|-------------|------|-------|-----------|
| **Fase 1** | Preparación y Roles | 2-3 | 16-22 | 🔴 Crítica |
| **Fase 2** | Sistema de Órdenes | 4-5 | 34-44 | 🔴 Crítica |
| **Fase 3** | Sistema de Pagos | 3-4 | 24-30 | 🔴 Crítica |
| **Fase 4** | Features Adicionales | 4-5 | 36-46 | 🟡 Alta |
| **Fase 5** | Testing y Docs | 2-3 | 22-26 | 🟡 Alta |
| **TOTAL** | **Proyecto Completo** | **18-24** | **132-168** | - |

### 6.2 Estimación por Funcionalidad

| Funcionalidad | Complejidad | Tiempo | Prioridad |
|--------------|-------------|---------|-----------|
| Sistema de roles (isAdmin) | Baja | 6h | 🔴 Crítica |
| AdminGuard | Baja | 2h | 🔴 Crítica |
| Gestión de usuarios | Media | 12h | 🟡 Alta |
| Actualización de perfil | Baja | 4h | 🟡 Alta |
| Modelo Order completo | Alta | 12h | 🔴 Crítica |
| OrdersService | Alta | 16h | 🔴 Crítica |
| OrdersController | Media | 8h | 🔴 Crítica |
| Tests de órdenes | Media | 10h | 🟡 Alta |
| Integración PayPal | Alta | 16h | 🔴 Crítica |
| Testing de pagos | Media | 10h | 🟡 Alta |
| Upload de imágenes (local) | Baja | 8h | 🟢 Media |
| Upload de imágenes (Cloudinary) | Media | 12h | 🟢 Media |
| Campo brand en productos | Baja | 4h | 🟢 Media |
| Rating y numReviews | Media | 8h | 🟢 Baja |
| Top productos | Baja | 4h | 🟢 Baja |
| Estadísticas admin | Media | 10h | 🟢 Baja |
| Documentación Swagger | Media | 8h | 🟡 Alta |
| Tests completos | Alta | 20h | 🟡 Alta |

### 6.3 Escenarios de Desarrollo

#### Escenario A: Full-time (8 horas/día)

```
INICIO: Día 1
└── Fase 1: Días 1-3 (Roles y usuarios)
└── Fase 2: Días 4-8 (Sistema de órdenes)
└── Fase 3: Días 9-12 (Pagos)
└── Fase 4: Días 13-17 (Features)
└── Fase 5: Días 18-20 (Testing)
FIN: Día 20 ✅
```

**Total: 20 días (4 semanas)**

---

#### Escenario B: Part-time (4 horas/día)

```
INICIO: Día 1
└── Fase 1: Días 1-6 (Roles y usuarios)
└── Fase 2: Días 7-16 (Sistema de órdenes)
└── Fase 3: Días 17-24 (Pagos)
└── Fase 4: Días 25-34 (Features)
└── Fase 5: Días 35-40 (Testing)
FIN: Día 40 ✅
```

**Total: 40 días (8 semanas)**

---

#### Escenario C: Solo Funcionalidades Críticas

**Incluye:**
- ✅ Sistema de roles
- ✅ Sistema de órdenes
- ✅ Sistema de pagos

**Excluye:**
- ❌ Upload de imágenes
- ❌ Estadísticas
- ❌ Top productos

```
INICIO: Día 1
└── Fase 1: Días 1-3 (Roles)
└── Fase 2: Días 4-8 (Órdenes)
└── Fase 3: Días 9-12 (Pagos)
└── Testing: Días 13-14
FIN: Día 14 ✅
```

**Total: 14 días (2.5 semanas)**

---

## 7. RECOMENDACIONES TÉCNICAS

### 7.1 Mejoras Arquitectónicas

#### 1. Implementar DTOs de Respuesta

**Problema actual:** Los endpoints retornan entidades completas con información sensible.

**Solución:**

```typescript
// src/common/dto/user-response.dto.ts
export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.isAdmin = user.isAdmin;
  }
}
```

---

#### 2. Implementar Interceptor de Serialización

```typescript
// src/common/interceptors/serialize.interceptor.ts
@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((data: any) => {
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
```

**Uso:**

```typescript
@UseInterceptors(new SerializeInterceptor(UserResponseDto))
@Get('me')
async getMe(@Request() req) {
  return this.authService.findById(req.user.id);
}
```

---

#### 3. Implementar Global Exception Filter

```typescript
// src/common/filters/http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

---

#### 4. Implementar Logger Centralizado

**Instalar Winston:**

```bash
npm install nest-winston winston
```

**Configurar:**

```typescript
// src/common/logger/logger.module.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

WinstonModule.forRoot({
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        }),
      ),
    }),
  ],
})
```

---

#### 5. Implementar Rate Limiting

**Instalar:**

```bash
npm install @nestjs/throttler
```

**Configurar:**

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // 60 segundos
      limit: 10,    // 10 requests
    }),
  ],
})
```

**Uso:**

```typescript
@UseGuards(ThrottlerGuard)
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Limitado a 10 intentos por minuto
}
```

---

### 7.2 Mejoras de Seguridad

#### 1. Helmet para Headers de Seguridad

```bash
npm install helmet
```

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
```

---

#### 2. CORS Configurado

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

#### 3. Validación de Input con class-validator

**Ya implementado ✅** pero agregar más reglas:

```typescript
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9\s\-]+$/, {
    message: 'Nombre solo puede contener letras, números, espacios y guiones',
  })
  name: string;

  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  price: number;
}
```

---

### 7.3 Mejoras de Performance

#### 1. Implementar Redis para Caché

```bash
npm install @nestjs/cache-manager cache-manager redis
```

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutos
    }),
  ],
})
```

**Uso:**

```typescript
@UseInterceptors(CacheInterceptor)
@Get('products')
async findAll() {
  // Resultado cacheado por 5 minutos
}
```

---

#### 2. Índices de Base de Datos

**Ya tienes algunos ✅**, agregar más:

```typescript
@Entity('products')
@Index(['category'])
@Index(['price'])
@Index(['createdAt'])
export class Product {
  // ...
}
```

---

#### 3. Paginación Cursor-based (opcional)

Para mejor performance en datasets grandes:

```typescript
async findAll(cursor?: string, limit: number = 10) {
  const qb = this.productRepository.createQueryBuilder('product');

  if (cursor) {
    qb.where('product.id > :cursor', { cursor });
  }

  return qb
    .orderBy('product.id', 'ASC')
    .take(limit)
    .getMany();
}
```

---

## 8. DIAGRAMA DE ARQUITECTURA

### 8.1 Arquitectura Actual

```
┌─────────────────────────────────────────────────────────┐
│                    VEGAN VITA BACKEND                   │
│                      (Estado Actual)                     │
└─────────────────────────────────────────────────────────┘

                         ┌─────────┐
                         │  Client │
                         │ (React) │
                         └────┬────┘
                              │
                         HTTP │ REST API
                              │
                    ┌─────────▼────────┐
                    │   NestJS Server   │
                    │    (Port 3001)    │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼─────┐      ┌──────▼──────┐      ┌─────▼──────┐
    │   Auth   │      │  Products   │      │   Health   │
    │  Module  │      │   Module    │      │   Check    │
    └────┬─────┘      └──────┬──────┘      └────────────┘
         │                   │
         │            ┌──────┴──────┐
         │            │             │
    ┌────▼────┐  ┌───▼────┐  ┌────▼────┐
    │  User   │  │Product │  │Category │
    │ Entity  │  │ Entity │  │ Entity  │
    └────┬────┘  └───┬────┘  └────┬────┘
         │           │            │
         └───────────┴────────────┘
                     │
              ┌──────▼──────┐
              │  PostgreSQL │
              │  (Port 5432)│
              └─────────────┘

✅ IMPLEMENTADO
```

---

### 8.2 Arquitectura Objetivo (Completa)

```
┌─────────────────────────────────────────────────────────┐
│                    VEGAN VITA BACKEND                   │
│                     (Objetivo Final)                     │
└─────────────────────────────────────────────────────────┘

                         ┌─────────┐
                         │  Client │
                         │ (React) │
                         └────┬────┘
                              │
                         HTTP │ REST API
                              │
                    ┌─────────▼────────┐
                    │   NestJS Server   │
                    │    (Port 3001)    │
                    │                   │
                    │  [Global Pipes]   │
                    │  - Validation     │
                    │  - Transform      │
                    │                   │
                    │  [Global Guards]  │
                    │  - JWT Auth       │
                    │  - Admin          │
                    │  - Rate Limit     │
                    └─────────┬─────────┘
                              │
         ┌────────────┬───────┼───────┬────────────┬──────────┐
         │            │       │       │            │          │
    ┌────▼─────┐ ┌───▼────┐ │ ┌─────▼──────┐ ┌───▼────┐ ┌──▼──────┐
    │   Auth   │ │ Users  │ │ │  Products  │ │ Orders │ │ Payments│
    │  Module  │ │ Module │ │ │   Module   │ │ Module │ │ Module  │
    │          │ │        │ │ │            │ │        │ │         │
    │ ✅ HECHO │ │❌FALTA │ │ │ ✅ PARCIAL │ │❌FALTA │ │❌FALTA  │
    └────┬─────┘ └───┬────┘ │ └─────┬──────┘ └───┬────┘ └──┬──────┘
         │           │      │       │            │         │
         │           │      │       │      ┌─────▼─────┐   │
         │           │      │       │      │OrderItems │   │
         │           │      │       │      │  Entity   │   │
         │           │      │       │      └───────────┘   │
         │           │      │       │                      │
    ┌────▼────┐ ┌───▼────┐ │ ┌─────▼──────┐         ┌────▼────┐
    │  User   │ │  User  │ │ │  Product   │         │  Order  │
    │ Entity  │ │Response│ │ │  Entity    │         │ Entity  │
    │         │ │  DTO   │ │ └─────┬──────┘         └────┬────┘
    │+ isAdmin│ │        │ │       │                     │
    └────┬────┘ └────────┘ │ ┌─────▼──────┐              │
         │                 │ │  Category  │              │
         │                 │ │   Entity   │              │
         │                 │ └─────┬──────┘              │
         │                 │       │                     │
         │                 │ ┌─────▼──────┐              │
         │                 │ │   Review   │              │
         │                 │ │   Entity   │              │
         │                 │ └─────┬──────┘              │
         │                 │       │                     │
         └─────────────────┴───────┴─────────────────────┘
                                   │
                            ┌──────▼──────┐
                            │  PostgreSQL │
                            │  (Port 5432)│
                            │             │
                            │  Tables:    │
                            │  - users    │
                            │  - products │
                            │  - categories│
                            │  - reviews  │
                            │  - orders   │  ❌ FALTA
                            │  - order_items│ ❌ FALTA
                            └─────────────┘

    ┌──────────────┐
    │   PayPal     │  ❌ FALTA INTEGRACIÓN
    │   API        │
    └──────────────┘

    ┌──────────────┐
    │  Cloudinary  │  ❌ OPCIONAL
    │   (CDN)      │
    └──────────────┘

    ┌──────────────┐
    │    Redis     │  ❌ OPCIONAL (Caché)
    │   (Caché)    │
    └──────────────┘
```

---

### 8.3 Flujo de Checkout (A Implementar)

```
┌─────────────────────────────────────────────────────────┐
│              FLUJO DE CHECKOUT - VEGAN VITA             │
└─────────────────────────────────────────────────────────┘

1. AGREGAR AL CARRITO (Frontend)
   ┌─────────────┐
   │   Cliente   │  Selecciona productos
   │  (React)    │  Ajusta cantidades
   └──────┬──────┘  Guarda en localStorage/Redux
          │
          │ Productos: [{id, qty, price}]
          │
          ▼

2. INICIAR CHECKOUT
   ┌─────────────┐
   │   Cliente   │  Click "Proceder al pago"
   └──────┬──────┘
          │
          │ POST /api/orders
          │ Body: {
          │   orderItems: [...],
          │   shippingAddress: {...},
          │   paymentMethod: "PayPal"
          │ }
          ▼
   ┌─────────────┐
   │   Orders    │  1. Validar stock
   │  Service    │  2. Calcular totales
   └──────┬──────┘  3. Crear orden (isPaid=false)
          │         4. Reducir stock
          │
          │ Response: { orderId, totalPrice }
          ▼

3. PROCESO DE PAGO
   ┌─────────────┐
   │   Cliente   │  Renderiza botón PayPal
   └──────┬──────┘
          │
          │ GET /api/config/paypal
          │ Response: { clientId }
          ▼
   ┌─────────────┐
   │   PayPal    │  Cliente completa pago
   │   Widget    │
   └──────┬──────┘
          │
          │ onApprove(paymentResult)
          ▼

4. CONFIRMAR PAGO
   ┌─────────────┐
   │   Cliente   │  PUT /api/orders/:id/pay
   └──────┬──────┘  Body: { paymentResult }
          │
          ▼
   ┌─────────────┐
   │  Payments   │  1. Validar con PayPal API
   │  Service    │  2. Actualizar orden
   └──────┬──────┘  3. isPaid = true
          │         4. paidAt = now
          │
          │ Response: { order }
          ▼

5. CONFIRMACIÓN
   ┌─────────────┐
   │   Cliente   │  Muestra página de éxito
   │  (React)    │  Muestra detalles de orden
   └─────────────┘

6. ADMIN - GESTIÓN
   ┌─────────────┐
   │   Admin     │  GET /api/orders
   │  Dashboard  │  Ve todas las órdenes
   └──────┬──────┘
          │
          │ PUT /api/orders/:id/deliver
          │ (Marcar como entregado)
          ▼
   ┌─────────────┐
   │   Orders    │  1. isDelivered = true
   │  Service    │  2. deliveredAt = now
   └─────────────┘
```

---

## 9. CHECKLIST DE IMPLEMENTACIÓN

### 9.1 Fase 1: Preparación ✅❌

- [ ] Agregar campo `isAdmin` a User.entity
- [ ] Crear migración de base de datos
- [ ] Crear AdminGuard
- [ ] Actualizar AuthService con roles
- [ ] Crear tests para roles
- [ ] Crear UsersModule
- [ ] Implementar endpoints de gestión de usuarios
- [ ] Implementar actualización de perfil
- [ ] Tests completos para UsersModule

### 9.2 Fase 2: Sistema de Órdenes ✅❌

- [ ] Crear Order.entity
- [ ] Crear OrderItem.entity
- [ ] Configurar relaciones TypeORM
- [ ] Crear CreateOrderDto
- [ ] Crear UpdateOrderStatusDto
- [ ] Crear OrdersModule
- [ ] Implementar OrdersService.createOrder()
- [ ] Implementar OrdersService.getMyOrders()
- [ ] Implementar OrdersService.getOrderById()
- [ ] Implementar OrdersService.updateOrderToPaid()
- [ ] Implementar OrdersService.updateOrderToDelivered()
- [ ] Implementar OrdersService.getAllOrders()
- [ ] Crear OrdersController con todos los endpoints
- [ ] Aplicar guards (JWT, Admin)
- [ ] Tests unitarios de OrdersService
- [ ] Tests E2E de endpoints

### 9.3 Fase 3: Sistema de Pagos ✅❌

- [ ] Instalar @paypal/checkout-server-sdk
- [ ] Configurar variables de entorno
- [ ] Crear PaymentsModule
- [ ] Crear PaymentsService
- [ ] Implementar endpoint GET /api/config/paypal
- [ ] Implementar validación de pago con PayPal API
- [ ] Configurar PayPal Sandbox
- [ ] Crear cuentas de prueba
- [ ] Probar flujo completo
- [ ] Manejar errores de PayPal
- [ ] Documentar proceso de configuración

### 9.4 Fase 4: Features Adicionales ✅❌

- [ ] Instalar multer o cloudinary
- [ ] Crear UploadModule
- [ ] Implementar POST /api/upload
- [ ] Validar tipos de archivo
- [ ] Validar tamaño de archivo
- [ ] Agregar campo `brand` a Product
- [ ] Agregar campos `rating` y `numReviews`
- [ ] Implementar cálculo automático de rating
- [ ] Crear endpoint GET /api/products/top
- [ ] Actualizar seeder con datos de prueba
- [ ] Crear endpoint GET /api/stats/overview
- [ ] Crear endpoint GET /api/stats/sales
- [ ] Crear endpoint GET /api/stats/products

### 9.5 Fase 5: Testing y Documentación ✅❌

- [ ] Tests unitarios de OrdersService (100%)
- [ ] Tests unitarios de PaymentsService (100%)
- [ ] Tests unitarios de UsersService (100%)
- [ ] Tests E2E de flujo de checkout
- [ ] Tests E2E de flujo de pago
- [ ] Tests E2E de panel admin
- [ ] Alcanzar 80%+ cobertura general
- [ ] Instalar @nestjs/swagger
- [ ] Configurar SwaggerModule
- [ ] Agregar decoradores a todos los endpoints
- [ ] Actualizar README.md
- [ ] Crear guía de instalación
- [ ] Crear guía de deployment
- [ ] Documentar variables de entorno
- [ ] Crear CHANGELOG.md

---

## 10. COMANDOS ÚTILES

### Desarrollo

```bash
# Instalar dependencias
pnpm install

# Iniciar en desarrollo
pnpm run start:dev

# Iniciar base de datos
docker-compose up -d

# Ver logs de base de datos
docker-compose logs -f postgres

# Ejecutar seeder
pnpm run seed  # (a implementar)
```

### Testing

```bash
# Tests unitarios
pnpm run test

# Tests en watch mode
pnpm run test:watch

# Cobertura de tests
pnpm run test:cov

# Tests E2E
pnpm run test:e2e
```

### Build y Producción

```bash
# Build
pnpm run build

# Iniciar en producción
pnpm run start:prod

# Build de imagen Docker
docker build -t vegan-vita-backend .

# Ejecutar contenedor
docker run -p 3001:3001 vegan-vita-backend
```

### Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it vegan_vita_db psql -U postgres -d vegan_vita_dev

# Backup de base de datos
docker exec vegan_vita_db pg_dump -U postgres vegan_vita_dev > backup.sql

# Restaurar backup
docker exec -i vegan_vita_db psql -U postgres vegan_vita_dev < backup.sql

# Ver tablas
\dt

# Describir tabla
\d users
```

---

## 11. CONCLUSIONES Y PRÓXIMOS PASOS

### 11.1 Estado Actual

Tu proyecto **Vegan Vita Backend** está en un **excelente estado de partida**:

✅ **Fortalezas:**
- Arquitectura NestJS bien estructurada
- Sistema de autenticación robusto con JWT
- Productos con búsqueda y filtrado avanzado
- Tests extensivos (1,307 líneas)
- CI/CD completo con GitHub Actions
- Docker configurado correctamente
- TypeORM con PostgreSQL
- Validación de DTOs completa

⚠️ **Áreas de Mejora:**
- Sistema de órdenes (funcionalidad crítica)
- Sistema de pagos (funcionalidad crítica)
- Sistema de roles y permisos
- Panel de administración
- Upload de imágenes
- Documentación con Swagger

### 11.2 Recomendación de Implementación

**OPCIÓN A: Implementación Completa (Recomendada)**
- Duración: 18-24 días full-time
- Incluye: Todas las funcionalidades
- Resultado: E-commerce completamente funcional

**OPCIÓN B: MVP Funcional (Rápida)**
- Duración: 14 días full-time
- Incluye: Roles + Órdenes + Pagos
- Resultado: E-commerce básico pero funcional

**OPCIÓN C: Incremental (Flexible)**
- Implementa por fases según prioridades
- Permite ajustar según feedback
- Ideal para desarrollo ágil

### 11.3 Próximos Pasos Inmediatos

1. **Revisar este documento completo**
2. **Decidir alcance del proyecto** (A, B o C)
3. **Configurar entorno de PayPal Sandbox**
4. **Comenzar con Fase 1: Sistema de Roles**
5. **Implementar Fase 2: Sistema de Órdenes**
6. **Continuar según plan cronológico**

---

## 12. RECURSOS Y REFERENCIAS

### Documentación Oficial

- [NestJS Docs](https://docs.nestjs.com/)
- [TypeORM Docs](https://typeorm.io/)
- [PayPal Developer](https://developer.paypal.com/)
- [Stripe Docs](https://stripe.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Tutoriales Recomendados

- [NestJS TypeORM Tutorial](https://docs.nestjs.com/techniques/database)
- [JWT Authentication in NestJS](https://docs.nestjs.com/security/authentication)
- [PayPal Checkout Integration](https://developer.paypal.com/docs/checkout/)

### Proyecto de Referencia

- ProShop MERN: `/Users/EACM/Developer/proshop_mern/backend/`

---

**Documento generado:** 01 de noviembre de 2025
**Versión:** 1.0
**Autor:** Claude AI
**Proyecto:** Vegan Vita Backend
**Ubicación:** `/Users/EACM/Developer/vegan-vita-backend/`

---

¡Buena suerte con tu proyecto! 🚀🌱
