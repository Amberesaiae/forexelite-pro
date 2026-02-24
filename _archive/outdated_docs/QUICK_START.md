# ForexElite Pro - Quick Start Checklist
**Get from zero to running in 30 minutes**

---

## ✅ Prerequisites (10 minutes)

### 1. Install Node.js
- [ ] Download from https://nodejs.org/ (LTS version)
- [ ] Run installer
- [ ] Restart terminal
- [ ] Verify: `node --version` (should show v20+)

### 2. Install Git (Optional but recommended)
- [ ] Download from https://git-scm.com/
- [ ] Run installer
- [ ] Verify: `git --version`

---

## ✅ Project Setup (10 minutes)

### 3. Run Automated Setup
```powershell
# Navigate to project directory
cd C:\path\to\forexelite-pro

# Run setup script
.\setup.ps1
```

**What this does:**
- ✅ Creates Next.js project
- ✅ Installs all dependencies
- ✅ Creates directory structure
- ✅ Sets up configuration files
- ✅ Creates .env.local template

### 4. Get API Keys

#### Supabase (5 min)
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Copy these to `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### OANDA (3 min)
- [ ] Go to https://www.oanda.com/
- [ ] Create practice account (free)
- [ ] Go to: Account → Manage API Access → Generate Token
- [ ] Copy these to `.env.local`:
  - `OANDA_API_KEY`
  - `OANDA_ACCOUNT_ID`

#### Upstash Redis (2 min)
- [ ] Go to https://console.upstash.com/
- [ ] Create new database (free tier)
- [ ] Copy these to `.env.local`:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

---

## ✅ Database Setup (5 minutes)

### 5. Run Database Migrations
- [ ] Open Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Copy SQL from `DATABASE_SETUP.md`
- [ ] Run each section in order:
  1. Enable extensions
  2. instrument_config table
  3. profiles table
  4. user_settings table
  5. user_strategies table
  6. signals table

---

## ✅ Launch (5 minutes)

### 6. Start Development Server
```bash
cd forexelite-pro
npm run dev
```

### 7. Open Browser
- [ ] Go to http://localhost:3000
- [ ] You should see Next.js welcome page

### 8. Verify Setup
- [ ] No console errors
- [ ] Page loads successfully
- [ ] Hot reload works (edit a file and see changes)

---

## 🎯 What You Have Now

```
✅ Next.js 14 with App Router
✅ TypeScript with strict mode
✅ Tailwind CSS with ForexElite design tokens
✅ Zustand for state management
✅ TanStack Query for server state
✅ Supabase for database & auth
✅ OANDA for price data
✅ Upstash Redis for rate limiting
✅ Lightweight Charts ready to integrate
✅ Complete directory structure
✅ All dependencies installed
```

---

## 📚 Next Steps

### Sprint 1 - Foundation (Week 1)
Follow `specs/06_SPRINT_PLAN.md` Section §1:

**Day 1-2: Auth & Onboarding**
- [ ] Implement Supabase Auth
- [ ] Create onboarding modal
- [ ] Set up auth guards

**Day 3-4: Price Ticker**
- [ ] Create `/api/prices` SSE route
- [ ] Build TickerBar component
- [ ] Connect to OANDA

**Day 5: Testing & Deploy**
- [ ] Test all features
- [ ] Deploy to Vercel
- [ ] Verify production works

---

## 🆘 Troubleshooting

### "node is not recognized"
```powershell
# Restart PowerShell after installing Node.js
# Or add to PATH manually
```

### "npm install" fails
```powershell
# Clear cache and retry
npm cache clean --force
rm -r node_modules
rm package-lock.json
npm install
```

### Port 3000 in use
```powershell
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Supabase connection fails
- Check `.env.local` has correct keys
- Verify Supabase project is active
- Check no typos in environment variable names

### OANDA API errors
- Verify API key is valid
- Check account ID is correct
- Ensure `OANDA_ENV=practice` for practice account

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| `SETUP_GUIDE.md` | Detailed setup instructions |
| `DATABASE_SETUP.md` | Database schema & SQL |
| `specs/06_SPRINT_PLAN.md` | 6-sprint implementation plan |
| `specs/04_TECHNICAL_PLAN.md` | Tech stack details |
| `specs/08_TRADINGVIEW_INTEGRATION.md` | Chart integration |

---

## 🎓 Learning Resources

### Next.js
- Docs: https://nextjs.org/docs
- Learn: https://nextjs.org/learn

### Supabase
- Docs: https://supabase.com/docs
- Auth: https://supabase.com/docs/guides/auth

### Lightweight Charts
- Docs: https://tradingview.github.io/lightweight-charts/
- Examples: https://tradingview.github.io/lightweight-charts/tutorials/

### OANDA API
- Docs: https://developer.oanda.com/rest-live-v20/introduction/
- Practice account: https://www.oanda.com/demo-account/

---

## ✨ Success Criteria

You're ready to start building when:

- [x] `npm run dev` starts without errors
- [x] http://localhost:3000 loads
- [x] `.env.local` has all API keys
- [x] Database tables created in Supabase
- [x] No console errors in browser
- [x] Hot reload works

---

## 🚀 Ready to Build!

You now have:
- ✅ Complete development environment
- ✅ All dependencies installed
- ✅ Database schema ready
- ✅ API keys configured
- ✅ Project structure in place

**Start with Sprint 1 in `specs/06_SPRINT_PLAN.md`**

Happy coding! 🎉

---

*ForexElite Pro Quick Start · v1.0 · February 2026*
