# Getting Started with ForexElite Pro
**From zero to running in 30 minutes**

---

## What You're Building

ForexElite Pro is an **institutional-grade trading platform** with:

**Canonical Architecture:**
- TradingView Broker Integration API (official, not webhooks)
- FIX Protocol 4.4 (industry standard for 20+ years)
- Microservices (scalable, distributed)

**Key Features:**
- Multi-broker support (OANDA, Interactive Brokers, any FIX broker)
- Real-time market data streaming (<100ms latency)
- Enterprise-grade risk management (pre-trade checks)
- Production-ready deployment (AWS, monitoring)

**Why Canonical?**
- Industry standards (FIX, TradingView API)
- Scalable architecture (microservices)
- Production-grade (monitoring, logging, deployment)

---

## Step 1: Install Prerequisites (10 minutes)

### Windows

**Node.js:**
1. Download from https://nodejs.org/ (LTS version)
2. Run installer
3. Restart terminal
4. Verify: `node --version`

**Python:**
1. Download from https://www.python.org/ (3.11+)
2. Run installer (check "Add to PATH")
3. Restart terminal
4. Verify: `python --version`

**PostgreSQL:**
```powershell
# Using Chocolatey
choco install postgresql

# Or download from https://www.postgresql.org/download/windows/
```

**Redis:**
```powershell
# Using Docker (recommended)
docker run -d -p 6379:6379 redis:7

# Or install Redis for Windows
```

### macOS

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install all prerequisites
brew install node python@3.11 postgresql redis

# Start services
brew services start postgresql
brew services start redis
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server
```

---

## Step 2: Clone and Setup (5 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/forexelite-pro.git
cd forexelite-pro

# Run automated setup
.\setup.ps1  # Windows PowerShell
./setup.sh   # macOS/Linux
```

**What this does:**
- Creates Next.js frontend
- Sets up Python virtual environment
- Installs all dependencies
- Creates directory structure
- Generates configuration files

---

## Step 3: Configure Environment (5 minutes)

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your favorite editor
code .env.local  # VS Code
nano .env.local  # Terminal
```

**Required API Keys:**

### OANDA (Free Practice Account)
1. Go to https://www.oanda.com/
2. Create practice account
3. Generate API token: Account → Manage API Access
4. Copy to `.env.local`:
```bash
OANDA_API_KEY=your_key_here
OANDA_ACCOUNT_ID=your_account_id
OANDA_ENV=practice
```

### Supabase (Free Tier)
1. Go to https://supabase.com/dashboard
2. Create new project
3. Copy credentials to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Upstash Redis (Free Tier)
1. Go to https://console.upstash.com/
2. Create new database
3. Copy credentials to `.env.local`:
```bash
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

---

## Step 4: Database Setup (5 minutes)

```bash
# Start PostgreSQL (if not running)
# Windows: Check Services
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
createdb forexelite_pro

# Run migrations
cd services/trading
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install alembic psycopg2-binary
alembic upgrade head
```

**Or use Supabase:**
1. Open Supabase dashboard
2. Go to SQL Editor
3. Copy SQL from `DATABASE_SETUP.md`
4. Run each section

---

## Step 5: Start Development (5 minutes)

### Terminal 1: Frontend
```bash
cd frontend
npm run dev
```
Open http://localhost:3000

### Terminal 2: Trading Service
```bash
cd services/trading
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
API at http://localhost:8000

### Terminal 3: Market Data Service
```bash
cd services/market-data
source venv/bin/activate
uvicorn app.main:app --reload --port 8001
```
WebSocket at ws://localhost:8001

---

## Step 6: Verify Installation

### Check Frontend
1. Open http://localhost:3000
2. You should see the ForexElite Pro dashboard
3. Check browser console for errors

### Check API
```bash
# Test TradingView API
curl http://localhost:8000/api/v1/symbols

# Expected response:
# {"symbols": [{"symbol": "EURUSD", ...}]}
```

### Check WebSocket
```javascript
// Open browser console on http://localhost:3000
const ws = new WebSocket('ws://localhost:8001/ws/prices');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
// Should see price updates
```

---

## What's Next?

### Week 1: Learn the Basics
- Read `specs/12_CANONICAL_ARCHITECTURE.md`
- Explore the codebase
- Run example trades on OANDA practice account

### Week 2: Implement Features
- Follow `specs/13_IMPLEMENTATION_ROADMAP.md`
- Start with TradingView API endpoints
- Add your first broker adapter

### Week 3: Deploy to Production
- Set up AWS account
- Follow deployment guide
- Configure monitoring

---

## Troubleshooting

### "node is not recognized"
- Restart terminal after installing Node.js
- Check PATH: `echo $PATH` (macOS/Linux) or `$env:PATH` (Windows)

### "python is not recognized"
- Restart terminal after installing Python
- Try `python3` instead of `python`

### "PostgreSQL connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env.local`
- Check port 5432 is not in use

### "Redis connection failed"
- Check Redis is running: `redis-cli ping`
- Should return "PONG"
- Check port 6379 is not in use

### "npm install" fails
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

---

## Quick Commands

```bash
# Start all services (Docker Compose)
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Run tests
pytest

# Format code
black .
isort .

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `GETTING_STARTED.md` | This file |
| `IMPLEMENTATION_CHECKLIST.md` | Quick reference |
| `specs/12_CANONICAL_ARCHITECTURE.md` | Architecture |
| `specs/13_IMPLEMENTATION_ROADMAP.md` | 8-week plan |
| `DATABASE_SETUP.md` | Database schema |

---

## Support

- **Documentation:** `specs/` directory
- **Issues:** GitHub Issues
- **Community:** Discord (coming soon)
- **Email:** support@forexelite.pro

---

## Success Checklist

- [ ] Node.js installed and verified
- [ ] Python installed and verified
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Frontend running on :3000
- [ ] API running on :8000
- [ ] WebSocket running on :8001
- [ ] No console errors
- [ ] Can see price updates

---

**You're ready to build!** 🚀

Start with `specs/13_IMPLEMENTATION_ROADMAP.md` Week 1 tasks.

---

*ForexElite Pro Getting Started · v1.0 · February 2026*