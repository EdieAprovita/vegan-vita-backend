#!/bin/bash

# Setup script for CI/CD configuration
# Run: bash .github/setup-cicd.sh

set -e

echo "🚀 VeganVita Backend - CI/CD Setup"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if husky is installed
if ! command -v husky &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Husky...${NC}"
    pnpm add -D husky
    npx husky install
fi

# Setup git hooks
echo -e "${YELLOW}🔧 Setting up Git hooks...${NC}"

# Make scripts executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

echo -e "${GREEN}✅ Git hooks configured${NC}"
echo ""

# Create directories if they don't exist
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE
mkdir -p dist
mkdir -p coverage

echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Install additional dev dependencies
echo -e "${YELLOW}📦 Installing development dependencies...${NC}"

PACKAGES_TO_INSTALL=(
    "husky"
    "lint-staged"
    "commitlint"
    "@commitlint/config-conventional"
)

for package in "${PACKAGES_TO_INSTALL[@]}"; do
    if ! pnpm list "$package" > /dev/null 2>&1; then
        echo "Installing $package..."
        pnpm add -D "$package"
    else
        echo "✅ $package already installed"
    fi
done

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Create .lintstagedrc.json
echo -e "${YELLOW}📝 Creating lint-staged config...${NC}"

cat > .lintstagedrc.json << 'EOF'
{
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.json": [
    "prettier --write"
  ],
  "*.md": [
    "prettier --write"
  ]
}
EOF

echo -e "${GREEN}✅ Lint-staged configured${NC}"
echo ""

# Create commitlint config
echo -e "${YELLOW}📝 Creating commitlint config...${NC}"

cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert',
        'security'
      ]
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-empty': [2, 'never'],
    'subject-period': [2, 'never']
  }
};
EOF

echo -e "${GREEN}✅ Commitlint configured${NC}"
echo ""

# Create .env.example if it doesn't exist
if [ ! -f .env.example ]; then
    echo -e "${YELLOW}📝 Creating .env.example...${NC}"
    
    cat > .env.example << 'EOF'
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

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Email (for future use)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=

# Stripe (for future use)
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=
EOF

    echo -e "${GREEN}✅ .env.example created${NC}"
    echo -e "${YELLOW}⚠️  Copy .env.example to .env and configure your values${NC}"
fi
echo ""

# Print summary
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CI/CD Setup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Copy .env.example to .env"
echo "   cp .env.example .env"
echo ""
echo "2. Update .env with your configuration"
echo ""
echo "3. Start Docker Compose"
echo "   docker-compose up -d"
echo ""
echo "4. Run tests locally"
echo "   pnpm run test"
echo "   pnpm run test:e2e"
echo ""
echo "5. Configure GitHub secrets"
echo "   See .github/SECRETS.md for details"
echo ""
echo "6. Push to GitHub"
echo "   git add ."
echo "   git commit -m 'chore: add ci/cd configuration'"
echo "   git push origin main"
echo ""

echo -e "${YELLOW}📚 Documentation:${NC}"
echo "- CI/CD Info: .github/CI-CD.md"
echo "- Secrets Setup: .github/SECRETS.md"
echo "- Code Analysis: CODE_ANALYSIS.md"
echo ""

echo -e "${GREEN}Happy coding! 🎉${NC}"
