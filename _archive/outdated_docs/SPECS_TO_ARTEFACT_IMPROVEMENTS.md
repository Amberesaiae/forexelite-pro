# Specs Features That Would Improve the Artefact

## Features in Specs BUT Missing from Artefact

### 1. **Onboarding Flow** ⭐ CRITICAL
**Specs:** Detailed 2-step onboarding (Core Flows, Flow 0)
- Step 1: Connect brokers (OANDA, MT5 Agent, MetaApi)
- Step 2: Risk preferences + trading disclaimer
- Progress indicator
- Validation feedback

**Artefact:** No onboarding UI at all
- Goes straight from login to dashboard
- No broker connection setup
- No disclaimer acceptance

**Why it improves artefact:**
- Users need to connect brokers before trading
- Legal requirement (disclaimer)
- Better UX (guided setup vs confusion)

**What to add to artefact:**
```html
<!-- Onboarding Page -->
<div class="onboarding-container">
  <div class="progress-bar">Step 1 of 2</div>
  
  <!-- Step 1: Connect Brokers -->
  <div class="broker-setup">
    <h2>Connect Your Brokers</h2>
    <div class="broker-cards">
      <div class="broker-card">
        <h3>OANDA</h3>
        <input placeholder="API Key" />
        <input placeholder="Account ID" />
        <select><option>Practice</option><option>Live</option></select>
      </div>
      <div class="broker-card">
        <h3>MT5 Agent</h3>
        <button>Download Agent</button>
        <input placeholder="Pairing Code" />
      </div>
    </div>
    <button class="next-btn">Verify & Continue</button>
  </div>
  
  <!-- Step 2: Risk Preferences -->
  <div class="risk-setup">
    <h2>Risk Preferences</h2>
    <input type="number" placeholder="Risk % per trade (default 1%)" />
    <select multiple><option>EUR/USD</option><option>GBP/USD</option></select>
    <label><input type="checkbox" required /> I accept the trading disclaimer</label>
    <button class="start-btn">Start Trading</button>
  </div>
</div>
```

---

### 2. **Multi-Broker Architecture** ⭐ CRITICAL
**Specs:** Broker selector in top bar (Tech Plan, Core Flows)
- User can switch between OANDA, MT5 Agent, MetaApi
- Each broker shows its own positions/balance
- `broker_connections` table with credentials

**Artefact:** Has broker cards but no active broker selector
- Shows broker connection status (connected/disconnected)
- No way to switch active broker in dashboard
- No per-broker position filtering

**Why it improves artefact:**
- Users with multiple brokers need to switch contexts
- Different brokers have different positions/balances
- Core requirement for the platform

**What to add to artefact:**
```html
<!-- Top Bar Enhancement -->
<div class="topbar">
  <span class="logo">⚡ ForexElite Pro</span>
  
  <!-- ADD THIS: Active Broker Selector -->
  <select class="broker-selector">
    <option value="broker-1">OANDA Practice (Connected)</option>
    <option value="broker-2">MT5 Agent - VPS-01 (Online)</option>
    <option value="broker-3">MetaApi Live (Connected)</option>
  </select>
  
  <select class="instrument-select">...</select>
  <!-- rest of top bar -->
</div>
```

---

### 3. **EA Deployment & Runtime Control** ⭐ CRITICAL
**Specs:** Full EA lifecycle (Core Flows, Flow 6)
- Deploy EA to specific MT5 connection + agent
- Run/Stop/Pause controls
- Status monitoring (Running/Stopped/Error/Offline)
- Agent health indicators
- Deployment logs

**Artefact:** Only has EA code generator
- Shows generated MQL5 code
- Copy button
- No deployment UI
- No runtime controls
- No status monitoring

**Why it improves artefact:**
- Generating code is useless without deployment
- Users need to run/stop EAs
- Need to see if EA is actually running
- Need to debug when EA fails

