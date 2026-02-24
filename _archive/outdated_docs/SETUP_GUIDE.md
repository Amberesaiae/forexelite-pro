# ForexElite Pro - Complete Setup Guide
**From Zero to Running Project**

---

## Prerequisites Installation

### 1. Install Node.js (Required)

**Windows:**
1. Download Node.js LTS from: https://nodejs.org/
2. Run the installer (node-v20.x.x-x64.msi)
3. Follow installation wizard (accept defaults)
4. Restart your terminal/PowerShell

**Verify Installation:**
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

### 2. Install Git (Required)

**Windows:**
1. Download from: https://git-scm.com/download/win
2. Run installer
3. Use default settings

**Verify:**
```bash
git --version
```

---

## Project Initialization

### Step 1: Create Next.js Project

```bash
# Navigate to your projects directory
cd C:\projects  # or wherever you want the project

# Create Next.js app with TypeScript
npx create-next-app@latest forexelite-pro --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Navigate into project
cd forexelite-pro
```

**When prompted, choose:**
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ `src/` directory: No
- ✅ App Router: Yes
- ✅ Import alias: Yes (@/*)

### Step 2: Install Core Dependencies

```bash
# State Management
npm install zustand @tanstack/react-query

# Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Validation
npm install zod

# Charts
npm install lightweight-charts

# Utilities
npm install clsx date-fns

# Dev Dependencies
npm install --save-dev @types/node @types/react @types/react-dom
```

### Step 3: Install Development Tools

```bash
# Testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react

# Prettier
npm install --save-dev prettier prettier-plugin-tailwindcss

# TypeScript types
npm install --save-dev @types/lightweight-charts
```

---

## Project Structure Setup

Run this script to create the directory structure:

```bash
# Create directories
mkdir -p app/api/prices app/api/signals app/api/lot-calc app/api/candles app/api/generate-ea
mkdir -p app/dashboard/signals app/dashboard/library app/dashboard/calculator app/dashboard/ea app/dashboard/broker
mkdir -p app/(auth)/login app/(auth)/onboarding
mkdir -p components/nav components/ticker components/signal components/risk components/library components/charts components/ea components/session components/broker components/ui
mkdir -p lib/broker lib/signals/indicators lib/charts lib/ea lib/db
mkdir -p store hooks types
mkdir -p public/fonts
```

---

## Configuration Files

### 1. TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2. Tailwind Config (tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C97A',
          dim: '#7A6130',
        },
        bg: {
          deep: '#04080F',
          card: '#080E1A',
          panel: '#0C1424',
          border: '#141E30',
        },
        text: {
          primary: '#EEF2FF',
          secondary: '#8899BB',
          dim: '#445577',
        },
        signal: {
          buy: '#00E5A0',
          'buy-dim': '#00704E',
          sell: '#FF4560',
          'sell-dim': '#7A1F2E',
        },
        blue: {
          DEFAULT: '#3D85FF',
          dim: '#1A3A7A',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
```

### 3. Next.js Config (next.config.ts)

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
```

### 4. Environment Variables (.env.local)

```bash
# Create .env.local file
cat > .env.local << 'EOF'
# Supabase (Get from https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OANDA v20 (Get from https://www.oanda.com/account/tpa/personal_token)
OANDA_API_KEY=your_oanda_api_key
OANDA_ACCOUNT_ID=your_oanda_account_id
OANDA_ENV=practice

# Upstash Redis (Get from https://console.upstash.com/)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Optional - MetaAPI (Phase 2)
METAAPI_TOKEN=stub
METAAPI_ACCOUNT_ID=stub
EOF
```

### 5. .gitignore

```bash
# Add to .gitignore
cat >> .gitignore << 'EOF'

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.db-journal

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF
```

### 6. Prettier Config (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## Service Setup

### 1. Supabase Setup

1. Go to https://supabase.com/dashboard
2. Create new project
3. Copy URL and keys to `.env.local`
4. Run database migrations (see `DATABASE_SETUP.md`)

### 2. OANDA Setup

1. Go to https://www.oanda.com/
2. Create practice account (free)
3. Generate API token: Account → Manage API Access
4. Copy token and account ID to `.env.local`

### 3. Upstash Redis Setup

1. Go to https://console.upstash.com/
2. Create new database (free tier)
3. Copy REST URL and token to `.env.local`

---

## Running the Project

### Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Build for Production

```bash
npm run build
npm start
```

### Run Tests

```bash
npm run test
```

### Lint Code

```bash
npm run lint
```

---

## Verification Checklist

- [ ] Node.js installed (v20+)
- [ ] npm installed (v10+)
- [ ] Git installed
- [ ] Project created with create-next-app
- [ ] All dependencies installed
- [ ] Directory structure created
- [ ] Configuration files in place
- [ ] .env.local created with keys
- [ ] Supabase project created
- [ ] OANDA practice account created
- [ ] Upstash Redis database created
- [ ] Development server runs successfully

---

## Troubleshooting

### "node is not recognized"
- Install Node.js from nodejs.org
- Restart terminal after installation

### "npm install" fails
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json
- Run `npm install` again

### Port 3000 already in use
- Kill process: `npx kill-port 3000`
- Or use different port: `npm run dev -- -p 3001`

### Supabase connection fails
- Check .env.local has correct keys
- Verify Supabase project is active
- Check network/firewall settings

---

## Next Steps

After setup is complete:

1. Review specs in `specs/` directory
2. Follow Sprint 1 implementation guide
3. Set up database schema (see `DATABASE_SETUP.md`)
4. Start building features

---

*ForexElite Pro Setup Guide · v1.0 · February 2026*
