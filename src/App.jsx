import { useState, useEffect, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"


function factorial(n) {
  if (n > 20) return Infinity
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
      <div style={S.eyebrow}>Systèmes Stochastiques</div>
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
  const inputVars = [
    { sym: "λ", name: "Taux d'arrivée", unit: "patients / heure", color: "var(--red)", nature: "Aléatoire", desc: "Nombre moyen de patients qui arrivent aux urgences par unité de temps. Les arrivées suivent un processus de Poisson — elles sont indépendantes et imprévisibles. Si λ = 6, on attend 6 patients par heure en moyenne, mais la réalité oscille autour de ce chiffre.", example: "λ = 6  →  1 patient toutes les 10 min en moyenne" },
    { sym: "μ", name: "Taux de service", unit: "soins / heure / médecin", color: "var(--yellow)", nature: "Aléatoire", desc: "Capacité de traitement d'un seul médecin. μ = 4 signifie qu'un médecin peut prendre en charge 4 patients par heure, soit 15 min par patient en moyenne. La durée réelle de chaque soin est aléatoire et suit une loi exponentielle de paramètre μ.", example: "μ = 4  →  E[durée soin] = 1/μ = 15 min" },
    { sym: "c", name: "Nombre de serveurs", unit: "médecins en poste", color: "var(--accent)", nature: "Décision", desc: "Le nombre de médecins (ou guichets) simultanément disponibles. C'est la variable de décision principale du gestionnaire. Augmenter c réduit l'attente mais augmente les coûts de personnel. Trouver c* optimal est l'objectif du modèle M/M/c.", example: "c = 3  →  3 médecins traitent en parallèle" },
    { sym: "D", name: "Demande médicale", unit: "unités / jour", color: "var(--green)", nature: "Aléatoire", desc: "Quantité de médicaments, matériels ou ressources consommée chaque jour. Elle dépend du flux de patients N(t), ce qui crée un couplage entre le modèle de file d'attente et le modèle de stock. Une forte affluence entraîne une forte demande.", example: "D ~ Normal(μ_D, σ_D²)" },
  ]
  const derivedVars = [
    { sym: "a = λ/μ", name: "Charge totale offerte", unit: "Erlangs", color: "var(--accent)", desc: "Mesure l'intensité du trafic entrant en Erlangs. C'est le nombre moyen de médecins qui seraient occupés si le système avait une capacité infinie. Si a > c, le système est instable.", example: "a = 6/4 = 1.5 Erlangs" },
    { sym: "ρ = λ/(c·μ)", name: "Taux d'occupation", unit: "sans unité, ∈ [0, 1[", color: "var(--yellow)", desc: "Fraction du temps pendant laquelle chaque médecin est occupé. Condition de stabilité : ρ < 1. Si ρ = 0.8, les médecins sont occupés 80 % du temps. Plus ρ se rapproche de 1, plus la file explose.", example: "ρ = 6/(3×4) = 0.5  →  50 % d'occupation" },
    { sym: "C(c, a)", name: "Probabilité d'attente (Erlang C)", unit: "probabilité ∈ [0, 1]", color: "var(--red)", desc: "Probabilité qu'un patient arrivant doive attendre parce que tous les médecins sont occupés. Calculée par la formule d'Erlang C. Si C = 0.3, 30 % des patients attendent avant d'être pris en charge.", example: "C(3, 1.5) ≈ 0.17  →  17 % attendent" },
    { sym: "E[Wq]", name: "Temps d'attente moyen en file", unit: "minutes", color: "var(--green)", desc: "Durée moyenne qu'un patient passe à attendre avant d'être pris en charge par un médecin (hors durée des soins). Relié à Erlang C par E[Wq] = C(c,a) / (c·μ − λ). Si le système est instable, E[Wq] → ∞.", example: "E[Wq] = 2.5 min" },
    { sym: "E[W]", name: "Temps de séjour total", unit: "minutes", color: "var(--accent)", desc: "Durée totale passée par un patient dans le système, de son arrivée à sa sortie. E[W] = E[Wq] + 1/μ. C'est la somme du temps d'attente et du temps de soin.", example: "E[W] = E[Wq] + 15 min" },
    { sym: "E[N]", name: "Nombre moyen de patients", unit: "patients dans le système", color: "var(--yellow)", desc: "Nombre moyen de patients présents à tout instant dans le système (en attente + en soin). Obtenu par la Loi de Little : E[N] = λ · E[W]. Utile pour estimer la capacité physique nécessaire (nombre de lits, salles d'attente).", example: "E[N] = 6 × (E[W]/60)" },
  ]
  const [activeInput, setActiveInput] = useState(0)
  const [activeDerived, setActiveDerived] = useState(0)
  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 1 — Comprendre</div>
      <h2 style={S.h2}>Dictionnaire des variables du modèle</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {[{ label: "Patient arrive", sub: "Poisson(λ)", color: "var(--red)" }, { label: "Triage", sub: "Priorité aléatoire", color: "var(--yellow)" }, { label: "File d'attente", sub: "n patients", color: "var(--accent)" }, { label: "Soins médicaux", sub: "c médecins · Exp(μ)", color: "var(--green)" }].map((a, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...S.card, borderColor: a.color, padding: "10px 16px", minWidth: 130 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</div>
              <div style={S.tag}>{a.sub}</div>
            </div>
            {i < arr.length - 1 && <div style={{ color: "var(--text3)", fontSize: 18 }}>→</div>}
          </div>
        ))}
      </div>
      <div style={S.divider} />
      <div style={S.h3}>Variables d'entrée et de décision</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {inputVars.map((v, i) => (
          <div key={v.sym} onClick={() => setActiveInput(i)} style={{ ...S.card, cursor: "pointer", borderColor: activeInput === i ? v.color : "var(--border)", borderWidth: activeInput === i ? 2 : 1, transition: "border-color .15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 26, color: v.color, lineHeight: 1 }}>{v.sym}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 10, background: v.nature === "Aléatoire" ? "rgba(248,113,113,.12)" : "rgba(74,222,128,.12)", color: v.nature === "Aléatoire" ? "var(--red)" : "var(--green)" }}>{v.nature}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{v.name}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)" }}>{v.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--surface2)", border: `1px solid ${inputVars[activeInput].color}`, borderLeft: `3px solid ${inputVars[activeInput].color}`, borderRadius: "0 8px 8px 0", padding: "16px 20px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 32, color: inputVars[activeInput].color, lineHeight: 1 }}>{inputVars[activeInput].sym}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{inputVars[activeInput].name}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{inputVars[activeInput].unit}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 10 }}>{inputVars[activeInput].desc}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: inputVars[activeInput].color, background: "rgba(0,0,0,.15)", padding: "6px 12px", borderRadius: 4, display: "inline-block" }}>{inputVars[activeInput].example}</div>
      </div>
      <div style={S.h3}>Variables calculées (résultats du modèle)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {derivedVars.map((v, i) => (
          <div key={v.sym} onClick={() => setActiveDerived(i)} style={{ ...S.card, cursor: "pointer", borderColor: activeDerived === i ? v.color : "var(--border)", borderWidth: activeDerived === i ? 2 : 1, transition: "border-color .15s" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 15, color: v.color, marginBottom: 4 }}>{v.sym}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{v.name}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)" }}>{v.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--surface2)", border: `1px solid ${derivedVars[activeDerived].color}`, borderLeft: `3px solid ${derivedVars[activeDerived].color}`, borderRadius: "0 8px 8px 0", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: derivedVars[activeDerived].color, lineHeight: 1 }}>{derivedVars[activeDerived].sym}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{derivedVars[activeDerived].name}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{derivedVars[activeDerived].unit}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 10 }}>{derivedVars[activeDerived].desc}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: derivedVars[activeDerived].color, background: "rgba(0,0,0,.15)", padding: "6px 12px", borderRadius: 4, display: "inline-block" }}>{derivedVars[activeDerived].example}</div>
      </div>
    </div>
  )
}

