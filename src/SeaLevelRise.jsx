import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   SEA LEVEL RISE — 1P / 2P climate-conflict card game
   ═══════════════════════════════════════════════════════════ */

const S = 34;
const ax2px = (q, r) => ({ x: S * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r), y: S * (3 / 2 * r) });
const hexPts = (cx, cy, sz) => { const p = []; for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 6; p.push(`${cx + sz * Math.cos(a)},${cy + sz * Math.sin(a)}`); } return p.join(" "); };

// ── MAPS ─────────────────────────────────────────────────
const MAP_1P = [
  { q:0,r:0,id:"center",ctrl:"gov",edge:0 },
  { q:1,r:-1,id:"ne1",ctrl:"gov",edge:1 },{ q:1,r:0,id:"e1",ctrl:"contested",edge:1 },{ q:0,r:1,id:"se1",ctrl:"nlf",edge:1 },
  { q:-1,r:1,id:"sw1",ctrl:"contested",edge:1 },{ q:-1,r:0,id:"w1",ctrl:"gov",edge:1 },{ q:0,r:-1,id:"nw1",ctrl:"gov",edge:1 },
  { q:2,r:-2,id:"ne2",ctrl:"gov",edge:2 },{ q:2,r:-1,id:"ene",ctrl:"gov",edge:2 },{ q:2,r:0,id:"e2",ctrl:"nlf",edge:2 },
  { q:1,r:1,id:"ese",ctrl:"nlf",edge:2 },{ q:0,r:2,id:"se2",ctrl:"nlf",edge:2 },{ q:-1,r:2,id:"sse",ctrl:"nlf",edge:2 },
  { q:-2,r:2,id:"sw2",ctrl:"contested",edge:2 },{ q:-2,r:1,id:"wsw",ctrl:"contested",edge:2 },{ q:-2,r:0,id:"w2",ctrl:"gov",edge:2 },
  { q:-1,r:-1,id:"wnw",ctrl:"gov",edge:2 },{ q:0,r:-2,id:"nw2",ctrl:"gov",edge:2 },{ q:1,r:-2,id:"nne",ctrl:"contested",edge:2 },
  { q:-2,r:-1,id:"extra",ctrl:"contested",edge:3 },
];
const MAP_2P = [
  { q:0,r:0,id:"center",ctrl:"contested",edge:0 },
  { q:1,r:-1,id:"ne1",ctrl:"gov",edge:1 },{ q:1,r:0,id:"e1",ctrl:"nlf",edge:1 },{ q:0,r:1,id:"se1",ctrl:"nlf",edge:1 },
  { q:-1,r:1,id:"sw1",ctrl:"contested",edge:1 },{ q:-1,r:0,id:"w1",ctrl:"gov",edge:1 },{ q:0,r:-1,id:"nw1",ctrl:"gov",edge:1 },
  { q:2,r:-2,id:"ne2",ctrl:"gov",edge:2 },{ q:2,r:-1,id:"ene",ctrl:"gov",edge:2 },{ q:2,r:0,id:"e2",ctrl:"nlf",edge:2 },
  { q:1,r:1,id:"ese",ctrl:"nlf",edge:2 },{ q:0,r:2,id:"se2",ctrl:"nlf",edge:2 },{ q:-1,r:2,id:"sse",ctrl:"nlf",edge:2 },
  { q:-2,r:2,id:"sw2",ctrl:"contested",edge:2 },{ q:-2,r:1,id:"wsw",ctrl:"contested",edge:2 },{ q:-2,r:0,id:"w2",ctrl:"gov",edge:2 },
  { q:-1,r:-1,id:"wnw",ctrl:"gov",edge:2 },{ q:0,r:-2,id:"nw2",ctrl:"contested",edge:2 },{ q:1,r:-2,id:"nne",ctrl:"contested",edge:2 },
  { q:-2,r:-1,id:"extra",ctrl:"nlf",edge:3 },
];

const C = { gov:"#22c55e", nlf:"#ef4444", contested:"#eab308", neutral:"#eab308", intl:"#60a5fa", sea:"#1e4060" };
const ICONS = { gov:"🏛️", nlf:"🚩", contested:"⚔️", neutral:"⚔️", intl:"🇺🇳", sea:"🌊" };
const PLAYER_LABEL = { gov: "🏛️ Government", nlf: "🚩 Insurgents" };

