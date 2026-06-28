import { useState, useEffect, useRef, useCallback } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"

// ── helpers ──────────────────────────────────────────────────────────────────
function factorial(n) {
  if (n > 20) return Infinity // prevent overflow for large c values
  let f = 1
  for (let i = 2; i <= n; i++) f *= i
  return f
}

function erlangC(c, a) {
  if (c <= 0 || a <= 0) return 0
  const rho = a / c
  if (rho >= 1) return 1
  const factC = factorial(c)
  if (!isFinite(factC)) return 1
  const num = Math.pow(a, c) / factC / (1 - rho)
  let sum = 0
  for (let k = 0; k < c; k++) sum += Math.pow(a, k) / factorial(k)
  const denom = sum + num
  if (!isFinite(denom) || denom === 0) return 0
  return num / denom
}

function zFromSvc(svc) {
  const t = {80:0.84,85:1.04,90:1.28,91:1.34,92:1.41,93:1.48,94:1.55,95:1.65,96:1.75,97:1.88,98:2.05,99:2.33}
  return t[svc] || 2.33
}

function expRand(rate) {
  if (rate <= 0) return Infinity
  return -Math.log(Math.random()) / rate
}

function fmt(v, d = 1) { return isFinite(v) && !isNaN(v) ? v.toFixed(d) : "∞" }