// ── SLIDE 2 : Modèle ─────────────────────────────────────────────────────────
function SlideModele() {
  const [activeSection, setActiveSection] = useState("queue")
  const sections = {
    queue: {
      label: "File M/M/c", color: "var(--accent)", title: "Modèle de file d'attente M/M/c",
      blocks: [
        { sym: "M", label: "Markovien (arrivées)", formula: "P(N(t)=k) = (λt)ᵏ · e⁻λᵗ / k!", color: "var(--red)", what: "Ce que ça modélise", whatText: "Les arrivées de patients suivent un processus de Poisson. Le premier « M » de M/M/c signifie que les temps inter-arrivées sont exponentiels de paramètre λ.", why: "Pourquoi ce choix", whyText: "La loi exponentielle possède la propriété d'absence de mémoire : la probabilité qu'un patient arrive dans la prochaine minute ne dépend pas du temps écoulé depuis la dernière arrivée.", vars: [{ sym: "λ", desc: "Taux moyen d'arrivée (patients/heure)" }, { sym: "t", desc: "Durée de la fenêtre d'observation" }, { sym: "k", desc: "Nombre de patients observés" }] },
        { sym: "M", label: "Markovien (service)", formula: "S ~ Exp(μ)  →  E[S] = 1/μ", color: "var(--yellow)", what: "Ce que ça modélise", whatText: "La durée de chaque soin est aléatoire et suit une loi exponentielle de taux μ. Un soin dure 15 min en moyenne, mais peut durer 2 min ou 2 heures selon la gravité.", why: "Pourquoi ce choix", whyText: "La loi exponentielle capture bien la forte variabilité des actes médicaux. Elle est aussi memoryless, ce qui maintient la propriété de Markov.", vars: [{ sym: "μ", desc: "Taux de service d'un médecin (soins/heure)" }, { sym: "1/μ", desc: "Durée moyenne d'un soin" }, { sym: "S", desc: "Variable aléatoire — durée d'un soin" }] },
        { sym: "c", label: "Serveurs parallèles", formula: "c ≥ ⌈a⌉ = ⌈λ/μ⌉  pour la stabilité", color: "var(--accent)", what: "Ce que ça modélise", whatText: "c est le nombre de médecins travaillant en parallèle. Chaque médecin traite les patients indépendamment avec le même taux μ. La capacité totale du système est c · μ.", why: "Comment le choisir", whyText: "c est la variable de décision centrale. Il faut impérativement que ρ = λ/(c·μ) < 1. En dessous de ce seuil, la file grossit sans limite.", vars: [{ sym: "c", desc: "Nombre de médecins actifs (décision)" }, { sym: "c·μ", desc: "Taux de service total du système" }, { sym: "ρ = λ/(c·μ)", desc: "Taux d'occupation (doit être < 1)" }] },
      ],
    },
    erlang: {
      label: "Formules clés", color: "var(--green)", title: "Les formules analytiques du modèle",
      blocks: [
        { sym: "C(c,a)", label: "Formule d'Erlang C", formula: "C(c,a) = [aᶜ/c! · 1/(1−ρ)] / [Σₖ₌₀ᶜ⁻¹ aᵏ/k! + aᶜ/c!·1/(1−ρ)]", color: "var(--red)", what: "Ce que ça calcule", whatText: "La probabilité qu'un patient arrivant trouve tous les médecins occupés et doive attendre. C'est le résultat clé de la théorie des files M/M/c.", why: "Grandeurs nécessaires", whyText: "Il suffit de connaître a = λ/μ et c. Le résultat donne directement la probabilité d'attente, sans simulation.", vars: [{ sym: "a = λ/μ", desc: "Charge totale offerte en Erlangs" }, { sym: "c", desc: "Nombre de médecins" }, { sym: "ρ = a/c", desc: "Taux d'occupation (< 1 requis)" }] },
        { sym: "E[Wq]", label: "Attente moyenne en file", formula: "E[Wq] = C(c,a) / (c·μ − λ)", color: "var(--yellow)", what: "Ce que ça calcule", whatText: "Le temps moyen qu'un patient passe dans la salle d'attente avant d'être vu par un médecin. Proportionnel à Erlang C.", why: "Intuition du dénominateur", whyText: "c·μ − λ est le débit net de traitement. Plus ce débit est grand, plus l'attente est courte. Quand λ → c·μ, l'attente tend vers l'infini.", vars: [{ sym: "C(c,a)", desc: "Probabilité d'attente (Erlang C)" }, { sym: "c·μ − λ", desc: "Débit net excédentaire du système" }] },
        { sym: "E[N]", label: "Loi de Little", formula: "E[N] = λ · E[W]  où  E[W] = E[Wq] + 1/μ", color: "var(--green)", what: "Ce que ça calcule", whatText: "Le nombre moyen de patients présents dans le système à tout instant. La Loi de Little est universelle : elle s'applique à tout système stable.", why: "Utilité pratique", whyText: "E[N] permet d'estimer le nombre de lits nécessaires. Si E[N] = 4.2, prévoir au minimum 5 places.", vars: [{ sym: "λ", desc: "Taux d'arrivée" }, { sym: "E[W]", desc: "Séjour total = attente + soin" }, { sym: "E[N]", desc: "Nombre moyen de patients dans le système" }] },
      ],
    },
    stock: {
      label: "Stock (s,Q)", color: "var(--yellow)", title: "Modèle de gestion de stock (s*, Q*)",
      blocks: [
        { sym: "s*", label: "Seuil de réapprovisionnement", formula: "s* = μ_D · L  +  z_α · σ_D · √L", color: "var(--accent)", what: "Ce que ça calcule", whatText: "Le niveau de stock en dessous duquel on déclenche une commande. s* est la somme de la demande attendue pendant le délai de livraison et d'un stock de sécurité.", why: "Décomposition du seuil", whyText: "μ_D · L est la part systématique. z_α · σ_D · √L est le stock de sécurité qui couvre l'incertitude. z_α dépend du niveau de service cible.", vars: [{ sym: "μ_D", desc: "Demande moyenne par jour" }, { sym: "L", desc: "Délai de livraison (jours)" }, { sym: "σ_D", desc: "Écart-type de la demande journalière" }, { sym: "z_α", desc: "Quantile normal au niveau de service α" }] },
        { sym: "Q*", label: "Quantité économique de commande", formula: "Q* = √(2 · K · μ_D / h)", color: "var(--yellow)", what: "Ce que ça calcule", whatText: "La quantité optimale à commander à chaque réapprovisionnement. Q* minimise la somme du coût de stockage et du coût de passation de commande.", why: "Le trade-off", whyText: "Grandes commandes → moins de passations (économie sur K) mais plus de stock (coût h élevé). Q* est exactement le point d'équilibre.", vars: [{ sym: "K", desc: "Coût fixe par commande (€)" }, { sym: "μ_D", desc: "Demande moyenne par jour" }, { sym: "h", desc: "Coût de stockage par unité par jour (€)" }] },
        { sym: "z_α", label: "Quantile du niveau de service", formula: "P(D_L ≤ s*) = α  →  z_α = Φ⁻¹(α)", color: "var(--green)", what: "Ce que ça calcule", whatText: "z_α est le nombre d'écarts-types à ajouter au-dessus de la moyenne pour garantir que la demande ne dépasse le stock que dans (1−α)% des cycles.", why: "Exemples concrets", whyText: "α = 95 % → z = 1.65 (5 % de risque). α = 99 % → z = 2.33 (1 % de risque). Plus α est élevé, plus le stock de sécurité augmente.", vars: [{ sym: "α", desc: "Niveau de service cible (ex. 0.99)" }, { sym: "Φ⁻¹", desc: "Fonction quantile de la loi normale standard" }, { sym: "D_L", desc: "Demande cumulée sur L jours" }] },
      ],
    },
  }
  const sec = sections[activeSection]
  return (
    <div style={S.slide}>
      <div style={S.eyebrow}>Étape 2 — Modéliser</div>
      <h2 style={S.h2}>Construction et variables du modèle</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {Object.entries(sections).map(([key, s]) => (
          <div key={key} onClick={() => setActiveSection(key)} style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 18px", borderRadius: 6, cursor: "pointer", background: activeSection === key ? s.color : "var(--surface)", color: activeSection === key ? "var(--bg)" : "var(--text2)", border: `1px solid ${activeSection === key ? s.color : "var(--border)"}`, transition: "all .15s" }}>{s.label}</div>
        ))}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: sec.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>{sec.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sec.blocks.map((b, i) => (
          <div key={i} style={{ ...S.card, borderLeft: `3px solid ${b.color}`, borderRadius: "0 8px 8px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 28, color: b.color, lineHeight: 1 }}>{b.sym}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{b.label}</div>
                </div>
                <div style={{ background: "rgba(0,0,0,.2)", borderRadius: 6, padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 12, color: b.color, lineHeight: 1.8, marginBottom: 12 }}>{b.formula}</div>
                <div style={{ ...S.h3, marginBottom: 8, fontSize: 9 }}>Variables impliquées</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {b.vars.map((v, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: b.color, minWidth: 90, flexShrink: 0 }}>{v.sym}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>{v.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{b.what}</div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 14 }}>{b.whatText}</div>
                <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{b.why}</div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{b.whyText}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={S.divider} />
      <div style={S.h3}>Objectif global — minimiser le coût espéré total</div>
      <div style={S.formulaBox}>
        min E[ α · E[Wq]  +  h · X_t  +  p · max(0, D_t − X_t) ]<br />
        <span style={{ color: "var(--text2)", fontSize: 11 }}>{"  "}α · E[Wq] = coût du temps d'attente{"  "}|{"  "}h · X_t = coût de stockage{"  "}|{"  "}p · max(…) = coût de pénurie</span>
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
  const chartData = rows.map(r => ({ c: `c=${r.c}`, wq: isFinite(r.wq) ? +r.wq.toFixed(2) : null, cost: isFinite(r.cost) ? Math.round(r.cost) : null }))
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
          <div style={S.formulaBox}>ρ = {lam}/{c}×{mu} = {rho.toFixed(3)}<br />a = λ/μ = {lam}/{mu} = {a.toFixed(2)} Erlangs</div>
          <div style={{ marginTop: 10 }}><span style={S.badge(rhoClass)}>{rho >= 1 ? "● INSTABLE ρ ≥ 1" : rho >= 0.8 ? `● ATTENTION ρ=${rho.toFixed(2)}` : `● STABLE ρ=${rho.toFixed(2)}`}</span></div>
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
          <div style={S.interp}>{rho >= 1 ? <span>Système <strong style={{ color: "var(--red)" }}>instable</strong>. Il faut au minimum <strong style={{ color: "var(--text)" }}>{Math.ceil(a) + 1} médecins</strong>.</span> : <span>Avec <strong style={{ color: "var(--text)" }}>{c} médecin(s)</strong>, occupation <strong style={{ color: "var(--text)" }}>{(rho * 100).toFixed(0)}%</strong>. Attente : <strong style={{ color: "var(--accent)" }}>{fmt(wq)} min</strong>. {(ec * 100).toFixed(0)}% des patients attendent.</span>}</div>
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
  const safeH = h > 0 ? h : 1
  const Q = Math.max(1, Math.round(Math.sqrt(2 * K * mud / safeH)))
  const nOrders = +(365 * mud / Q).toFixed(1)
  const costAnnuel = Math.round(nOrders * K + (Q / 2 + ss) * safeH * 365)
  const chartData = []
  for (let qi = Math.max(1, Q - 40); qi <= Q + 60; qi += 5) {
    const holding = (qi / 2 + ss) * safeH * 365
    const ordering = (365 * mud / qi) * K
    if (isFinite(holding) && isFinite(ordering)) chartData.push({ Q: qi, stockage: Math.round(holding), commande: Math.round(ordering), total: Math.round(holding + ordering) })
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
          <div style={S.formulaBox}>s* = μ_D·L + z_α·σ_D·√L<br />{"   "}= {mud}×{L} + {z.toFixed(2)}×{sig}×√{L} = <strong>{s}</strong><br />Q* = √(2·K·μ_D/h)<br />{"   "}= √(2×{K}×{mud}/{h}) = <strong>{Q}</strong></div>
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
          <div style={S.interp}>Commander <strong style={{ color: "var(--text)" }}>{Q} unités</strong> dès que le stock atteint <strong style={{ color: "var(--accent)" }}>{s} unités</strong>. Stock de sécurité : <strong style={{ color: "var(--text)" }}>{ss} unités</strong>. Probabilité de pénurie : <strong style={{ color: "var(--green)" }}>{(100 - svc).toFixed(0)}%</strong>.</div>
        </div>
      </div>
      <div style={S.divider} />
      <div style={S.h3}>Coût total selon Q — minimum en Q*</div>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2730" />
          <XAxis dataKey="Q" tick={{ fill: "#7a8899", fontSize: 11, fontFamily: "var(--mono)" }} />
          <YAxis tick={{ fill: "#7a8899", fontSize: 11, fontFamily: "var(--mono)" }} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 12 }} />
          <Line type="monotone" dataKey="stockage" name="Stockage (€)" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="commande" name="Commande (€)" stroke="#f87171" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="total" name="Total (€)" stroke="#4fc3f7" strokeWidth={2} dot={false} />
          <Legend wrapperStyle={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── SLIDE 5 : Simulation ──────────────────────────────────────────────────────
function SlideSimulation() {
  const [lam, setLam] = useState(6)
  const [mu, setMu] = useState(4)
  const [c, setC] = useState(3)
  const [dur, setDur] = useState(100)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)

  const lamRef = useRef(lam)
  const muRef  = useRef(mu)
  const cRef   = useRef(c)
  const durRef = useRef(dur)
  useEffect(() => { lamRef.current = lam }, [lam])
  useEffect(() => { muRef.current  = mu  }, [mu])
  useEffect(() => { cRef.current   = c   }, [c])
  useEffect(() => { durRef.current = dur }, [dur])

  const runSim = () => {
    if (running) return
    setRunning(true)
    setResult(null)
    setTimeout(() => {
      try {
        const _lam = lamRef.current
        const _mu  = muRef.current
        const _c   = cRef.current
        const _dur = durRef.current

        // ── Correct event-driven M/M/c simulation ──
        // State:
        //   busy      : number of doctors currently serving (0..c)
        //   queue     : FIFO of patient arrival times waiting for a doctor
        //   events    : list of {t, type} sorted by time
        // Key insight: wait = depart_event.t - patient_arrival_time
        //              calculated at the moment a doctor becomes free (depart event)

        let busy = 0
        const queue = []        // arrival times of queued patients (FIFO)
        let totalWait = 0
        let nServed = 0
        let totalBusy = 0
        let lastTime = 0
        const history = []

        const events = [{ t: expRand(_lam), type: 'arrive' }]
        let iter = 0
        const MAX_ITER = 500000

        while (events.length > 0 && iter < MAX_ITER) {
          iter++
          // find min-time event (simple sort — fast enough for this size)
          events.sort((a, b) => a.t - b.t)
          const ev = events.shift()
          if (ev.t > _dur) break

          // accumulate busy-doctor-time since last event
          totalBusy += busy * (ev.t - lastTime)
          lastTime = ev.t

          if (ev.type === 'arrive') {
            // schedule next arrival immediately
            events.push({ t: ev.t + expRand(_lam), type: 'arrive' })

            if (busy < _c) {
              // doctor free → serve now, wait = 0
              busy++
              nServed++
              // totalWait += 0 (no wait)
              events.push({ t: ev.t + expRand(_mu), type: 'depart' })
            } else {
              // all busy → join queue with arrival timestamp
              queue.push(ev.t)
            }

          } else {
            // depart: a doctor just freed up
            busy--
            if (queue.length > 0) {
              // pull next patient from queue
              const arrivalTime = queue.shift()
              const wait = ev.t - arrivalTime   // real wait in hours
              totalWait += wait
              nServed++
              busy++
              events.push({ t: ev.t + expRand(_mu), type: 'depart' })
            }
          }

          // record snapshot for chart (max 600 points)
          if (history.length < 600) {
            history.push({ t: +ev.t.toFixed(2), N: busy + queue.length, q: queue.length, b: busy })
          }
        }

        // final metrics
        const avgWq = nServed > 0 ? (totalWait / nServed) * 60 : 0   // hours → minutes
        const occ   = _dur > 0 && _c > 0 ? (totalBusy / (_dur * _c)) * 100 : 0
        const a     = _lam / _mu
        const rho   = _lam / (_c * _mu)
        const ec    = erlangC(_c, a)
        const wqTh  = rho >= 1 ? Infinity : ec / (_c * _mu - _lam) * 60

        setResult({ history, avgWq, wqTh, nServed, occ, rho })
      } catch (err) {
        console.error("Simulation error:", err)
      } finally {
        setRunning(false)
      }
    }, 80)
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
            <button style={{ ...S.btn, opacity: running ? 0.6 : 1, cursor: running ? "not-allowed" : "pointer" }} onClick={runSim} disabled={running}>{running ? "En cours..." : "▶ Lancer"}</button>
            <button style={{ ...S.btnSec, cursor: "pointer" }} onClick={() => setResult(null)} disabled={running}>Effacer</button>
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
            Simulation validée : E[Wq] simulé = <strong style={{ color: "var(--accent)" }}>{fmt(result.avgWq)} min</strong> vs théorique Erlang C = <strong style={{ color: "var(--green)" }}>{isFinite(result.wqTh) ? fmt(result.wqTh) + " min" : "∞"}</strong>. Les deux valeurs convergent quand la durée augmente.
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
          <div style={S.interp}>Programmer <strong style={{ color: "var(--text)" }}>{bestC} médecins</strong>, commander <strong style={{ color: "var(--text)" }}>{Q} unités</strong> dès que le stock atteint <strong style={{ color: "var(--accent)" }}>{s} unités</strong>. Système stable (ρ={rho.toFixed(2)}), attente <strong style={{ color: "var(--green)" }}>{fmt(wq)} min</strong>, rupture &lt; {(100 - svc).toFixed(0)}%.</div>
        </div>
      </div>
      <div style={S.divider} />
      <div style={S.h3}>Tableau de décision</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{["Décision", "Valeur optimale", "Interprétation", "Si on réduit ↓", "Si on augmente ↑"].map(h => (<th key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>{h}</th>))}</tr></thead>
        <tbody>{decisions.map(d => (<tr key={d.label} style={{ borderBottom: "1px solid var(--border)" }}><td style={{ padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)" }}>{d.label}</td><td style={{ padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 14, color: "var(--green)", fontWeight: 600 }}>{d.value}{d.unit}</td><td style={{ padding: "10px 12px", color: "var(--text2)", fontSize: 12 }}>{d.interp}</td><td style={{ padding: "10px 12px", color: "var(--red)", fontSize: 12 }}>{d.down}</td><td style={{ padding: "10px 12px", color: "var(--yellow)", fontSize: 12 }}>{d.up}</td></tr>))}</tbody>
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
        <thead><tr>{["Hypothèse M/M/c", "Réalité", "Extension possible"].map(h => (<th key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>{h}</th>))}</tr></thead>
        <tbody>{limites.map(l => (<tr key={l.hyp} style={{ borderBottom: "1px solid var(--border)" }}><td style={{ padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--yellow)" }}>{l.hyp}</td><td style={{ padding: "10px 12px", color: "var(--text2)", fontSize: 12 }}>{l.realite}</td><td style={{ padding: "10px 12px", color: "var(--accent)", fontSize: 12 }}>{l.solution}</td></tr>))}</tbody>
      </table>
      <div style={S.h3}>Extensions naturelles</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {extensions.map(([t, d]) => (<div key={t} style={{ ...S.card, display: "flex", gap: 16, alignItems: "flex-start" }}><div style={{ width: 3, height: 36, background: "var(--accent)", borderRadius: 2, flexShrink: 0, marginTop: 2 }} /><div><div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3, color: "var(--text)" }}>{t}</div><div style={{ ...S.body, fontSize: 13 }}>{d}</div></div></div>))}
      </div>
      <div style={{ ...S.interp, marginTop: 24 }}>Le modèle M/M/c n'est pas un aboutissement — c'est un <strong style={{ color: "var(--text)" }}>point de départ rigoureux</strong>. Ses formules exactes permettent de valider les simulations, qui elles n'ont besoin d'aucune hypothèse paramétrique.</div>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
const SLIDES = [
  { id: "intro",    label: "Introduction", component: SlideHero },
  { id: "probleme", label: "Problème",     component: SlideProbleme },
  { id: "modele",   label: "Modèle",       component: SlideModele },
  { id: "file",     label: "File M/M/c",   component: SlideFile },
  { id: "stock",    label: "Stock (s,Q)",  component: SlideStock },
  { id: "sim",      label: "Simulation",   component: SlideSimulation },
  { id: "synthese", label: "Synthèse",     component: SlideSynthese },
  { id: "limites",  label: "Limites",      component: SlideLimites },
]

export default function App() {
  const [active, setActive] = useState("intro")
  const Slide = SLIDES.find(s => s.id === active)?.component || SlideHero
  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.navBrand}>M/M/c · Urgences</div>
        {SLIDES.map(s => (<div key={s.id} style={S.navTab(active === s.id)} onClick={() => setActive(s.id)}>{s.label}</div>))}
      </nav>
      <Slide />
    </div>
  )
}