// ── SHARED CARDS (27) ────────────────────────────────────
const SHARED_CARDS = [
  { id:"L1",tier:"low",title:"Public Health Campaign",situation:"A waterborne disease spreads through displacement camps. A vaccination drive is proposed.",win:"Campaign succeeds. Population trust rises.",winHex:1,winFrom:"contested",lose:"Vaccines diverted. The other side distributes medicine instead.",loseHex:1,loseTo:"enemy",reading:"Cusato: whose crisis management becomes visible? Parallel governance challenges the state's monopoly on care." },
  { id:"L2",tier:"low",title:"Media Strategy",situation:"An international journalist requests access to your territory.",win:"Favourable coverage. International sympathy increases.",winHex:1,winFrom:"contested",lose:"The journalist documents harm in your areas.",loseHex:1,loseTo:"contested",reading:"Cusato: the politics of visibility. Media access determines whose violence is seen and condemned." },
  { id:"L3",tier:"low",title:"Diplomatic Reception",situation:"A regional power invites you to a bilateral summit. Your enemy's backers will be present.",win:"You secure a trade deal and intelligence on enemy supply lines.",winHex:1,winFrom:"enemy",lose:"The summit produces nothing. Your attendance is spun as desperation.",loseHex:1,loseTo:"contested",reading:"Farrell & Newman: diplomatic summits are information network nodes. Intelligence is a panopticon effect." },
  { id:"L4",tier:"low",title:"Infrastructure Repair",situation:"The main desalination plant is failing. Coastal communities depend on it.",win:"Plant restored. Communities stabilise.",winHex:1,winFrom:"contested",lose:"Repairs stall. Residents migrate to contested zones.",loseHex:1,loseTo:"contested",reading:"Wainwright & Mann: who provides climate infrastructure exercises sovereign authority." },
  { id:"L5",tier:"low",title:"Refugee Registration",situation:"The UN wants to conduct a census of displaced populations in your territory.",win:"Census completed. International aid increases.",winHex:1,winFrom:"contested",lose:"Census reveals your figures were inflated. Credibility drops.",loseHex:1,loseTo:"enemy",reading:"Cusato: data is never neutral. The census decides who is a 'refugee' and who is a 'threat.'" },
  { id:"L6",tier:"low",title:"Local Ceasefire",situation:"An enemy commander offers a local ceasefire in exchange for humanitarian access.",win:"Ceasefire holds. Tensions ease.",winHex:1,winFrom:"contested",lose:"The ceasefire is a stalling tactic. Enemy rearms.",loseHex:1,loseTo:"enemy",reading:"Wainwright & Mann: local ceasefires represent Behemoth — fragmented authority." },
  { id:"L7",tier:"low",title:"Climate Summit",situation:"You're invited to speak at an international climate adaptation conference.",win:"Your speech reframes the crisis as a global responsibility.",winHex:1,winFrom:"contested",lose:"Activists confront you. Media coverage is hostile.",loseHex:1,loseTo:"contested",reading:"Mai: the summit is where the narrative of crisis and transformation is constructed." },
  { id:"L8",tier:"low",title:"Tax Collection",situation:"Your treasury is depleted. You attempt to collect taxes from businesses in your territory.",win:"Revenue stabilises. Services continue.",winHex:1,winFrom:"contested",lose:"Businesses relocate to enemy territory where taxes are lower.",loseHex:1,loseTo:"enemy",reading:"Wainwright & Mann: taxation is the material foundation of sovereignty." },
  { id:"L9",tier:"low",title:"Reopen Schools",situation:"You propose reopening schools in recently stabilised areas.",win:"Schools reopen. Families return.",winHex:1,winFrom:"contested",lose:"A mortar hits a school. The propaganda is devastating.",loseHex:1,loseTo:"contested",reading:"Cusato: reopening schools is counter-securitisation. The attack re-securitises the space." },
  { id:"M1",tier:"med",title:"Arms Deal",situation:"A foreign power offers weapons in exchange for exclusive port access. A rival power will retaliate.",win:"Weapons arrive. Military capacity surges.",winHex:2,winFrom:"enemy",lose:"The rival power retaliates with banking sanctions.",loseHex:2,loseTo:"contested",reading:"Farrell & Newman: the port is a chokepoint. The sanctions are weaponised interdependence." },
  { id:"M2",tier:"med",title:"Mineral Discovery",situation:"Geologists report lithium deposits under contested territory. Multiple states are interested.",win:"You secure extraction rights and investment.",winHex:2,winFrom:"contested",lose:"The enemy gets there first, backed by a rival power.",loseHex:2,loseTo:"enemy",reading:"Leonelli: critical raw materials at the intersection of climate and security." },
  { id:"M3",tier:"med",title:"Security Council Resolution",situation:"A draft UN resolution would authorise humanitarian intervention on the island.",win:"The resolution includes sovereignty protections. Aid on your terms.",winHex:2,winFrom:"contested",lose:"The resolution passes with enforcement. Peacekeepers deploy.",loseHex:2,loseTo:"intl",reading:"Wainwright & Mann: Climate Leviathan — planetary sovereign authority overriding yours." },
  { id:"M4",tier:"med",title:"Military Operation",situation:"Intelligence suggests the enemy's command post is lightly defended.",win:"The command post falls. Enemy coordination fractures.",winHex:2,winFrom:"enemy",lose:"It was a trap. Heavy casualties.",loseHex:2,loseTo:"enemy",reading:"Cusato: military operations as securitisation — a military solution to a climate crisis." },
  { id:"M5",tier:"med",title:"Diaspora Bonds",situation:"Your finance minister proposes bonds to the diaspora. It requires international banking access.",win:"Diaspora invests heavily. Treasury fills.",winHex:2,winFrom:"contested",lose:"Banking system flags transactions. Funds frozen.",loseHex:2,loseTo:"contested",reading:"Farrell & Newman: SWIFT as panopticon and chokepoint." },
  { id:"M6",tier:"med",title:"Environmental Accord",situation:"The enemy proposes a joint environmental protection zone — no fighting, shared conservation.",win:"The accord holds. A model for peace talks.",winHex:2,winFrom:"contested",lose:"The enemy uses the zone to smuggle weapons.",loseHex:2,loseTo:"enemy",reading:"Cusato: 'climatisation' of security. Mai: the accord promises transformation but may reproduce power dynamics." },
  { id:"M7",tier:"med",title:"Foreign Naval Base",situation:"A major power offers a naval base — protection from enemy sea routes, but permanent foreign presence.",win:"Enemy sea routes cut. Pressure eases.",winHex:2,winFrom:"enemy",lose:"The foreign power uses the base for its own purposes.",loseHex:2,loseTo:"intl",reading:"Farrell & Newman: your coastline becomes someone else's chokepoint." },
  { id:"M8",tier:"med",title:"Cyber Operation",situation:"Your intelligence service can launch a cyberattack on the enemy's communication network.",win:"Enemy communications collapse.",winHex:2,winFrom:"enemy",lose:"Attack traced to you. International condemnation.",loseHex:2,loseTo:"contested",reading:"Farrell & Newman: digital infrastructure as a theatre of coercion." },
  { id:"M9",tier:"med",title:"Truth Commission",situation:"International pressure mounts for a truth and reconciliation process.",win:"You shape the narrative. Past abuses acknowledged on your terms.",winHex:2,winFrom:"contested",lose:"Testimony implicates your officials. Arrest warrants follow.",loseHex:2,loseTo:"intl",reading:"Cusato: accountability determines whose violence is visible." },
  { id:"H1",tier:"high",title:"Full Military Offensive",situation:"A large-scale assault on enemy territory. Total commitment.",win:"Enemy forces collapse. Massive territorial gain.",winHex:3,winFrom:"enemy",lose:"Offensive stalls. Casualties mount. Enemy counter-attacks.",loseHex:3,loseTo:"enemy",reading:"Cusato: the ultimate securitisation move — military force as the answer to a climate crisis." },
  { id:"H2",tier:"high",title:"State of Emergency",situation:"Emergency powers — curfews, suspended liberties, military rule.",win:"Dissent suppressed. Control tightens.",winHex:3,winFrom:"contested",lose:"Mass protests erupt. International isolation deepens.",loseHex:3,loseTo:"enemy",reading:"Wainwright & Mann: Climate Leviathan. Schmitt's state of exception." },
  { id:"H3",tier:"high",title:"Nationalise Foreign Assets",situation:"Foreign companies control critical infrastructure. You can seize it.",win:"You control infrastructure. Self-sufficiency rises.",winHex:3,winFrom:"contested",lose:"Foreign governments retaliate. Sanctions hit.",loseHex:3,loseTo:"contested",reading:"Farrell & Newman: nationalisation attempts to escape chokepoint vulnerability. Wainwright & Mann: Climate Behemoth." },
  { id:"H4",tier:"high",title:"Secret Alliance",situation:"A dissident enemy commander offers to defect — in exchange for amnesty and a position.",win:"The enemy splits. Defecting faction joins you.",winHex:3,winFrom:"enemy",lose:"Double agent. The 'defection' was a Trojan horse.",loseHex:3,loseTo:"enemy",reading:"Wainwright & Mann: sovereign formations are unstable. Alliances are bets on which order prevails." },
  { id:"H5",tier:"high",title:"Invite Foreign Intervention",situation:"You formally request military assistance from a major power. On their terms.",win:"Foreign troops push back the enemy.",winHex:3,winFrom:"enemy",lose:"The foreign power pursues its own agenda. They don't leave.",loseHex:3,loseTo:"intl",reading:"Wainwright & Mann: inviting Leviathan. Farrell & Newman: the intervener gains panopticon access." },
  { id:"H6",tier:"high",title:"Naval Blockade",situation:"You blockade the enemy coastline. Nothing in, nothing out.",win:"Enemy supply lines collapse. Territory falls.",winHex:3,winFrom:"enemy",lose:"Starving civilians go viral. ICC opens investigation.",loseHex:3,loseTo:"intl",reading:"Cusato: blockade as structural violence. Farrell & Newman: physical chokepoint effects." },
  { id:"H7",tier:"high",title:"Climate Reparations Claim",situation:"A climate reparations claim at the ICJ. Unprecedented.",win:"ICJ rules in your favour. Massive legitimacy surge.",winHex:3,winFrom:"contested",lose:"Case dismissed. Major powers now hostile.",loseHex:3,loseTo:"contested",reading:"Mai: can international law deliver structural transformation?" },
  { id:"H8",tier:"high",title:"Scorched Earth",situation:"Enemy advances. You propose destroying infrastructure in retreating areas.",win:"Enemy advance halts. No infrastructure to hold.",winHex:3,winFrom:"enemy",lose:"Indiscriminate destruction. Massive civilian casualties.",loseHex:3,loseTo:"enemy",reading:"Cusato: environmental destruction as violence." },
  { id:"H9",tier:"high",title:"Constitutional Referendum",situation:"A referendum on a new constitution — power-sharing, autonomy, environmental rights.",win:"Passes. Legitimacy soars. Some enemy regions rejoin.",winHex:3,winFrom:"contested",lose:"Low turnout. Boycotted. Seen as illegitimate.",loseHex:3,loseTo:"enemy",reading:"Wainwright & Mann: Climate X — the emancipatory alternative." },
];

