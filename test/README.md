# E2E Tests Setup Guide

## Configuración de Base de Datos de Pruebas

Los tests E2E requieren una base de datos PostgreSQL **separada** para evitar conflictos con tu base de datos de desarrollo.

### 1. Crear Base de Datos de Pruebas

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos de pruebas
CREATE DATABASE vegan_vita_test;

# Salir de psql
\q
```

### 2. Configurar Variables de Entorno (Solo para desarrollo local)

```bash
# Copiar el archivo de ejemplo
cp .env.test.example .env.test
```

El archivo `.env.test` está configurado con los valores correctos. **No necesitas modificarlo** a menos que uses credenciales diferentes de PostgreSQL.

**IMPORTANTE**: 
- En **desarrollo local**: Los tests usan el archivo `.env.test`
- En **CI/CD**: Las variables de entorno se pasan directamente en el workflow
- El `JWT_SECRET` debe ser `vegan-vita-super-secret-key` para que coincida con el default del código

### 3. Ejecutar los Tests E2E

```bash
# Ejecutar todos los tests E2E
pnpm run test:e2e

# Ejecutar un archivo específico
pnpm run test:e2e -- test/orders.e2e-spec.ts
```

## Problemas Comunes

### Error: "duplicate key value violates unique constraint"

**Causa**: La base de datos de pruebas tiene datos residuales o esquema inconsistente.

**Solución**: Eliminar y recrear la base de datos:

```bash
psql -U postgres
DROP DATABASE vegan_vita_test;
CREATE DATABASE vegan_vita_test;
\q
```

### Error 401 "Unauthorized" en todos los tests

**Causa**: El `JWT_SECRET` en `.env.test` no coincide con el del código.

**Solución**: Verificar que `.env.test` tiene:
```env
JWT_SECRET=vegan-vita-super-secret-key
```

### La base de datos no se limpia entre tests

Los tests tienen `beforeAll` y `afterAll` hooks que limpian la base de datos automáticamente. Si esto falla, puedes limpiar manualmente:

```bash
psql -U postgres -d vegan_vita_test
TRUNCATE users, categories, products, orders, order_items, reviews CASCADE;
\q
```

## Estructura de los Tests

```
test/
├── app.e2e-spec.ts       # Tests básicos de la aplicación
├── orders.e2e-spec.ts    # Tests del sistema de órdenes (22 tests)
├── jest-e2e.json         # Configuración de Jest para E2E
├── setup-e2e.ts          # Setup que carga .env.test
└── README.md             # Este archivo
```

## CI/CD con GitHub Actions

En CI/CD, la base de datos se configura automáticamente con PostgreSQL service. Ver `.github/workflows/*.yml` para la configuración.

## Notas Importantes

1. **No usar la base de datos de desarrollo** para tests E2E
2. **Los tests son independientes**: Cada test limpia y crea sus propios datos
3. **Emails en tests**: Se usa configuración mock de SMTP para no enviar emails reales
4. **Transacciones**: Los tests usan transacciones reales de la base de datos

## Coverage

Los tests E2E complementan los tests unitarios (94 tests pasando). Para ver el coverage completo:

```bash
# Tests unitarios con coverage
pnpm run test:cov

# Tests E2E
pnpm run test:e2e
```
