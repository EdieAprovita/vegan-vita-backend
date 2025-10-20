# CI/CD Pipeline Documentation

## 📋 Descripción General

VeganVita Backend cuenta con un sistema CI/CD completo y modular usando **GitHub Actions**. El pipeline automatiza pruebas, quality checks, builds, y deployments.

---

## 🔄 Workflows Incluidos

### 1. **CI Pipeline** (`ci.yml`)
**Evento:** Push a `main`/`develop` o Pull Request

Ejecuta en paralelo:
- ✅ **Setup & Cache** - Instalación de dependencias con caché
- ✅ **Linting** - ESLint + Prettier
- ✅ **Build** - Compilación TypeScript
- ✅ **Unit Tests** - Tests con coverage
- ✅ **E2E Tests** - Tests de integración con PostgreSQL
- ✅ **Security** - Auditoría de dependencias
- ✅ **Status Report** - Resumen de estado

**Tiempo estimado:** 5-10 minutos

---

### 2. **Code Quality** (`code-quality.yml`)
**Evento:** Push a `main`/`develop` o Pull Request

- 🔍 **SonarQube Analysis** - Análisis estático de código
- 📊 **Complexity Check** - Evaluación de complejidad
- 📝 **TypeScript Type Check** - Validación de tipos
- 📜 **License Compliance** - Verificación de licencias

---

### 3. **Docker Build** (`docker-build.yml`)
**Evento:** Push a `main` o Tags

- 🐳 Construye imagen Docker
- 📦 Push a GitHub Container Registry (GHCR)
- 🏷️ Tagging automático (latest, version, sha)
- 💾 Caché de buildx

---

### 4. **Deploy Staging** (`deploy-staging.yml`)
**Evento:** Push a `develop`

- 🧪 Pruebas previas
- 📦 Build de la aplicación
- 🚀 Deploy SSH al servidor de staging
- ❤️ Health check
- 🔔 Notificación Slack

---

### 5. **Deploy Production** (`deploy-production.yml`)
**Evento:** Push a `main` (manual desde `gh workflow run`)

**Requiere:**
- Todas las pruebas pasen
- Aprobación manual (environment protection)

**Pasos:**
1. Pre-deployment checks (tests, lint, build)
2. Build y push Docker image
3. Deploy SSH a producción
4. Health checks
5. Validación de endpoints
6. Notificaciones Slack

---

### 6. **Release Management** (`release.yml`)
**Evento:** Push de tag `v*` o manual

- 🏷️ Crea GitHub Release
- 📝 Genera changelog automático
- 📚 Documentación
- 📦 Publicación (npm si aplica)

---

### 7. **Scheduled Tasks** (`scheduled-tasks.yml`)
**Evento:** Cron (diario a 2 AM, semanal Monday a 8 AM)

- 📦 Check de actualizaciones
- 🔒 Auditoría de seguridad
- 🧹 Limpieza de artifacts
- 🗄️ Health check base de datos
- 📊 Análisis de performance
- 🤖 Auto-create PRs para actualizaciones

---

## 📊 Estado de Branches

| Branch | Evento | Workflow | Descripción |
|--------|--------|----------|-------------|
| `main` | Push | CI + Code Quality + Docker + Production Deploy | Rama de producción |
| `develop` | Push | CI + Code Quality + Docker + Staging Deploy | Rama de desarrollo |
| `feature/*` | PR | CI + Code Quality | Branches de features |
| `v*` | Tag | Release + Docker | Liberación de versiones |

---

## 🔑 Configuración Requerida

### Secrets a Configurar

1. **Básico (Recomendado):**
   ```
   SLACK_WEBHOOK_URL - Notificaciones
   ```

2. **Staging (Opcional):**
   ```
   STAGING_SSH_KEY
   STAGING_SERVER_HOST
   STAGING_SERVER_USER
   STAGING_APP_PATH
   STAGING_APP_URL
   ```

3. **Production (Recomendado):**
   ```
   PRODUCTION_SSH_KEY
   PRODUCTION_SERVER_HOST
   PRODUCTION_SERVER_USER
   PRODUCTION_APP_PATH
   PRODUCTION_APP_URL
   ```

Ver `.github/SECRETS.md` para detalles completos.

---

## 📈 Métricas y Monitoreo

### Coverage de Tests
- Reportes enviados a Codecov
- Badge visible en README
- Histórico de cobertura

### Build Artifacts
- Retenidos por 1 día
- Almacenamiento optimizado

### Performance
- Tiempo de build cacheado
- Paralelización automática
- Output de tamaño de bundle

---

## 🚀 Cómo Usar

### Triggering Manual de Workflows

```bash
# Deploy a staging
gh workflow run deploy-staging.yml

# Deploy a producción
gh workflow run deploy-production.yml

# Release con versión específica
gh workflow run release.yml -f version=v1.0.0

# Scheduled tasks
gh workflow run scheduled-tasks.yml
```

### Monitoreo

```bash
# Ver estado de workflows
gh workflow list

# Ver runs de un workflow
gh workflow view ci.yml --json status,conclusion,createdAt

# Ver logs de un run específico
gh run view <run-id> --log
```

### Debugging

```bash
# Ver workflow file
gh workflow view ci.yml

# Listar runs activos
gh run list --status in_progress

# Cancelar un run
gh run cancel <run-id>
```

---

## 🐛 Troubleshooting

### Tests fallan localmente pero pasan en CI

```bash
# Limpiar cache local
rm -rf node_modules
pnpm install --frozen-lockfile

# Ejecutar con mismo entorno que CI
docker-compose up -d
pnpm run test:e2e
```

### Build Docker falla en CI

- Verificar `.dockerignore`
- Revisar permisos de archivos
- Aumentar timeout en buildx

### Deploy SSH falla

```bash
# Verificar SSH key
ssh -i ~/.ssh/vegan-vita-deploy -T git@github.com

# Test conexión al servidor
ssh -i ~/.ssh/vegan-vita-deploy user@staging.example.com
```

---

## 📚 Archivos Relacionados

- `docker-compose.yml` - Stack local de desarrollo
- `Dockerfile` - Imagen Docker multistage
- `.github/workflows/` - Definiciones de workflows
- `.github/SECRETS.md` - Guía de secretos
- `package.json` - Scripts disponibles

---

## 📞 Support

- Issues: Abre un issue en GitHub
- Documentación: Ver README.md
- Preguntas: Contacto en README.md