// ── INSURGENT-EXCLUSIVE CARDS (9, 2P only) ───────────────
const INSURGENT_CARDS = [
  { id:"I1",tier:"low",exclusive:"nlf",title:"Propaganda Broadcast",situation:"Your media wing can broadcast a pirate radio message across government territory.",win:"Broadcast resonates. Defections from government areas.",winHex:1,winFrom:"gov",lose:"Signal traced. Government raids your station.",loseHex:1,loseTo:"gov",reading:"Cusato: counter-narratives as resistance to securitisation." },
  { id:"I2",tier:"low",exclusive:"nlf",title:"Smuggling Network",situation:"Fishermen loyal to your cause offer to smuggle supplies past coastal patrols.",win:"Supplies arrive. Morale rises.",winHex:1,winFrom:"contested",lose:"Boats intercepted. Fishermen arrested.",loseHex:1,loseTo:"gov",reading:"Farrell & Newman: informal networks as alternatives to chokepoints." },
  { id:"I3",tier:"low",exclusive:"nlf",title:"Community Courts",situation:"You establish local courts — parallel governance rivalling the state's legal system.",win:"Courts gain legitimacy. Civilians prefer your justice.",winHex:1,winFrom:"contested",lose:"A controversial ruling alienates local leaders.",loseHex:1,loseTo:"contested",reading:"Wainwright & Mann: Behemoth — fragmented, localised sovereignty." },
  { id:"I4",tier:"med",exclusive:"nlf",title:"Foreign Backers",situation:"A rival power offers weapons and funds — but wants influence over your post-war governance.",win:"Arms and money flow in. Military capacity surges.",winHex:2,winFrom:"gov",lose:"Your backer's agenda conflicts with yours. Internal split.",loseHex:2,loseTo:"contested",reading:"Farrell & Newman: foreign backing means network dependency." },
  { id:"I5",tier:"med",exclusive:"nlf",title:"Exploit Civilian Protests",situation:"Mass protests erupt in government territory over water shortages. You can infiltrate and escalate.",win:"The city falls to your side amid the chaos.",winHex:2,winFrom:"gov",lose:"Government cracks down. Civilians blame you.",loseHex:2,loseTo:"gov",reading:"Cusato: exploiting protests blurs the combatant/civilian line." },
  { id:"I6",tier:"med",exclusive:"nlf",title:"Hostage Negotiation",situation:"Your forces captured a foreign aid worker. You can demand concessions for their release.",win:"Government makes territorial concessions.",winHex:2,winFrom:"gov",lose:"International condemnation. Peacekeeping force authorised.",loseHex:2,loseTo:"intl",reading:"Cusato: hostage-taking as visibility strategy that triggers securitisation." },
  { id:"I7",tier:"high",exclusive:"nlf",title:"General Uprising",situation:"Cells across the island are ready. A coordinated uprising in government territory.",win:"Multiple cities fall simultaneously.",winHex:3,winFrom:"gov",lose:"Uprising betrayed by an informant. Mass arrests.",loseHex:3,loseTo:"gov",reading:"Wainwright & Mann: Climate Mao — revolutionary transformation from below." },
  { id:"I8",tier:"high",exclusive:"nlf",title:"Declare Independence",situation:"Formally declare independence. Some states may recognise you.",win:"Recognition from key states. Legitimacy transforms.",winHex:3,winFrom:"contested",lose:"No recognition. Framed as separatists. Support collapses.",loseHex:3,loseTo:"gov",reading:"Wainwright & Mann: sovereignty is a claim that succeeds or fails on recognition." },
  { id:"I9",tier:"high",exclusive:"nlf",title:"Ally with International Forces",situation:"The UN is here. Cooperate against the government — at the cost of your independence.",win:"Joint operations crush government forces.",winHex:3,winFrom:"gov",lose:"The UN turns on you next.",loseHex:3,loseTo:"intl",reading:"Wainwright & Mann: allying with Leviathan. They may protect you today and prosecute you tomorrow." },
];

const DEBRIEF = [
  "Compare your game with another group's. You may have played the same cards differently — whose island is in a better position, and by whose standards?",
  "The game forced you to choose between three options. Was there a fourth option the game didn't offer? What does its absence tell you about how the scenario was framed?",
  "Did winning ever feel wrong? Did losing ever feel right? What does that tension tell you about how international law evaluates outcomes?",
  "The game has no option to address climate change itself — only to manage its consequences. Why? And what does that structural limitation mirror in the real world?",
];

const ENDGAME = {
  bigWin: { title:"Supreme Commander", text:"You unified the island under your authority. But at what cost — and for how long? The sea doesn't care about your borders." },
  win: { title:"Fragile Victory", text:"You hold more ground than anyone. But half the island is underwater, and your enemies haven't disappeared." },
  draw: { title:"Stalemate", text:"Nobody won. The island is fractured, flooded, and exhausted." },
  lose: { title:"Overthrown", text:"You lost control. History will record you as a cautionary tale — or a martyr, depending on who writes it." },
  bigLose: { title:"Captured", text:"You were arrested and transferred to The Hague. The trial will last years." },
  mandate: { title:"Under Mandate", text:"The UN established a mandate over the island. You are arrested and transferred to The Hague alongside the insurgent leader. In the eyes of the world, you are both equally culpable." },
};

