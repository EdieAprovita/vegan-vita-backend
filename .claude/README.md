# Agentes Especializados de Vegan Vita Backend

Este proyecto cuenta con **3 agentes especializados** configurados localmente para ayudar en diferentes aspectos del desarrollo.

## 📁 Ubicación

```
.claude/
└── agents/
    ├── arquitecture.md    # Agente de Arquitectura
    ├── developer.md       # Agente de Desarrollo
    └── testing.md         # Agente de Testing
```

## 🤖 Agentes Disponibles

### 1. **Arquitecture** - El Estratega 🏛️

**Especialidad:** Diseño de arquitectura, patrones, decisiones técnicas

**Usa este agente para:**
- ✅ Diseñar nuevas features o módulos
- ✅ Revisar y proponer mejoras arquitectónicas
- ✅ Crear ADRs (Architecture Decision Records)
- ✅ Definir estructura de carpetas y archivos
- ✅ Seleccionar patrones de diseño apropiados
- ✅ Documentar decisiones técnicas importantes

**Conocimientos:**
- Arquitectura NestJS modular
- TypeORM + PostgreSQL
- SOLID Principles
- Clean Architecture
- Patrones de diseño (Repository, Factory, Strategy, etc.)
- E-commerce domain knowledge

### 2. **Developer** - El Constructor 👨‍💻

**Especialidad:** Implementación de código, refactoring, bug fixing

**Usa este agente para:**
- ✅ Implementar nuevos módulos o features
- ✅ Escribir entidades TypeORM
- ✅ Crear DTOs con validación
- ✅ Implementar Services con lógica de negocio
- ✅ Crear Controllers con endpoints
- ✅ Refactorizar código existente
- ✅ Resolver bugs
- ✅ Optimizar performance

**Conocimientos:**
- TypeScript + NestJS
- TypeORM (entidades, relaciones, migraciones)
- class-validator + class-transformer
- JWT + Passport.js
- Manejo de errores y excepciones
- Transacciones de base de datos
- Seguridad (bcrypt, sanitización)

### 3. **Testing** - El Guardián 🧪

**Especialidad:** Testing completo (unitarios, integración, E2E)

**Usa este agente para:**
- ✅ Crear tests unitarios de Services
- ✅ Crear tests unitarios de Controllers
- ✅ Implementar tests de integración
- ✅ Escribir tests E2E con Supertest
- ✅ Revisar cobertura de tests
- ✅ Identificar casos edge no cubiertos
- ✅ Crear tests de regresión para bugs

**Conocimientos:**
- Jest + ts-jest
- Supertest (E2E)
- Mocking (repositories, services)
- AAA Pattern (Arrange-Act-Assert)
- Test-Driven Development (TDD)
- Cobertura de código

## 🚀 Cómo Usar los Agentes

### Opción 1: Invocación Directa (Recomendada)

Desde Claude Code, simplemente pide que se invoque el agente:

```
"Invoca el agente de arquitectura para diseñar el sistema de órdenes"
```

```
"Usa el agente de desarrollo para implementar el módulo de pagos"
```

```
"Invoca el agente de testing para crear tests del módulo de órdenes"
```

### Opción 2: Usando Task Tool (Avanzado)

Si necesitas más control, el desarrollador puede usar directamente el Task tool:

```typescript
Task(
  subagent_type="arquitecture",
  prompt="Diseña la arquitectura completa para el sistema de notificaciones en tiempo real..."
)
```

## 📋 Workflows Recomendados

### Workflow 1: Nueva Feature Completa

```
1. Arquitecture (Diseño)
   ├─ "Diseña la arquitectura para [feature]"
   └─ Output: Diseño completo + ADRs + Plan

2. Developer (Implementación)
   ├─ "Implementa [feature] según diseño del agente arquitecture"
   └─ Output: Código completo funcional

3. Testing (Validación)
   ├─ "Crea suite completa de tests para [feature]"
   └─ Output: Tests unitarios + integración + E2E

4. Review & Merge
   └─ Code review y merge a main
```

### Workflow 2: Bug Fix

```
1. Testing (Reproducir)
   ├─ "Crea un test que reproduzca el bug [descripción]"
   └─ Output: Test que falla

2. Developer (Arreglar)
   ├─ "Arregla el bug para que el test pase"
   └─ Output: Código corregido

3. Testing (Verificar)
   ├─ "Verifica que el test pasa y agrega tests adicionales"
   └─ Output: Tests de regresión
```

### Workflow 3: Refactoring