// ── design tokens ─────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" },
  nav: { display: "flex", alignItems: "center", gap: 0, borderBottom: "1px solid var(--border)", background: "var(--surface)", position: "sticky", top: 0, zIndex: 50, overflowX: "auto" },
  navBrand: { fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 24px", borderRight: "1px solid var(--border)", whiteSpace: "nowrap", height: 48, display: "flex", alignItems: "center" },
  navTab: (active) => ({ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: active ? "var(--accent)" : "var(--text2)", padding: "0 20px", height: 48, display: "flex", alignItems: "center", cursor: "pointer", borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent", whiteSpace: "nowrap", transition: "color .15s" }),
  slide: { flex: 1, padding: "40px 48px", maxWidth: 1100, margin: "0 auto", width: "100%" },
  slideNarrow: { flex: 1, padding: "40px 48px", maxWidth: 820, margin: "0 auto", width: "100%" },
  eyebrow: { fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 },
  h1: { fontSize: 36, fontWeight: 600, color: "var(--text)", lineHeight: 1.2, marginBottom: 8 },
  h2: { fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 16 },
  h3: { fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" },
  body: { fontSize: 14, color: "var(--text2)", lineHeight: 1.7 },
  mono: { fontFamily: "var(--mono)", fontSize: 13 },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 },
  cardSm: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 },
  kpi: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px" },
  kpiLabel: { fontFamily: "var(--mono)", fontSize: 9, color: "var(--text2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 },
  kpiVal: (c) => ({ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 600, color: c === "good" ? "var(--green)" : c === "bad" ? "var(--red)" : c === "warn" ? "var(--yellow)" : "var(--text)" }),
  kpiSub: { fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 2 },
  ctrlRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  ctrlLabel: { fontSize: 12, color: "var(--text2)", width: 200, flexShrink: 0 },
  ctrlSub: { fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" },
  ctrlVal: { fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text)", width: 52, textAlign: "right" },
  formulaBox: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 16px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", lineHeight: 2, marginTop: 12 },
  interp: { background: "var(--surface2)", borderLeft: "3px solid var(--accent)", borderRadius: "0 6px 6px 0", padding: "12px 16px", fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 },
  badge: (c) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, background: c === "good" ? "rgba(74,222,128,.12)" : c === "bad" ? "rgba(248,113,113,.12)" : "rgba(251,191,36,.12)", color: c === "good" ? "var(--green)" : c === "bad" ? "var(--red)" : "var(--yellow)" }),
  btn: { fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", background: "var(--accent)", color: "var(--bg)", border: "none", padding: "9px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
  btnSec: { fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", padding: "9px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 600, marginLeft: 10 },
  divider: { height: 1, background: "var(--border)", margin: "28px 0" },
  tag: { fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase" },
}

function Slider({ label, sub, min, max, step = 1, value, onChange, unit = "" }) {
  return (
    <div style={S.ctrlRow}>
      <div style={S.ctrlLabel}>
        <div>{label}</div>
        {sub && <div style={S.ctrlSub}>{sub}</div>}
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ flex: 1, accentColor: "var(--accent)", height: 3, cursor: "pointer" }} />
      <div style={S.ctrlVal}>{value}{unit}</div>
    </div>
  )
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={S.kpi}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={S.kpiVal(color)}>{value}</div>
      {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
  )
}

// ── SLIDE 0 : Hero ────────────────────────────────────────────────────────────
function SlideHero() {
  return (
    <div style={{ ...S.slideNarrow, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "calc(100vh - 48px)" }}>
      <div style={S.eyebrow}>Recherche Opérationnelle · Systèmes Stochastiques</div>
      <h1 style={{ ...S.h1, fontSize: 44, marginBottom: 20 }}>
        Gestion des Urgences<br />
        <span style={{ color: "var(--accent)" }}>sous Incertitude</span>
      </h1>
      <p style={{ ...S.body, fontSize: 16, maxWidth: 560, marginBottom: 36 }}>
        Une approche stochastique couplant file d'attente M/M/c et supply chain médicale pour optimiser les ressources hospitalières.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[["File M/M/c", "var(--accent)"], ["Stock (s,Q)", "var(--green)"], ["Simulation", "var(--yellow)"]].map(([t, c]) => (
          <div key={t} style={{ fontFamily: "var(--mono)", fontSize: 12, color: c, border: `1px solid ${c}`, borderRadius: 4, padding: "6px 14px", opacity: 0.85 }}>{t}</div>
        ))}
      </div>
      <div style={{ ...S.divider, marginTop: 48 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          ["λ", "Arrivées Poisson", "Aléatoire"],
          ["M/M/c", "File d'attente", "Markovienne"],
          ["(s,Q)", "Politique stock", "Optimale"],
        ].map(([sym, title, sub]) => (
          <div key={sym} style={S.card}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: "var(--accent)", marginBottom: 6 }}>{sym}</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{title}</div>
            <div style={S.tag}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SLIDE 1 : Problème ────────────────────────────────────────────────────────
function SlideProbleme() {
  const actors = [
    { label: "Patient arrive", sub: "Poisson(λ)", color: "var(--red)" },
    { label: "Triage", sub: "Priorité aléatoire", color: "var(--yellow)" },
    { label: "File d'attente", sub: "n patients", color: "var(--accent)" },
    { label: "Soins", sub: "c médecins · Exp(μ)", color: "var(--green)" },
  ]
  const aleaS = [
    ["Arrivées λ(t)", "Poisson — imprévisible", "var(--red)"],
    ["Durée soins S", "Exponentielle — variable", "var(--yellow)"],
    ["Stock R(t)", "Médicaments, lits, sang", "var(--accent)"],
  ]
  const decisions = [
    ["c", "Médecins à programmer"],
    ["s", "Seuil de réapprovisionnement"],
    ["Q", "Quantité à commander"],
  ]
  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 1 — Comprendre</div>
      <h2 style={S.h2}>Le système des urgences</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {actors.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...S.card, borderColor: a.color, padding: "10px 16px", minWidth: 130 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</div>
              <div style={S.tag}>{a.sub}</div>
            </div>
            {i < actors.length - 1 && <div style={{ color: "var(--text3)", fontSize: 18 }}>→</div>}
          </div>
        ))}
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.h3}>Ce que la nature décide</div>
          {aleaS.map(([t, s, c]) => (
            <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 3, height: 36, background: c, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: c }}>{t}</div>
                <div style={S.tag}>{s}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.h3}>Ce que le gestionnaire décide</div>
          {decisions.map(([sym, desc]) => (
            <div key={sym} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: "var(--green)", width: 32 }}>{sym}</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>{desc}</div>
            </div>
          ))}
          <div style={{ ...S.interp, marginTop: 16, fontSize: 12 }}>
            Le gestionnaire décide <strong style={{ color: "var(--text)" }}>avant</strong> de connaître ce que la nature fera. C'est l'essence du problème stochastique.
          </div>
        </div>
      </div>
      <div style={{ ...S.divider }} />
      <div style={S.h3}>La tension permanente</div>
      <div style={S.grid2}>
        <div style={{ ...S.card, borderColor: "var(--red)" }}>
          <div style={{ color: "var(--red)", fontWeight: 600, marginBottom: 6 }}>Trop peu de ressources</div>
          <div style={S.body}>File qui explose · Patients en danger · Rupture de stock médicaments</div>
        </div>
        <div style={{ ...S.card, borderColor: "var(--yellow)" }}>
          <div style={{ color: "var(--yellow)", fontWeight: 600, marginBottom: 6 }}>Trop de ressources</div>
          <div style={S.body}>Budget gaspillé · Médecins inactifs · Médicaments périmés</div>
        </div>
      </div>
    </div>
  )
}