// ── HELPERS ──────────────────────────────────────────────
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function cl(v) { return Math.max(0, Math.min(100, v)); }

function getSeaTarget(hexes) {
  const alive = hexes.filter(h => h.ctrl !== "sea");
  const maxE = Math.max(...alive.map(h => h.edge));
  const cands = alive.filter(h => h.edge === maxE);
  return cands.length ? cands[Math.floor(Math.random() * cands.length)].id : null;
}

function countHexes(hexes) {
  const c = { gov:0, nlf:0, contested:0, intl:0, sea:0 };
  hexes.forEach(h => { const k = h.ctrl === "neutral" ? "contested" : h.ctrl; c[k] = (c[k]||0)+1; });
  return c;
}

function transferHexes(hexes, count, from, to) {
  const u = hexes.map(h => ({...h}));
  let n = 0;
  // Try specified source first, then fall back through all other takeable sources
  const allSources = [from, "contested", "neutral", "nlf", "gov", "intl"].filter(s => s && s !== to);
  // Deduplicate
  const prio = [...new Set(allSources)];
  for (const src of prio) { if (n >= count) break; for (let i = 0; i < u.length && n < count; i++) { if (u[i].ctrl === src && u[i].ctrl !== "sea") { u[i].ctrl = to; n++; } } }
  return u;
}

// Resolve "enemy" references based on current player
function resolveCard(card, player) {
  const enemy = player === "gov" ? "nlf" : "gov";
  const self = player;
  return {
    ...card,
    winFrom: card.winFrom === "enemy" ? enemy : card.winFrom,
    loseTo: card.loseTo === "enemy" ? enemy : card.loseTo,
  };
}

// ── COMPONENTS ───────────────────────────────────────────
function HexTile({ hex, cx, cy, flash, flashKey, isSinking }) {
  const fill = C[hex.ctrl] || "#555";
  const inner = hexPts(cx, cy, S - 2);
  const outer = hexPts(cx, cy, S);
  const icon = ICONS[hex.ctrl] || "";
  return (
    <g>
      <polygon points={outer} fill="#0c1420" stroke="none" />
      <polygon points={inner} fill={fill} stroke="#0c1420" strokeWidth={1.5} opacity={hex.ctrl === "sea" ? 0.75 : 0.85} />
      {flash && <polygon key={`f-${hex.id}-${flashKey}`} points={inner} fill="#fff" opacity={0}><animate attributeName="opacity" values="0;0.7;0.2;0.7;0.2;0.7;0" dur="3.5s" fill="freeze" /></polygon>}
      {isSinking && <polygon key={`s-${hex.id}-${flashKey}`} points={inner} fill="#4a9edd" opacity={0}><animate attributeName="opacity" values="0;0.7;0.2;0.7;0.2;0.7;0.5" dur="3.5s" fill="freeze" /></polygon>}
      <text x={cx} y={cy+2} textAnchor="middle" dominantBaseline="middle" fontSize={14} style={{pointerEvents:"none",opacity:hex.ctrl==="sea"?0.8:1}}>{icon}</text>
    </g>
  );
}

function CoinFlip({ result, onDone }) {
  const [ph, setPh] = useState(0);
  useEffect(() => { const a=setTimeout(()=>setPh(1),1300),b=setTimeout(()=>setPh(2),2200),c=setTimeout(()=>onDone(),3800); return()=>{clearTimeout(a);clearTimeout(b);clearTimeout(c);}; }, []);
  const ok = result === "success", col = ok ? "#22c55e" : "#ef4444";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
      {ph===0 && <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}><svg width={80} height={80} viewBox="0 0 80 80" style={{animation:"coinSpin .35s linear infinite",display:"block"}}><circle cx={40} cy={40} r={36} fill="#555" stroke="#777" strokeWidth={2}/><text x={40} y={46} textAnchor="middle" fontSize={22} fill="#aaa" fontWeight={700}>?</text></svg><div style={{fontFamily:"var(--m)",fontSize:11,color:"#666",marginTop:10,animation:"pulse 1s ease infinite"}}>Flipping...</div></div>}
      {ph>=1 && <div style={{animation:"fadeIn .4s ease",display:"flex",flexDirection:"column",alignItems:"center"}}><svg width={88} height={88} viewBox="0 0 88 88" style={{display:"block"}}><circle cx={44} cy={44} r={40} fill={ok?"rgba(34,197,94,.12)":"rgba(239,68,68,.12)"} stroke={col} strokeWidth={3}/><circle cx={44} cy={44} r={26} fill={col} opacity={.2}/><text x={44} y={51} textAnchor="middle" fontSize={28} fill={col} fontWeight={900}>{ok?"✓":"✗"}</text></svg><div style={{fontFamily:"var(--m)",fontSize:14,letterSpacing:2,fontWeight:700,color:col,marginTop:8}}>{ok?"SUCCESS":"COMPLICATION"}</div></div>}
    </div>
  );
}