```
1. Testing (Cobertura)
   ├─ "Crea tests de regresión para [módulo]"
   └─ Output: Tests que documentan comportamiento actual

2. Arquitecture (Propuesta)
   ├─ "Propón mejoras arquitectónicas para [módulo]"
   └─ Output: Nueva estructura + justificación

3. Developer (Implementar)
   ├─ "Refactoriza [módulo] según nueva arquitectura"
   └─ Output: Código refactorizado

4. Testing (Validar)
   ├─ "Verifica que todos los tests pasan"
   └─ Output: Confirmación de que no hay regresiones
```

## 📝 Ejemplos de Uso

### Ejemplo 1: Implementar Sistema de Órdenes

**Paso 1 - Arquitectura:**
```
Usuario: "Invoca el agente de arquitectura para diseñar el sistema completo
de órdenes/pedidos con integración a PayPal y reducción automática de stock"

Arquitecture Output:
- Diseño de Order.entity y OrderItem.entity
- DTOs (CreateOrderDto, UpdateOrderStatusDto)
- Estructura de OrdersService y OrdersController
- ADRs sobre transacciones y manejo de stock
- Plan de implementación en 5 fases
- Estimación: 4-5 días
```

**Paso 2 - Desarrollo:**
```
Usuario: "Usa el agente de desarrollo para implementar el sistema de órdenes
según el diseño del agente de arquitectura"

Developer Output:
- Entidades completas con relaciones TypeORM
- DTOs con validaciones class-validator
- OrdersService con lógica de transacciones
- OrdersController con endpoints protegidos
- OrdersModule configurado
- Código en: src/orders/
```

**Paso 3 - Testing:**
```
Usuario: "Invoca el agente de testing para crear suite completa de tests
para el módulo de órdenes con 85%+ cobertura"

Testing Output:
- orders.service.spec.ts (tests unitarios, 300+ líneas)
- orders.controller.spec.ts (tests unitarios, 150+ líneas)
- orders.integration.spec.ts (tests de integración)
- orders.e2e-spec.ts (tests E2E del flujo completo)
- Cobertura: 87%
```

### Ejemplo 2: Agregar Campo a Entidad Existente

**Paso 1 - Arquitectura:**
```
Usuario: "El agente de arquitectura debe evaluar si agregar el campo 'brand'
a Product.entity es consistente con la arquitectura actual"

Arquitecture Output:
- ADR-005: Agregar campo brand a Product
- Justificación: Mejora filtrado y categorización
- Cambios necesarios: entity, DTOs, migraciones
- Estimación: 0.5 días
```

**Paso 2 - Desarrollo:**
```
Usuario: "Implementa el campo brand según la decisión del agente de arquitectura"

Developer Output:
- Product.entity actualizado
- CreateProductDto y UpdateProductDto actualizados
- Migración de BD (si aplica)
- Seeder actualizado
```

**Paso 3 - Testing:**
```
Usuario: "Actualiza los tests de productos para incluir el campo brand"

Testing Output:
- Tests actualizados en products.service.spec.ts
- Tests de validación del campo brand
- Todos los tests pasan
```

### Ejemplo 3: Revisar Arquitectura Actual

```
Usuario: "Invoca el agente de arquitectura para revisar la estructura
actual del proyecto e identificar áreas de mejora"

Arquitecture Output:
📊 ANÁLISIS DE ARQUITECTURA ACTUAL

✅ Fortalezas:
- Arquitectura modular bien definida
- Uso correcto de DTOs y validación
- Separación clara de responsabilidades

⚠️ Áreas de Mejora:
1. Falta AdminGuard para rutas admin
2. No hay sistema de roles granular (RBAC)
3. Falta logging estructurado (Winston)
4. No hay caché (Redis)
5. Falta documentación Swagger

🎯 Prioridades:
1. [ALTA] Implementar AdminGuard
2. [ALTA] Sistema de roles (isAdmin field)
3. [MEDIA] Logging con Winston
4. [BAJA] Caché con Redis
5. [BAJA] Documentación Swagger

📝 ADRs Recomendados:
- ADR-006: Sistema de roles y permisos
- ADR-007: Estrategia de logging
- ADR-008: Estrategia de caché
```

## 🎯 Mejores Prácticas

### 1. Orden de Invocación

**Siempre sigue este orden:**
1. 🏛️ **Arquitecture** → Diseña primero
2. 👨‍💻 **Developer** → Implementa después
3. 🧪 **Testing** → Valida al final

**Nunca saltes pasos:**
- ❌ Developer sin diseño de Arquitecture → Código inconsistente
- ❌ Código sin tests de Testing → Falta de calidad
- ❌ Arquitecture sin validación → Diseños no probados

