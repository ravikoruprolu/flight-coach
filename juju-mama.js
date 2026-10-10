/* ═══════════════════════════════════════════════════════════
   Juju — Pre-Flight Coach chatbot (external module)
   The chubby Dragon Warrior panda who knows Daniels' formula.
   Loads after the main inline script. Uses globals:
   state, generatePlan, analyze, Vdot, fmtTime, escapeHtml,
   writeTimeField, updateTimeFieldDisplay, updateInputState,
   runStandardAnalysis, runBeginnerAnalysis, parseTime,
   computeWeekDates, weekWhy
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ─────────── 1. CSS ─────────── */
var JUJU_CSS = `
.juju-fab{position:fixed;bottom:24px;right:24px;width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#0f172a,#10b981);border:none;cursor:pointer;box-shadow:0 8px 24px rgba(16,185,129,.45);z-index:200;display:flex;align-items:center;justify-content:center;font-size:34px;transition:transform .2s;animation:juju-bob 1.4s ease-in-out infinite;overflow:visible}
.juju-fab:hover{transform:scale(1.1)}
.juju-fab::before{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(16,185,129,.4);animation:juju-pulse 2s ease-out infinite}
.juju-fab .runner{display:inline-block;animation:juju-run .65s ease-in-out infinite}
.juju-fab .speed-line{position:absolute;left:-16px;top:50%;width:14px;height:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85));border-radius:2px;animation:juju-speed 1.2s linear infinite;opacity:0}
.juju-fab .speed-line:nth-child(1){top:34%;animation-delay:.15s}
.juju-fab .speed-line:nth-child(2){top:50%;animation-delay:.45s}
.juju-fab .speed-line:nth-child(3){top:66%;animation-delay:.75s}
@keyframes juju-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes juju-run{0%,100%{transform:translateY(0) rotate(-6deg) scaleY(0.96)}25%{transform:translateY(-3px) rotate(0deg) scaleY(1)}50%{transform:translateY(0) rotate(6deg) scaleY(0.96)}75%{transform:translateY(-3px) rotate(0deg) scaleY(1)}}
@keyframes juju-pulse{0%{transform:scale(.9);opacity:.8}100%{transform:scale(1.35);opacity:0}}
@keyframes juju-speed{0%{opacity:0;transform:translateX(0)}40%{opacity:.85}100%{opacity:0;transform:translateX(-28px)}}
.juju-drawer{position:fixed;bottom:108px;right:24px;width:400px;max-width:calc(100vw - 32px);height:620px;max-height:calc(100vh - 140px);background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.22);z-index:199;display:none;flex-direction:column;overflow:hidden;animation:juju-slide-in .25s ease-out}
.juju-drawer.open{display:flex}
@keyframes juju-slide-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.juju-header{padding:12px 16px;background:linear-gradient(135deg,#0f172a,#10b981);color:#fff;display:flex;align-items:center;gap:10px;position:relative}
.juju-header .juju-avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.juju-header .juju-title{font-weight:700;font-size:15px;line-height:1.1}
.juju-header .juju-sub{font-size:11px;opacity:.85;margin-top:2px}
.juju-header .juju-close{background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;padding:2px 6px;line-height:1;opacity:.85;transition:opacity .15s}
.juju-header .juju-close:hover{opacity:1}
.juju-header .juju-close.settings{font-size:15px;margin-left:auto}
.juju-settings{position:absolute;top:60px;right:12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;width:290px;box-shadow:0 10px 32px rgba(0,0,0,.15);z-index:10;display:none}
.juju-settings.open{display:block}
.juju-settings label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:4px;margin-top:10px}
.juju-settings label:first-of-type{margin-top:0}
.juju-settings select,.juju-settings input{width:100%;font:inherit;font-size:12.5px;padding:7px 9px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text)}
.juju-settings select:focus,.juju-settings input:focus{outline:none;border-color:#10b981;box-shadow:0 0 0 2px rgba(16,185,129,.15)}
.juju-settings .juju-settings-note{font-size:10.5px;color:var(--muted);line-height:1.45;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)}
.juju-messages{flex:1;overflow-y:auto;padding:16px;background:#fafafb;display:flex;flex-direction:column;gap:10px}
.juju-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5;word-wrap:break-word;animation:juju-msg-in .2s ease-out}
@keyframes juju-msg-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.juju-msg.bot{background:var(--surface);border:1px solid var(--border);border-bottom-left-radius:4px;align-self:flex-start}
.juju-msg.user{background:var(--text);color:#fff;border-bottom-right-radius:4px;align-self:flex-end}
.juju-msg.system{align-self:center;background:var(--blue-bg);border:1px solid var(--blue-bd);color:var(--blue-tx);font-size:11.5px;max-width:95%;text-align:center;padding:8px 12px}
.juju-msg strong{font-weight:700}
.juju-msg em{font-style:italic;opacity:.9}
.juju-msg ul{margin:6px 0 4px 18px}
.juju-msg li{margin-bottom:3px}
.juju-msg code{font-family:var(--mono);font-size:12px;background:#f0f0f4;color:var(--text);padding:1px 5px;border-radius:4px}
.juju-msg .juju-action{display:block;margin-top:8px;background:#10b981;color:#fff;border:none;padding:7px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;text-align:center;width:100%}
.juju-msg .juju-action:hover{background:#059669}
.juju-typing{display:flex;gap:4px;padding:10px 6px;align-self:flex-start}
.juju-typing span{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:juju-typing 1.2s infinite}
.juju-typing span:nth-child(2){animation-delay:.15s}
.juju-typing span:nth-child(3){animation-delay:.3s}
@keyframes juju-typing{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}
.juju-chips{padding:8px 12px;display:flex;gap:6px;flex-wrap:wrap;background:var(--surface);border-top:1px solid var(--border);max-height:80px;overflow-y:auto}
.juju-chip{font-size:11px;padding:5px 10px;border-radius:999px;border:1px solid var(--border);background:#fafafb;color:var(--text);cursor:pointer;transition:all .15s;white-space:nowrap}
.juju-chip:hover{border-color:#10b981;background:#ecfdf5;color:#065f46}
.juju-input-row{display:flex;padding:10px 12px;gap:8px;background:var(--surface);border-top:1px solid var(--border)}
.juju-input-row input{flex:1;font:inherit;font-size:13px;padding:9px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text)}
.juju-input-row input:focus{outline:none;border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.12)}
.juju-send{background:#10b981;color:#fff;border:none;width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:background .15s}
.juju-send:hover:not(:disabled){background:#059669}
.juju-send:disabled{background:#a7f3d0;cursor:not-allowed}
@media print{.juju-fab,.juju-drawer{display:none!important}}
`;