function CardView({ card, onPick }) {
  const tc = card.tier==="low"?"#22c55e":card.tier==="med"?"#eab308":"#ef4444";
  const tl = card.tier==="low"?"LOW RISK · LOW REWARD · ±1":card.tier==="med"?"MEDIUM RISK · MEDIUM REWARD · ±2":"HIGH RISK · HIGH REWARD · ±3";
  return (
    <button onClick={()=>onPick(card)} style={{background:"#161b22",border:`1px solid ${tc}40`,borderLeft:`3px solid ${tc}`,borderRadius:10,padding:"14px 16px",textAlign:"left",cursor:"pointer",color:"#e6edf3",width:"100%",transition:"all .15s"}}
      onMouseEnter={e=>{e.currentTarget.style.background="#1c2333";e.currentTarget.style.borderColor=tc;}}
      onMouseLeave={e=>{e.currentTarget.style.background="#161b22";e.currentTarget.style.borderColor=`${tc}40`;}}>
      <div style={{fontFamily:"var(--m)",fontSize:9,letterSpacing:2,color:tc,marginBottom:6,textTransform:"uppercase"}}>{tl}{card.exclusive?" · EXCLUSIVE":""}</div>
      <div style={{fontSize:15,fontWeight:700,marginBottom:5,fontFamily:"var(--m)"}}>{card.title}</div>
      <div style={{fontSize:13,color:"#9ca3af",lineHeight:1.6}}>{card.situation}</div>
    </button>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function SeaLevelRise() {
  const [phase, setPhase] = useState("title"); // title, modeSelect, playing, coin, outcome, pass, debrief
  const [mode, setMode] = useState("1p");
  const [round, setRound] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState("gov");
  const [hexes, setHexes] = useState([]);
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [coinRes, setCoinRes] = useState(null);
  const [sinkId, setSinkId] = useState(null);
  const [flashIds, setFlashIds] = useState([]);
  const [flashKey, setFlashKey] = useState(0);
  const [history, setHistory] = useState([]);
  const [eliminated, setEliminated] = useState(null);
  const topRef = useRef(null);

  useEffect(() => { if (topRef.current) topRef.current.scrollIntoView({behavior:"smooth"}); }, [phase, round]);

  const maxRounds = mode === "2p" ? 10 : 9;

  function buildDeck() {
    if (mode === "1p") return shuffle([...SHARED_CARDS]);
    // 2P: shared + insurgent-exclusive
    return shuffle([...SHARED_CARDS, ...INSURGENT_CARDS]);
  }

  function drawHand(deckArr, player) {
    // Filter: insurgent-exclusive cards only appear on insurgent turns
    const available = deckArr.filter(c => {
      if (c.exclusive === "nlf" && player !== "nlf") return false;
      return true;
    });
    const h = available.slice(0, 3);
    const remaining = deckArr.filter(c => !h.includes(c));
    return { hand: h, remaining };
  }

  function startGame(m) {
    setMode(m);
    const map = MAP_2P;
    setHexes(map.map(h => ({...h})));
    const d = m === "1p" ? shuffle([...SHARED_CARDS]) : shuffle([...SHARED_CARDS, ...INSURGENT_CARDS]);
    const startPlayer = "gov";
    if (m === "1p") {
      const { hand: h, remaining } = drawHand(d, startPlayer);
      setDeck(remaining);
      setHand(h);
    } else {
      setDeck(d);
      setHand([]);
    }
    setRound(1);
    setCurrentPlayer(startPlayer);
    setHistory([]);
    setEliminated(null);
    setFlashIds([]);
    setSinkId(null);
    if (m === "2p") {
      setPhase("pass");
    } else {
      setPhase("draw");
    }
  }

  function pickCard(card) {
    const resolved = resolveCard(card, currentPlayer);
    setChosen(resolved);
    setCoinRes(Math.random() < 0.5 ? "success" : "fail");
    setPhase("coin");
  }

  function resolveCoin() {
    const ok = coinRes === "success";
    let u = [...hexes];
    let desc = "";
    setFlashIds([]);

    if (ok) {
      desc = chosen.win;
      const from = chosen.winFrom === "mixed" ? (currentPlayer === "gov" ? "nlf" : "gov") : chosen.winFrom;
      u = transferHexes(u, chosen.winHex, from, currentPlayer);
    } else {
      desc = chosen.lose;
      u = transferHexes(u, chosen.loseHex, currentPlayer, chosen.loseTo);
    }

    // Sea level rise
    const sink = getSeaTarget(u);
    if (sink) { u = u.map(h => h.id === sink ? {...h, ctrl:"sea"} : h); setSinkId(sink); }

    setHexes(u);
    setHistory(p => [...p, { round, player: currentPlayer, card: chosen.title, tier: chosen.tier, result: coinRes, desc, sunk: sink, reading: chosen.reading }]);

    const changed = [];
    u.forEach((h, i) => { if (h.ctrl !== hexes[i]?.ctrl && h.ctrl !== "sea") changed.push(h.id); });
    setFlashIds(changed);
    setFlashKey(k => k + 1);

    // Check elimination and domination
    const gc = u.filter(h => h.ctrl === "gov").length;
    const nc = u.filter(h => h.ctrl === "nlf").length;
    const alive = u.filter(h => h.ctrl !== "sea").length;
    if (gc === 0) { setEliminated("gov"); setPhase("debrief"); return; }
    if (mode === "2p" && nc === 0) { setEliminated("nlf"); setPhase("debrief"); return; }
    // Total domination — current player holds all non-sea hexes
    if (gc === alive && gc > 0) { setEliminated("nlf_dominated"); setPhase("debrief"); return; }
    if (mode === "2p" && nc === alive && nc > 0) { setEliminated("gov_dominated"); setPhase("debrief"); return; }

    setPhase("outcome");
  }

  function nextRound() {
    setSinkId(null); setFlashIds([]);
    if (round >= maxRounds) { setPhase("debrief"); return; }

    const nextR = round + 1;
    setRound(nextR);

    // Determine next player
    let nextPlayer = currentPlayer;
    if (mode === "2p") {
      nextPlayer = currentPlayer === "gov" ? "nlf" : "gov";
    }
    setCurrentPlayer(nextPlayer);

    if (mode === "2p" && nextPlayer !== currentPlayer) {
      // Show pass screen
      setPhase("pass");
    } else {
      // Draw new hand
      let d = [...deck];
      if (d.length < 5) d = mode === "1p" ? shuffle([...SHARED_CARDS]) : shuffle([...SHARED_CARDS, ...INSURGENT_CARDS]);
      const { hand: h, remaining } = drawHand(d, nextPlayer);
      setDeck(remaining);
      setHand(h);
      setPhase("draw");
    }
  }

  function continueAfterPass() {
    let d = [...deck];
    if (d.length < 5) d = mode === "1p" ? shuffle([...SHARED_CARDS]) : shuffle([...SHARED_CARDS, ...INSURGENT_CARDS]);
    const { hand: h, remaining } = drawHand(d, currentPlayer);
    setDeck(remaining);
    setHand(h);
    setPhase("draw");
  }

  const counts = countHexes(hexes);

  // ── MAP ────────────────────────────────────────────────
  const MapView = () => {
    const pos = hexes.map(h => ax2px(h.q, h.r));
    const pad = S + 8;
    const minX = Math.min(...pos.map(p=>p.x))-pad, maxX = Math.max(...pos.map(p=>p.x))+pad;
    const minY = Math.min(...pos.map(p=>p.y))-pad, maxY = Math.max(...pos.map(p=>p.y))+pad;
    return (
      <div style={{background:"#0a0f1a",borderRadius:8,border:"1px solid #1e2433",padding:6,marginBottom:10}}>
        <svg viewBox={`${minX} ${minY} ${maxX-minX} ${maxY-minY}`} width="100%" style={{display:"block",maxHeight:300}}>
          <rect x={minX} y={minY} width={maxX-minX} height={maxY-minY} fill="#0a0f1a"/>
          {hexes.map(h => { const{x,y}=ax2px(h.q,h.r); return <HexTile key={h.id} hex={h} cx={x} cy={y} flash={flashIds.includes(h.id)} flashKey={flashKey} isSinking={sinkId===h.id}/>; })}
        </svg>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:4,marginBottom:2}}>
          {[{c:C.gov,l:"🏛️ You"},{c:C.nlf,l:"🚩 Insurgents"},{c:C.contested,l:"⚔️ Contested"},{c:C.intl,l:"🇺🇳 Int'l"},{c:C.sea,l:"🌊 Flooded",o:.6}].map((x,i)=>
            <div key={i} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:7,height:7,borderRadius:"50%",background:x.c,opacity:x.o||1}}/><span style={{fontSize:8,fontFamily:"var(--m)",color:"#666"}}>{x.l}</span></div>
          )}
        </div>
      </div>
    );
  };

  const ScoreBar = () => (
    <div style={{display:"flex",gap:6,marginBottom:10}}>
      {[{l:"🏛️ GOV",v:counts.gov,c:C.gov},{l:"🚩 INS",v:counts.nlf,c:C.nlf},{l:"⚔️ CTD",v:counts.contested,c:C.contested},{l:"🇺🇳 INT",v:counts.intl,c:C.intl},{l:"🌊 SEA",v:counts.sea,c:"#3a6a9a"}].map((s,i)=>
        <div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,fontFamily:"var(--m)",color:s.c}}>{s.v}</div><div style={{fontSize:8,fontFamily:"var(--m)",color:"#666",letterSpacing:1}}>{s.l}</div></div>
      )}
    </div>
  );

  // ── STYLES ─────────────────────────────────────────────
  const wrap = {"--m":"'JetBrains Mono',monospace","--s":"'Georgia',serif",background:"#0d1117",color:"#e6edf3",fontFamily:"var(--s)",minHeight:"100vh",maxWidth:600,margin:"0 auto",padding:"16px 14px 48px"};
  const tag = {fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#d4a853",fontFamily:"var(--m)",marginBottom:6};
  const cardS = {background:"#161b22",border:"1px solid #30363d",borderRadius:8,padding:14,marginBottom:10};
  const btnS = (a) => ({background:a?"#d4a853":"#161b22",color:a?"#0d1117":"#e6edf3",border:a?"none":"1px solid #30363d",padding:"12px 16px",fontSize:13,fontWeight:600,fontFamily:"var(--m)",borderRadius:6,cursor:"pointer",width:"100%",letterSpacing:.5});

  const CSS = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Playfair+Display:wght@700;900&display=swap');
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes coinSpin{0%{transform:scaleX(1)}25%{transform:scaleX(0)}50%{transform:scaleX(-1)}75%{transform:scaleX(0)}100%{transform:scaleX(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
*{box-sizing:border-box;margin:0;padding:0}`;

  const playerTag = PLAYER_LABEL[currentPlayer] || currentPlayer;

  // ── TITLE ──────────────────────────────────────────────
  if (phase === "title") {
    return (
      <div ref={topRef} style={wrap}><style>{CSS}</style>
        <div style={{textAlign:"center",paddingTop:"2vh",animation:"fadeIn .7s ease"}}>
          <div style={{...tag,marginBottom:12}}>Global Law (LLM) · Maastricht University, Faculty of Law</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,margin:"0 0 8px",letterSpacing:-1}}>SEA LEVEL RISE</h1>
          <p style={{color:"#8b949e",fontSize:13,lineHeight:1.5,margin:"0 auto 16px",maxWidth:420}}>The ocean is rising. The island is shrinking. The war hasn't stopped.</p>
          <img src="cover.png" alt="Sea Level Rise" style={{width:"100%",maxWidth:500,borderRadius:10,display:"block",margin:"0 auto 20px"}} onError={e=>{e.target.style.display="none";}} />
          <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:320,margin:"0 auto"}}>
            <button onClick={()=>{setMode("1p");setPhase("instructions1p");}} style={btnS(true)}>🏛️ SINGLE PLAYER</button>
            <button onClick={()=>{setMode("2p");setPhase("instructions2p");}} style={{...btnS(false),borderColor:"#ef4444"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#1c2333";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#161b22";}}>
              🏛️ vs 🚩 TWO PLAYERS
            </button>
          </div>
          <div style={{marginTop:16,fontSize:9,fontFamily:"var(--m)",color:"#4a5568",letterSpacing:.5}}>© Henrique Marcos, 2026. All rights reserved.</div>
        </div>
      </div>
    );
  }

  // ── 1P INSTRUCTIONS ────────────────────────────────────
  if (phase === "instructions1p") {
    return (
      <div ref={topRef} style={wrap}><style>{CSS}</style>
        <div style={{animation:"fadeIn .6s ease"}}>
          <div style={{...tag,marginBottom:12}}>Single Player</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:16}}>🏛️ Government</h2>

          <div style={{...cardS,textAlign:"left"}}>
            <div style={{...tag,marginBottom:10}}>Your role</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#c9d1d9"}}>
              You are the <strong style={{color:"#22c55e"}}>🏛️ Government</strong> of a small island state. Your territory is under threat from <strong style={{color:"#ef4444"}}>🚩 insurgent forces</strong>, and the ocean is rising.
            </div>
          </div>

          <div style={{...cardS,textAlign:"left"}}>
            <div style={{...tag,marginBottom:10}}>How it works</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#c9d1d9"}}>
              The game lasts <strong style={{color:"#e6edf3"}}>9 rounds</strong>. Each round, the game deals you <strong style={{color:"#e6edf3"}}>3 cards</strong>. Pick 1 to play, then <strong style={{color:"#e6edf3"}}>flip the coin</strong>.
              <br/><br/>
              <span style={{color:"#22c55e"}}>●</span> <strong>Success</strong> = you gain hexes.{" "}
              <span style={{color:"#ef4444"}}>●</span> <strong>Complication</strong> = you lose hexes.
              <br/><br/>
              Cards come in three risk levels:
              <br/>
              <span style={{color:"#22c55e"}}>■</span> Low risk, low reward: ±1 hex{" "}
              <span style={{color:"#eab308"}}>■</span> Medium risk, medium reward: ±2 hexes{" "}
              <span style={{color:"#ef4444"}}>■</span> High risk, high reward: ±3 hexes
            </div>
          </div>

          <div style={{...cardS,textAlign:"left"}}>
            <div style={{...tag,marginBottom:10}}>The sea</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#c9d1d9"}}>
              <strong style={{color:"#3a6a9a"}}>🌊 Every round, the sea rises</strong> — one hex floods and is gone forever. After 9 rounds, nearly half the island will be underwater.
            </div>
          </div>

          <div style={{...cardS,textAlign:"left"}}>
            <div style={{...tag,marginBottom:10}}>Winning</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#c9d1d9"}}>
              <strong style={{color:"#e6edf3"}}>Hold more hexes than the insurgents at the end.</strong> If you take all their hexes, you win immediately. If you lose all yours, it's game over. And if the 🇺🇳 UN ends up in control — you both lose.
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
            <button onClick={()=>startGame("1p")} style={btnS(true)}>START GAME</button>
            <button onClick={()=>setPhase("title")} style={btnS(false)}>← BACK</button>
          </div>
        </div>
      </div>
    );
  }

  // ── 2P INSTRUCTIONS ────────────────────────────────────
  if (phase === "instructions2p") {
    return (
      <div ref={topRef} style={wrap}><style>{CSS}</style>
        <div style={{animation:"fadeIn .6s ease"}}>
          <div style={{...tag,marginBottom:12}}>Two-Player Mode</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:16}}>🏛️ vs 🚩</h2>
          
          <div style={{...cardS,textAlign:"left"}}>
            <div style={{...tag,marginBottom:10}}>Setup</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#c9d1d9"}}>
              Decide who plays the <strong style={{color:"#22c55e"}}>🏛️ Government</strong> and who plays the <strong style={{color:"#ef4444"}}>🚩 Insurgents</strong>. You will share one device, passing it back and forth.
            </div>
          </div>

          <div style={{...cardS,textAlign:"left"}}>
            <div style={{...tag,marginBottom:10}}>How it works</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#c9d1d9"}}>
              The game lasts <strong style={{color:"#e6edf3"}}>10 rounds</strong>. Players take turns — one round each, alternating.
              <br/><br/>
              <strong style={{color:"#22c55e"}}>🏛️ Government</strong> plays rounds 1, 3, 5, 7, 9
              <br/>
              <strong style={{color:"#ef4444"}}>🚩 Insurgents</strong> plays rounds 2, 4, 6, 8, 10
              <br/><br/>
              On your turn: the game deals you <strong style={{color:"#e6edf3"}}>3 cards</strong>. Pick 1 to play, then <strong style={{color:"#e6edf3"}}>flip the coin</strong>.
              <br/>
              <span style={{color:"#22c55e"}}>●</span> <strong>Success</strong> = you gain hexes from your opponent.
              <br/>
              <span style={{color:"#ef4444"}}>●</span> <strong>Complication</strong> = you lose hexes.
              <br/><br/>
              Between turns, a <strong style={{color:"#d4a853"}}>pass screen</strong> will appear — hand the device to the other player before continuing.
            </div>
          </div>

          <div style={{...cardS,textAlign:"left"}}>
            <div style={{...tag,marginBottom:10}}>The sea</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#c9d1d9"}}>
              <strong style={{color:"#3a6a9a"}}>🌊 Every round, the sea rises</strong> — one hex floods and is gone forever. It can swallow anyone's territory. After 10 rounds, the island will have lost half its land.
            </div>
          </div>

          <div style={{...cardS,textAlign:"left"}}>
            <div style={{...tag,marginBottom:10}}>Winning</div>
            <div style={{fontSize:13,lineHeight:1.8,color:"#c9d1d9"}}>
              <strong style={{color:"#e6edf3"}}>Whoever holds the most hexes at the end wins.</strong>
              <br/><br/>
              If you capture all enemy hexes, you win immediately. If the 🇺🇳 UN ends up controlling more territory than both of you, you both lose — and get sent to The Hague.
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
            <button onClick={()=>startGame("2p")} style={btnS(true)}>START GAME</button>
            <button onClick={()=>setPhase("title")} style={btnS(false)}>← BACK</button>
          </div>
        </div>
      </div>
    );
  }

  // ── PASS DEVICE ────────────────────────────────────────
  if (phase === "pass") {
    return (
      <div ref={topRef} style={wrap}><style>{CSS}</style>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 80px)",textAlign:"center",animation:"fadeIn .5s ease"}}>
          <div style={{fontSize:48,marginBottom:16}}>{currentPlayer === "gov" ? "🏛️" : "🚩"}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,marginBottom:8}}>
            {currentPlayer === "gov" ? "Government's Turn" : "Insurgents' Turn"}
          </div>
          <p style={{color:"#8b949e",fontSize:14,marginBottom:24}}>Pass the device to the {currentPlayer === "gov" ? "Government" : "Insurgent"} player.</p>
          <button onClick={continueAfterPass} style={{...btnS(true),maxWidth:280}}>READY — DRAW CARDS</button>
        </div>
      </div>
    );
  }

  // ── DRAW ───────────────────────────────────────────────
  if (phase === "draw") {
    return (
      <div ref={topRef} style={wrap}><style>{CSS}</style>
        <div style={{animation:"fadeIn .4s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div style={tag}>Round {round} / {maxRounds}</div>
            <div style={{...tag,color:"#3a6a9a"}}>🌊 {counts.sea} flooded</div>
          </div>
          {mode === "2p" && <div style={{...tag,color:C[currentPlayer],marginBottom:8,fontSize:12}}>
            {playerTag}'s turn
          </div>}
          <ScoreBar />
          <MapView />
          <div style={{...tag,marginBottom:10,marginTop:4}}>Your cards — pick 1 to play</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {hand.map((c,i) => <div key={c.id} style={{animation:`fadeIn .4s ease ${i*.1}s both`}}><CardView card={c} onPick={pickCard}/></div>)}
          </div>
        </div>
      </div>
    );
  }

  // ── COIN ───────────────────────────────────────────────
  if (phase === "coin") {
    return (
      <div ref={topRef} style={wrap}><style>{CSS}</style>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 80px)"}}>
          <div style={{...tag,textAlign:"center",marginBottom:12}}>{chosen.title}</div>
          <CoinFlip result={coinRes} onDone={resolveCoin}/>
        </div>
      </div>
    );
  }

  // ── OUTCOME ────────────────────────────────────────────
  if (phase === "outcome") {
    const ok = coinRes === "success";
    const entry = history[history.length-1];
    return (
      <div ref={topRef} style={wrap}><style>{CSS}</style>
        <div style={{animation:"fadeIn .5s ease"}}>
          <div style={tag}>Round {round} — {mode==="2p"?playerTag+" — ":""}Outcome</div>
          <MapView />
          <ScoreBar />
          <div style={{...cardS,borderColor:ok?"#22c55e":"#ef4444"}}>
            <div style={{...tag,color:ok?"#22c55e":"#ef4444",marginBottom:4}}>
              {ok?"● Success":"● Complication"} — {chosen.title}
            </div>
            <p style={{fontSize:14,lineHeight:1.6,color:"#e6edf3"}}>{entry.desc}</p>
          </div>
          {entry.sunk && (
            <div style={{...cardS,borderColor:"#3a6a9a",background:"rgba(30,58,95,0.15)"}}>
              <div style={{...tag,color:"#5b8cb8",marginBottom:4}}>🌊 Sea Level Rise</div>
              <p style={{fontSize:13,color:"#8ba8c8"}}>The ocean claims another hex. The island shrinks.</p>
            </div>
          )}
          <button onClick={nextRound} style={btnS(true)}>
            {round >= maxRounds ? "SEE RESULTS" : `ROUND ${round+1} →`}
          </button>
        </div>
      </div>
    );
  }

  // ── DEBRIEF ────────────────────────────────────────────
  if (phase === "debrief") {
    const gc=counts.gov, nc=counts.nlf, ic=counts.intl;
    let ending;
    const is2p = mode === "2p";

    // Elimination / domination endings
    if (eliminated === "gov") {
      ending = is2p
        ? {title:"🚩 Insurgent Victory", text:"The government has fallen. The head of state is arrested by insurgent forces, tried in a makeshift court, and sentenced to life imprisonment. The video is broadcast across the island. A new era begins — though no one knows what kind."}
        : {title:"Total Defeat", text:"You lost every last hex. Your government collapsed. You were captured and transferred to The Hague. The trial begins next month."};
    }
    else if (eliminated === "nlf") {
      ending = is2p
        ? {title:"🏛️ Government Victory", text:"The insurgency is broken. Remaining fighters are rounded up and face military tribunals. The insurgent leader, however, was not among those captured. Intelligence suggests he boarded a fishing boat days earlier. He surfaces weeks later in Geneva, giving an interview to the BBC from a safe house. He is already fundraising."}
        : {title:"Liberation Crushed", text:"The insurgency was wiped from the map. Their leader was captured. Whether this is justice or tyranny depends on who tells the story."};
    }
    else if (eliminated === "nlf_dominated") {
      ending = is2p
        ? {title:"🏛️ Total Government Control", text:"Every inch of dry land flies the government flag. Insurgent commanders are tried in military courts. But the insurgent leader is gone — last seen crossing into international waters on a cargo ship. From exile, he releases a statement: 'The island will remember.' The president celebrates. The sea continues to rise."}
        : {title:"Total Victory", text:"You control every inch of the island that hasn't been swallowed by the sea. The insurgency is finished. But the ocean is still rising — and you rule over ruins."};
    }
    else if (eliminated === "gov_dominated") {
      ending = is2p
        ? {title:"🚩 Total Insurgent Control", text:"The revolution is complete. Government officials are arrested and transferred to The Hague on war crimes charges. The former president is found hiding in the basement of the central bank. The insurgent commander declares a new republic from the steps of the parliament — but the sea is already lapping at the foundations."}
        : {title:"Revolution Complete", text:"The insurgents hold the entire island. The old government is gone. But governing is harder than fighting — and the sea doesn't care who's in charge."};
    }
    // UN mandate
    else if (ic >= gc && ic >= nc) {
      ending = is2p
        ? {title:"🇺🇳 Under International Mandate", text:"The UN Security Council has established a mandate over the island. Both the head of government and the insurgent leader are arrested, placed on the same transport plane, and flown to The Hague. In the eyes of the world, they are equally culpable. The island is governed by strangers now."}
        : ENDGAME.mandate;
    }
    // Standard endings — 2P needs to say who won
    else if (gc > nc && gc > nc + 3) {
      ending = is2p
        ? {title:"🏛️ Decisive Government Victory", text:"The government has united the country — for now. Insurgent forces are dismantled and their commanders face military tribunals. The insurgent leader, however, has escaped to a friendly country in Europe. From a modest apartment, he gives interviews and plans his return."}
        : ENDGAME.bigWin;
    }
    else if (gc > nc) {
      ending = is2p
        ? {title:"🏛️ Government Wins", text:"The government holds more ground, but the war isn't truly over. Remaining insurgent cells are hunted down. Their leader has fled abroad, living under a false name. He sends encrypted messages to his followers. The grievances that started the war have not been addressed."}
        : ENDGAME.win;
    }
    else if (gc === nc) {
      ending = is2p
        ? {title:"Stalemate", text:"Neither side could break the other. The island is split, flooded, and exhausted. Both leaders claim victory in their speeches. Neither population believes them."}
        : ENDGAME.draw;
    }
    else if (nc > gc && nc - gc <= 3) {
      ending = is2p
        ? {title:"🚩 Insurgent Victory", text:"The insurgents hold more territory. Government officials are arrested, their passports confiscated, and transferred to The Hague to face charges. The former president watches the island disappear from the window of a prison transport."}
        : ENDGAME.lose;
    }
    else {
      ending = is2p
        ? {title:"🚩 Decisive Insurgent Victory", text:"The insurgency has won. Government ministers are rounded up and flown to The Hague. The former president is captured at the airport trying to board a private jet. The insurgent commander addresses what remains of the nation — victorious, but inheriting a drowning island."}
        : ENDGAME.bigLose;
    }

    return (
      <div ref={topRef} style={wrap}><style>{CSS}</style>
        <div style={{animation:"fadeIn .6s ease"}}>
          <div style={tag}>{eliminated ? (eliminated.includes("dominated") ? `Domination — Round ${round}` : `Eliminated — Round ${round}`) : `Game Over — ${maxRounds} Rounds`}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:12}}>{ending.title}</h2>
          <MapView />
          <ScoreBar />
          <div style={{...cardS,textAlign:"center"}}><p style={{fontSize:15,lineHeight:1.7,color:"#c9d1d9",fontStyle:"italic"}}>{ending.text}</p></div>
          <div style={cardS}>
            <div style={{...tag,marginBottom:6}}>Game log</div>
            {history.map((h,i) => (
              <div key={i} style={{padding:"8px 0",borderBottom:i<history.length-1?"1px solid #30363d":"none"}}>
                <span style={{fontSize:10,fontFamily:"var(--m)",color:"#d4a853"}}>R{h.round} </span>
                {mode==="2p" && <span style={{fontSize:10,fontFamily:"var(--m)",color:C[h.player],marginRight:4}}>{h.player==="gov"?"🏛️":"🚩"}</span>}
                <span style={{fontSize:12,color:"#e6edf3"}}>{h.card}</span>
                <span style={{fontSize:9,fontFamily:"var(--m)",marginLeft:6,padding:"1px 5px",borderRadius:3,
                  background:h.tier==="low"?"rgba(34,197,94,.15)":h.tier==="med"?"rgba(234,179,8,.15)":"rgba(239,68,68,.15)",
                  color:h.tier==="low"?"#22c55e":h.tier==="med"?"#eab308":"#ef4444"
                }}>{h.tier==="low"?"LOW":h.tier==="med"?"MED":"HIGH"}</span>
                <span style={{fontSize:12,marginLeft:6,color:h.result==="success"?"#22c55e":"#ef4444"}}>●</span>
                <div style={{fontSize:10,color:"#666",fontStyle:"italic",marginTop:2}}>{h.desc}</div>
                {h.reading && <div style={{fontSize:11,color:"#8b949e",marginTop:4,paddingLeft:8,borderLeft:"2px solid #d4a853",lineHeight:1.6}}>📖 {h.reading}</div>}
              </div>
            ))}
          </div>
          <div style={{...cardS,borderColor:"#d4a853",background:"rgba(212,168,83,0.06)"}}>
            <div style={{...tag,marginBottom:8}}>📖 Discuss with your group</div>
            {DEBRIEF.map((q,i) => <div key={i} style={{fontSize:13,lineHeight:1.7,color:"#e6edf3",marginBottom:i<DEBRIEF.length-1?10:0}}><span style={{fontFamily:"var(--m)",fontSize:10,color:"#d4a853",marginRight:4}}>{i+1}.</span>{q}</div>)}
          </div>
          <button onClick={()=>setPhase("title")} style={{...btnS(false),marginTop:6}}>PLAY AGAIN</button>
        </div>
      </div>
    );
  }

  return null;
}
