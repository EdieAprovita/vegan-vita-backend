# Ejemplos Prácticos de Uso de Agentes

Esta guía contiene ejemplos reales de cómo invocar y usar los agentes del proyecto Vegan Vita Backend.

## 📋 Índice

1. [Sistema de Órdenes (Completo)](#1-sistema-de-órdenes-completo)
2. [Agregar Campo a Entidad](#2-agregar-campo-a-entidad)
3. [Implementar Sistema de Roles](#3-implementar-sistema-de-roles)
4. [Bug Fix con Tests](#4-bug-fix-con-tests)
5. [Refactoring de Módulo](#5-refactoring-de-módulo)
6. [Integración de Pagos](#6-integración-de-pagos)

---

## 1. Sistema de Órdenes (Completo)

### 🎯 Objetivo
Implementar sistema completo de gestión de órdenes con:
- Creación de órdenes
- Gestión de items
- Reducción de stock
- Integración con pagos

### 📝 Paso 1: Arquitectura

**Tu prompt:**
```
Invoca el agente de arquitectura con la siguiente tarea:

Diseña la arquitectura completa para un sistema de gestión de órdenes/pedidos
en el proyecto Vegan Vita Backend.

Requisitos:
- Crear órdenes con múltiples items
- Calcular totales (subtotal + impuestos + envío)
- Dirección de envío
- Método de pago (PayPal)
- Estados: pending, paid, delivered
- Reducción automática de stock (transacciones ACID)
- Solo el usuario puede ver sus órdenes
- Admin puede ver todas las órdenes

Stack: NestJS + TypeORM + PostgreSQL
Módulos existentes: Auth, Products (revisar antes de diseñar)
```

**Output esperado del agente:**
```markdown
# DISEÑO ARQUITECTÓNICO: Sistema de Órdenes

## 1. RESUMEN EJECUTIVO
Sistema de gestión de órdenes que permite crear pedidos, gestionar items,
calcular totales y reducir stock automáticamente usando transacciones...

## 2. ARQUITECTURA DE ALTO NIVEL
[Diagrama Mermaid]

## 3. MÓDULOS Y COMPONENTES

### 3.1 OrdersModule
Estructura:
src/orders/
├── orders.module.ts
├── orders.service.ts
├── orders.controller.ts
├── entities/
│   ├── order.entity.ts
│   ├── order-item.entity.ts
│   └── index.ts
└── dto/
    ├── create-order.dto.ts
    ├── update-order-status.dto.ts
    └── index.ts

### 3.2 Entidades TypeORM

#### Order.entity.ts
[Código completo de la entidad]

#### OrderItem.entity.ts
[Código completo de la entidad]

### 3.3 DTOs
[Definiciones de DTOs]

### 3.4 Endpoints
POST   /api/orders              - Crear orden
GET    /api/orders/myorders     - Mis órdenes
GET    /api/orders/:id          - Obtener orden
PUT    /api/orders/:id/pay      - Marcar pagado
GET    /api/orders              - Todas (admin)
PUT    /api/orders/:id/deliver  - Marcar entregado (admin)

## 4. DECISIONES ARQUITECTÓNICAS

### ADR-001: Uso de Transacciones para Stock
[Detalles de la decisión]

## 5. PLAN DE IMPLEMENTACIÓN

Fase 1: Entidades (1 día)
Fase 2: DTOs (0.5 días)
Fase 3: Service (2 días)
Fase 4: Controller (1 día)
Fase 5: Tests (1 día)

Total: 5.5 días

## 6. SIGUIENTE PASO
Invocar agente developer para implementar las entidades primero.
```

---

### 📝 Paso 2: Implementación - Entidades

**Tu prompt:**
```
Invoca el agente de desarrollo con la siguiente tarea:

Implementa las entidades Order y OrderItem según el diseño del agente
de arquitectura.

Asegúrate de:
- Usar UUID para IDs
- Configurar relaciones TypeORM correctamente
- Agregar índices necesarios
- Incluir timestamps automáticos
- Seguir convenciones del proyecto
```

**Output esperado:**
```markdown
# IMPLEMENTACIÓN: Entidades Order y OrderItem

## 1. RESUMEN
Implementación de Order.entity y OrderItem.entity con todas las
relaciones TypeORM necesarias.

## 2. ARCHIVOS A CREAR

### 2.1 Entidades
- src/orders/entities/order.entity.ts
- src/orders/entities/order-item.entity.ts
- src/orders/entities/index.ts

## 3. IMPLEMENTACIÓN COMPLETA

### 3.1 Order Entity
[Código completo con comentarios]

### 3.2 OrderItem Entity
[Código completo con comentarios]

### 3.3 Index Export
[Código de barrel export]

## 4. SIGUIENTE PASO
Crear los DTOs con validación.
```

---

### 📝 Paso 3: Implementación - DTOs

**Tu prompt:**
```
Usa el agente de desarrollo para crear los DTOs:
- CreateOrderDto con validaciones class-validator
- UpdateOrderStatusDto
- CreateOrderItemDto (anidado)
- ShippingAddressDto (anidado)
```

**Output esperado:**
```markdown
# IMPLEMENTACIÓN: DTOs de Orders

[Código completo de todos los DTOs con validaciones]
```

---

### 📝 Paso 4: Implementación - Service

**Tu prompt:**
```
Agente de desarrollo: implementa OrdersService con:

Métodos:
1. create() - Crear orden con transacción para reducir stock
2. findById() - Obtener orden por ID
3. findByUserId() - Obtener órdenes de un usuario
4. findAll() - Obtener todas (admin)
5. updateToPaid() - Marcar como pagado
6. updateToDelivered() - Marcar como entregado (admin)

Importante:
- Usar transacciones para create()
- Validar stock antes de crear orden
- Manejar todos los errores apropiadamente
```

**Output esperado:**
```markdown
# IMPLEMENTACIÓN: OrdersService

[Código completo del service con toda la lógica de negocio]
```

---

### 📝 Paso 5: Implementación - Controller

**Tu prompt:**
```
Agente developer: crea OrdersController con todos los endpoints.

Aplicar:
- JwtAuthGuard en todas las rutas
- AdminGuard en rutas de admin
- Códigos HTTP apropiados
```

**Output esperado:**
```markdown
# IMPLEMENTACIÓN: OrdersController

[Código completo del controller con todos los endpoints]
```

---

### 📝 Paso 6: Testing

**Tu prompt:**
```
Invoca el agente de testing para crear suite completa de tests:

1. Tests unitarios de OrdersService (100% cobertura)
   - Todos los métodos
   - Casos exitosos
   - Casos de error
   - Edge cases

2. Tests unitarios de OrdersController

3. Test de integración: crear orden con reducción de stock

4. Test E2E: flujo completo de checkout

Objetivo: 85%+ cobertura total del módulo
```

**Output esperado:**
```markdown
# SUITE DE TESTS: Orders Module

## 1. ESTRATEGIA
[Plan de testing]

## 2. TESTS UNITARIOS - SERVICE
[Código completo con 300+ líneas de tests]

## 3. TESTS UNITARIOS - CONTROLLER
[Código completo con 150+ líneas]

## 4. TESTS DE INTEGRACIÓN
[Tests con BD real]

## 5. TESTS E2E
[Flujo completo de checkout]

## 6. COBERTURA
Esperada: 87%
```

---

## 2. Agregar Campo a Entidad

### 🎯 Objetivo
Agregar campo `brand` a Product.entity

### 📝 Paso 1: Validación Arquitectónica

**Tu prompt:**
```
Agente de arquitectura: evalúa si agregar el campo 'brand' (marca/fabricante)
a Product.entity es consistente con la arquitectura actual.

Considera:
- ¿Es necesario?
- ¿Dónde más impacta? (DTOs, filtros, búsqueda)
- ¿Requiere migración?
- ¿Afecta performance?

Crea un ADR documentando la decisión.
```

**Output esperado:**
```markdown
# ADR-005: Agregar Campo Brand a Product

## Contexto
Los productos veganos tienen diferentes marcas/fabricantes...

## Decisión
ACEPTADA - Agregar campo brand

## Impacto
- Product.entity: nuevo campo
- CreateProductDto: validación
- UpdateProductDto: validación
- FilterProductDto: nuevo filtro
- Búsqueda: incluir brand
- Seeder: actualizar productos

## Estimación
0.5 días

## SIGUIENTE PASO
Developer implementa el cambio
```

---

### 📝 Paso 2: Implementación

**Tu prompt:**
```
Developer: implementa el campo brand según ADR-005

Cambios necesarios:
1. Product.entity - agregar columna
2. CreateProductDto - agregar validación
3. UpdateProductDto - agregar validación
4. FilterProductDto - agregar filtro opcional
5. ProductsService - actualizar búsqueda
6. Seeder - agregar brands a productos existentes
```

**Output esperado:**
```markdown
# IMPLEMENTACIÓN: Campo Brand en Product

[Código de todos los cambios necesarios]
```

---

### 📝 Paso 3: Tests

**Tu prompt:**
```
Testing: actualiza tests para incluir el campo brand

- Tests de validación de brand
- Tests de filtrado por brand
- Tests de búsqueda incluyendo brand
- Verificar que tests existentes siguen pasando
```

---

## 3. Implementar Sistema de Roles

### 🎯 Objetivo
Agregar campo `isAdmin` y crear AdminGuard

### 📝 Paso 1: Arquitectura

**Tu prompt:**
```
Arquitecture: diseña sistema de roles para Vegan Vita Backend

Requisitos:
- Agregar campo isAdmin a User
- Crear AdminGuard
- Proteger rutas admin (gestión de usuarios, órdenes)
- Backward compatibility (usuarios existentes)

Stack actual: Ya existe JwtAuthGuard que funciona bien
```

**Output esperado:**
```markdown
# ADR-006: Sistema de Roles (isAdmin)

[Diseño completo + plan de implementación]
```

---

### 📝 Paso 2: Implementación

**Tu prompt:**
```
Developer: implementa sistema de roles

1. User.entity - agregar campo isAdmin
2. AdminGuard - crear guard que verifica req.user.isAdmin
3. Actualizar seeder - crear usuario admin por defecto
4. Proteger rutas existentes que requieren admin

Usuarios existentes: isAdmin = false por defecto
```

---

### 📝 Paso 3: Testing

**Tu prompt:**
```
Testing: crea tests para sistema de roles

- Tests de AdminGuard (permite admin, bloquea user normal)
- Tests de rutas protegidas
- Tests de backward compatibility
```

---

## 4. Bug Fix con Tests

### 🎯 Objetivo
Resolver bug donde 2 usuarios pueden comprar el último item simultáneamente

### 📝 Paso 1: Reproducir con Test

**Tu prompt:**
```
Testing: crea un test que reproduzca este bug:

Escenario:
1. Producto con stock = 1
2. Usuario A crea orden con quantity = 1
3. Usuario B crea orden con quantity = 1 (simultáneamente)
4. Resultado esperado: Una orden exitosa, otra falla
5. Resultado actual: Ambas órdenes se crean (BUG)

Test debe fallar actualmente, documentando el bug.
```

**Output esperado:**
```typescript
describe('Concurrent Orders Bug', () => {
  it('should prevent concurrent orders from exceeding stock', async () => {
    // Test que reproduce el bug y actualmente FALLA
  });
});
```

---

### 📝 Paso 2: Resolver Bug

**Tu prompt:**
```
Developer: resuelve el bug de órdenes concurrentes

Solución: Usar row-level locking en PostgreSQL al verificar stock

```typescript
// En OrdersService.create()
const product = await queryRunner.manager
  .createQueryBuilder(Product, 'product')
  .setLock('pessimistic_write') // 🔒 LOCK
  .where('product.id = :id', { id: item.productId })
  .getOne();
```

Implementa esta solución y verifica que el test ahora pasa.
```

---

### 📝 Paso 3: Tests Adicionales

**Tu prompt:**
```
Testing: agrega tests de regresión

- Test de concurrencia con múltiples usuarios
- Test de timeout en lock
- Test de deadlock prevention
```

---

## 5. Refactoring de Módulo

### 🎯 Objetivo
Refactorizar AuthService para separar responsabilidades

### 📝 Paso 1: Tests de Regresión

**Tu prompt:**
```
Testing: antes del refactoring, crea suite completa de tests
para AuthService documentando comportamiento actual

Esto asegura que el refactoring no rompa nada.

Cobertura: 100% de AuthService
```

---

### 📝 Paso 2: Propuesta Arquitectónica

**Tu prompt:**
```
Arquitecture: AuthService hace demasiado (registro, login, validación,
hash de passwords). Propón separación de responsabilidades.

Considera:
- PasswordService (hash, compare)
- UserService (CRUD de usuarios)
- AuthService (solo lógica de autenticación)

Mantén backward compatibility en las rutas.
```

**Output esperado:**
```markdown
# ADR-007: Refactoring AuthService

[Propuesta de nueva arquitectura]
```

---

### 📝 Paso 3: Implementación

**Tu prompt:**
```
Developer: implementa refactoring según ADR-007

Asegúrate de:
- Todos los tests de regresión pasan
- No cambios en endpoints (backward compatible)
- Código más limpio y mantenible
```

---

### 📝 Paso 4: Validación

**Tu prompt:**
```
Testing: verifica que todos los tests pasan después del refactoring

Si algún test falla, el refactoring introdujo regresión.
```

---

## 6. Integración de Pagos

### 🎯 Objetivo
Integrar PayPal para procesamiento de pagos

### 📝 Paso 1: Arquitectura

**Tu prompt:**
```
Arquitecture: diseña integración con PayPal SDK

Requisitos:
- Endpoint GET /api/config/paypal (retorna clientId)
- Validación de pago con PayPal API
- Actualización de orden después de pago exitoso
- Manejo de errores de PayPal
- Sandbox para desarrollo, production para prod

Variables de entorno necesarias:
- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET
- PAYPAL_MODE (sandbox | production)
```

**Output esperado:**
```markdown
# ADR-008: Integración PayPal

[Diseño completo de integración]
```

---

### 📝 Paso 2: Implementación

**Tu prompt:**
```
Developer: implementa integración PayPal

1. Instalar SDK: npm install @paypal/checkout-server-sdk
2. Crear PaymentsModule
3. Crear PaymentsService con validación
4. Crear endpoint config/paypal
5. Actualizar OrdersService.updateToPaid() para validar con PayPal

Configuración en .env:
PAYPAL_CLIENT_ID=sandbox_xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=sandbox
```

---

### 📝 Paso 3: Testing

**Tu prompt:**
```
Testing: crea tests de integración PayPal

- Mock de PayPal API
- Test de pago exitoso
- Test de pago fallido
- Test de validación de payment result
- Test de actualización de orden

No usar API real en tests (usar mocks).
```

---

## 🎓 Tips para Usar los Ejemplos

### 1. Adapta los Prompts
No copies y pegues ciegamente. Adapta según tu necesidad específica:

```
❌ "Implementa sistema de órdenes"

✅ "Implementa sistema de órdenes según diseño del agente de arquitectura,
   asegurándote de usar transacciones para la reducción de stock"
```

### 2. Da Contexto
Siempre recuerda al agente el contexto:

```
"Recuerda que este es el proyecto Vegan Vita Backend con NestJS + TypeORM.
Ya tenemos implementados los módulos Auth y Products."
```

### 3. Sé Específico
Cuanto más específico, mejor resultado:

```
❌ "Crea tests"

✅ "Crea tests unitarios de OrdersService cubriendo los métodos create(),
   findById() y updateToPaid(), incluyendo casos de error y edge cases.
   Objetivo: 90%+ cobertura"
```

### 4. Itera
No tengas miedo de pedir ajustes:

```
"El diseño es muy complejo. Simplifícalo eliminando X y manteniendo solo Y."
```

### 5. Verifica
Siempre verifica el output:

```
"Antes de continuar, verifica que el código compila y los tests pasan"
```

---

## 📚 Recursos Adicionales

- [README de Agentes](.claude/README.md) - Documentación completa
- [Estructura de Agentes](.claude/ESTRUCTURA.md) - Vista general
- [Análisis del Proyecto](../ANALISIS_COMPLETO_PROYECTO.md) - Estado actual

---

**Última actualización:** 01 de noviembre de 2025
**Versión:** 1.0

¡Feliz desarrollo con tus agentes! 🚀