/* ─────────── 2. HTML ─────────── */
var JUJU_HTML = `
<button class="juju-fab" id="jujuFab" aria-label="Open Juju chatbot">
  <span class="speed-line"></span>
  <span class="speed-line"></span>
  <span class="speed-line"></span>
  <span class="runner">🐼</span>
</button>
<div class="juju-drawer" id="jujuDrawer" role="dialog" aria-label="Juju chatbot">
  <div class="juju-header">
    <div class="juju-avatar">🐼</div>
    <div>
      <div class="juju-title">Juju</div>
      <div class="juju-sub" id="jujuStatus">Offline · built-in knowledge</div>
    </div>
    <button class="juju-close settings" id="jujuSettingsBtn" title="Settings">⚙</button>
    <button class="juju-close" id="jujuClose" title="Close">×</button>
  </div>
  <div class="juju-settings" id="jujuSettings">
    <label>AI Mode</label>
    <select id="jujuMode">
      <option value="offline">Offline (built-in knowledge)</option>
      <option value="openai">OpenAI (GPT)</option>
      <option value="anthropic">Anthropic (Claude)</option>
      <option value="gemini">Google Gemini</option>
    </select>
    <label>API Key</label>
    <input type="password" id="jujuApiKey" placeholder="paste your key" autocomplete="off">
    <label>Model (optional)</label>
    <input type="text" id="jujuModel" placeholder="leave blank for default">
    <div class="juju-settings-note">Your key is stored in this browser only. It's sent only to the provider you select. Never shared with the Pre-Flight Coach creator.</div>
  </div>
  <div class="juju-messages" id="jujuMessages"></div>
  <div class="juju-chips" id="jujuChips"></div>
  <div class="juju-input-row">
    <input type="text" id="jujuInput" placeholder="Ask Juju anything about running…" autocomplete="off">
    <button class="juju-send" id="jujuSend" aria-label="Send">↑</button>
  </div>
</div>
`;

/* ─────────── 3. Inject ─────────── */
function injectCSS(){
  var el = document.createElement('style');
  el.id = 'juju-css';
  el.textContent = JUJU_CSS;
  document.head.appendChild(el);
}
function injectHTML(){
  var wrap = document.createElement('div');
  wrap.innerHTML = JUJU_HTML;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
}

