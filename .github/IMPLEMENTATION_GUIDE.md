# Implementation Guide - CI/CD

Este documento proporciona instrucciones paso a paso para implementar el CI/CD en tu repositorio.

## 🎯 Objetivos

- ✅ Automatizar pruebas
- ✅ Asegurar calidad de código
- ✅ Facilitar deployments
- ✅ Monitorizar cambios
- ✅ Notificaciones en tiempo real

---

## 📋 Checklist de Implementación

### Fase 1: Configuración Local (20 min)

- [ ] **1.1 Ejecutar setup script**

  ```bash
  bash .github/setup-cicd.sh
  ```

- [ ] **1.2 Configurar Git hooks**

  ```bash
  # Verificar que los hooks están instalados
  ls -la .husky/

  # Hacer scripts ejecutables
  chmod +x .husky/pre-commit
  chmod +x .husky/commit-msg
  ```

- [ ] **1.3 Prueba local pre-commit**

  ```bash
  # Edita un archivo
  echo "test" > src/test.ts

  # Intenta un commit (debería fallar en linting)
  git add src/test.ts
  git commit -m "test: test file"

  # Limpia
  git reset HEAD src/test.ts
  rm src/test.ts
  ```

### Fase 2: Configuración de Secretos (30 min)

- [ ] **2.1 Crear SSH keys para staging**

  ```bash
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/vegan-vita-staging -C "VeganVita Staging"

  # Copiar clave privada
  cat ~/.ssh/vegan-vita-staging | pbcopy

  # Guardar en GitHub → Settings → Secrets → STAGING_SSH_KEY
  ```

- [ ] **2.2 Crear SSH keys para producción**

  ```bash
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/vegan-vita-prod -C "VeganVita Production"

  # Copiar clave privada
  cat ~/.ssh/vegan-vita-prod | pbcopy

  # Guardar en GitHub → Settings → Secrets → PRODUCTION_SSH_KEY
  ```

