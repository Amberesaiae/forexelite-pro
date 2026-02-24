# Deviation Proof: Artefact vs Specs vs Current Implementation

## Evidence-Based Analysis

### 1. Trading Sessions Feature

**Artefact HTML (Lines 182-190, 954-961):**
```css
.sessions-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:28px; }
.session-card { background:var(--bg-card); border:1px solid var(--bg-border); border-radius:8px; padding:18px; }
.session-live { display:inline-flex; align-items:center; gap:5px; font-size:9px; color:var(--green); }
```
```javascript
function buildSessions(){
  document.getElementById('sessions-row').innerHTML=SESSIONS.map(s=>`
    <div class="session-card ${s.active?'active':''}">
      <div class="session-name">${s.name}</div>
      <div class="session-time">${s.open} – ${s.close} ${s.tz}</div>
      ${s.active?'<div class="session-live">LIVE NOW</div>':''}
    </div>`).join('');
}
```

**Specs:** ❌ NOT MENTIONED
- No reference to "London", "Tokyo", "Sydney", "New York" sessions
- No market hours tracking in Core Flows or Tech Plan

**Current Implementation:** ❌ NOT IMPLEMENTED
- Zero matches for "session", "London", "Tokyo", "Sydney" in frontend code

**Verdict:** Artefact includes feature NOT in specs, NOT in current code

---

### 2. Signal Generation Feature

**Artefact HTML (Lines 142-154, 482-547):**
```css
.signal-section { background:var(--bg-panel); border-top:1px solid var(--bg-border); }
.signal-grid { display:grid; grid-template-columns:280px 1fr; gap:0; }
.signal-controls { padding:24px; border-right:1px solid var(--bg-border); }
.generate-btn { background:var(--gold); color:var(--bg-deep); }
```
```html
<div class="signal-section section-full" id="signals">
  <div class="signal-grid">
    <div class="signal-controls">
      <h3>CONFIGURE SIGNAL</h3>
      <!-- Strategy pills: SMC, Price Action, S&R -->
      <button class="generate-btn" onclick="generateSignals()">⚡ GENERATE SIGNALS</button>
    </div>
    <div class="signal-output" id="signal-output"></div>
  </div>
</div>
```

**Specs:** ❌ NOT MENTIONED
- Zero matches for "signal.*generat", "SMC", "Price Action", "Support.*Resistance"
- Specs mention `signals` table in database but no signal generation UI/flow

**Current Implementation:** ❌ NOT IMPLEMENTED
- Zero matches for "signal", "SMC", "Price Action" in frontend code

**Verdict:** Artefact includes feature NOT in specs, NOT in current code

---

### 3. EA Generator Feature

**Artefact HTML (Lines 238-248, 653-681, 1082-1088):**
```css
.ea-container { background:var(--bg-card); border:1px solid var(--bg-border); }
.ea-gen-btn { background:var(--gold); color:var(--bg-deep); }
.ea-code { padding:20px; font-family:'JetBrains Mono',monospace; }
```
```html
<div class="ea-container">
  <div class="ea-header">
    <div class="ea-filename">ForexElite_SMC_EURUSD.mq5</div>
  </div>
  <div class="ea-controls">
    <select id="ea-strategy">
      <option value="smc">Smart Money Concepts</option>
      <option value="sr">Support & Resistance</option>
    </select>
    <button class="ea-gen-btn" onclick="updateEA()">GENERATE</button>
  </div>
  <div class="ea-code" id="ea-code"></div>
</div>
```
```javascript
function updateEA(){
  const s=document.getElementById('ea-strategy').value;
  document.getElementById('ea-code').innerHTML=(EA_T[s]||EA_T.smc)(p,t,r);
}
```

**Specs:** ✅ MENTIONED (but different scope)
```
Epic Brief (Line 7): "EA Library that supports the full lifecycle (generate → compile/validate → deploy/run)"
Tech Plan (Line 179): "EA Generator: Produces EA source from platform templates + strategy config"
Core Flows (Line 26): "Create Version (Generate/Upload)"
```

**Current Implementation:** ❌ NOT IMPLEMENTED
- Zero matches for "EA.*generat", "Expert Advisor", "MQL5" in frontend code
- No EA library pages exist

**Verdict:** Artefact shows VISUAL IMPLEMENTATION of spec concept, but current code has NOTHING

---

## Summary Table

| Feature | Artefact | Specs | Current Code | Alignment |
|---------|----------|-------|--------------|-----------|
| **Trading Sessions** | ✅ Full UI (4 cards, live indicators) | ❌ Not mentioned | ❌ Not implemented | **ARTEFACT ONLY** |
| **Signal Generation** | ✅ Full UI (controls + output) | ❌ Not mentioned | ❌ Not implemented | **ARTEFACT ONLY** |
| **EA Generator** | ✅ Full UI (code display + syntax highlighting) | ✅ Mentioned (lifecycle) | ❌ Not implemented | **ARTEFACT + SPECS** |
| **Risk Calculator** | ✅ Full UI (pip value, margin, max loss) | ❌ Not mentioned | ✅ Basic version exists | **PARTIAL** |
| **Broker Selector** | ✅ Dropdown in header | ✅ Multi-broker architecture | ✅ Exists in dashboard | **ALIGNED** |
| **Chart + Order Panel** | ✅ Split layout | ✅ Core Flow 2 & 3 | ✅ Exists in dashboard | **ALIGNED** |
| **Positions Table** | ✅ Bottom panel | ✅ Core Flow 4 | ✅ Exists in dashboard | **ALIGNED** |

## Conclusion

**Proof of Deviation:**

1. **Artefact includes 2 major features NOT in specs:**
   - Trading Sessions (London/NY/Tokyo/Sydney)
   - Signal Generation (SMC/Price Action/S&R)

2. **Specs describe EA lifecycle, artefact shows the UI for it**
   - Specs: Architecture for EA generation/compile/deploy
   - Artefact: Visual mockup of EA generator with code display
   - Current: Neither architecture nor UI implemented

3. **Current implementation is a generic SaaS app:**
   - Has: Landing page with 3D globe, basic dashboard
   - Missing: All trading-specific features from artefact
   - Missing: EA lifecycle from specs

**The deviation is real and measurable.**

The artefact is a **richer vision** than the specs (includes extra features), and the current code implements **neither** the artefact vision nor the spec architecture.