**What to add to artefact:**
```html
<!-- EA Deployments Section (NEW) -->
<div class="section">
  <h2>EA Deployments</h2>
  
  <div class="deployments-grid">
    <div class="deployment-card">
      <div class="deployment-header">
        <h3>SMC_OB_EURUSD v1.2</h3>
        <span class="status-badge running">● RUNNING</span>
      </div>
      <div class="deployment-info">
        <div class="info-row">
          <span>Broker:</span>
          <span>MT5 Agent - VPS-01</span>
        </div>
        <div class="info-row">
          <span>Symbol:</span>
          <span>EURUSD</span>
        </div>
        <div class="info-row">
          <span>Started:</span>
          <span>2 hours ago</span>
        </div>
        <div class="info-row">
          <span>Trades Today:</span>
          <span>3 (2 wins, 1 loss)</span>
        </div>
      </div>
      <div class="deployment-actions">
        <button class="btn-stop">Stop</button>
        <button class="btn-logs">View Logs</button>
        <button class="btn-settings">Settings</button>
      </div>
    </div>
    
    <div class="deployment-card">
      <div class="deployment-header">
        <h3>MA_Cross_GBPUSD v2.0</h3>
        <span class="status-badge stopped">● STOPPED</span>
      </div>
      <div class="deployment-info">
        <div class="info-row">
          <span>Broker:</span>
          <span>MT5 Agent - VPS-01</span>
        </div>
        <div class="info-row">
          <span>Symbol:</span>
          <span>GBPUSD</span>
        </div>
        <div class="info-row">
          <span>Last Run:</span>
          <span>Yesterday 14:32</span>
        </div>
      </div>
      <div class="deployment-actions">
        <button class="btn-start">Start</button>
        <button class="btn-delete">Delete</button>
      </div>
    </div>
  </div>
</div>

<!-- Agent Health Monitor (NEW) -->
<div class="agents-panel">
  <h3>MT5 Agents</h3>
  <div class="agent-card">
    <div class="agent-status online">● Online</div>
    <div class="agent-name">VPS-01</div>
    <div class="agent-meta">Last seen: 2 seconds ago</div>
    <div class="agent-stats">
      <span>2 EAs running</span>
      <span>CPU: 12%</span>
    </div>
  </div>
</div>
```

---

### 4. **EA Library (Projects & Versions)** ⭐ IMPORTANT
**Specs:** Structured EA management (Core Flows, Flow 5)
- EA Projects (containers)
- EA Versions (v1, v2, v3...)
- Version status (Draft/Compiled/Deployed/Running/Error)
- Artifact storage (source + compiled)
- Upload/download capabilities

**Artefact:** Only inline code generator
- No project organization
- No version history
- No artifact management
- Can't save/load EAs

**Why it improves artefact:**
- Users need to manage multiple EAs
- Need version control (what changed?)
- Need to store compiled artifacts
- Need to reuse/modify existing EAs

**What to add to artefact:**
```html
<!-- EA Library Page (NEW) -->
<div class="ea-library">
  <div class="library-header">
    <h2>EA Library</h2>
    <button class="btn-new-project">+ New Project</button>
  </div>
  
  <div class="projects-grid">
    <div class="project-card">
      <h3>Smart Money Concepts</h3>
      <div class="project-meta">
        <span>Strategy: SMC Order Blocks</span>
        <span>Last updated: 2 days ago</span>
      </div>
      <div class="versions-list">
        <div class="version-item">
          <span class="version-number">v1.2</span>
          <span class="version-status compiled">Compiled</span>
          <button class="btn-deploy">Deploy</button>
        </div>
        <div class="version-item">
          <span class="version-number">v1.1</span>
          <span class="version-status running">Running</span>
          <button class="btn-view">View</button>
        </div>
      </div>
      <button class="btn-new-version">+ New Version</button>
    </div>
  </div>
</div>
```

---

### 5. **Async Job Tracking** ⭐ IMPORTANT
**Specs:** Job system for long-running operations (Tech Plan)
- Compile jobs (pending → in_progress → completed/failed)
- Deploy jobs
- Job status tracking
- Error messages
- Retry capability

**Artefact:** Instant operations only
- Generate button → immediate code display
- No loading states for long operations
- No job queue visibility
- No error recovery

**Why it improves artefact:**
- Compilation takes time (5-30 seconds)
- Deployment takes time (agent communication)
- Users need feedback on progress
- Need to handle failures gracefully