- [ ] **2.3 Configurar webhook de Slack**

  1. Ir a https://api.slack.com/apps
  2. Create New App → From scratch
  3. Nombre: "VeganVita Notifications"
  4. Select workspace
  5. Features → Incoming Webhooks → Add New Webhook
  6. Select channel (ej: #deployments)
  7. Copiar Webhook URL
  8. Guardar en GitHub como `SLACK_WEBHOOK_URL`

- [ ] **2.4 Agregar secrets a GitHub**

  ```bash
  gh secret set STAGING_SSH_KEY < ~/.ssh/vegan-vita-staging
  gh secret set STAGING_SERVER_HOST -b "staging.example.com"
  gh secret set STAGING_SERVER_USER -b "deploy"
  gh secret set STAGING_APP_PATH -b "/var/www/vegan-vita"
  gh secret set STAGING_APP_URL -b "https://staging.example.com"

  gh secret set PRODUCTION_SSH_KEY < ~/.ssh/vegan-vita-prod
  gh secret set PRODUCTION_SERVER_HOST -b "prod.example.com"
  gh secret set PRODUCTION_SERVER_USER -b "deploy"
  gh secret set PRODUCTION_APP_PATH -b "/var/www/vegan-vita"
  gh secret set PRODUCTION_APP_URL -b "https://example.com"

  gh secret set SLACK_WEBHOOK_URL -b "https://hooks.slack.com/..."
  ```

- [ ] **2.5 Verificar secrets agregados**
  ```bash
  gh secret list
  ```

### Fase 3: Configuración en GitHub (20 min)

- [ ] **3.1 Habilitar GitHub Pages (opcional)**

  - Settings → Pages
  - Source: Deploy from a branch
  - Branch: main (o gh-pages)

- [ ] **3.2 Proteger rama main**

  - Settings → Branches
  - Add rule → main
  - Require status checks: ✅ CI
  - Require branches to be up to date
  - Dismiss stale PR approvals
  - Require code reviews: 1
  - Restrict who can push: Only admins

- [ ] **3.3 Configurar Dependabot**

  - Ya está configurado en `.github/dependabot.yml`
  - Settings → Code security and analysis
  - Dependabot alerts: ✅ Enable
  - Dependabot security updates: ✅ Enable
  - Dependabot version updates: ✅ Enable

- [ ] **3.4 Configurar Code Scanning (opcional)**
  - Security → Code scanning alerts
  - Set up code scanning

### Fase 4: Pruebas de Workflows (40 min)

- [ ] **4.1 Ejecutar CI localmente**

  ```bash
  # Simular ejecución de tests
  pnpm run lint
  pnpm run build
  pnpm run test
  pnpm run test:e2e
  ```

- [ ] **4.2 Trigger workflow manualmente**

  ```bash
  # Ver workflows disponibles
  gh workflow list

  # Triggerar CI manualmente
  gh workflow run ci.yml

  # Ver status
  gh run list --workflow=ci.yml
  ```

- [ ] **4.3 Verificar logs**

  ```bash
  # Ver últimos runs
  gh run list

  # Ver logs de un run específico
  gh run view <run-id> --log
  ```

- [ ] **4.4 Test de PR (create test branch)**

  ```bash
  # Crear branch de prueba
  git checkout -b feature/test-ci

  # Hacer cambios menores
  echo "// test" >> src/app.service.ts

  # Hacer commit y push
  git add .
  git commit -m "feat: test ci workflow"
  git push origin feature/test-ci

  # Crear PR en GitHub
  gh pr create --fill

  # Verificar que CI corre
  gh pr status

  # Limpiar
  git checkout main
  git branch -D feature/test-ci
  ```

### Fase 5: Configurar Staging Deploy (30 min)

- [ ] **5.1 Preparar servidor staging**

  ```bash
  # En el servidor staging
  ssh deploy@staging.example.com

  # Crear directorio de la app
  mkdir -p /var/www/vegan-vita
  cd /var/www/vegan-vita

  # Clonar repositorio (usar SSH key)
  git clone git@github.com:EdieAprovita/vegan-vita-backend.git .

  # Instalar dependencias
  pnpm install

  # Crear .env
  cp .env.example .env
  # Editar .env con valores de staging
  nano .env
  ```

- [ ] **5.2 Setup systemd service (staging)**

  ```bash
  sudo tee /etc/systemd/system/vegan-vita-backend-staging.service > /dev/null <<EOF
  [Unit]
  Description=VeganVita Backend Staging
  After=network.target

  [Service]
  Type=simple
  User=deploy
  WorkingDirectory=/var/www/vegan-vita
  ExecStart=/usr/bin/node dist/main.js
  Restart=always
  RestartSec=10
  StandardOutput=journal
  StandardError=journal
  Environment="NODE_ENV=staging"

  [Install]
  WantedBy=multi-user.target
  EOF

  sudo systemctl daemon-reload
  sudo systemctl enable vegan-vita-backend-staging
  ```

- [ ] **5.3 Agregar authorized keys**
  ```bash
  # En el servidor staging
  mkdir -p ~/.ssh
  cat >> ~/.ssh/authorized_keys << 'EOF'
  # Pegar contenido de ~/.ssh/vegan-vita-staging.pub
  EOF
  chmod 600 ~/.ssh/authorized_keys
  ```

### Fase 6: Configurar Production Deploy (30 min)

Similar a Fase 5 pero para producción.

- [ ] **6.1 Proteger ambiente de producción**
  - Settings → Environments
  - Crear environment "production"
  - Required reviewers: 1+
  - Deployment branches: main

---

## 🚀 Flujo de Trabajo Típico

### Para Features

```bash
# 1. Crear branch
git checkout -b feature/new-feature

# 2. Hacer cambios
# ... editar archivos

# 3. Commit (pre-commit hooks corren)
git commit -m "feat: add new feature"

# 4. Push
git push origin feature/new-feature

# 5. Crear PR
gh pr create --fill

# 6. Verificar CI ✅
# 7. Solicitar review
# 8. Merge a develop
# 9. Deploy automático a staging
```

### Para Releases

```bash
# 1. Actualizar versión en package.json
# 2. Crear changelog
# 3. Tag con versión
git tag v1.0.0

# 4. Push tag
git push origin v1.0.0

# 5. Workflow release se ejecuta
# 6. GitHub Release creado
# 7. Docker image pushed
```

### Para Hotfixes

```bash
# 1. Crear branch desde main
git checkout -b hotfix/critical-fix

# 2. Fix y test
# ... cambios

# 3. Merge a main y develop
# 4. Tag en main
# 5. Deploy automático a producción
```

---

## 🔍 Monitoreo y Debugging

### Ver estado de CI

```bash
# Último status
gh run list

# Ver logs completos
gh run view <run-id> --log

# Ver step específico
gh run view <run-id> --json jobs

# Cancelar un run
gh run cancel <run-id>

# Re-run un workflow
gh run rerun <run-id>
```

### Debugging de fallas

```bash
# Ver errores específicos
gh run view <run-id> --log | grep -i error

# Re-correr localmente
pnpm run test    # Si falló test
pnpm run build   # Si falló build
pnpm run lint    # Si falló linting
```

---

## 📚 Referencias

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🆘 Troubleshooting

### "SSH key permission denied"

```bash
# Verificar permisos
ls -la ~/.ssh/vegan-vita-prod
chmod 600 ~/.ssh/vegan-vita-prod

# Test conexión
ssh -i ~/.ssh/vegan-vita-prod deploy@prod.example.com
```

### "Tests failing in CI but passing locally"

```bash
# Usar mismo entorno que CI
docker-compose up -d
export DB_HOST=localhost
pnpm run test:e2e
```

### "Deployment stuck"

```bash
# Ver logs del servidor
ssh deploy@prod.example.com
systemctl status vegan-vita-backend-staging
journalctl -u vegan-vita-backend-staging -f
```

---

**¿Necesitas ayuda?** Crea una issue en GitHub o contacta directamente.