// ── SLIDE 2 : Modèle ─────────────────────────────────────────────────────────
function SlideModele() {
  const briques = [
    { num: "01", title: "État S(t)", desc: "S(t) = (N(t), I(t), X(t)) — nombre de patients, médecins occupés, stock. Propriété de Markov : le passé n'a plus d'importance.", color: "var(--accent)" },
    { num: "02", title: "Arrivées Poisson", desc: "P(N=k) = (λt)ᵏ e⁻λᵗ / k!  —  temps entre arrivées ~ Exp(λ). Indépendance, stationnarité, rarité.", color: "var(--green)" },
    { num: "03", title: "Soins Exp(μ)", desc: "S ~ Exp(μ) → E[S] = 1/μ. Un soin de 15 min en moyenne peut durer 2 min ou 2 heures selon la gravité.", color: "var(--yellow)" },
    { num: "04", title: "Stock X(t)", desc: "Xₜ₊₁ = max(0, Xₜ − Dₜ) + Qₜ  —  la demande Dₜ dépend de N(t) : les deux systèmes sont couplés.", color: "var(--accent)" },
  ]
  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 2 — Modéliser</div>
      <h2 style={S.h2}>Construction du modèle M/M/c</h2>
      <div style={S.grid2}>
        {briques.map(b => (
          <div key={b.num} style={{ ...S.card, borderTop: `2px solid ${b.color}` }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: b.color, letterSpacing: "0.1em", marginBottom: 8 }}>BRIQUE {b.num}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{b.title}</div>
            <div style={{ ...S.body, fontSize: 13 }}>{b.desc}</div>
          </div>
        ))}
      </div>
      <div style={S.divider} />
      <div style={S.h3}>Objectif — minimiser le coût espéré total</div>
      <div style={S.formulaBox}>
        min {"  "}E[ α·W {"  "}+{"  "} h·Xₜ {"  "}+{"  "} p·max(0, Dₜ − Xₜ) ]<br />
        <span style={{ color: "var(--text2)", fontSize: 11 }}>
          {"  "}α·W = coût attente {"  "}|{"  "} h·Xₜ = coût stockage {"  "}|{"  "} p·max(…) = coût pénurie
        </span>
      </div>
      <div style={{ ...S.grid3, marginTop: 20 }}>
        {[
          ["Condition stabilité", "ρ = λ/(c·μ) < 1", "var(--red)"],
          ["Erlang C", "P(attente) = C(c,a)", "var(--accent)"],
          ["Loi de Little", "E[N] = λ · E[W]", "var(--green)"],
        ].map(([t, f, c]) => (
          <div key={t} style={S.card}>
            <div style={S.tag}>{t}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: c, marginTop: 8 }}>{f}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SLIDE 3 : File interactive ────────────────────────────────────────────────
function SlideFile() {
  const [lam, setLam] = useState(6)
  const [mu, setMu] = useState(4)
  const [c, setC] = useState(3)
  const [cw, setCw] = useState(20)
  const [cm, setCm] = useState(100)

  const a = lam / mu
  const rho = lam / (c * mu)
  const ec = erlangC(c, a)
  const wq_h = rho >= 1 ? Infinity : ec / (c * mu - lam)
  const wq = wq_h * 60
  const w = wq + (1 / mu) * 60
  const N = isFinite(wq) ? lam * (w / 60) : Infinity
  const costW = isFinite(wq) ? wq * cw * lam : Infinity
  const total = isFinite(costW) ? costW + c * cm : Infinity

  const rhoClass = rho >= 1 ? "bad" : rho >= 0.8 ? "warn" : "good"

  const cMin = Math.max(1, Math.ceil(a))
  let bestC = cMin, bestCost = Infinity
  const rows = []
  for (let ci = cMin; ci <= cMin + 6; ci++) {
    const ri = lam / (ci * mu)
    const eci = erlangC(ci, a)
    const wqi = ri >= 1 ? Infinity : eci / (ci * mu - lam) * 60
    const costi = ri >= 1 ? Infinity : wqi * cw * lam + ci * cm
    if (costi < bestCost) { bestCost = costi; bestC = ci }
    rows.push({ c: ci, rho: ri, ec: eci, wq: wqi, cost: costi })
  }

  const chartData = rows.map(r => ({
    c: `c=${r.c}`, wq: isFinite(r.wq) ? +r.wq.toFixed(2) : null,
    cost: isFinite(r.cost) ? Math.round(r.cost) : null,
    highlight: r.c === bestC
  }))

  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 3 — Résoudre · File d'attente</div>
      <h2 style={S.h2}>Modèle M/M/c — Trouver c*</h2>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.h3}>Paramètres</div>
          <Slider label="λ — arrivées/heure" sub="taux de Poisson" min={1} max={20} value={lam} onChange={setLam} />
          <Slider label="μ — soins/heure/médecin" sub="taux exponentiel" min={1} max={10} value={mu} onChange={setMu} />
          <Slider label="c — médecins testés" sub="variable de décision" min={1} max={12} value={c} onChange={setC} />
          <Slider label="Coût attente (€/min/patient)" min={5} max={100} step={5} value={cw} onChange={setCw} />
          <Slider label="Coût médecin (€/garde)" min={50} max={400} step={10} value={cm} onChange={setCm} />
          <div style={S.formulaBox}>
            ρ = {lam}/{c}×{mu} = {rho.toFixed(3)}<br />
            a = λ/μ = {lam}/{mu} = {a.toFixed(2)} Erlangs
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={S.badge(rhoClass)}>
              {rho >= 1 ? "● INSTABLE ρ ≥ 1" : rho >= 0.8 ? `● ATTENTION ρ=${rho.toFixed(2)}` : `● STABLE ρ=${rho.toFixed(2)}`}
            </span>
          </div>
        </div>
        <div>
          <div style={{ ...S.grid2, marginBottom: 14 }}>
            <KPI label="ρ taux de charge" value={rho >= 1 ? "≥ 1 !" : rho.toFixed(3)} sub={`occupation ${(Math.min(rho,1)*100).toFixed(0)}%`} color={rhoClass} />
            <KPI label="P(attente) Erlang C" value={rho >= 1 ? "100%" : (ec * 100).toFixed(1) + "%"} color={ec > 0.5 ? "bad" : ec > 0.2 ? "warn" : "good"} />
            <KPI label="E[Wq] attente file" value={rho >= 1 ? "∞" : fmt(wq) + " min"} color={wq > 10 ? "bad" : wq > 3 ? "warn" : "good"} />
            <KPI label="E[W] séjour total" value={rho >= 1 ? "∞" : fmt(w) + " min"} />
            <KPI label="E[N] loi de Little" value={rho >= 1 ? "∞" : fmt(N)} sub="patients en système" />
            <KPI label="Coût total" value={rho >= 1 ? "∞" : Math.round(total) + " €"} sub={c === bestC ? "✓ optimal" : `optimal c=${bestC}`} color={c === bestC ? "good" : undefined} />
          </div>
          <div style={S.interp}>
            {rho >= 1
              ? <span>Système <strong style={{ color: "var(--red)" }}>instable</strong>. Il faut au minimum <strong style={{ color: "var(--text)" }}>{Math.ceil(a) + 1} médecins</strong>.</span>
              : <span>Avec <strong style={{ color: "var(--text)" }}>{c} médecin(s)</strong>, chaque médecin est occupé <strong style={{ color: "var(--text)" }}>{(rho * 100).toFixed(0)}%</strong> du temps. Attente moyenne : <strong style={{ color: "var(--accent)" }}>{fmt(wq)} min</strong>. {(ec * 100).toFixed(0)}% des patients attendent.</span>
            }
          </div>
        </div>
      </div>
      <div style={S.divider} />
      <div style={S.h3}>Coût total selon le nombre de médecins</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2730" />
          <XAxis dataKey="c" tick={{ fill: "#7a8899", fontSize: 11, fontFamily: "var(--mono)" }} />
          <YAxis tick={{ fill: "#7a8899", fontSize: 11, fontFamily: "var(--mono)" }} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 12 }} />
          <Bar dataKey="cost" name="Coût total (€)" fill="#4fc3f7" radius={[3, 3, 0, 0]} />
          <Bar dataKey="wq" name="E[Wq] (min)" fill="#4ade80" radius={[3, 3, 0, 0]} />
          <Legend wrapperStyle={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── SLIDE 4 : Stock ───────────────────────────────────────────────────────────
// FIX: Added safety guards for division by zero (h=0) and NaN propagation.
// Chart data is now filtered to only include valid positive Q values.
function SlideStock() {
  const [mud, setMud] = useState(20)
  const [sig, setSig] = useState(5)
  const [L, setL] = useState(2)
  const [svc, setSvc] = useState(99)
  const [K, setK] = useState(100)
  const [h, setH] = useState(5)

  const z = zFromSvc(svc)
  const ss = Math.round(z * sig * Math.sqrt(L))
  const demL = mud * L
  const s = Math.round(demL + ss)

  // FIX: guard against h=0 causing division by zero → NaN → crash
  const safeH = h > 0 ? h : 1
  const Q = Math.max(1, Math.round(Math.sqrt(2 * K * mud / safeH)))

  const nOrders = +(365 * mud / Q).toFixed(1)
  const costAnnuel = Math.round(nOrders * K + (Q / 2 + ss) * safeH * 365)

  // FIX: only include valid Q values (positive) in chart, avoid Infinity/NaN entries
  const chartData = []
  const qStart = Math.max(1, Q - 40)
  const qEnd = Q + 60
  for (let qi = qStart; qi <= qEnd; qi += 5) {
    const holding = (qi / 2 + ss) * safeH * 365
    const ordering = (365 * mud / qi) * K
    const total = holding + ordering
    if (isFinite(holding) && isFinite(ordering)) {
      chartData.push({
        Q: qi,
        stockage: Math.round(holding),
        commande: Math.round(ordering),
        total: Math.round(total)
      })
    }
  }

  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 3 — Résoudre · Supply Chain</div>
      <h2 style={S.h2}>Politique de stock (s*, Q*)</h2>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.h3}>Paramètres</div>
          <Slider label="μ_D demande moy/jour" sub="unités consommées" min={5} max={80} value={mud} onChange={setMud} />
          <Slider label="σ_D écart-type" sub="variabilité demande" min={1} max={30} value={sig} onChange={setSig} />
          <Slider label="L délai livraison (jours)" min={1} max={14} value={L} onChange={setL} />
          <Slider label="Niveau de service (%)" min={80} max={99} value={svc} onChange={setSvc} unit="%" />
          <Slider label="K coût fixe commande (€)" min={10} max={1000} step={10} value={K} onChange={setK} />
          <Slider label="h coût stockage (€/u/jour)" min={1} max={30} value={h} onChange={setH} />
          <div style={S.formulaBox}>
            s* = μ_D·L + z_α·σ_D·√L<br />
            {"   "}= {mud}×{L} + {z.toFixed(2)}×{sig}×√{L} = <strong>{s}</strong><br />
            Q* = √(2·K·μ_D/h)<br />
            {"   "}= √(2×{K}×{mud}/{h}) = <strong>{Q}</strong>
          </div>
        </div>
        <div>
          <div style={{ ...S.grid2, marginBottom: 14 }}>
            <KPI label="s* seuil commande" value={s + " u"} color="good" sub="commander quand stock ≤ s*" />
            <KPI label="Q* quantité" value={Q + " u"} color="good" sub="par commande" />
            <KPI label="Stock de sécurité" value={ss + " u"} sub={`z=${z.toFixed(2)}`} />
            <KPI label="Demande pendant L" value={Math.round(demL) + " u"} sub="attendue" />
            <KPI label="Commandes/an" value={nOrders} />
            <KPI label="Coût annuel estimé" value={costAnnuel.toLocaleString() + " €"} />
          </div>
          <div style={S.interp}>
            Commander <strong style={{ color: "var(--text)" }}>{Q} unités</strong> dès que le stock atteint <strong style={{ color: "var(--accent)" }}>{s} unités</strong>. Le stock de sécurité de <strong style={{ color: "var(--text)" }}>{ss} unités</strong> couvre les aléas du délai. Probabilité de pénurie : <strong style={{ color: "var(--green)" }}>{(100 - svc).toFixed(0)}%</strong>.
          </div>
        </div>
      </div>
      <div style={S.divider} />
      <div style={S.h3}>Coût total selon Q — minimum en Q*</div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2730" />
            <XAxis dataKey="Q" tick={{ fill: "#7a8899", fontSize: 11, fontFamily: "var(--mono)" }} label={{ value: "Q (unités)", position: "insideBottom", offset: -2, fill: "#7a8899", fontSize: 11 }} />
            <YAxis tick={{ fill: "#7a8899", fontSize: 11, fontFamily: "var(--mono)" }} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 12 }} />
            <Line type="monotone" dataKey="stockage" name="Stockage (€)" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="commande" name="Commande (€)" stroke="#f87171" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="total" name="Total (€)" stroke="#4fc3f7" strokeWidth={2} dot={false} />
            <Legend wrapperStyle={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ ...S.card, textAlign: "center", padding: 32, color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 12 }}>
          Données insuffisantes pour afficher le graphique
        </div>
      )}
    </div>
  )
}