/* ─────────── 4. Knowledge base ─────────── */
var JUJU_KB = [
  { id:'vdot-what', cat:'VDOT',
    kw:['what is vdot','vdot meaning','explain vdot','what does vdot mean','vdot stand for'],
    syn:['vdot'],
    a:`**VDOT** is Jack Daniels' single-number fitness score. It combines VO₂max (your aerobic engine) with running economy (how efficiently you use oxygen) into one value, from about **30 (recreational) to 85 (elite)**.\n\nYour recent race performance is the input — a 5K in 22:00 gives roughly VDOT 40. Every training pace in your plan derives from this number. When you race faster, VDOT rises and all your paces shift faster automatically.\n\n**Why it matters:** it turns "I feel fitter" into a precise, comparable number. A 1-point VDOT gain is roughly a **15–20 second 5K improvement**.` },

  { id:'paces-what', cat:'Paces',
    kw:['what are the paces','explain paces','e m t i r','pace zones','training paces','what are the zones'],
    syn:['paces','zones'],
    a:`Daniels defines **5 training paces**. Each has a purpose, not just a speed:\n\n**E — Easy** · 59–74% VO₂max. Conversational. Builds aerobic base. Most of your weekly km.\n\n**M — Marathon** · ~81% VO₂max. Pace you could hold for 2.5+ hours. Trains fat-burning.\n\n**T — Threshold** · ~88% VO₂max. "Comfortably hard." Improves lactate clearance.\n\n**I — Interval** · ~98% VO₂max. 3–5 min reps with jog recovery. Raises your VO₂max ceiling.\n\n**R — Repetition** · ~106% VO₂max. Short, fast, full recovery. Neuromuscular speed.\n\n**Weekly quality budget:** ~20% of weekly km maximum. The rest is E.` },

  { id:'e-pace', cat:'Paces',
    kw:['what is easy pace','e pace','conversational pace','how slow easy','easy run pace'],
    syn:['easy','e pace'],
    a:`**E pace** is 59–74% of your VDOT-derived VO₂max — a pace where you can hold a **full conversation**.\n\nThe mistake almost every runner makes: running easy runs too fast. If you can't say *"the quick brown fox"* without gasping, you're not at E.\n\n**Why it matters:** E pace builds capillaries, mitochondria, and fat-burning enzymes. Going faster doesn't accelerate that; it adds fatigue that ruins tomorrow's quality session.\n\n**If in doubt:** slow down 30 sec/km.` },

  { id:'t-pace', cat:'Paces',
    kw:['what is threshold','t pace','threshold pace','tempo pace','lactate threshold','what is tempo'],
    syn:['threshold','tempo'],
    a:`**T pace** is "comfortably hard" — around 88% VO₂max, or roughly the pace you could race for **60 minutes all-out**.\n\n**Feel test:** you can speak 3–4 words at a time. Breathing is rhythmic.\n\n**Purpose:** raises the speed at which lactate accumulates faster than you clear it.\n\n**Typical doses:**\n- Cruise intervals: 3–6 × 1 km T with 1 min jog\n- Continuous tempo: 20 min at T\n- Long reps: 3 × 2 km T with 2 min jog\n\n**Cap:** ~10% of weekly km per session.` },

  { id:'i-pace', cat:'Paces',
    kw:['what is interval pace','i pace','what is interval training','why intervals'],
    syn:['interval','i pace'],
    a:`**I pace (Interval)** trains your VO₂max — the maximum rate your body can use oxygen.\n\n**Dose:** 3–5 min hard reps with ~equal-time jog recovery. Total hard time per session: **~8% of weekly km maximum**.\n\n**Why "ceiling" matters:** VO₂max is your engine size. Everything below scales with it.\n\n**Typical sessions:**\n- 5 × 1,000 m I, 3 min jog\n- 6 × 800 m I, 2:30 jog\n- 8 × 3 min hard, 2 min jog\n\n**Feel:** hard but controlled. Reps should be even.` },

  { id:'r-pace', cat:'Paces',
    kw:['what is rep training','r pace','repetition pace','why 200s','what are reps'],
    syn:['repetition','r pace'],
    a:`**R pace (Repetition)** is faster than mile race pace — about 106% of VDOT. Reps are **short** (200–400 m) with **full recovery**.\n\n**What it trains:** running economy, neuromuscular coordination, raw speed. **Not** VO₂max — recovery is too long.\n\n**Weekly dose:** very small. ~5% of weekly km, never more than 8 km.\n\n**Typical sessions:**\n- 8 × 200 m R, 200 m jog\n- 6 × 400 m R, 400 m jog\n\n**Key rule:** if you're not fully recovered before the next rep, you're doing I work, not R work.` },

  { id:'m-pace', cat:'Paces',
    kw:['what is marathon pace','m pace','goal pace'],
    syn:['marathon pace','m pace'],
    a:`**M pace** is your projected race-day marathon pace — the pace you believe you can hold for 42.195 km. About 81% VO₂max.\n\n**Two uses:**\n\n1. **Marathon-specific long runs** — E + M combinations teach fat-burning and glycogen sparing.\n2. **Race rehearsal** — practice pacing, fueling, and mental rhythm at goal pace.\n\n**Pitfall:** don't turn every long run into an M run. One M session per week max during the specific phase.` },

  { id:'long-run-purpose', cat:'Long Run',
    kw:['why long run','purpose of long run','benefit of long run','why do long runs'],
    syn:['long','purpose'],
    a:`The long run develops **aerobic and muscular endurance** you can't get from shorter sessions:\n\n1. **Mitochondrial density** — more energy factories\n2. **Capillary growth** — better oxygen delivery\n3. **Fat oxidation** — spares glycogen late in a race\n4. **Muscular durability** — legs tolerate more pounding\n5. **Mental confidence** — you *know* you can go the distance\n\n**Daniels' guideline:** build toward ~**2.5–3 hours for a marathon**, capped by weekly volume and safety.\n\n**Pace:** E pace. Always.` },

  { id:'cutback-why', cat:'Recovery',
    kw:['what is cutback','why cutback','recovery week','absorption week','reduced week'],
    syn:['cutback','recovery'],
    a:`**Cutback weeks** are planned recovery weeks where volume drops ~25–40% before resuming.\n\n**Why they work:** adaptation doesn't happen during training — it happens during **recovery**. A hard block creates stress; the cutback lets your body absorb it and emerge stronger.\n\n**Typical patterns:**\n- 3 weeks building → 1 cutback\n- 4 build → cutback → 4 build → cutback (plans ≥ 16 weeks)\n\n**Symptoms you're overdue:** resting HR creeping up, poor sleep, nagging aches, easy runs feeling hard.` },

  { id:'strides', cat:'Workouts',
    kw:['what are strides','why strides','strides benefit','20 second strides','what is a stride'],
    syn:['strides'],
    a:`**Strides** are 15–20 second accelerations to roughly mile pace (R pace), followed by full recovery.\n\n**What they do:**\n- Sharpen neuromuscular coordination\n- Improve running economy\n- Remind your legs what "fast" feels like\n- Zero fatigue cost\n\n**How:** after an easy run, find a flat stretch. Accelerate over 20s to R pace, hold 2–3s, decelerate. Jog 60–90s. Repeat 6–10×.` },

  { id:'taper-how', cat:'Taper',
    kw:['how to taper','taper marathon','taper weeks','race taper','how do i taper'],
    syn:['taper'],
    a:`**Taper = reduce volume, keep intensity.** Arrive fresh but sharp — not flat.\n\n**2-week structure:**\n- **Week −2:** ~65–75% of peak volume; keep one short T session; long run cut to 60%\n- **Race week:** ~40–55% of peak; one 3 × 1 km T sharpener mid-week; all other runs short and easy\n\n**What NOT to do:**\n- Don't stop running. Frequency stays the same.\n- Don't add extra "sharpening" sessions.\n- Don't do a hard workout 2 days out.\n\n**Feel:** you should feel slightly *restless* by race day — not tired, not flat.` },

  { id:'race-week', cat:'Race Day',
    kw:['race week','race week plan','week before race','race week training'],
    syn:['race week'],
    a:`**Race week checklist:**\n\n- **Volume:** ~40–55% of peak. Most runs 4–6 km easy.\n- **Quality:** one sharpener, ~3 days out — 3 × 1 km T.\n- **Long run:** none. Replace with 40–50 min easy.\n- **Rest:** same days as always.\n- **Sleep:** prioritized.\n- **Fuel:** practice race-day breakfast 2–3 days before.\n\nRace-week *training mileage excludes race distance*. The plan header shows both separately.` },

  { id:'how-many-days', cat:'General',
    kw:['how many days a week','days per week run','how often run','how many days should i run'],
    syn:['days','frequency'],
    a:`Depends on goal and base:\n\n- **Health/fitness:** 3 days/week\n- **5K–10K:** 4–5 days\n- **Half marathon:** 5 days\n- **Marathon:** 5–6 days\n\n**More important than frequency:** consistency. 4 days/week for 6 months beats 6 days/week for 6 weeks.\n\n**If new:** start at 3, add 1 day every 6–8 weeks.` },

  { id:'missed-workout', cat:'General',
    kw:['missed a workout','missed a run','skip workout','fell behind','what if i miss'],
    syn:['missed','skipped'],
    a:`**Miss one easy run:** skip it. No makeup.\n**Miss one quality session:** don't stack it onto another day. Skip it.\n**Miss a week:** pick up where the plan says. Don't try to catch up.\n\n**Golden rule:** never compress a plan. Adding yesterday's workout on top of today's is how you get injured.\n\nMiss more than 2 weeks? Restart at ~80% of where you left off.` },

  { id:'soreness', cat:'General',
    kw:['sore after run','muscle soreness','doms','soreness normal','why am i sore'],
    syn:['sore','soreness'],
    a:`**DOMS** peaks 24–72h after hard or unfamiliar work. Normal, especially early in a plan.\n\n**Normal:** symmetrical, diffuse, feels better as you warm up.\n**Not normal:** sharp, one-sided, worse as you run. Likely injury — see a physio.\n\n**What helps:** light movement, sleep, protein (~1.6 g/kg/day).\n**What doesn't:** ice baths, massage guns, most supplements.\n\n**Rule of thumb:** if soreness lasts >5 days after a workout, back off.` },

  { id:'shin-splints', cat:'Injury',
    kw:['shin splints','shin pain','medial tibial','my shins hurt'],
    syn:['shin','splints'],
    a:`**Shin splints (MTSS)** — pain along the inner tibia. Common in new runners or after a volume jump.\n\n**What to do:**\n- Stop running for 5–7 days\n- Cross-train (bike, pool) to maintain fitness\n\n**Root causes to fix:**\n- Too much too soon\n- Weak calves / hip abductors\n- Worn-out shoes\n\n**See a physio if:** pain persists at rest, is one-sided, or doesn't improve after a week off.` },

  { id:'pfitzinger', cat:'Systems',
    kw:['pfitzinger','pfitz','advanced marathoning','pfitz plan'],
    syn:['pfitzinger'],
    a:`**Pfitzinger & Douglas** (*Advanced Marathoning*) uses:\n\n- **Lactate threshold runs** (similar to Daniels T)\n- **Medium-long runs** mid-week (13–16 km)\n- **Long runs** up to 35 km with marathon-pace segments\n- **Tune-up races** as checkpoints\n\n**Key difference from Daniels:** more volume at moderate intensity, fewer very-hard sessions.\n\nPeak weekly km for advanced marathoners: 100–130 km.` },

  { id:'lydiard', cat:'Systems',
    kw:['lydiard','arthur lydiard','base building lydiard','lydiard method'],
    syn:['lydiard'],
    a:`**Arthur Lydiard** pioneered **periodization**:\n\n1. **Base phase** — 8–12 weeks of pure aerobic running\n2. **Hill phase** — strength work\n3. **Track phase** — speed and sharpening\n4. **Peaking phase** — taper and race\n\n**Key idea:** build a massive aerobic base first, then add intensity. His athletes ran 100-mile weeks before touching intervals.\n\n**Modern relevance:** compress the base to 60–70% of a plan, not 90%. But the principle — aerobic first, speed later — remains.` },

  { id:'80-20', cat:'Systems',
    kw:['80 20 running','polarized training','easy hard split','80/20'],
    syn:['80/20','polarized'],
    a:`**80/20 running** (Fitzgerald, Seiler): 80% of training time at low intensity, 20% at moderate-to-high.\n\n**Why it works:** the mechanisms for improving aerobic fitness respond best to high volume at low intensity. Too much "moderate" work (the grey zone) makes you tired without raising your ceiling.\n\n**Daniels' framework** is compatible: E pace = 80% of km. T/I/R = 20%.` },

  { id:'explain-plan', cat:'Tool',
    kw:['explain my plan','how does my plan work','walk me through my plan','what does my plan do'],
    syn:['explain plan','walkthrough'],
    a:`Your plan is organized into **4 phases**:\n\n**Phase I — Base.** Easy runs + strides + light R work. Builds aerobic foundation.\n\n**Phase II — Early quality.** R + T sessions. Sharpens economy, builds lactate clearance.\n\n**Phase III — Race-specific.** I + T/M work. Raises VO₂max, adds race-specific endurance.\n\n**Phase IV — Taper.** Reduced volume, short sharpeners, race day.\n\nEvery 3–4 weeks there's a **cutback week** (~25% less volume).\n\nTry **"explain week 5"** to see what any specific week trains.` },

  { id:'how-generated', cat:'Tool',
    kw:['how is my plan generated','how does this tool work','what algorithm','how do you build a plan'],
    syn:['generated','algorithm'],
    a:`The tool applies **Daniels' VDOT methodology**:\n\n1. Your recent race → VDOT score → all paces\n2. Goal race → target VDOT → feasibility check\n3. Weeks available → phase boundaries\n4. Current + peak km → weekly volume targets with cutbacks\n5. Long-run day + rest days → schedule grid\n6. Fitness gap → whether to include M work\n7. Time trial → recalibrates future paces\n\nEvery week is validated against hard rules. If something can't fit, you'll see a validation warning.` },

  { id:'why-cutback', cat:'Tool',
    kw:['why is week x a cutback','why cutback here','why recovery week here'],
    syn:['why cutback'],
    a:`Cutbacks are placed by the rule engine based on plan length:\n\n- **12–13 weeks:** 1 cutback at ~50% mark\n- **14–17 weeks:** 1 mid-block cutback at ~50%\n- **18+ weeks:** 2 cutbacks (~35% and ~72%)\n- **Never** on a TT week, sim week, or immediately before taper\n\nCutback reduces weekly km by ~25% and long run by ~30%.` },

  { id:'what-is-tt', cat:'Tool',
    kw:['what is the time trial','why time trial','tt week','mid block tt'],
    syn:['time trial','tt'],
    a:`The **time trial (TT)** is a mid-block fitness checkpoint. It:\n\n1. **Measures current fitness** — you run all-out and enter the result\n2. **Recalibrates the plan** — a new VDOT updates all future paces\n\n**Important:** the TT counts as your quality session for the week. Days after it are easy. This is deliberate — racing hard then stacking threshold work creates too much stress.` },

  { id:'double-threshold', cat:'Advanced',
    kw:['double threshold','two workouts a day','norwegian method'],
    syn:['double threshold'],
    a:`**Double-threshold training** (the "Norwegian method") runs two threshold sessions per day, 4–5 days/week. Requires:\n\n- Very high weekly volume (120+ km)\n- Precise lactate measurement\n- Expert supervision\n- Years of base\n\n**Not recommended** for recreational runners. Pre-Flight Coach uses classic Daniels periodization.` },

  { id:'hr-zones', cat:'Advanced',
    kw:['heart rate zones','hr training','max heart rate','zone 2'],
    syn:['heart rate','hr zones'],
    a:`**Heart-rate zones vs. pace zones:**\n\n- **Pace zones** (Daniels) are set by VDOT from race results — objective, repeatable.\n- **HR zones** are influenced by heat, caffeine, sleep, stress.\n\n**Daniels uses pace, not HR**, because pace is what you race.\n\n**When HR helps:** hot days, illness, altitude. If your E pace feels way harder than usual at the same speed, check HR.\n\n**Zone 2 hype:** "Zone 2" ≈ Daniels E pace. Same idea, different labeling.` }
];

