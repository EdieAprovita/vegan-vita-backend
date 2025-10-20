# GitHub Actions Secrets Setup Guide

Este documento describe los secretos necesarios para los workflows de CI/CD.

## 🔐 Secrets Requeridos por Workflow

### 1. Workflow: CI (ci.yml)

**No requiere secretos especiales** - Usa acceso público

### 2. Workflow: Docker Build (docker-build.yml)

**No requiere secretos adicionales** - Usa `GITHUB_TOKEN` automático

### 3. Workflow: Code Quality (code-quality.yml)

**Opcional para SonarQube:**

```
SONAR_HOST_URL       - URL del servidor SonarQube
SONAR_TOKEN          - Token de autenticación SonarQube
```

### 4. Workflow: Deploy Staging (deploy-staging.yml)

```
STAGING_SSH_KEY                - Clave privada SSH para servidor staging
STAGING_SERVER_HOST            - Host del servidor (ej: staging.example.com)
STAGING_SERVER_USER            - Usuario SSH (ej: deploy)
STAGING_APP_PATH               - Ruta de la aplicación en el servidor
STAGING_APP_URL                - URL de la aplicación (ej: https://staging.example.com)
SLACK_WEBHOOK_URL              - Webhook de Slack para notificaciones
```

### 5. Workflow: Deploy Production (deploy-production.yml)

```
PRODUCTION_SSH_KEY             - Clave privada SSH para servidor producción
PRODUCTION_SERVER_HOST         - Host del servidor
PRODUCTION_SERVER_USER         - Usuario SSH
PRODUCTION_APP_PATH            - Ruta de la aplicación
PRODUCTION_APP_URL             - URL de producción
SLACK_WEBHOOK_URL              - Webhook de Slack
```

### 6. Workflow: Release (release.yml)

```
SLACK_WEBHOOK_URL              - Webhook de Slack para notificaciones
```

### 7. Workflow: Scheduled Tasks (scheduled-tasks.yml)

```
SLACK_WEBHOOK_URL              - Webhook de Slack para notificaciones
```

---

## 📝 Instrucciones para Configurar Secrets

### En GitHub:

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click en "New repository secret"
4. Ingresa el nombre del secret y su valor
5. Click "Add secret"

### Ejemplo de SSH Key:

```bash
# Generar clave SSH para deploy (si no tienes una)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/vegan-vita-deploy

# Copiar la clave privada (contenido completo)
cat ~/.ssh/vegan-vita-deploy | pbcopy

# En GitHub, pegalo en el secret PRODUCTION_SSH_KEY
```

### Ejemplo de Slack Webhook:

1. Ve a tu workspace de Slack
2. Crea una aplicación en https://api.slack.com/apps
3. Activa "Incoming Webhooks"
4. Crea un nuevo webhook y copia la URL
5. Guárdalo en el secret SLACK_WEBHOOK_URL

---

## 🔍 Verificar Secrets Configurados

```bash
# Listar secrets (sin mostrar valores)
gh secret list
```

---

## ⚠️ Seguridad

- **Nunca** commits secrets en el código
- Usa `.env` para desarrollo local
- Rota keys regularmente
- Revoca keys si se comprometen
- Limita permisos SSH a directorios específicos

---

## 🚀 Variables Útiles (No-Secreto)

Para variables públicas, usa `Settings → Variables → Actions`:

```
NODE_VERSION=20
PNPM_VERSION=10
APP_NAME=vegan-vita-backend
```

Acceso en workflows:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ vars.NODE_VERSION }}
```

---

## ✅ Checklist de Configuración

- [ ] SSH Keys generadas y configuradas
- [ ] Secrets básicos (SLACK_WEBHOOK_URL) añadidos
- [ ] Staging secrets configurados
- [ ] Production secrets configurados
- [ ] Permisos SSH limitados en servidores
- [ ] Prueba manual del flujo de deploy en staging
- [ ] Backup de SSH keys en lugar seguro
- [ ] Documentación actualizada con URLs reales