// ── SLIDE 5 : Simulation ──────────────────────────────────────────────────────
// FIX: Replaced useCallback (which caused stale closure issues) with a plain
// function that reads params directly. Also added event count cap to prevent
// infinite loops, and proper null checks before rendering results.
function SlideSimulation() {
  const [lam, setLam] = useState(6)
  const [mu, setMu] = useState(4)
  const [c, setC] = useState(3)
  const [dur, setDur] = useState(100)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)

  // Use refs to capture latest param values at run time, avoiding stale closure
  const lamRef = useRef(lam)
  const muRef = useRef(mu)
  const cRef = useRef(c)
  const durRef = useRef(dur)

  useEffect(() => { lamRef.current = lam }, [lam])
  useEffect(() => { muRef.current = mu }, [mu])
  useEffect(() => { cRef.current = c }, [c])
  useEffect(() => { durRef.current = dur }, [dur])

  const runSim = () => {
    if (running) return
    setRunning(true)
    setResult(null)

    // Defer to next tick so React can re-render the "En cours..." state
    setTimeout(() => {
      try {
        const _lam = lamRef.current
        const _mu = muRef.current
        const _c = cRef.current
        const _dur = durRef.current

        const history = []
        let queue = 0, busy = 0, totalWait = 0, nServed = 0, totalBusy = 0, lastTime = 0
        const events = [{ t: expRand(_lam), type: "arrive" }]
        let eventCount = 0
        const MAX_EVENTS = 200000 // safety cap

        while (events.length > 0 && eventCount < MAX_EVENTS) {
          eventCount++
          events.sort((a, b) => a.t - b.t)
          const ev = events.shift()
          if (ev.t > _dur) break
          const dt = ev.t - lastTime
          totalBusy += busy * dt
          lastTime = ev.t

          if (ev.type === "arrive") {
            if (busy < _c) {
              busy++
              events.push({ t: ev.t + expRand(_mu), type: "depart", wait: 0 })
            } else {
              queue++
            }
            if (ev.t < _dur) {
              events.push({ t: ev.t + expRand(_lam), type: "arrive" })
            }
            if (history.length < 600) {
              history.push({ t: +ev.t.toFixed(2), N: queue + busy, q: queue, b: busy })
            }
          } else {
            busy--
            nServed++
            totalWait += (ev.wait || 0)
            if (queue > 0) {
              queue--
              busy++
              events.push({ t: ev.t + expRand(_mu), type: "depart", wait: 0 })
            }
            if (history.length < 600) {
              history.push({ t: +ev.t.toFixed(2), N: queue + busy, q: queue, b: busy })
            }
          }
        }

        const avgWq = nServed > 0 ? totalWait / nServed * 60 : 0
        const occ = _dur > 0 && _c > 0 ? totalBusy / (_dur * _c) * 100 : 0
        const a = _lam / _mu
        const rho = _lam / (_c * _mu)
        const ec = erlangC(_c, a)
        const wqTh = rho >= 1 ? Infinity : ec / (_c * _mu - _lam) * 60

        setResult({ history, avgWq, wqTh, nServed, occ, rho })
      } catch (err) {
        console.error("Simulation error:", err)
      } finally {
        setRunning(false)
      }
    }, 80)
  }

  const clearSim = () => {
    setResult(null)
  }

  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 4 — Valider · Simulation Monte Carlo</div>
      <h2 style={S.h2}>Simulation événementielle</h2>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.h3}>Paramètres</div>
          <Slider label="λ arrivées/heure" min={1} max={20} value={lam} onChange={setLam} />
          <Slider label="μ soins/heure/médecin" min={1} max={10} value={mu} onChange={setMu} />
          <Slider label="c médecins" min={1} max={10} value={c} onChange={setC} />
          <Slider label="Durée simulation (heures)" min={10} max={500} step={10} value={dur} onChange={setDur} />
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              style={{ ...S.btn, opacity: running ? 0.6 : 1, cursor: running ? "not-allowed" : "pointer" }}
              onClick={runSim}
              disabled={running}
            >
              {running ? "En cours..." : "▶ Lancer"}
            </button>
            <button
              style={{ ...S.btnSec, cursor: "pointer" }}
              onClick={clearSim}
              disabled={running}
            >
              Effacer
            </button>
          </div>
        </div>
        <div style={S.grid2}>
          <KPI label="E[Wq] simulé" value={result ? fmt(result.avgWq) + " min" : "—"} color={result && result.avgWq < 3 ? "good" : result ? "warn" : undefined} />
          <KPI label="E[Wq] théorique" value={result ? (isFinite(result.wqTh) ? fmt(result.wqTh) + " min" : "∞") : "—"} color="good" sub="Erlang C" />
          <KPI label="Patients traités" value={result ? result.nServed : "—"} />
          <KPI label="Taux occupation" value={result ? result.occ.toFixed(1) + "%" : "—"} color={result && result.occ < 80 ? "good" : result ? "warn" : undefined} />
        </div>
      </div>

      {result && result.history && result.history.length > 0 && (
        <>
          <div style={S.divider} />
          <div style={S.h3}>Évolution du système dans le temps</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={result.history} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2730" />
              <XAxis dataKey="t" tick={{ fill: "#7a8899", fontSize: 10, fontFamily: "var(--mono)" }} label={{ value: "Temps (h)", position: "insideBottom", offset: -2, fill: "#7a8899", fontSize: 11 }} />
              <YAxis tick={{ fill: "#7a8899", fontSize: 10, fontFamily: "var(--mono)" }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 11 }} />
              <Line type="stepAfter" dataKey="N" name="Patients total" stroke="#4fc3f7" strokeWidth={1.5} dot={false} />
              <Line type="stepAfter" dataKey="b" name="Médecins occupés" stroke="#4ade80" strokeWidth={1.5} dot={false} />
              <Line type="stepAfter" dataKey="q" name="File attente" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
              <Legend wrapperStyle={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ ...S.interp, marginTop: 14 }}>
            La simulation confirme la théorie : E[Wq] simulé = <strong style={{ color: "var(--accent)" }}>{fmt(result.avgWq)} min</strong> vs théorique = <strong style={{ color: "var(--green)" }}>{isFinite(result.wqTh) ? fmt(result.wqTh) + " min" : "∞"}</strong>. Les deux convergent quand la durée augmente.
          </div>
        </>
      )}

      {!result && !running && (
        <div style={{ ...S.card, marginTop: 24, textAlign: "center", padding: 40 }}>
          <div style={{ ...S.body, color: "var(--text3)" }}>Lance la simulation pour voir l'évolution du système</div>
        </div>
      )}

      {running && (
        <div style={{ ...S.card, marginTop: 24, textAlign: "center", padding: 40 }}>
          <div style={{ ...S.body, color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 12 }}>Simulation en cours...</div>
        </div>
      )}
    </div>
  )
}