**What to add to artefact:**
```html
<!-- Jobs Panel (NEW) -->
<div class="jobs-panel">
  <h3>Recent Jobs</h3>
  
  <div class="job-item in-progress">
    <div class="job-icon">⏳</div>
    <div class="job-info">
      <div class="job-title">Compiling SMC_OB_EURUSD v1.3</div>
      <div class="job-progress">
        <div class="progress-bar" style="width: 65%"></div>
        <span>65% - Validating syntax...</span>
      </div>
    </div>
    <button class="btn-cancel">Cancel</button>
  </div>
  
  <div class="job-item completed">
    <div class="job-icon">✓</div>
    <div class="job-info">
      <div class="job-title">Deployed MA_Cross_GBPUSD v2.0</div>
      <div class="job-meta">Completed 5 minutes ago</div>
    </div>
    <button class="btn-view-logs">Logs</button>
  </div>
  
  <div class="job-item failed">
    <div class="job-icon">✗</div>
    <div class="job-info">
      <div class="job-title">Compile FVG_Entry_USDJPY v1.0</div>
      <div class="job-error">Error: Syntax error on line 42</div>
    </div>
    <button class="btn-retry">Retry</button>
  </div>
</div>
```

---

### 6. **Trade History & Audit Trail** ⭐ IMPORTANT
**Specs:** `trade_events` table (Tech Plan)
- All manual trades logged
- Broker order IDs tracked
- Event types (ORDER_PLACED, ORDER_REJECTED, POSITION_CLOSED)
- Per-broker filtering
- Audit trail for compliance

**Artefact:** Only shows open positions
- No closed positions history
- No trade log
- No audit trail
- Can't review past trades

**Why it improves artefact:**
- Users need to review trading history
- Need to analyze performance
- Compliance/tax reporting
- Debugging (why did order fail?)

**What to add to artefact:**
```html
<!-- Trade History Tab (NEW) -->
<div class="history-section">
  <div class="history-filters">
    <select><option>All Brokers</option><option>OANDA</option></select>
    <select><option>All Events</option><option>Orders</option><option>Positions</option></select>
    <input type="date" placeholder="From" />
    <input type="date" placeholder="To" />
  </div>
  
  <table class="history-table">
    <thead>
      <tr>
        <th>Time</th>
        <th>Event</th>
        <th>Broker</th>
        <th>Instrument</th>
        <th>Side</th>
        <th>Size</th>
        <th>Price</th>
        <th>P&L</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>2024-02-22 14:32:15</td>
        <td>Position Closed</td>
        <td>OANDA</td>
        <td>EUR/USD</td>
        <td>BUY</td>
        <td>0.10</td>
        <td>1.08428</td>
        <td class="pos-green">+$11.80</td>
        <td><span class="badge-success">Filled</span></td>
      </tr>
      <tr>
        <td>2024-02-22 14:30:42</td>
        <td>Order Placed</td>
        <td>MT5 Agent</td>
        <td>GBP/USD</td>
        <td>SELL</td>
        <td>0.05</td>
        <td>1.26345</td>
        <td>—</td>
        <td><span class="badge-success">Filled</span></td>
      </tr>
      <tr>
        <td>2024-02-22 14:28:10</td>
        <td>Order Rejected</td>
        <td>OANDA</td>
        <td>USD/JPY</td>
        <td>BUY</td>
        <td>5.00</td>
        <td>—</td>
        <td>—</td>
        <td><span class="badge-error">Insufficient Margin</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Summary: Priority Improvements

| Feature | Priority | Impact | Effort |
|---------|----------|--------|--------|
| **Onboarding Flow** | 🔴 Critical | Users can't start without it | Medium |
| **Multi-Broker Selector** | 🔴 Critical | Core architecture requirement | Low |
| **EA Deployment UI** | 🔴 Critical | EA generator is useless without it | High |
| **EA Library** | 🟡 Important | Better EA management | Medium |
| **Job Tracking** | 🟡 Important | Better UX for async ops | Medium |
| **Trade History** | 🟡 Important | Performance analysis | Low |

## Recommendation

Add these to the artefact in this order:
1. **Onboarding** (users need to connect brokers first)
2. **Broker Selector** (switch between connected brokers)
3. **EA Deployment** (make EA generator actually useful)
4. **EA Library** (organize multiple EAs)
5. **Job Tracking** (show compile/deploy progress)
6. **Trade History** (review past trades)

This would make the artefact a **complete, functional design** instead of just a pretty mockup.