var JUJU_CHIPS = [
  'What is VDOT?', 'Explain my plan', 'What is T pace?', 'Why cutbacks?',
  'How to taper?', 'How many days a week?', 'Explain week 5', 'What pace is easy?'
];

/* ─────────── 5. State ─────────── */
var jujuState = {
  open: false, mode: 'offline', apiKey: '', model: '',
  messages: [], lastTopic: null, guidedForm: null
};

function jujuSaveSettings(){
  try { localStorage.setItem('juju_settings', JSON.stringify({
    mode: jujuState.mode, apiKey: jujuState.apiKey, model: jujuState.model
  })); } catch(e){}
}
function jujuLoadSettings(){
  try {
    var raw = localStorage.getItem('juju_settings');
    if (!raw) return;
    var s = JSON.parse(raw);
    jujuState.mode = s.mode || 'offline';
    jujuState.apiKey = s.apiKey || '';
    jujuState.model = s.model || '';
  } catch(e){}
}

/* ─────────── 6. Matcher ─────────── */
function jujuNormalize(s){ return String(s||'').toLowerCase().replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim(); }
function jujuMatchKB(query){
  var q = ' ' + jujuNormalize(query) + ' ';
  var best = null, bestScore = 0;
  for (var i = 0; i < JUJU_KB.length; i++){
    var entry = JUJU_KB[i], score = 0;
    for (var k = 0; k < entry.kw.length; k++){
      if (q.indexOf(' ' + entry.kw[k] + ' ') >= 0) score += 10;
      else if (q.indexOf(entry.kw[k]) >= 0) score += 5;
    }
    for (var s = 0; s < entry.syn.length; s++){
      if (q.indexOf(' ' + entry.syn[s] + ' ') >= 0) score += 3;
    }
    if (jujuState.lastTopic === entry.id) score += 1.5;
    if (score > bestScore){ bestScore = score; best = entry; }
  }
  return bestScore >= 3 ? { entry: best, score: bestScore } : null;
}