### 2. Comunicación entre Agentes

Los agentes están diseñados para trabajar en conjunto:

```
Arquitecture dice:
"He diseñado el módulo Orders. El agente Developer debe implementar
en este orden: entities → DTOs → service → controller → module"

Developer dice:
"He implementado Orders siguiendo el diseño. El agente Testing
debe crear tests con 85%+ cobertura"

Testing dice:
"He identificado un edge case: ¿qué pasa con órdenes concurrentes
para el último item? Developer debe agregar locking"
```

### 3. Documentación Compartida

Todos los agentes generan documentación:

```
docs/
├── architecture/
│   ├── adrs/
│   │   ├── ADR-001-orders-architecture.md    # Por Arquitecture
│   │   ├── ADR-002-payment-integration.md
│   │   └── ADR-003-stock-management.md
│   └── system-design.md
├── development/
│   ├── implementation-guide.md                # Por Developer
│   └── api-endpoints.md
└── testing/
    ├── testing-strategy.md                    # Por Testing
    └── coverage-report.md
```

### 4. Iteración y Mejora

No tengas miedo de iterar:

```
Usuario: "El diseño del agente de arquitectura es muy complejo,
¿puede simplificarlo?"

Arquitecture: "Entiendo. Propongo arquitectura simplificada
eliminando X y Y, manteniendo solo Z que es crítico"

Usuario: "Perfecto, ahora sí implementa eso"
```

## ⚙️ Configuración de los Agentes

### Variables de Entorno

Los agentes están configurados para trabajar con:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vegan_vita_dev

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d

# Puerto
PORT=3001
```

### Stack Tecnológico

Los agentes tienen conocimiento profundo de:

- **Backend:** NestJS 9.4.3, TypeScript 4.7.4
- **ORM:** TypeORM 0.3.27
- **Base de Datos:** PostgreSQL 16
- **Testing:** Jest 29.5.0, Supertest
- **Validación:** class-validator, class-transformer
- **Auth:** JWT, Passport.js, bcrypt

## 🐛 Troubleshooting

### Problema: "El agente no entiende el contexto del proyecto"

**Solución:** Los agentes tienen contexto del proyecto. Si parece que no,
recuérdales explícitamente:

```
"Recuerda que este es el proyecto Vegan Vita Backend con NestJS + TypeORM + PostgreSQL.
Ya tenemos implementado Auth y Products."
```

### Problema: "El código generado no es consistente con el existente"

**Solución:** Pide al agente que revise código existente primero:

```
"Antes de implementar, revisa cómo está implementado el módulo de Products
en src/products/ y mantén el mismo estilo"
```

### Problema: "Los agentes generan demasiado código de una vez"

**Solución:** Divide en tareas más pequeñas:

```
❌ "Implementa todo el sistema de órdenes"

✅ "Implementa solo las entidades Order y OrderItem"
✅ "Ahora implementa los DTOs"
✅ "Ahora implementa el OrdersService"
```

## 📚 Recursos Adicionales

- **Documentación del Proyecto:** [README.md](../README.md)
- **Análisis Completo:** [ANALISIS_COMPLETO_PROYECTO.md](../ANALISIS_COMPLETO_PROYECTO.md)
- **Guía de Agentes Mejorados:** [AGENTES_MEJORADOS.md](../AGENTES_MEJORADOS.md)

## 🔄 Actualización de Agentes

Los agentes pueden ser actualizados editando los archivos en `.claude/agents/`.

**Para actualizar un agente:**

1. Edita el archivo correspondiente:
   - `.claude/agents/arquitecture.md`
   - `.claude/agents/developer.md`
   - `.claude/agents/testing.md`

2. Los cambios se aplican inmediatamente en la próxima invocación

3. Documenta cambios importantes en este README

## ✅ Checklist de Uso

Antes de invocar un agente, asegúrate de:

**Para Arquitecture:**
- [ ] Tienes claro el requerimiento funcional
- [ ] Conoces las restricciones técnicas
- [ ] Sabes qué módulos existen ya

**Para Developer:**
- [ ] Arquitecture ya diseñó la solución
- [ ] Entiendes el diseño propuesto
- [ ] Tienes las dependencias necesarias instaladas

**Para Testing:**
- [ ] Developer ya implementó el código
- [ ] El código compila sin errores
- [ ] Sabes qué cobertura se espera (mínimo 80%)

---

**Última actualización:** 01 de noviembre de 2025
**Versión:** 1.0
**Mantenedor:** Equipo Vegan Vita

¡Feliz desarrollo con tus agentes especializados! 🚀🌱