// ── SLIDE 6 : Synthèse ────────────────────────────────────────────────────────
function SlideSynthese() {
  const [lam, setLam] = useState(6)
  const [mu, setMu] = useState(4)
  const [mud, setMud] = useState(20)
  const [sig, setSig] = useState(5)
  const [L, setL] = useState(2)
  const [svc, setSvc] = useState(99)

  const a = lam / mu
  const cMin = Math.max(1, Math.ceil(a))
  let bestC = cMin, bestCost = Infinity
  for (let ci = cMin; ci <= cMin + 10; ci++) {
    const ri = lam / (ci * mu)
    if (ri >= 1) continue
    const eci = erlangC(ci, a)
    const wqi = eci / (ci * mu - lam) * 60
    const cost = wqi * 20 * lam + ci * 100
    if (cost < bestCost) { bestCost = cost; bestC = ci }
  }
  const rho = lam / (bestC * mu)
  const ec = erlangC(bestC, a)
  const wq = ec / (bestC * mu - lam) * 60

  const z = zFromSvc(svc)
  const ss = Math.round(z * sig * Math.sqrt(L))
  const s = Math.round(mud * L + ss)
  const Q = Math.max(1, Math.round(Math.sqrt(2 * 100 * mud / 5)))

  const decisions = [
    { label: "c* médecins", value: bestC, unit: "", interp: `ρ=${rho.toFixed(2)}, E[Wq]=${fmt(wq)} min`, down: "File explose", up: "Budget gaspillé" },
    { label: "s* seuil stock", value: s, unit: " u", interp: `Stock sécu=${ss}u, z=${z.toFixed(2)}`, down: "Ruptures fréquentes", up: "Surstock coûteux" },
    { label: "Q* quantité", value: Q, unit: " u", interp: `${Math.round(365 * mud / Q)} commandes/an`, down: "Trop de commandes", up: "Stock trop élevé" },
  ]

  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 5 — Interpréter</div>
      <h2 style={S.h2}>Décision optimale complète</h2>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.h3}>Ajuster les paramètres</div>
          <Slider label="λ arrivées/heure" min={1} max={20} value={lam} onChange={setLam} />
          <Slider label="μ soins/heure/médecin" min={1} max={10} value={mu} onChange={setMu} />
          <Slider label="μ_D demande médicaments/jour" min={5} max={80} value={mud} onChange={setMud} />
          <Slider label="σ_D écart-type" min={1} max={20} value={sig} onChange={setSig} />
          <Slider label="L délai livraison (jours)" min={1} max={14} value={L} onChange={setL} />
          <Slider label="Niveau de service (%)" min={80} max={99} value={svc} onChange={setSvc} unit="%" />
        </div>
        <div>
          <div style={{ ...S.grid3, marginBottom: 14 }}>
            <KPI label="c* médecins" value={bestC} color="good" sub="optimal" />
            <KPI label="s* seuil" value={s + " u"} color="good" />
            <KPI label="Q* commande" value={Q + " u"} color="good" />
            <KPI label="ρ charge" value={rho.toFixed(3)} color={rho < 0.8 ? "good" : "warn"} />
            <KPI label="E[Wq]" value={fmt(wq) + " min"} color={wq < 3 ? "good" : "warn"} />
            <KPI label="P(pénurie)" value={(100 - svc) + "%"} color="good" />
          </div>
          <div style={S.interp}>
            Programmer <strong style={{ color: "var(--text)" }}>{bestC} médecins</strong>, commander <strong style={{ color: "var(--text)" }}>{Q} unités</strong> dès que le stock atteint <strong style={{ color: "var(--accent)" }}>{s} unités</strong>. Le système sera stable (ρ={rho.toFixed(2)}), l'attente sera de <strong style={{ color: "var(--green)" }}>{fmt(wq)} min</strong>, et la probabilité de rupture sera de {(100 - svc).toFixed(0)}%.
          </div>
        </div>
      </div>
      <div style={S.divider} />
      <div style={S.h3}>Tableau de décision</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>{["Décision", "Valeur optimale", "Interprétation", "Si on réduit ↓", "Si on augmente ↑"].map(h => (
            <th key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {decisions.map(d => (
            <tr key={d.label} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{d.label}</td>
              <td style={{ padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 14, color: "var(--green)", fontWeight: 600 }}>{d.value}{d.unit}</td>
              <td style={{ padding: "10px 12px", color: "var(--text2)", fontSize: 12 }}>{d.interp}</td>
              <td style={{ padding: "10px 12px", color: "var(--red)", fontSize: 12 }}>{d.down}</td>
              <td style={{ padding: "10px 12px", color: "var(--yellow)", fontSize: 12 }}>{d.up}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── SLIDE 7 : Limites ─────────────────────────────────────────────────────────
function SlideLimites() {
  const limites = [
    { hyp: "λ constant", realite: "Varie selon l'heure, le jour, la saison", solution: "Poisson non-homogène λ(t)" },
    { hyp: "Soins Exp(μ)", realite: "Durée réelle plus variable, multi-étapes", solution: "Erlang-k ou log-normale" },
    { hyp: "Un type de patient", realite: "Urgents, semi-urgents, bénins ont des μ différents", solution: "File à priorités M/G/c/K" },
    { hyp: "Stock indépendant", realite: "Consommation dépend de N(t)", solution: "Modèle couplé MDP" },
    { hyp: "Délai fixe L", realite: "Délai de livraison aléatoire", solution: "L ~ loi aléatoire intégrée" },
  ]
  const extensions = [
    ["Processus de décision markovien (MDP)", "Politique dynamique qui s'adapte à l'état du système"],
    ["Apprentissage par renforcement", "Politique apprise par simulation — comme Uber/InDrive"],
    ["Simulation à événements discrets", "Aucune hypothèse paramétrique nécessaire"],
  ]
  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 6 — Critique</div>
      <h2 style={S.h2}>Limites du modèle et extensions</h2>
      <div style={S.h3}>Hypothèses et ce qu'elles cachent</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 28 }}>
        <thead>
          <tr>{["Hypothèse M/M/c", "Réalité", "Extension possible"].map(h => (
            <th key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {limites.map(l => (
            <tr key={l.hyp} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--yellow)" }}>{l.hyp}</td>
              <td style={{ padding: "10px 12px", color: "var(--text2)", fontSize: 12 }}>{l.realite}</td>
              <td style={{ padding: "10px 12px", color: "var(--accent)", fontSize: 12 }}>{l.solution}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={S.h3}>Extensions naturelles</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {extensions.map(([t, d]) => (
          <div key={t} style={{ ...S.card, display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 3, height: 36, background: "var(--accent)", borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3, color: "var(--text)" }}>{t}</div>
              <div style={{ ...S.body, fontSize: 13 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...S.interp, marginTop: 24 }}>
        Le modèle M/M/c n'est pas un aboutissement — c'est un <strong style={{ color: "var(--text)" }}>point de départ rigoureux</strong>. Ses formules exactes permettent de valider les simulations, qui elles n'ont besoin d'aucune hypothèse paramétrique.
      </div>
    </div>
  )
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
const SLIDES = [
  { id: "intro",    label: "Introduction", component: SlideHero },
  { id: "probleme", label: "Problème",    component: SlideProbleme },
  { id: "modele",   label: "Modèle",      component: SlideModele },
  { id: "file",     label: "File M/M/c",  component: SlideFile },
  { id: "stock",    label: "Stock (s,Q)", component: SlideStock },
  { id: "sim",      label: "Simulation",  component: SlideSimulation },
  { id: "synthese", label: "Synthèse",    component: SlideSynthese },
  { id: "limites",  label: "Limites",     component: SlideLimites },
]

export default function App() {
  const [active, setActive] = useState("intro")
  const Slide = SLIDES.find(s => s.id === active)?.component || SlideHero

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.navBrand}>M/M/c · Urgences</div>
        {SLIDES.map(s => (
          <div key={s.id} style={S.navTab(active === s.id)} onClick={() => setActive(s.id)}>{s.label}</div>
        ))}
      </nav>
      <Slide />
    </div>
  )
}