/* ─────────── 7. Action detection ─────────── */
function jujuTryAction(query){
  var q = jujuNormalize(query);
  var m;

  m = q.match(/(?:explain|describe|walk me through|what(?:'s| is) in|tell me about)\s+week\s+(\d+)/);
  if (m) return { type:'explain_week', week: parseInt(m[1],10) };

  m = q.match(/(?:change|set|regenerate|rebuild|update|rerun|re-?run)\b.*?(?:peak|weekly)\D*(\d+)/);
  if (m) return { type:'set_peak', km: parseInt(m[1],10) };

  m = q.match(/peak\s+(?:to|=)\s*(\d+)/);
  if (m) return { type:'set_peak', km: parseInt(m[1],10) };

  m = q.match(/(?:current|i run|i'm running|im running|i do)\D*(\d+)\s*(?:km|kilomet)/);
  if (m) return { type:'set_current_km', km: parseInt(m[1],10) };

  m = q.match(/goal\s+(?:time\s+)?(?:to|=)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m){
    var h=0, mi=0, se=0;
    if (m[3]){ h=parseInt(m[1],10); mi=parseInt(m[2],10); se=parseInt(m[3],10); }
    else { mi=parseInt(m[1],10); se=parseInt(m[2],10); }
    return { type:'set_goal_time', sec: h*3600 + mi*60 + se };
  }

  if (/(fill|complete|set up|start|guide).*(form|plan|input|entry)|help me (fill|enter|set)/.test(q))
    return { type:'start_guided_form' };

  if (/why.*long run|why is (?:my )?long run|long run (?:so )?short/.test(q))
    return { type:'explain_long_run' };

  if (/^(regenerate|rebuild|rerun|re-?run|refresh)(?:\s+the)?\s*(?:my\s+)?plan\.?$/.test(q))
    return { type:'regenerate' };

  if (/(summar|overview|show).*(plan)|what(?:'s| is) my plan/.test(q))
    return { type:'plan_summary' };

  return null;
}

/* ─────────── 8. Action handlers ─────────── */
function jujuExecuteAction(action){
  if (!action) return null;
  var G = window;

  if (action.type === 'explain_week'){
    if (!G.state || !G.state.plan) return 'No plan generated yet. Fill the form above and click **Analyze** first.';
    var wk = G.state.plan.weeks[action.week - 1];
    if (!wk) return 'Week ' + action.week + ' is beyond your plan (' + G.state.plan.weeks.length + ' weeks).';
    var lines = ['**Week ' + wk.number + ' — Phase ' + wk.phase + '**'];
    if (wk.isCutback) lines.push('_Recovery/absorption week_');
    if (wk.isTT) lines.push('_Time trial week — replaces your main quality session_');
    if (wk.isSim) lines.push('_Race-pace simulation week_');
    lines.push('Total: **' + wk.totalKm.toFixed(1) + ' km**\n');
    var dates = G.computeWeekDates(G.state.plan.startDate, wk.number);
    var dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (var d = 0; d < wk.days.length; d++){
      var day = wk.days[d]; if (!day) continue;
      var dt = dates[d] ? dn[dates[d].getDay()] : '?';
      var line = '- **' + dt + '** · ' + day.title;
      if (day.totalKm > 0) line += ' (' + day.totalKm.toFixed(1) + ' km)';
      if (day.isQ && day.qRank) line += ' · ' + day.qRank;
      if (day.isLongRun) line += ' · long run';
      if (day.isTT) line += ' · **TT**';
      if (day.zone === 'race') line += ' · **RACE**';
      lines.push(line);
    }
    lines.push('\n_Focus:_ ' + G.weekWhy(wk));
    return lines.join('\n');
  }

  if (action.type === 'set_peak'){
    var el = document.getElementById('peakKm'); if (!el) return 'Peak input not found.';
    el.value = action.km; G.updateInputState();
    if (G.state.planType === 'standard'){ setTimeout(function(){ G.runStandardAnalysis(); }, 60); return 'Updated peak weekly km to **'+action.km+'** and regenerating…'; }
    return 'Updated peak weekly km to **'+action.km+'**. Click **Analyze** to regenerate.';
  }
  if (action.type === 'set_current_km'){
    var el2 = document.getElementById('currentKm'); if (!el2) return 'Current-km input not found.';
    el2.value = action.km; G.updateInputState();
    return 'Set current weekly km to **'+action.km+'**. Click **Analyze** to regenerate.';
  }
  if (action.type === 'set_goal_time'){
    if (typeof G.writeTimeField !== 'function') return 'Time field not available.';
    G.writeTimeField('goalTime', action.sec);
    if (typeof G.updateTimeFieldDisplay === 'function') G.updateTimeFieldDisplay('goalTime','goalTimeHint');
    G.updateInputState();
    return 'Updated goal time to **'+G.fmtTime(action.sec)+'**. Click **Analyze** to regenerate.';
  }
  if (action.type === 'regenerate'){
    if (G.state.planType === 'standard'){ G.runStandardAnalysis(); return 'Regenerating your plan…'; }
    if (G.state.planType === 'beginner'){ G.runBeginnerAnalysis(); return 'Regenerating your beginner plan…'; }
    return 'Nothing to regenerate — fill the form first.';
  }
  if (action.type === 'plan_summary'){
    if (!G.state.plan) return 'No plan yet. Fill the form above and click **Analyze**.';
    var l2 = ['**Plan overview**\n'];
    l2.push('- Total weeks: **'+G.state.plan.weeks.length+'**');
    if (G.state.plan.cutbackWeeks && G.state.plan.cutbackWeeks.length) l2.push('- Cutbacks: weeks '+G.state.plan.cutbackWeeks.join(', '));
    if (G.state.plan.ttWeek) l2.push('- Time trial: week **'+G.state.plan.ttWeek+'** ('+G.state.plan.ttDistanceLabel+')');
    var sims = G.state.plan.weeks.filter(function(w){return w.isSim;}).map(function(w){return w.number;});
    if (sims.length) l2.push('- Race-rehearsal weeks: '+sims.join(', '));
    if (G.state.plan.peakKm) l2.push('- Peak weekly km ceiling: **'+G.state.plan.peakKm+'**');
    l2.push('\nAsk me **"explain week 5"** to zoom in on any week.');
    return l2.join('\n');
  }
  if (action.type === 'explain_long_run'){
    if (!G.state.plan || !G.state.plan.caps) return 'Generate a plan first.';
    var caps = G.state.plan.caps;
    return 'Your long runs are capped by **three rules**:\n\n1. **Race duration** — long run targets ~race time\n2. **Weekly volume cap** — never exceeds ~40% of that week\'s km\n3. **Distance ceiling** — hard cap at **'+caps.L+' km**\n\nBecause your peak is '+G.state.plan.peakKm+' km/week, the long-run ceiling is **'+caps.L+' km**.\n\nWant a longer long run? Raise **Peak weekly km**. Try: *"change peak to 100"*.';
  }
  if (action.type === 'start_guided_form') return { guided: true };
  return null;
}

/* ─────────── 9. Guided form ─────────── */
var JUJU_FORM_STEPS = [
  { key:'userName',  q:'First, what should I call you?', parse:function(v){return v.trim();} },
  { key:'startDate', q:'When do you want to **start** training? (YYYY-MM-DD)', parse:function(v){return v.trim();} },
  { key:'raceDate',  q:'And your **race date**? (YYYY-MM-DD)', parse:function(v){return v.trim();} },
  { key:'curDist',   q:'What distance was your **most recent race**? (1500, 5000, 10000, 21097.5, 42195 metres)', parse:function(v){return parseFloat(v)||0;} },
  { key:'curTime',   q:'How long did that take? **HH:MM:SS**', parse:function(v){var t=window.parseTime(v); return t||0;} },
  { key:'currentKm', q:'How many **km per week** are you currently running?', parse:function(v){return parseFloat(v)||0;} },
  { key:'goalDist',  q:'What is your **goal race distance**? (5000, 10000, 21097.5, 42195)', parse:function(v){return parseFloat(v)||0;} },
  { key:'goalTime',  q:'And your **goal time**? HH:MM:SS', parse:function(v){var t=window.parseTime(v); return t||0;} },
  { key:'peakKm',    q:'Last one — what **peak weekly km** should the plan build to?', parse:function(v){return parseFloat(v)||0;} }
];
function jujuFormApply(step, val){
  var el = document.getElementById(step.key); if (!el) return false;
  if (step.key === 'curTime' || step.key === 'goalTime'){
    if (typeof window.writeTimeField === 'function') window.writeTimeField(step.key, val);
    if (typeof window.updateTimeFieldDisplay === 'function') window.updateTimeFieldDisplay(step.key, step.key+'Hint');
  } else { el.value = val; }
  if (typeof window.updateInputState === 'function') window.updateInputState();
  return true;
}

/* ─────────── 10. LLM adapters ─────────── */
function jujuSystemPrompt(){
  var G = window;
  var lines = [
    "You are Juju, a chubby kung-fu panda running coach embedded in Pre-Flight Coach.",
    "You know Jack Daniels' Running Formula deeply — VDOT, E/M/T/I/R paces, periodization, cutbacks, taper.",
    "You also know Pfitzinger, Lydiard, 80/20, and general sports science.",
    "",
    "VOICE: warm, concise, practical, a little playful (you're a panda who runs). Plain language.",
    "FORMAT: short paragraphs. **bold** key terms. Bullets when listing.",
    "HARD RULES:",
    "- Never diagnose medical conditions. For pain/injury, recommend a physio.",
    "- Never prescribe training beyond Daniels safety caps (weekly ramp ≤10%, long run ≤35 km, quality ≤20% of weekly km).",
    "- If a plan exists, refer to it by week number and phase.",
    "",
    "CURRENT PLAN CONTEXT:"
  ];
  if (G.state && G.state.plan && G.state.plan.weeks){
    lines.push('- Total weeks: ' + G.state.plan.weeks.length);
    lines.push('- Peak weekly km: ' + (G.state.plan.peakKm || '—'));
    if (G.state.plan.cutbackWeeks && G.state.plan.cutbackWeeks.length) lines.push('- Cutback weeks: ' + G.state.plan.cutbackWeeks.join(','));
    if (G.state.plan.ttWeek) lines.push('- Time trial week: ' + G.state.plan.ttWeek);
    if (G.state.analysis){
      lines.push('- Current VDOT: ' + G.state.analysis.currentVdot.toFixed(1));
      lines.push('- Target VDOT: ' + G.state.analysis.targetVdot.toFixed(1));
      lines.push('- Goal: ' + G.fmtTime(G.state.analysis.goalTime));
    }
  } else { lines.push('(no plan generated yet)'); }
  return lines.join('\n');
}

function jujuCallLLM(userText, history){
  var provider = jujuState.mode, key = jujuState.apiKey;
  if (!key) return Promise.reject(new Error('No API key set. Click ⚙ to add one.'));
  var sysPrompt = jujuSystemPrompt();
  var recent = (history || []).slice(-8).filter(function(m){ return m.role==='user' || m.role==='assistant'; });

  if (provider === 'openai'){
    var model = jujuState.model || 'gpt-4o-mini';
    var msgs = [{ role:'system', content: sysPrompt }].concat(recent).concat([{ role:'user', content: userText }]);
    return fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
      body: JSON.stringify({ model: model, messages: msgs, temperature:0.6, max_tokens:800 })
    }).then(function(r){
      if (!r.ok) return r.text().then(function(t){ throw new Error('OpenAI: ' + r.status + ' — ' + t.slice(0,180)); });
      return r.json();
    }).then(function(j){ return j.choices[0].message.content; });
  }
  if (provider === 'anthropic'){
    var modelA = jujuState.model || 'claude-3-5-sonnet-latest';
    return fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-api-key': key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model: modelA, max_tokens: 800, system: sysPrompt, messages: recent.concat([{role:'user',content:userText}]) })
    }).then(function(r){
      if (!r.ok) return r.text().then(function(t){ throw new Error('Anthropic: ' + r.status + ' — ' + t.slice(0,180)); });
      return r.json();
    }).then(function(j){ return j.content[0].text; });
  }
  if (provider === 'gemini'){
    var modelG = jujuState.model || 'gemini-1.5-flash';
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelG) + ':generateContent?key=' + encodeURIComponent(key);
    var contents = recent.map(function(m){ return { role: m.role==='assistant'?'model':'user', parts:[{text:m.content}] }; });
    contents.push({ role:'user', parts:[{ text:userText }] });
    return fetch(url, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ systemInstruction:{ parts:[{text: sysPrompt}] }, contents: contents, generationConfig:{ temperature:0.6, maxOutputTokens:800 } })
    }).then(function(r){
      if (!r.ok) return r.text().then(function(t){ throw new Error('Gemini: ' + r.status + ' — ' + t.slice(0,180)); });
      return r.json();
    }).then(function(j){
      var c = j.candidates && j.candidates[0];
      if (c && c.content && c.content.parts && c.content.parts[0]) return c.content.parts[0].text;
      throw new Error('Gemini: unexpected response shape');
    });
  }
  return Promise.reject(new Error('Unknown mode: ' + provider));
}

