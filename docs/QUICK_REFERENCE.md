# 🚀 Quick Reference Guide

## Cheat Sheet - Comandos más usados

### 🚀 Primeros Pasos

```bash
# Setup inicial (ejecuta una sola vez)
bash .github/setup-cicd.sh

# Ver workflows disponibles
gh workflow list

# Configurar secretos
gh secret set NAME -b "value"

# Ver secretos configurados
gh secret list
```

### 📊 Monitoreo

```bash
# Ver últimos runs
gh run list

# Ver runs de un workflow específico
gh run list --workflow=ci.yml

# Ver logs completos de un run
gh run view <RUN_ID> --log

# Ver status en tiempo real
gh run watch <RUN_ID>

# Cancelar un run
gh run cancel <RUN_ID>

# Re-ejecutar un run fallido
gh run rerun <RUN_ID>
```

### 🔧 Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Tests
pnpm run test              # Tests unitarios
pnpm run test:watch       # Watch mode
pnpm run test:cov         # Con coverage
pnpm run test:e2e         # E2E tests

# Linting
pnpm run lint             # ESLint check
pnpm run format           # Prettier fix

# Build
pnpm run build            # Compilar

# Desarrollo
pnpm run start:dev        # Watch mode
pnpm run start            # Normal

# Docker
docker-compose up -d      # Iniciar BD
docker-compose down       # Detener BD
docker-compose ps         # Ver status
```

### 📤 Git & Commits

```bash
# Crear branch
git checkout -b feature/name

# Commit (con hooks)
git commit -m "feat: description"  # Conventional commits
git commit -m "fix: bug description"
git commit -m "docs: documentation"

# Push
git push origin feature/name

# Crear PR
gh pr create --fill

# Mergear PR
gh pr merge <PR_NUMBER>
```

### 🐳 Docker

```bash
# Build imagen
docker build -t vegan-vita-backend:latest .

# Run container
docker run -p 3001:3001 vegan-vita-backend:latest

# Ver logs
docker logs <CONTAINER_ID>

# Stop container
docker stop <CONTAINER_ID>
```

---

## 📋 Triggers de Workflows

```
Branch: main        → CI + Code Quality + Docker + Production Deploy
Branch: develop     → CI + Code Quality + Docker + Staging Deploy
Tag: v*             → Release + Docker
PR: cualquiera      → CI + Code Quality
Manual:             → Cualquier workflow
Cron:               → Scheduled tasks (diario/semanal)
```

---

## 🔐 Secretos Esenciales

```bash
# Mínimo para empezar:
SLACK_WEBHOOK_URL

# Para staging:
STAGING_SSH_KEY
STAGING_SERVER_HOST
STAGING_SERVER_USER
STAGING_APP_PATH
STAGING_APP_URL

# Para producción:
PRODUCTION_SSH_KEY
PRODUCTION_SERVER_HOST
PRODUCTION_SERVER_USER
PRODUCTION_APP_PATH
PRODUCTION_APP_URL
```

---

## 📊 URLs Importantes

```
GitHub Actions:     https://github.com/EdieAprovita/vegan-vita-backend/actions
Secrets:           https://github.com/EdieAprovita/vegan-vita-backend/settings/secrets/actions
Workflows:         https://github.com/EdieAprovita/vegan-vita-backend/settings/pages
Settings:          https://github.com/EdieAprovita/vegan-vita-backend/settings
Releases:          https://github.com/EdieAprovita/vegan-vita-backend/releases
Codecov:           https://codecov.io/gh/EdieAprovita/vegan-vita-backend
```

---

## 🆘 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Tests fallan | `pnpm run test` local, revisar logs |
| Build falla | `pnpm run build` local, revisar TypeScript |
| Linting falla | `pnpm run lint` local, `pnpm run format` |
| SSH deployment falla | Verificar SSH key: `ssh -i ~/.ssh/key user@host` |
| Pre-commit hooks fallan | Revisar `.husky/pre-commit` |
| Dockerfile falla | `docker build .` local |
| Secrets no encontrados | `gh secret list` - verificar que existen |

---

## 📈 Performance Targets

```
Build time:     < 8 min
Test exec:      < 3 min  
Coverage:       > 80%
Success rate:   > 95%
Deploy time:    < 5 min
```

---

## 🔍 Debugging

```bash
# Ver workflow YAML
gh workflow view ci.yml

# Ver run specific
gh run view <RUN_ID> --json name,conclusion,startedAt,completedAt

# Download logs
gh run download <RUN_ID>

# Listar jobs en un run
gh run view <RUN_ID> --json jobs

# Ver output de un job específico
gh run view <RUN_ID> --json jobs -q '.[] | select(.name=="Build") | .steps'
```

---

## 📝 Commit Types

```
feat:       Nueva funcionalidad
fix:        Corrección de bug
docs:       Cambios en documentación
style:      Cambios de formato (sin cambio de lógica)
refactor:   Refactorización de código
perf:       Mejoras de performance
test:       Agregar/modificar tests
chore:      Cambios en build, deps, etc
ci:         Cambios en CI/CD
build:      Cambios en build
```

---

## 🎯 Workflow de Desarrollo Típico

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... editar archivos

# 3. Run tests locally
pnpm run test
pnpm run test:e2e
pnpm run lint

# 4. Commit (auto-runs pre-commit hooks)
git commit -m "feat: add new feature"

# 5. Push
git push origin feature/new-feature

# 6. Create PR
gh pr create --fill

# 7. Wait for CI to pass ✅
gh run list --workflow=ci.yml

# 8. Merge
gh pr merge <PR_NUMBER>

# 9. See staging deploy 🚀
# Auto-deployed when develop is updated
```

---

## 🚀 Production Release Process

```bash
# 1. Update version in package.json
# 2. Create changelog
# 3. Create tag
git tag v1.0.0

# 4. Push tag
git push origin v1.0.0

# 5. GitHub Release is created automatically
# 6. Docker image is built and pushed
# 7. Manual deployment to production
```

---

## 📌 Useful Aliases

```bash
# Add to ~/.zshrc or ~/.bashrc

alias ghwf="gh workflow list"
alias ghruns="gh run list --limit 5"
alias ghlogs="gh run view \$1 --log"
alias ghsecrets="gh secret list"
alias ghrerun="gh run rerun \$1"

# Usage:
# ghwf
# ghruns
# ghlogs <RUN_ID>
# ghsecrets
# ghrerun <RUN_ID>
```

---

## 🔗 Referencias Rápidas

- **GitHub CLI**: `gh help`
- **GitHub Actions**: https://docs.github.com/en/actions
- **NestJS Docs**: https://docs.nestjs.com
- **Docker Docs**: https://docs.docker.com
- **Conventional Commits**: https://www.conventionalcommits.org

---

## ⏱️ Timing Guide

```
Típico CI run:      8 min (parallelizado)
  ├─ Setup:         1 min
  ├─ Lint:          1 min
  ├─ Build:         2 min
  ├─ Unit tests:    1 min
  ├─ E2E tests:     2 min
  └─ Security:      1 min

Staging deploy:     3-5 min
Production deploy:  5-10 min (+ aprobación)
Release workflow:   3-5 min
```

---

## 📞 When Something Goes Wrong

1. **Check logs:** `gh run view <ID> --log`
2. **Review changes:** `git show <COMMIT>`
3. **Test locally:** `pnpm run test && pnpm run build`
4. **Check secrets:** `gh secret list`
5. **Read docs:** Ver `.github/*.md`
6. **Create issue:** Si es un bug

---

**Last Updated:** 19 Oct 2025  
**Quick Reference v1.0**

