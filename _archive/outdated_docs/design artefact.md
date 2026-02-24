<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ForexElite Pro — Institutional Trading Intelligence</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&family=JetBrains+Mono:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  :root {
    --gold: #C9A84C;
    --gold-light: #E8C97A;
    --gold-dim: #7A6130;
    --bg-deep: #04080F;
    --bg-card: #080E1A;
    --bg-panel: #0C1424;
    --bg-border: #141E30;
    --text-primary: #EEF2FF;
    --text-secondary: #8899BB;
    --text-dim: #445577;
    --green: #00E5A0;
    --green-dim: #00704E;
    --red: #FF4560;
    --red-dim: #7A1F2E;
    --blue: #3D85FF;
    --blue-dim: #1A3A7A;
    --accent: #C9A84C;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg-deep);
    color: var(--text-primary);
    overflow-x: hidden;
    cursor: default;
  }

  /* ===== SCROLLBAR ===== */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg-deep); }
  ::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 2px; }

  /* ===== NOISE TEXTURE OVERLAY ===== */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.3;
  }

  /* ===== NAVIGATION ===== */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    height: 64px;
    background: rgba(4,8,15,0.92);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--bg-border);
  }

  .nav-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 3px;
    color: var(--gold);
    text-decoration: none;
  }

  .nav-logo span { color: var(--text-primary); }

  .nav-links {
    display: flex;
    gap: 32px;
    list-style: none;
  }

  .nav-links a {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.2s;
    cursor: pointer;
  }

  .nav-links a:hover { color: var(--gold); }

  .nav-cta {
    background: var(--gold);
    color: var(--bg-deep) !important;
    padding: 8px 20px;
    border-radius: 4px;
    font-weight: 700 !important;
  }

  .nav-cta:hover { background: var(--gold-light) !important; color: var(--bg-deep) !important; }

  /* ===== HERO ===== */
  .hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 100px 40px 60px;
    position: relative;
    overflow: hidden;
  }

  .hero-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: gridMove 20s linear infinite;
  }

  @keyframes gridMove {
    0% { transform: translateY(0); }
    100% { transform: translateY(60px); }
  }

  .hero-glow {
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
    top: -100px; right: -100px;
    border-radius: 50%;
  }

  .hero-glow2 {
    position: absolute;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(61,133,255,0.08) 0%, transparent 70%);
    bottom: 0; left: 100px;
    border-radius: 50%;
  }

  .hero-content { position: relative; max-width: 1200px; margin: 0 auto; width: 100%; }

  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 24px;
    padding: 6px 14px;
    border: 1px solid var(--gold-dim);
    border-radius: 2px;
    animation: fadeUp 0.8s ease forwards;
    opacity: 0;
  }

  .hero-tag::before {
    content: '';
    width: 6px; height: 6px;
    background: var(--green);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .hero h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(56px, 9vw, 120px);
    line-height: 0.9;
    letter-spacing: 2px;
    margin-bottom: 24px;
    animation: fadeUp 0.8s 0.1s ease forwards;
    opacity: 0;
  }

  .hero h1 .gold { color: var(--gold); }

  .hero-sub {
    font-size: 16px;
    color: var(--text-secondary);
    max-width: 560px;
    line-height: 1.7;
    margin-bottom: 48px;
    font-weight: 300;
    animation: fadeUp 0.8s 0.2s ease forwards;
    opacity: 0;
  }

  .hero-actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    animation: fadeUp 0.8s 0.3s ease forwards;
    opacity: 0;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .btn-primary {
    background: var(--gold);
    color: var(--bg-deep);
    border: none;
    padding: 14px 32px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }

  .btn-secondary {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--bg-border);
    padding: 14px 32px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover { border-color: var(--gold-dim); color: var(--gold); }

  /* ===== LIVE TICKER ===== */
  .ticker-bar {
    background: var(--bg-panel);
    border-top: 1px solid var(--bg-border);
    border-bottom: 1px solid var(--bg-border);
    overflow: hidden;
    padding: 12px 0;
    position: relative;
  }

  .ticker-inner {
    display: flex;
    gap: 48px;
    animation: tickerScroll 30s linear infinite;
    white-space: nowrap;
  }

  @keyframes tickerScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .ticker-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  .ticker-pair { color: var(--text-primary); font-weight: 600; }
  .ticker-price { color: var(--text-secondary); }
  .ticker-change.up { color: var(--green); }
  .ticker-change.down { color: var(--red); }

  /* ===== SECTION LAYOUT ===== */
  section {
    padding: 80px 40px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .section-full {
    max-width: 100%;
    padding: 80px 0;
  }

  .section-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 40px;
  }

  .section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 12px;
  }

  .section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(36px, 5vw, 64px);
    line-height: 1;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }

  .section-desc {
    font-size: 15px;
    color: var(--text-secondary);
    max-width: 560px;
    line-height: 1.7;
    font-weight: 300;
  }

  .section-header { margin-bottom: 48px; }

  /* ===== SIGNAL GENERATOR ===== */
  .signal-section {
    background: var(--bg-panel);
    border-top: 1px solid var(--bg-border);
    border-bottom: 1px solid var(--bg-border);
  }

  .signal-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 0;
    border: 1px solid var(--bg-border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-card);
    min-height: 500px;
  }

  .signal-controls {
    padding: 28px;
    border-right: 1px solid var(--bg-border);
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: var(--bg-deep);
  }

  .signal-controls h3 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px;
    letter-spacing: 2px;
    color: var(--gold);
  }

  .ctrl-group { display: flex; flex-direction: column; gap: 8px; }

  .ctrl-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
  }

  .ctrl-select, .ctrl-input {
    background: var(--bg-panel);
    border: 1px solid var(--bg-border);
    color: var(--text-primary);
    padding: 10px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
    transition: border-color 0.2s;
    width: 100%;
  }

  .ctrl-select:hover, .ctrl-input:focus { border-color: var(--gold-dim); outline: none; }

  .strategy-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .strategy-pill {
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 2px;
    border: 1px solid var(--bg-border);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
  }

  .strategy-pill.active {
    border-color: var(--gold);
    color: var(--gold);
    background: rgba(201,168,76,0.08);
  }

  .strategy-pill:hover { border-color: var(--gold-dim); color: var(--text-primary); }

  .generate-btn {
    background: var(--gold);
    color: var(--bg-deep);
    border: none;
    padding: 12px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: auto;
  }

  .generate-btn:hover { background: var(--gold-light); }

  .signal-output {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .signal-card {
    border: 1px solid var(--bg-border);
    border-radius: 6px;
    padding: 20px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 16px;
    align-items: center;
    transition: border-color 0.2s, background 0.2s;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .signal-card:hover { border-color: var(--gold-dim); background: rgba(201,168,76,0.03); }

  .signal-card.buy { border-left: 3px solid var(--green); }
  .signal-card.sell { border-left: 3px solid var(--red); }

  .signal-direction {
    width: 48px; height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
  }

  .signal-direction.buy { background: rgba(0,229,160,0.1); color: var(--green); }
  .signal-direction.sell { background: rgba(255,69,96,0.1); color: var(--red); }

  .signal-info { display: flex; flex-direction: column; gap: 4px; }

  .signal-pair {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    letter-spacing: 1px;
  }

  .signal-strategy {
    font-size: 11px;
    color: var(--gold);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 1px;
  }

  .signal-meta {
    font-size: 11px;
    color: var(--text-secondary);
    font-family: 'JetBrains Mono', monospace;
  }

  .signal-levels { text-align: right; display: flex; flex-direction: column; gap: 4px; }

  .level-row {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  .level-tag {
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 2px;
  }

  .level-tag.entry { background: rgba(61,133,255,0.15); color: var(--blue); }
  .level-tag.sl { background: rgba(255,69,96,0.15); color: var(--red); }
  .level-tag.tp { background: rgba(0,229,160,0.15); color: var(--green); }
  .level-tag.tf { background: rgba(201,168,76,0.15); color: var(--gold); }

  .signal-strength {
    display: flex;
    gap: 3px;
    align-items: center;
    margin-top: 4px;
    justify-content: flex-end;
  }

  .strength-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--bg-border);
  }

  .strength-dot.active { background: var(--gold); }

  .no-signal {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--text-dim);
  }

  .no-signal-icon { font-size: 48px; opacity: 0.3; }

  /* ===== RISK MANAGEMENT ===== */
  .risk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 40px;
  }

  .risk-card {
    background: var(--bg-card);
    border: 1px solid var(--bg-border);
    border-radius: 8px;
    padding: 28px;
  }

  .risk-card h3 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    letter-spacing: 1px;
    color: var(--gold);
    margin-bottom: 20px;
  }

  .calc-field { margin-bottom: 14px; }

  .calc-field label {
    display: block;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 6px;
  }

  .calc-field input, .calc-field select {
    width: 100%;
    background: var(--bg-panel);
    border: 1px solid var(--bg-border);
    color: var(--text-primary);
    padding: 10px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    border-radius: 4px;
    transition: border-color 0.2s;
  }

  .calc-field input:focus, .calc-field select:focus { border-color: var(--gold-dim); outline: none; }

  .calc-result {
    background: rgba(201,168,76,0.05);
    border: 1px solid var(--gold-dim);
    border-radius: 4px;
    padding: 16px;
    margin-top: 16px;
  }

  .calc-result-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold-dim);
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 4px;
  }

  .calc-result-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px;
    letter-spacing: 1px;
    color: var(--gold);
  }

  .calc-btn {
    width: 100%;
    background: var(--gold);
    color: var(--bg-deep);
    border: none;
    padding: 12px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
  }

  .calc-btn:hover { background: var(--gold-light); }

  /* ===== LIBRARY ===== */
  .library-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--bg-border);
    margin-bottom: 40px;
    overflow-x: auto;
  }

  .lib-tab {
    padding: 12px 24px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
    white-space: nowrap;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: 'DM Sans', sans-serif;
  }

  .lib-tab.active { color: var(--gold); border-bottom-color: var(--gold); }
  .lib-tab:hover { color: var(--text-primary); }

  .lib-content { display: none; }
  .lib-content.active { display: block; }

  .strategy-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }

  .strat-card {
    background: var(--bg-card);
    border: 1px solid var(--bg-border);
    border-radius: 8px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
  }

  .strat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px;
    height: 100%;
    background: var(--gold);
    transform: scaleY(0);
    transition: transform 0.25s;
    transform-origin: bottom;
  }

  .strat-card:hover { border-color: var(--gold-dim); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
  .strat-card:hover::before { transform: scaleY(1); }

  .strat-badge {
    display: inline-block;
    padding: 3px 10px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-radius: 2px;
    margin-bottom: 14px;
    font-family: 'JetBrains Mono', monospace;
  }

  .badge-smc { background: rgba(201,168,76,0.12); color: var(--gold); }
  .badge-price { background: rgba(61,133,255,0.12); color: var(--blue); }
  .badge-sr { background: rgba(0,229,160,0.12); color: var(--green); }
  .badge-pa { background: rgba(255,69,96,0.12); color: var(--red); }
  .badge-fund { background: rgba(139,92,246,0.12); color: #A78BFA; }
  .badge-mm { background: rgba(236,72,153,0.12); color: #F472B6; }

  .strat-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }

  .strat-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .strat-tags { display: flex; flex-wrap: wrap; gap: 6px; }

  .strat-tag {
    padding: 3px 8px;
    font-size: 10px;
    color: var(--text-dim);
    border: 1px solid var(--bg-border);
    border-radius: 2px;
    font-family: 'JetBrains Mono', monospace;
  }

  .strat-expand {
    display: none;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--bg-border);
  }

  .strat-expand.open { display: block; }

  .strat-expand-title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 8px;
    margin-top: 14px;
  }

  .strat-expand-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  .strat-rules {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .strat-rules li {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: 'JetBrains Mono', monospace;
    padding-left: 16px;
    position: relative;
    line-height: 1.5;
  }

  .strat-rules li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--gold);
  }

  /* ===== EA CODE GENERATOR ===== */
  .ea-container {
    background: var(--bg-card);
    border: 1px solid var(--bg-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .ea-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: var(--bg-deep);
    border-bottom: 1px solid var(--bg-border);
  }

  .ea-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ea-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
  }

  .ea-dot.red { background: #FF5F57; }
  .ea-dot.yellow { background: #FEBC2E; }
  .ea-dot.green { background: #28C840; }

  .ea-filename {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .ea-controls {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-bo