/* ─────────── 11. Render helpers ─────────── */
function jujuRenderMarkdown(text){
  var t = window.escapeHtml(text || '');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^_])_([^_]+)_(?=[^_]|$)/g, '$1<em>$2</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  var lines = t.split('\n'), out = [], inList = false;
  for (var i=0;i<lines.length;i++){
    var ln = lines[i];
    if (/^\s*[-*]\s+/.test(ln)){
      if (!inList){ out.push('<ul>'); inList = true; }
      out.push('<li>' + ln.replace(/^\s*[-*]\s+/,'') + '</li>');
    } else {
      if (inList){ out.push('</ul>'); inList = false; }
      if (ln.trim() === '') out.push('<br>');
      else out.push(ln);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('');
}
function jujuAddMessage(role, text){
  var box = document.getElementById('jujuMessages'); if (!box) return;
  var el = document.createElement('div');
  el.className = 'juju-msg ' + role;
  el.innerHTML = jujuRenderMarkdown(text);
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}
function jujuShowTyping(){
  var box = document.getElementById('jujuMessages');
  var el = document.createElement('div');
  el.className = 'juju-typing'; el.id = 'jujuTyping';
  el.innerHTML = '<span></span><span></span><span></span>';
  box.appendChild(el); box.scrollTop = box.scrollHeight;
}
function jujuHideTyping(){ var el = document.getElementById('jujuTyping'); if (el) el.remove(); }
function jujuSetStatus(msg){ var el = document.getElementById('jujuStatus'); if (el) el.textContent = msg; }
function jujuRenderChips(){
  var box = document.getElementById('jujuChips'); if (!box) return;
  box.innerHTML = '';
  for (var i=0;i<JUJU_CHIPS.length;i++){
    (function(txt){
      var c = document.createElement('button');
      c.className = 'juju-chip'; c.textContent = txt;
      c.addEventListener('click', function(){ document.getElementById('jujuInput').value = txt; jujuSendMessage(); });
      box.appendChild(c);
    })(JUJU_CHIPS[i]);
  }
}

/* ─────────── 12. Message flow ─────────── */
function jujuSendMessage(){
  var input = document.getElementById('jujuInput'); if (!input) return;
  var text = (input.value || '').trim(); if (!text) return;
  input.value = '';
  jujuAddMessage('user', text);
  jujuState.messages.push({ role:'user', content:text });

  if (jujuState.guidedForm !== null){
    var step = JUJU_FORM_STEPS[jujuState.guidedForm];
    var val = step.parse(text);
    if (jujuFormApply(step, val)){
      jujuState.guidedForm++;
      if (jujuState.guidedForm < JUJU_FORM_STEPS.length){
        var nxt = JUJU_FORM_STEPS[jujuState.guidedForm];
        setTimeout(function(){ jujuAddMessage('bot', nxt.q); }, 250);
        return;
      } else {
        jujuState.guidedForm = null;
        setTimeout(function(){ jujuAddMessage('bot', 'All set! Click **Analyze** on the form to generate your plan. Or say *"regenerate my plan"*.'); }, 250);
        return;
      }
    }
  }

  var action = jujuTryAction(text);
  if (action){
    var result = jujuExecuteAction(action);
    if (result && result.guided){
      jujuState.guidedForm = 0;
      setTimeout(function(){ jujuAddMessage('bot', "Great — let's fill in your details step by step.\n\n" + JUJU_FORM_STEPS[0].q); }, 250);
      return;
    }
    if (typeof result === 'string'){
      setTimeout(function(){
        jujuAddMessage('bot', result);
        jujuState.messages.push({ role:'assistant', content: result });
      }, 250);
      return;
    }
  }

  if (jujuState.mode === 'offline'){
    var match = jujuMatchKB(text);
    jujuShowTyping();
    setTimeout(function(){
      jujuHideTyping();
      if (match){
        jujuState.lastTopic = match.entry.id;
        jujuAddMessage('bot', match.entry.a);
        jujuState.messages.push({ role:'assistant', content: match.entry.a });
      } else {
        jujuAddMessage('bot', "I don't have a built-in answer for that one.\n\nTry asking about **VDOT**, **paces**, **long runs**, **cutbacks**, **taper**, or say **\"explain my plan\"** / **\"explain week 5\"**.\n\nOr connect a real LLM via ⚙ settings — then I can answer anything.");
      }
    }, 300);
    return;
  }

  jujuShowTyping();
  jujuSetStatus('Thinking…');
  jujuCallLLM(text, jujuState.messages.slice(0, -1))
    .then(function(reply){
      jujuHideTyping();
      if (!reply) reply = '(empty response)';
      jujuAddMessage('bot', reply);
      jujuState.messages.push({ role:'assistant', content: reply });
      jujuSetStatus('Online · ' + jujuState.mode);
    })
    .catch(function(err){
      jujuHideTyping();
      jujuAddMessage('system', '⚠ ' + (err && err.message ? err.message : 'LLM request failed'));
      jujuSetStatus('Error — check settings');
    });
}

/* ─────────── 13. Init ─────────── */
function jujuInit(){
  jujuLoadSettings();
  var fab = document.getElementById('jujuFab');
  var drawer = document.getElementById('jujuDrawer');
  var closeBtn = document.getElementById('jujuClose');
  var settingsBtn = document.getElementById('jujuSettingsBtn');
  var settings = document.getElementById('jujuSettings');
  var input = document.getElementById('jujuInput');
  var sendBtn = document.getElementById('jujuSend');
  var modeSel = document.getElementById('jujuMode');
  var keyInp = document.getElementById('jujuApiKey');
  var modelInp = document.getElementById('jujuModel');
  if (!fab || !drawer) return;

  modeSel.value = jujuState.mode;
  keyInp.value = jujuState.apiKey;
  modelInp.value = jujuState.model;
  jujuSetStatus(jujuState.mode === 'offline' ? 'Offline · built-in knowledge' : 'Online · ' + jujuState.mode);

  fab.addEventListener('click', function(){
    jujuState.open = !jujuState.open;
    drawer.classList.toggle('open', jujuState.open);
    if (jujuState.open && jujuState.messages.length === 0){
      jujuAddMessage('bot', "Hey — I'm **Juju** 🐼\n\nPart panda, part coach. I know Jack Daniels' *Running Formula* inside out, plus Pfitzinger, Lydiard, and 80/20.\n\nAsk me anything about training. I can also **explain your plan**, **adjust values** (*\"change peak to 100\"*), or **walk you through filling the form**.\n\nWhat's on your mind?");
      jujuState.messages.push({ role:'assistant', content:'greeting' });
    }
    if (jujuState.open) setTimeout(function(){ input.focus(); }, 50);
  });

  closeBtn.addEventListener('click', function(){ jujuState.open = false; drawer.classList.remove('open'); });
  settingsBtn.addEventListener('click', function(e){ e.stopPropagation(); settings.classList.toggle('open'); });
  modeSel.addEventListener('change', function(){
    jujuState.mode = modeSel.value; jujuSaveSettings();
    jujuSetStatus(jujuState.mode === 'offline' ? 'Offline · built-in knowledge' : 'Online · ' + jujuState.mode);
  });
  keyInp.addEventListener('input', function(){ jujuState.apiKey = keyInp.value.trim(); jujuSaveSettings(); });
  modelInp.addEventListener('input', function(){ jujuState.model = modelInp.value.trim(); jujuSaveSettings(); });
  sendBtn.addEventListener('click', jujuSendMessage);
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); jujuSendMessage(); }
    if (e.key === 'Escape'){ settings.classList.remove('open'); }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && jujuState.open) closeBtn.click();
  });
  document.addEventListener('click', function(e){
    if (settings.classList.contains('open') && !settings.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)){
      settings.classList.remove('open');
    }
  });
  jujuRenderChips();
}

/* ─────────── 14. Boot ─────────── */
function boot(){ injectCSS(); injectHTML(); jujuInit(); }
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

})();