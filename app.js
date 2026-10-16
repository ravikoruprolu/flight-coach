var APP_VERSION = 'v26';

function parseLocalDate(str){
  if (!str) return null;
  var parts = String(str).split('-');
  if (parts.length !== 3) return new Date(str);
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10) - 1;
  var d = parseInt(parts[2], 10);
  return new Date(y, m, d);
}

var Vdot={
  vo2FromSpeed:function(v){return -4.60+0.182258*v+0.000104*v*v;},
  fractionOfVdot:function(t){return 0.8+0.1894393*Math.exp(-0.012778*t)+0.2989558*Math.exp(-0.1932605*t);},
  fromRace:function(dM,tSec){var t=tSec/60,v=dM/t;return this.vo2FromSpeed(v)/this.fractionOfVdot(t);},
  speedAtPercent:function(vdot,pct){var target=vdot*pct,a=0.000104,b=0.182258,c=-4.60-target;return (-b+Math.sqrt(b*b-4*a*c))/(2*a);},
  timeFor:function(vdot,pct,dM){return dM/this.speedAtPercent(vdot,pct)*60;}
};
var PCT={E_SLOW:0.62,E_FAST:0.74,M:0.81,T:0.88,I:0.98,R:1.06};

/* ============================================================
   TIME FIELD HELPERS — three segmented inputs, one value
================================================================ */
function readTimeField(prefix){
  var hEl = document.getElementById(prefix+'H');
  var mEl = document.getElementById(prefix+'M');
  var sEl = document.getElementById(prefix+'S');
  if (!hEl || !mEl || !sEl) return { seconds: null, empty: true, invalid: false };
  var hStr = (hEl.value || '').trim();
  var mStr = (mEl.value || '').trim();
  var sStr = (sEl.value || '').trim();
  if (!hStr && !mStr && !sStr) return { seconds: null, empty: true, invalid: false };
  var h = parseInt(hStr, 10); if (isNaN(h)) h = 0;
  var m = parseInt(mStr, 10); if (isNaN(m)) m = 0;
  var s = parseInt(sStr, 10); if (isNaN(s)) s = 0;
  if (m > 59 || s > 59) return { seconds: null, empty: false, invalid: true };
  var total = h*3600 + m*60 + s;
  if (total <= 0) return { seconds: null, empty: true, invalid: false };
  return { seconds: total, empty: false, invalid: false };
}
function writeTimeField(prefix, sec){
  var hEl = document.getElementById(prefix+'H');
  var mEl = document.getElementById(prefix+'M');
  var sEl = document.getElementById(prefix+'S');
  if (!hEl || !mEl || !sEl) return;
  if (!sec || sec <= 0){ hEl.value=''; mEl.value=''; sEl.value=''; return; }
  var h = Math.floor(sec/3600);
  var m = Math.floor((sec%3600)/60);
  var s = Math.round(sec%60);
  if (s === 60){ s = 0; m += 1; }
  if (m === 60){ m = 0; h += 1; }
  hEl.value = h > 0 ? String(h).padStart(2,'0') : '';
  mEl.value = (h > 0 || m > 0) ? String(m).padStart(2,'0') : '';
  sEl.value = String(s).padStart(2,'0');
}
function clearTimeField(prefix){
  var ids = ['H','M','S'];
  for (var i=0;i<ids.length;i++){
    var el = document.getElementById(prefix+ids[i]);
    if (el) el.value = '';
  }
}
function setupTimeField(prefix){
  var units = ['H','M','S'];
  units.forEach(function(u, idx){
    var el = document.getElementById(prefix+u);
    if (!el) return;
    el.addEventListener('input', function(e){
      var v = e.target.value.replace(/\D/g, '').slice(0, 2);
      e.target.value = v;
      if (v.length === 2 && idx < units.length - 1){
        var next = document.getElementById(prefix+units[idx+1]);
        if (next){ next.focus(); next.select(); }
      }
      updateInputState();
    });
    el.addEventListener('keydown', function(e){
      if (e.key === 'Backspace' && e.target.value === '' && idx > 0){
        var prev = document.getElementById(prefix+units[idx-1]);
        if (prev){ prev.focus(); prev.select(); e.preventDefault(); }
      }
      if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length && idx < units.length - 1){
        var next = document.getElementById(prefix+units[idx+1]);
        if (next){ next.focus(); next.select(); e.preventDefault(); }
      }
      if (e.key === 'ArrowLeft' && e.target.selectionStart === 0 && idx > 0){
        var prev = document.getElementById(prefix+units[idx-1]);
        if (prev){ prev.focus(); prev.select(); e.preventDefault(); }
      }
    });
    el.addEventListener('blur', function(){
      if (el.value.length === 1) el.value = '0' + el.value;
      updateInputState();
    });
    el.addEventListener('focus', function(){ el.select(); });
  });
}

function fmtTime(sec,opt){
  opt=opt||{};
  if(!isFinite(sec)||sec<=0)return '—';
  var t=Math.round(sec),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;
  if(h>0)return h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  if(opt.alwaysMin||m>0)return m+':'+(s<10?'0':'')+s;
  return s+'s';
}
function parseTime(str, distanceM){
  /* Kept for backward compat — used in prompt-based goal reset */
  if(!str||!String(str).trim())return null;
  var trimmed = String(str).trim();
  if (trimmed.indexOf(':') >= 0){
    var parts = trimmed.split(':').map(Number);
    for(var i=0;i<parts.length;i++){if(isNaN(parts[i]))return null;}
    if(parts.length===2)return parts[0]*60+parts[1];
    if(parts.length===3)return parts[0]*3600+parts[1]*60+parts[2];
    return null;
  }
  var num = Number(trimmed);
  if (isNaN(num) || num <= 0) return null;
  if (distanceM && distanceM >= 3000 && num >= 5) return num * 60;
  if (distanceM && distanceM >= 3000 && num < 5) return num * 60;
  return num;
}
function paceKmShort(sec){
  var t=Math.round(sec);
  var m=Math.floor(t/60), s=t%60;
  return m+':'+(s<10?'0':'')+s;
}
function paceKm(sec){return paceKmShort(sec)+'/km';}
function pace400(sec){
  var t=Math.round(sec);
  var m=Math.floor(t/60), s=t%60;
  return m+':'+(s<10?'0':'')+s;
}
function findRaceTime(vdot,dM){var lo=60,hi=60*300;for(var i=0;i<60;i++){var mid=(lo+hi)/2;if(Vdot.fromRace(dM,mid)>vdot)lo=mid;else hi=mid;}return (lo+hi)/2;}
function fmtDateShort(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function fmtDateLong(d){return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});}
function dayNameOf(d){return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];}
function diffDays(a,b){return Math.round((b-a)/(1000*60*60*24));}
function isMarathonDistance(g){ return parseFloat(g) === 42195; }

var ELITE_MIN_SECONDS = {1500:206, 1609.344:223, 3000:440, 5000:755, 10000:1571, 21097.5:3480, 42195:7235};
function validateRaceInput(distanceM, timeSec){
  if (!distanceM || !timeSec || timeSec <= 0){
    return {valid: false, reason: 'Please enter both a race distance and a race time.'};
  }
  var bestKey = null, bestDiff = Infinity;
  for (var k in ELITE_MIN_SECONDS){
    var diff = Math.abs(parseFloat(k) - distanceM);
    if (diff < bestDiff){ bestDiff = diff; bestKey = k; }
  }
  if (bestKey && bestDiff < 200){
    var minTime = ELITE_MIN_SECONDS[bestKey];
    if (timeSec < minTime){
      return {valid: false, reason: 'That time is faster than the world record for this distance.'};
    }
  }
  var vdot = Vdot.fromRace(distanceM, timeSec);
  if (vdot > 90){
    return {valid: false, reason: 'That time implies a fitness level above the world\'s best.'};
  }
  if (vdot < 10){
    return {valid: false, reason: 'That time implies a fitness below what VDOT handles well. If you\'re just starting out, try <strong>"I\'m new to running"</strong> mode.'};
  }
  return {valid: true, vdot: vdot};
}

function computeWeekDates(startDateStr, weekNum){
  var s = parseLocalDate(startDateStr);
  if (!s) return [];
  s.setHours(0,0,0,0);
  var dates = [];
  var dow = s.getDay();
  var daysUntilSunday = (dow === 0) ? 0 : (7 - dow);
  var firstSunday = new Date(s);
  firstSunday.setDate(firstSunday.getDate() + daysUntilSunday);
  if (weekNum === 1){
    for (var i = 0; i <= daysUntilSunday; i++){
      var d = new Date(s); d.setDate(d.getDate() + i); dates.push(d);
    }
  } else {
    var firstMonday = new Date(firstSunday);
    firstMonday.setDate(firstMonday.getDate() + 1);
    var weekStart = new Date(firstMonday);
    weekStart.setDate(weekStart.getDate() + (weekNum - 2) * 7);
    for (var i = 0; i < 7; i++){
      var d = new Date(weekStart); d.setDate(d.getDate() + i); dates.push(d);
    }
  }
  return dates;
}
function computeWeeks(startStr, endStr){
  if(!startStr||!endStr)return null;
  var s = parseLocalDate(startStr); if (!s) return null;
  var e = parseLocalDate(endStr);   if (!e) return null;
  s.setHours(0,0,0,0); e.setHours(0,0,0,0);
  if (e <= s) return null;
  var dow = s.getDay();
  var daysUntilSunday = (dow === 0) ? 0 : (7 - dow);
  var firstSunday = new Date(s);
  firstSunday.setDate(firstSunday.getDate() + daysUntilSunday);
  if (e <= firstSunday) return 1;
  var firstMonday = new Date(firstSunday);
  firstMonday.setDate(firstMonday.getDate() + 1);
  var daysAfterWeek1 = diffDays(firstMonday, e);
  return 1 + Math.ceil((daysAfterWeek1 + 1) / 7);
}
function raceDayIndexInFinalWeek(startStr, endStr, weeks){
  var dates = computeWeekDates(startStr, weeks);
  var e = parseLocalDate(endStr); if (!e) return dates.length - 1;
  e.setHours(0,0,0,0);
  for (var i = 0; i < dates.length; i++){ if (dates[i].getTime() === e.getTime()) return i; }
  return dates.length - 1;
}
function computePhaseBoundaries(totalWeeks){
  if (totalWeeks <= 2) return {I: totalWeeks - 1, II: totalWeeks - 1, III: totalWeeks - 1, IV: totalWeeks, phaseIVStart: totalWeeks};
  if (totalWeeks <= 4){
    var iEnd = totalWeeks - 2;
    return {I: iEnd, II: iEnd, III: iEnd, IV: totalWeeks, phaseIVStart: iEnd + 1};
  }
  if (totalWeeks <= 6){
    var iEnd2 = totalWeeks - 3;
    return {I: iEnd2, II: iEnd2, III: iEnd2, IV: totalWeeks, phaseIVStart: totalWeeks - 1};
  }
  var phaseIVWeeks = 2;
  var remaining = totalWeeks - phaseIVWeeks;
  var phaseIWeeks = Math.max(2, Math.round(remaining * 0.32));
  var phaseIIWeeks = Math.max(2, Math.round(remaining * 0.32));
  var phaseIIIWeeks = remaining - phaseIWeeks - phaseIIWeeks;
  if (phaseIIIWeeks < 1){
    phaseIIIWeeks = 1;
    phaseIIWeeks = Math.max(1, remaining - phaseIWeeks - phaseIIIWeeks);
    phaseIWeeks = Math.max(1, remaining - phaseIIWeeks - phaseIIIWeeks);
  }
  return {I: phaseIWeeks, II: phaseIWeeks + phaseIIWeeks, III: phaseIWeeks + phaseIIWeeks + phaseIIIWeeks, IV: totalWeeks, phaseIVStart: phaseIWeeks + phaseIIWeeks + phaseIIIWeeks + 1};
}
function paceFromVdot(vdot){
  return {E_slow:Vdot.timeFor(vdot,PCT.E_SLOW,1000),E_fast:Vdot.timeFor(vdot,PCT.E_FAST,1000),M:Vdot.timeFor(vdot,PCT.M,1000),T:Vdot.timeFor(vdot,PCT.T,1000),T400:Vdot.timeFor(vdot,PCT.T,400),I:Vdot.timeFor(vdot,PCT.I,1000),I400:Vdot.timeFor(vdot,PCT.I,400),R:Vdot.timeFor(vdot,PCT.R,1000),R400:Vdot.timeFor(vdot,PCT.R,400),R200:Vdot.timeFor(vdot,PCT.R,200)};
}

var RACE_META={'5000':{km:5,name:'5K'},'10000':{km:10,name:'10K'},'21097.5':{km:21.0975,name:'half marathon'},'42195':{km:42.195,name:'marathon'}};
function minAdequateVolume(goalDist,targetVdot){
  var key = String(goalDist);
  var distFactor={'5000':0.9,'10000':1.0,'21097.5':1.1,'42195':1.2}[key]||1.0;
  var vdotFactor;
  if(targetVdot<35)vdotFactor=0.7;
  else if(targetVdot<45)vdotFactor=0.9;
  else if(targetVdot<55)vdotFactor=1.15;
  else if(targetVdot<65)vdotFactor=1.4;
  else if(targetVdot<75)vdotFactor=1.7;
  else vdotFactor=2.0;
  return 45*distFactor*vdotFactor;
}
function targetLongDurationMin(goalDist){
  // Training-time targets, not a fraction of goal race duration. The final
  // target is still bounded by current weekly volume and the plan's long-run cap.
  var targets={'5000':55,'10000':75,'21097.5':105,'42195':165};
  return targets[String(goalDist)] || 75;
}
function realisticGain(weeklyKm,adequateVol,weeks){
  var base=1.6;
  if(weeklyKm<adequateVol)base*=Math.max(0.35,weeklyKm/adequateVol);
  return base*(weeks/14);
}
function analyze(cfg){
  var curVdot=Vdot.fromRace(cfg.curDist,cfg.curTime);
  var targetVdot=Vdot.fromRace(cfg.goalDist,cfg.goalTime);
  var currentGoalTime=findRaceTime(curVdot,cfg.goalDist);
  var currentGoalPaceKm=currentGoalTime/(cfg.goalDist/1000);
  var targetGoalPaceKm=cfg.goalTime/(cfg.goalDist/1000);
  var paceGapSec=currentGoalPaceKm-targetGoalPaceKm;
  var vdotGap=targetVdot-curVdot;
  var adequateVol=minAdequateVolume(cfg.goalDist,targetVdot);
  var volOk=(cfg.peakKm>=adequateVol*0.95);
  var rawTargetLongMin=targetLongDurationMin(cfg.goalDist);
  var curPaces = paceFromVdot(curVdot);
  var avgEPaceSec = (curPaces.E_slow + curPaces.E_fast) / 2;
  var isMar = isMarathonDistance(cfg.goalDist);
  var caps = computeCaps(cfg.peakKm, cfg.goalDist);
  var targetLongMin = Math.min(rawTargetLongMin, caps.Lmin);
  var planPeakLongKm = Math.min(caps.L, targetLongMin * 60 / avgEPaceSec);
  var planPeakLongMin = planPeakLongKm * avgEPaceSec / 60;
  var planCanReachLongRun = planPeakLongMin >= targetLongMin * 0.9;
  var achievableGain=realisticGain(cfg.peakKm,adequateVol,cfg.weeks);
  var vdotFeasible=vdotGap<=achievableGain*1.15;
  var paceGapLarge=paceGapSec>20;
  var goalIsEasier = vdotGap < -0.1;
  var goalIsAtAbility = !goalIsEasier && vdotGap <= 0.5;
  var severity;
  if (goalIsEasier || goalIsAtAbility) severity='green';
  else if(vdotFeasible && volOk && planCanReachLongRun) severity='green';
  else if(vdotGap<=achievableGain*1.6 && cfg.peakKm>=adequateVol*0.7) severity='amber';
  else severity='red';
  var predictedVdot=curVdot+achievableGain;
  var predictedTime=findRaceTime(predictedVdot,cfg.goalDist);
  var suggestedGoalTime = goalIsEasier ? currentGoalTime : predictedTime;
  return {
    currentVdot:curVdot,targetVdot:targetVdot,currentGoalTime:currentGoalTime,goalTime:cfg.goalTime,
    currentGoalPaceKm:currentGoalPaceKm,targetGoalPaceKm:targetGoalPaceKm,paceGapSec:paceGapSec,
    vdotGap:vdotGap,currentKm:cfg.currentKm,peakKm:cfg.peakKm,adequateVol:adequateVol,
    weeks:cfg.weeks,targetLongMin:targetLongMin,achievableGain:achievableGain,predictedVdot:predictedVdot,predictedTime:predictedTime,
    volOk:volOk,planCanReachLongRun:planCanReachLongRun,vdotFeasible:vdotFeasible,paceGapLarge:paceGapLarge,
    severity:severity,goalDist:cfg.goalDist,goalIsEasier:goalIsEasier,goalIsAtAbility:goalIsAtAbility,suggestedGoalTime:suggestedGoalTime,
    noVolumeGrowth: cfg.peakKm <= cfg.currentKm * 1.05
  };
}
function suggestPeakTiers(goalDist,currentKm){
  var key=String(goalDist);
  var tiers={
    '5000':[{name:'Beginner',km:30,note:'Just finish a 5K comfortably'},{name:'Intermediate',km:45,note:'Sub-25 5K'},{name:'Advanced',km:60,note:'Sub-20 5K'},{name:'Elite',km:100,note:'Sub-15 5K'}],
    '10000':[{name:'Beginner',km:35,note:'Finish a 10K comfortably'},{name:'Intermediate',km:55,note:'Sub-50 10K'},{name:'Advanced',km:75,note:'Sub-40 10K'},{name:'Elite',km:120,note:'Sub-30 10K'}],
    '21097.5':[{name:'Beginner',km:45,note:'Finish a half (2:00+)'},{name:'Intermediate',km:65,note:'Sub-1:45 half'},{name:'Advanced',km:85,note:'Sub-1:30 half'},{name:'Elite',km:130,note:'Sub-1:15 half'}],
    '42195':[{name:'Beginner',km:60,note:'Finish a marathon (4:30+)'},{name:'Intermediate',km:85,note:'Sub-3:30 marathon'},{name:'Advanced',km:110,note:'Sub-3:00 marathon'},{name:'Elite',km:170,note:'Sub-2:30 marathon'}]
  };
  var list=tiers[key]||tiers['21097.5'];
  return list.map(function(t){return {name:t.name,km:Math.max(t.km,currentKm),note:t.note};});
}
var DAY_NAMES=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var DAY_FULL_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function computeCaps(peakKm,goalDist){
  var isMar = isMarathonDistance(goalDist);
  var lMaxKm = isMar ? 35 : 30;
  var lMaxMin = isMar ? 195 : 150;
  // Marathon-specific long-run policy: the weekly ceiling alone must not
  // accidentally cap all long runs below 30 km in a suitably loaded plan.
  // 70+ km peak plans may target 30–32 km; 85+ km plans may reach 32–35 km.
  var lCap;
  if (isMar) {
    if (peakKm >= 85) lCap = Math.min(35, Math.max(32, peakKm * 0.40));
    else if (peakKm >= 70) lCap = Math.min(32, Math.max(30, peakKm * 0.46));
    else if (peakKm >= 60) lCap = Math.min(30, peakKm * 0.46);
    else lCap = Math.min(28, peakKm * 0.46);
  } else {
    lCap = Math.min(peakKm * 0.32, lMaxKm);
  }
  var lDurationCap = isMar && peakKm >= 70 ? lMaxMin : Math.min(lCap * 6.5, lMaxMin);
  return {R:Math.min(peakKm*0.05,8),I:Math.min(peakKm*0.08,10),T:Math.min(peakKm*0.10,16),L:Math.round(lCap),Lmin:Math.round(Math.min(lCap*6.5,lDurationCap))};
}
function chooseTTDistance(goalDist, peakKm){
  var goalTargets = {'800':1000,'1500':1500,'1609.344':1609,'3000':3000,'5000':5000,'10000':5000,'21097.5':10000,'42195':10000};
  var target = goalTargets[String(goalDist)] || 5000;
  var maxFromVolume = peakKm * 0.15 * 1000;
  var tt = Math.min(target, maxFromVolume);
  var standards = [600, 800, 1000, 1500, 1609, 3000, 5000, 10000];
  var best = 600;
  for (var i = 0; i < standards.length; i++) { if (standards[i] <= tt) best = standards[i]; }
  return best;
}
function ttDistanceLabelFor(meters){
  if (meters === 1609) return '1 mile';
  if (meters >= 1000) return (meters/1000).toFixed(meters%1000===0?0:1) + ' km';
  return meters + ' m';
}
function eRunKm(km,strides){
  return { zone:'E', title: km+' km E'+(strides?' + '+strides+' strides':''), totalKm: km, strides: strides || 0, detail: strides ? strides+' × 20 s light & quick' : '', isQ: false };
}
function lRunKm(caps, weekVol, capMin, paces, goalDist){
  var avgEPaceSec = (paces.E_slow + paces.E_fast) / 2;
  var kmFromTime = capMin * 60 / avgEPaceSec;
  var isMar = isMarathonDistance(goalDist);
  // Experienced marathon plans may place one long run at a higher share of
  // weekly mileage; this is still bounded by the configured long-run and time caps.
  var weeklyFrac = isMar ? (weekVol >= 70 ? 0.46 : weekVol >= 60 ? 0.44 : 0.40) : 0.32;
  var weeklyCap = weekVol * weeklyFrac;
  var km = Math.min(caps.L, kmFromTime, weeklyCap);
  var actualKm = Math.max(4, Math.round(km * 2) / 2);
  return { zone:'E', title:'Long run '+actualKm+' km', totalKm: actualKm, detail:'Easy / conversational', isQ: false, isLongRun: true };
}
function restDay(){return {zone:'rest',title:'Rest',totalKm:0,detail:'',isQ:false};}
function raceDay(label){return {zone:'race',title:label,totalKm:0,detail:'Race day',isQ:false};}
function ttDay(distLabel,distM){
  var testKm=distM/1000;
  var totalKm=Math.round((testKm+3)*10)/10;
  return {zone:'tt',title:distLabel+' time trial',totalKm:totalKm,testDistanceKm:testKm,
    detail:distLabel+' test at hard, even effort; total session distance includes warm-up and cool-down',isQ:true};
}
function racePaceSimLong(peakKm, goalDist, variant){
  var isMar = isMarathonDistance(goalDist);
  var v = (variant || 0) % 2;
  if (v === 0){
    var totalA = isMar ? (peakKm >= 85 ? Math.min(peakKm * 0.38, 32) : peakKm >= 70 ? Math.min(peakKm * 0.46, 32) : Math.min(peakKm * 0.44, 30)) : Math.min(peakKm * 0.28, 26);
    totalA = Math.round(totalA);
    var mA = Math.round(totalA * 0.55);
    var eA = totalA - mA;
    return {zone:'M',title:eA+' km E + '+mA+' km M',totalKm:totalA,detail:'Race rehearsal · practice fueling at current-fitness marathon pace',isQ:true,isSim:true,isLongRun:true};
  }
  var totalB = isMar ? (peakKm >= 85 ? Math.min(peakKm * 0.34, 30) : peakKm >= 70 ? Math.min(peakKm * 0.42, 30) : Math.min(peakKm * 0.40, 28)) : Math.min(peakKm * 0.26, 22);
  totalB = Math.round(totalB);
  var tB = Math.round(totalB * 0.20);
  var mB = Math.round(totalB * 0.45);
  var eB = totalB - mB - tB;
  return {zone:'M',title:eB+' km E + '+mB+' km M + '+tB+' km T',totalKm:totalB,detail:'Race rehearsal at controlled current-fitness paces; not target pace unless validated',isQ:true,isSim:true,isLongRun:true};
}
function rSession(caps,weeklyKm,v){
  var lim=caps.R,variant=v%4;
  if(variant===0){var n=Math.min(12,Math.max(6,Math.floor(lim/0.2)));return {zone:'R',title:n+' × 200 m R',totalKm:+(n*0.2+3).toFixed(1),detail:'200 m jog recovery',isQ:true};}
  if(variant===1){var n=Math.min(10,Math.max(4,Math.floor(lim/0.3)));return {zone:'R',title:n+' × 300 m R',totalKm:+(n*0.3+3).toFixed(1),detail:'300 m jog recovery',isQ:true};}
  if(variant===2){var n=Math.min(8,Math.max(4,Math.floor(lim/0.4)));return {zone:'R',title:n+' × 400 m R',totalKm:+(n*0.4+3).toFixed(1),detail:'400 m jog recovery',isQ:true};}
  var n200=Math.min(6,Math.floor(lim/0.2/2)),n400=Math.min(4,Math.floor(lim/0.4/2));
  return {zone:'R',title:n200+' × 200 + '+n400+' × 400 R',totalKm:+(n200*0.2+n400*0.4+3).toFixed(1),detail:'Mixed reps',isQ:true};
}
function iSession(caps,weeklyKm,v){
  var lim=caps.I,variant=v%4;
  if(variant===0){var n=Math.min(6,Math.max(3,Math.floor(lim/1)));return {zone:'I',title:n+' × 1,000 m I',totalKm:+(n+3).toFixed(1),detail:'3 min jog recovery',isQ:true};}
  if(variant===1){var n=Math.min(8,Math.max(4,Math.floor(lim/0.8)));return {zone:'I',title:n+' × 800 m I',totalKm:+(n*0.8+3).toFixed(1),detail:'2–3 min jog recovery',isQ:true};}
  if(variant===2){var n=Math.min(5,Math.max(3,Math.floor(lim/1.2)));return {zone:'I',title:n+' × 1,200 m I',totalKm:+(n*1.2+3).toFixed(1),detail:'3 min jog recovery',isQ:true};}
  var n=Math.min(8,Math.max(4,Math.floor(lim/0.7)));
  return {zone:'I',title:n+' × 3 min Hard',totalKm:+(n*0.7+3).toFixed(1),detail:'2 min jog recovery',isQ:true};
}
function tSession(caps,weeklyKm,v){
  var lim=caps.T,variant=v%5;
  if(variant===0)return {zone:'T',title:'Steady 20 min T',totalKm:5.5,detail:'Continuous threshold',isQ:true};
  if(variant===1){var n=Math.min(6,Math.max(3,Math.floor(lim)));return {zone:'T',title:n+' × 1 km T',totalKm:+(n+3).toFixed(1),detail:'1 min rests',isQ:true};}
  if(variant===2){var n=Math.min(3,Math.max(2,Math.floor(lim/2)));return {zone:'T',title:n+' × 2 km T',totalKm:+(n*2+3).toFixed(1),detail:'2 min rests',isQ:true};}
  if(variant===3){var n=Math.min(4,Math.max(2,Math.floor(lim/3)));return {zone:'T',title:n+' × 3 km T',totalKm:+(n*3+3).toFixed(1),detail:'3 min rests',isQ:true};}
  var n=Math.min(6,Math.max(3,Math.floor(lim)));
  return {zone:'T',title:n+' × 1 km T + 4 × 200 R',totalKm:+(n+4).toFixed(1),detail:'1 min rests · finish w/ R 200s',isQ:true};
}
function goalPaceRehearsal(goalPaceSecPerKm){return {zone:'T',title:'3 × 2 km @ goal pace',totalKm:9,detail:'Target '+paceKm(goalPaceSecPerKm)+' · 3 min jogs',paceOverrideSecPerKm:goalPaceSecPerKm,isQ:true};}
function padEasyRuns(days, weekLen, targetKm, longRunKm){
  if (weekLen < 5) return;
  var currentKm = 0;
  var easyIndices = [];
  for (var i = 0; i < days.length; i++){
    var d = days[i];
    if (!d) continue;
    if (isFinite(d.totalKm)) currentKm += d.totalKm;
    if (d.zone === 'E' && !d.isLongRun && !d.adjusted && typeof d.strides === 'number' && d.totalKm > 0){
      easyIndices.push(i);
    }
  }
  if (easyIndices.length === 0) return;
  var scaledTarget = Math.round(targetKm * (weekLen / 7));
  var shortfall = Math.round(scaledTarget - currentKm);
  if (shortfall <= 0) return;
  var cap = longRunKm ? longRunKm * 0.65 : 12;
  for (var i = 0; i < easyIndices.length && shortfall > 0; i++){
    var idx = easyIndices[i];
    var d = days[idx];
    var room = cap - d.totalKm;
    if (room <= 0) continue;
    var remainingSlots = easyIndices.length - i;
    var add = Math.min(room, Math.ceil(shortfall / remainingSlots));
    if (add <= 0) continue;
    d.totalKm = Math.round(d.totalKm + add);
    d.title = d.totalKm + ' km E' + (d.strides ? ' + ' + d.strides + ' strides' : '');
    shortfall -= add;
  }
}

/* Rule-based training core: deterministic plan checks and conflict resolution. */
function getWeekTrainingKm(week){
  var total=0;
  (week.days||[]).forEach(function(d){if(d && d.zone!=='race' && isFinite(d.totalKm)) total+=d.totalKm;});
  return Math.round(total*10)/10;
}
function refreshWeekTotals(week){
  week.totalKm=getWeekTrainingKm(week);
  week.raceKm=week.raceKm||0;
  week.totalRunningKm=Math.round((week.totalKm+week.raceKm)*10)/10;
  return week.totalKm;
}
function enforceWeeklyMileageCap(week, peakKm, isRaceWeek, currentWeekCap){
  // Priority: optional padding/easy runs first, then long run only if unavoidable.
  var cap=Math.max(0, Math.min(peakKm, currentWeekCap==null?peakKm:currentWeekCap));
  var total=refreshWeekTotals(week);
  if(total<=cap+0.01) return {passed:true, before:total, after:total, cap:cap, reductions:[]};
  var reductions=[];
  var easy=week.days.map(function(d,i){return {d:d,i:i};}).filter(function(x){return x.d && x.d.zone==='E' && !x.d.isLongRun && !x.d.isQ;});
  // Trim the largest ordinary easy runs first, retaining a 4 km minimum where possible.
  easy.sort(function(a,b){return (b.d.totalKm||0)-(a.d.totalKm||0);});
  easy.forEach(function(x){
    total=refreshWeekTotals(week); if(total<=cap+0.01) return;
    var d=x.d, old=d.totalKm||0, floor=old>=5?4:0;
    var take=Math.min(old-floor, total-cap);
    if(take>0){d.totalKm=Math.max(floor,Math.round((old-take)*10)/10); d.title=d.totalKm+' km E'+(d.strides?' + '+d.strides+' strides':''); reductions.push({day:x.i,from:old,to:d.totalKm,reason:'easy-volume'});}
  });
  // If still over target, remove optional easy days before compromising the long run.
  total=refreshWeekTotals(week);
  if(total>cap+0.01){
    var removable=week.days.map(function(d,i){return {d:d,i:i};}).filter(function(x){return x.d && x.d.zone==='E' && !x.d.isLongRun && !x.d.isQ && x.d.totalKm>0;});
    removable.sort(function(a,b){return (b.d.totalKm||0)-(a.d.totalKm||0);});
    removable.forEach(function(x){
      total=refreshWeekTotals(week); if(total<=cap+0.01) return;
      var old=x.d.totalKm||0;
      x.d.zone='rest'; x.d.title='Rest (weekly volume adjustment)'; x.d.totalKm=0; x.d.strides=0;
      x.d.detail='Optional easy mileage removed to respect the weekly volume target';
      reductions.push({day:x.i,from:old,to:0,reason:'optional-easy-day-removed'});
    });
  }
  // Preserve the workout itself; only trim up to 1 km of warm-up/cool-down when necessary.
  total=refreshWeekTotals(week);
  if(total>cap+0.01){
    var quality=week.days.map(function(d,i){return {d:d,i:i};}).filter(function(x){return x.d && x.d.isQ && !x.d.isLongRun && (x.d.totalKm||0)>0;});
    quality.sort(function(a,b){return (b.d.totalKm||0)-(a.d.totalKm||0);});
    quality.forEach(function(x){
      total=refreshWeekTotals(week); if(total<=cap+0.01) return;
      var d=x.d, old=d.totalKm||0;
      var floor=d.zone==='tt' && d.testDistanceKm ? d.testDistanceKm+2 : Math.max(3,old-1);
      var take=Math.min(Math.max(0,old-floor),total-cap);
      if(take>0.01){d.totalKm=Math.max(floor,Math.round((old-take)*10)/10);reductions.push({day:x.i,from:old,to:d.totalKm,reason:'quality-warmup-cooldown'});}
    });
  }
  // The long run is the last thing shortened, and never below 4 km.
  total=refreshWeekTotals(week);
  if(total>cap+0.01){
    var long=week.days.find(function(d){return d && d.isLongRun;});
    if(long){var oldLong=long.totalKm||0;var newLong=Math.max(4,Math.round((oldLong-(total-cap))*10)/10);if(newLong<oldLong){long.totalKm=newLong;long.title='Long run '+newLong+' km';reductions.push({from:oldLong,to:newLong,reason:'long-run-emergency-cap'});}}
  }
  total=refreshWeekTotals(week);
  return {passed:total<=cap+0.01,before:Math.round((week._preCapKm||total)*10)/10,after:total,cap:cap,reductions:reductions};
}
function validateTrainingPlan(plan, cfg){
  var issues=[];
  var peak=cfg.peakKm;
  plan.weeks.forEach(function(w){
    refreshWeekTotals(w);
    if(w.totalKm>peak+0.01) issues.push({ruleId:'LOAD_MAX_WEEKLY_KM',severity:'error',week:w.number,observed:w.totalKm,expected:'<= '+peak});
    if(w.capResult && !w.capResult.passed) issues.push({ruleId:'LOAD_CAP_UNRESOLVED',severity:'error',week:w.number,observed:w.totalKm,expected:'<= '+(w.capResult.cap||peak)});
    if(w.isCutback && w.number!==plan.weeks.length && w.number!==plan.bounds.phaseIVStart && w.totalKm>peak*0.9) issues.push({ruleId:'LOAD_CUTBACK_MAGNITUDE',severity:'warning',week:w.number,observed:w.totalKm,expected:'meaningful reduction from adjacent build weeks'});
    if((w.isCutback || w.isModReduced) && w.number>1){var previousWeek=plan.weeks[w.number-2];if(previousWeek && previousWeek.totalKm>0 && w.totalKm>=previousWeek.totalKm*0.9) issues.push({ruleId:'RECOVERY_WEEK_NOT_REDUCED',severity:'warning',week:w.number,observed:w.totalKm,expected:'at least 10% below previous week actual training volume'});}
    if(w.isCutback){
      var cutbackLong=(w.days||[]).find(function(d){return d && d.isLongRun;});
      if(cutbackLong && cutbackLong.isSim) issues.push({ruleId:'RECOVERY_NO_RACE_REHEARSAL',severity:'error',week:w.number,observed:cutbackLong.title,expected:'easy long run only in recovery week'});
      var prev=plan.weeks[w.number-2];
      if(cutbackLong && prev){var prevLong=(prev.days||[]).find(function(d){return d && d.isLongRun;});if(prevLong && cutbackLong.totalKm>prevLong.totalKm*0.82) issues.push({ruleId:'RECOVERY_LONG_RUN_REDUCTION',severity:'warning',week:w.number,observed:cutbackLong.totalKm,expected:'<= 82% of previous long run'});}
    }
    var dates=computeWeekDates(cfg.startDate,w.number);
    var hard=[];
    (w.days||[]).forEach(function(d,i){
      if(!d) return;
      if(dates[i] && cfg.restDays && cfg.restDays.has(dates[i].getDay()) && d.zone!=='rest' && d.zone!=='race') issues.push({ruleId:'SCHEDULE_REST_DAY',severity:'error',week:w.number,day:i,zone:d.zone});
      if(d.isQ || d.zone==='tt' || d.isSim) hard.push({i:i,d:d});
    });
    for(var i=1;i<hard.length;i++) if(hard[i].i-hard[i-1].i===1) issues.push({ruleId:'RECOVERY_NO_BACK_TO_BACK_QUALITY',severity:'warning',week:w.number,days:[hard[i-1].i,hard[i].i]});
  });
  for(var wi=1;wi<plan.weeks.length;wi++){
    var prevLong=(plan.weeks[wi-1].days||[]).find(function(d){return d && d.isLongRun;});
    var thisLong=(plan.weeks[wi].days||[]).find(function(d){return d && d.isLongRun;});
    if(prevLong && thisLong && prevLong.totalKm>=30 && thisLong.totalKm>=30){
      issues.push({ruleId:'LONG_RUN_NO_BACK_TO_BACK_PEAKS',severity:'error',week:plan.weeks[wi].number,observed:prevLong.totalKm+' km then '+thisLong.totalKm+' km',expected:'avoid consecutive 30+ km long runs'});
    }
  }
  return {valid:!issues.some(function(x){return x.severity==='error';}),issues:issues};
}

function generatePlan(cfg){
  var weeks=cfg.weeks,peakKm=cfg.peakKm,currentKm=cfg.currentKm||peakKm*0.6;
  var paceVdot = cfg.paceVdot || cfg.targetVdot || 40;
  var goalDist=cfg.goalDist,goalTime=cfg.goalTime;
  var caps=computeCaps(peakKm,goalDist);
  var paces=paceFromVdot(paceVdot);
  var rawTargetLongMin=targetLongDurationMin(goalDist);
  var targetLongMin = Math.min(rawTargetLongMin, caps.Lmin);
  var goalPaceSecPerKm=goalTime/(goalDist/1000);
  var currentMPaceSecPerKm=paces.M;
  var currentVdotForGap=cfg.currentVdot || paceVdot;
  var targetVdotForGap=cfg.targetVdot || (typeof findVdotForRaceTime==='function' ? findVdotForRaceTime(goalTime,goalDist) : paceVdot);
  var vdotGap=targetVdotForGap-currentVdotForGap;
  var paceGapSec=currentMPaceSecPerKm-goalPaceSecPerKm;
  var goalPaceValidated=(vdotGap<=1.5 && paceGapSec<=12);
  var rehearsalNeeded=!goalPaceValidated;
  var isMar = isMarathonDistance(goalDist);
  var ttWeek = Math.max(3, Math.round(weeks * 0.5));
  var boundsCheck = computePhaseBoundaries(weeks);
  if (weeks < 6){ ttWeek = null; }
  else if (ttWeek >= boundsCheck.phaseIVStart){
    ttWeek = Math.max(boundsCheck.II + 1, boundsCheck.phaseIVStart - 1);
  }
  var ttDistance = chooseTTDistance(goalDist, peakKm);
  var ttDistanceLabel = ttDistanceLabelFor(ttDistance);
  var restWeekdays=cfg.restDays||new Set();
  var longRunWeekday=cfg.longDay!==undefined?cfg.longDay:6;
  var raceIdx=cfg.raceIdx;
  var out=[];

  var bounds = computePhaseBoundaries(weeks);
  function phaseFor(w){
    if (w <= bounds.I) return 'I';
    if (w <= bounds.II) return 'II';
    if (w < bounds.phaseIVStart) return 'III';
    return 'IV';
  }
  var startVol=Math.min(currentKm,peakKm*0.75);
  var buildEnd = bounds.II;
  var simWeeks = isMar
    ? [weeks-6, weeks-4].filter(function(w){ return w > bounds.II && w < bounds.phaseIVStart; })
    : [];
  // A rehearsal must never land in a recovery/cutback week. If a candidate
  // conflicts with the later cutback selection, it is suppressed below too.
  var midBlockCutbackWeek = null;
  if (weeks >= 12){
    var candidate = Math.round((bounds.II + bounds.phaseIVStart) / 2);
    var minCandidate = bounds.II + 1;
    var maxCandidate = bounds.phaseIVStart - 1;
    if (candidate < minCandidate) candidate = minCandidate;
    if (candidate > maxCandidate) candidate = maxCandidate;
    while (candidate > minCandidate && (simWeeks.indexOf(candidate) >= 0 || candidate === ttWeek || candidate % 4 === 0)){ candidate--; }
    if(candidate===ttWeek || simWeeks.indexOf(candidate)>=0) candidate = Math.min(maxCandidate, candidate+1);
    midBlockCutbackWeek = candidate;
  }
  var longBuildEnd = isMar ? Math.max(bounds.phaseIVStart - 1, buildEnd) : buildEnd;

  for(var w=1;w<=weeks;w++){
    var weekVol;
    if(w<=buildEnd){var t=(w-1)/Math.max(1,buildEnd-1);weekVol=Math.round(startVol+(peakKm-startVol)*t);}
    else if (w < bounds.phaseIVStart){weekVol=peakKm;}
    else if (w === bounds.phaseIVStart){weekVol=Math.round(peakKm*0.7);}
    else {weekVol=Math.round(peakKm*0.45);}
    var isEarlyAbsorption = (weeks >= 12 && w === 4 && w < bounds.phaseIVStart && w !== ttWeek && simWeeks.indexOf(w) < 0);
    var isCutback = isEarlyAbsorption || (midBlockCutbackWeek !== null && w === midBlockCutbackWeek);
    var previousWasRecovery = out.length > 0 && (out[out.length-1].isCutback || out[out.length-1].isModReduced);
    var isModReduced = (!isCutback && !previousWasRecovery && w>2 && w < bounds.phaseIVStart && w%4===0);
    if(isModReduced){ weekVol=Math.round(weekVol*0.85); }
    if (isCutback){ weekVol = Math.round(weekVol * 0.72); }

    var days=new Array(7).fill(null);
    var isRaceWeek=(w===weeks),isTaperWeek=(w===bounds.phaseIVStart),isTTWeek=(ttWeek !== null && w===ttWeek);
    var isSimWeek=(simWeeks.indexOf(w)>=0 && !isCutback);
    var phase=phaseFor(w);
    var longProgress=Math.min(1, w / longBuildEnd);
    var thisLongTarget;
    if (isMar){ thisLongTarget = targetLongMin * (0.55 + 0.50 * longProgress); }
    else { thisLongTarget = targetLongMin * (0.65 + 0.35 * longProgress); }
    if(isTTWeek) thisLongTarget *= 0.90;
    if(isTaperWeek) thisLongTarget *= 0.72;
    if(isMar && w >= bounds.phaseIVStart - 4 && w < bounds.phaseIVStart - 1 && simWeeks.indexOf(w) < 0 && !isCutback){
      thisLongTarget = Math.min(thisLongTarget, targetLongMin * 0.84);
    }
    thisLongTarget = Math.min(thisLongTarget, caps.Lmin);
    var weekDates=computeWeekDates(cfg.startDate,w);
    var weekLen=weekDates.length;
    var longDayIdx=-1;
    for(var i=0;i<weekLen;i++){if(weekDates[i].getDay()===longRunWeekday){longDayIdx=i;break;}}
    function isRest(i){return restWeekdays.has(weekDates[i].getDay());}

    if(isRaceWeek){
      for(var i=0;i<weekLen;i++){
        if(i===raceIdx){days[i]=raceDay('★ RACE — goal '+fmtTime(goalTime));continue;}
        if(isRest(i)){days[i]=restDay();continue;}
        var dOut=raceIdx-i;
        if(dOut<0){days[i]=restDay();continue;}
        if(dOut===5){days[i]={zone:'T',title:'3 × 1 km T',totalKm:5,detail:'2 min rests · final sharpener',isQ:true};}
        else if(dOut===4){days[i]=eRunKm(5,0);}
        else if(dOut===3){days[i]=eRunKm(4,0);}
        else if(dOut===2){days[i]=eRunKm(4,6);}
        else if(dOut===1){days[i]=eRunKm(3,0);}
        else {days[i]=eRunKm(5,0);}
      }
    } else if(isTaperWeek){
      if(longDayIdx>=0){
        var taperLongFraction = isMar ? 0.45 : 0.65;
          var taperLongMin = Math.min(targetLongMin * taperLongFraction, 14 * 60 * 60 / ((paces.E_slow + paces.E_fast)/2));
        days[longDayIdx]=lRunKm(caps,weekVol,taperLongMin,paces,goalDist);
      }
      for(var i=0;i<weekLen;i++){
        if(days[i]) continue;
        if(isRest(i)){days[i]=restDay();continue;}
        var dOut=(raceIdx>=0?raceIdx:longDayIdx)-i;
        if(dOut===6){days[i]={zone:'T',title:'3 × 1 km T',totalKm:5,detail:'2 min rests',isQ:true};}
        else if(dOut===3){days[i]=eRunKm(5,6); days[i].detail='Easy with relaxed strides · no threshold load';}
        else {days[i]=eRunKm(Math.max(4,Math.round(weekVol*0.12)),i%2===0?6:0);}
      }
    } else {
      var longRunRef = null;
      if(longDayIdx>=0){
        if(isSimWeek) days[longDayIdx]=racePaceSimLong(peakKm,goalDist,w);
        else days[longDayIdx]=lRunKm(caps,weekVol,thisLongTarget,paces,goalDist);
        longRunRef = days[longDayIdx] ? days[longDayIdx].totalKm : null;
      }
      var q1,q2,q3;
      if(phase==='I'){q1=eRunKm(Math.max(6,Math.round(weekVol*0.18)),10);q2=rSession(caps,peakKm,w);q3=eRunKm(Math.max(5,Math.round(weekVol*0.15)),8);}
      else if(phase==='II'){q1=rSession(caps,peakKm,w);q2=tSession(caps,peakKm,w);q3=eRunKm(Math.max(6,Math.round(weekVol*0.15)),8);}
      else if(phase==='III'){
        q1=iSession(caps,peakKm,w);
        q2=tSession(caps,peakKm,w);
        q3=eRunKm(Math.max(5,Math.round(weekVol*0.15)),6);
        if (goalPaceValidated && w >= bounds.phaseIVStart - 3 && w < bounds.phaseIVStart){ q2 = goalPaceRehearsal(goalPaceSecPerKm); }
      }
      else {q1=goalPaceValidated?goalPaceRehearsal(goalPaceSecPerKm):tSession(caps,peakKm,w);q2=rSession(caps,peakKm,w);q3=eRunKm(Math.max(5,Math.round(weekVol*0.15)),6);}
      if(isSimWeek){q1=null; q2=null; q3=eRunKm(Math.max(5,Math.round(weekVol*0.12)),6);}
      if(isTTWeek){q1=ttDay(ttDistanceLabel,ttDistance); q2=null; q3=null;}
      if(isCutback){ q1=null; q2=null; q3=null; }
      var qIndices=[];
      for(var i=0;i<weekLen;i++){ if(isRest(i)) continue; if(i===longDayIdx) continue; qIndices.push(i); }
      if(qIndices.length > 0){
        // Schedule quality by weekday relative to the long run, not by array order.
        // Standard weeks: Tue/Thu are preferred for a Saturday long run.
        // TT weeks: place the TT midweek and protect the following day.
        var offsets = isTTWeek ? [4,5,3,6,2,1,0] : [3,5,4,2,6,1,0];
        var preferredWeekdays = [];
        for (var oi = 0; oi < offsets.length; oi++) preferredWeekdays.push((longRunWeekday + offsets[oi]) % 7);
        var sortedQ = [];
        for (var p = 0; p < preferredWeekdays.length; p++) {
          for (var j = 0; j < qIndices.length; j++) {
            if (weekDates[qIndices[j]].getDay() === preferredWeekdays[p] && sortedQ.indexOf(qIndices[j]) < 0) sortedQ.push(qIndices[j]);
          }
        }
        for (var j = 0; j < qIndices.length; j++) if (sortedQ.indexOf(qIndices[j]) < 0) sortedQ.push(qIndices[j]);
        // Pick the first two quality days at least two calendar days apart.
        // If a preferred weekday is unavailable (e.g. a rest day), don't
        // silently stack Tuesday + Wednesday quality sessions.
        var spacedQ = [];
        for (var sq = 0; sq < sortedQ.length; sq++) {
          var candidateQ = sortedQ[sq];
          if (spacedQ.length === 0 || (spacedQ.length < 2 && spacedQ.every(function(chosen){return Math.abs(chosen-candidateQ) >= 2;}))) {
            spacedQ.push(candidateQ);
          }
          if (spacedQ.length === 2) break;
        }
        qIndices = spacedQ.concat(sortedQ.filter(function(idx){return spacedQ.indexOf(idx)<0;}));
      }
      if(qIndices[0]!==undefined&&q1)days[qIndices[0]]=q1;
      if(qIndices[1]!==undefined&&q2)days[qIndices[1]]=q2;
      if(qIndices[2]!==undefined&&q3)days[qIndices[2]]=q3;
      for(var i=0;i<weekLen;i++){
        if(days[i])continue;
        if(isRest(i)){days[i]=restDay();continue;}
        days[i]=eRunKm(Math.max(4,Math.round(weekVol*0.14)),i%2===0?6:0);
      }
      if (isCutback || isModReduced){
        if (longDayIdx >= 0 && days[longDayIdx] && days[longDayIdx].isLongRun){
          // A reduced week must not increase the long run; the lower weekly cap already reduces load.
          var newLong = Math.max(4, Math.round(days[longDayIdx].totalKm * 2) / 2);
          var previousWeekForLong = out.length ? out[out.length-1] : null;
          var previousLongForCutback = previousWeekForLong && (previousWeekForLong.days||[]).find(function(d){return d && d.isLongRun;});
          if(previousLongForCutback && previousLongForCutback.totalKm >= 5){
            var priorLongFactor = isCutback ? 0.80 : 0.90;
            var priorLongCeiling = Math.floor(previousLongForCutback.totalKm * priorLongFactor * 2) / 2;
            newLong = Math.max(4, Math.min(newLong, priorLongCeiling));
          }
          days[longDayIdx].totalKm = newLong;
          days[longDayIdx].title = 'Long run ' + newLong + ' km';
        }
        if(isCutback){
          for (var i=0;i<weekLen;i++){
            if (days[i] && days[i].zone === 'E' && !days[i].isLongRun){
              var reduced = Math.round(days[i].totalKm * 0.90);
              if (reduced < days[i].totalKm && reduced >= 4){
                days[i].totalKm = reduced;
                days[i].title = days[i].totalKm + ' km E' + (days[i].strides ? ' + '+days[i].strides+' strides' : '');
              }
            }
          }
        }
      }
      if (!isRaceWeek && !isTaperWeek && !isCutback){ padEasyRuns(days, weekLen, weekVol, longRunRef); }
    }
    while(days.length<7){days.push(null);}
    // Store training distance separately from race distance; enforce peak cap after all session builders/padding.
    var preCapKm=0; for(var pc=0;pc<days.length;pc++){if(days[pc] && days[pc].zone!=='race' && isFinite(days[pc].totalKm)) preCapKm+=days[pc].totalKm;}
    var weekRecord={number:w,days:days,totalKm:preCapKm}; weekRecord._preCapKm=preCapKm;
    // Enforce the intended weekly target. The previous version only capped at
    // peakKm, allowing a 'Reduced' week to exceed its planned weekVol.
    var weekCap=Math.min(peakKm,weekVol);
    if(w===1) weekCap=Math.min(weekCap,Math.max(currentKm,Math.round(currentKm*1.10)));
    if(w>1 && (isCutback || isModReduced) && out.length){
      var previousActual=out[out.length-1].totalKm || 0;
      if(previousActual>0){
        var reductionFactor=isCutback?0.85:0.90;
        weekCap=Math.min(weekCap,Math.round(previousActual*reductionFactor*10)/10);
      }
    }
    var capResult=enforceWeeklyMileageCap(weekRecord,peakKm,isRaceWeek,weekCap);
    var qCount=0;
    for(var i=0;i<7;i++){if(days[i]&&days[i].isQ){qCount++;days[i].qRank='Q'+qCount;}}
    var totalKm=0, raceKm=0;
    for(var i=0;i<7;i++){var d=days[i];if(d&&d.zone==='race'){raceKm+=goalDist/1000;continue;} if(d&&isFinite(d.totalKm))totalKm+=d.totalKm;}
    totalKm=Math.round(totalKm*10)/10;
    out.push({
      number:w, phase:phase, totalKm:totalKm, trainingKm:totalKm, raceKm:Math.round(raceKm*1000)/1000,
      totalRunningKm:Math.round((totalKm+raceKm)*10)/10, days:days, paces:paces,
      isTT:isTTWeek, isSim:isSimWeek, isCutback:isCutback, isModReduced:isModReduced,
      capResult:capResult, startDate:cfg.startDate, weekLen:weekLen
    });
  }
  // Final marathon safeguard: never leave consecutive 30+ km long runs,
  // including long builds where the phase boundaries move later. Preserve the
  // later key run and convert the preceding one to an easy 28 km long run.
  for(var li=1;li<out.length;li++){
    var priorLong=(out[li-1].days||[]).find(function(d){return d && d.isLongRun;});
    var nextLong=(out[li].days||[]).find(function(d){return d && d.isLongRun;});
    if(priorLong && nextLong && priorLong.totalKm>=30 && nextLong.totalKm>=30){
      priorLong.zone='E'; priorLong.title='Long run 28 km'; priorLong.totalKm=28;
      priorLong.detail='Easy / conversational'; priorLong.isQ=false; priorLong.isSim=false; priorLong.isLongRun=true;
      out[li-1].isSim=(out[li-1].days||[]).some(function(d){return d && d.isSim;});
      out[li-1].totalKm=refreshWeekTotals(out[li-1]);
      out[li-1].trainingKm=out[li-1].totalKm;
      out[li-1].totalRunningKm=Math.round((out[li-1].totalKm+(out[li-1].raceKm||0))*10)/10;
      out[li-1].capResult=enforceWeeklyMileageCap(out[li-1],peakKm,false,peakKm);
    }
  }
  var result={weeks:out,caps:caps,paces:paces,rehearsalNeeded:rehearsalNeeded,ttWeek:ttWeek,ttDistance:ttDistance,ttDistanceLabel:ttDistanceLabel,startDate:cfg.startDate,bounds:bounds};
  result.validation=validateTrainingPlan(result,cfg);
  return result;
}

var BEGINNER_12 = [
  {sessions:['walk20','rw_1_1_x6','walk30']},
  {sessions:['walk20','rw_1_1_x8','walk35']},
  {sessions:['rw_1_1_x8','rw_1_1_x10','walk40']},
  {sessions:['rw_1_1_x10','rw_2_1_x6','rw_1_1_x12']},
  {sessions:['rw_2_1_x6','rw_2_1_x8','rw_1_1_x14']},
  {sessions:['rw_2_1_x8','rw_3_1_x6','rw_2_1_x10']},
  {sessions:['rw_3_1_x6','rw_5_2_x3','rw_3_1_x8']},
  {sessions:['run12','run15','rw_5_2_x4']},
  {sessions:['run15','run20','run25']},
  {sessions:['run20','run25','run30']},
  {sessions:['run15','run20','run25']},
  {sessions:['run10','run15','RACE']}
];
function beginnerSessionFromSpec(spec){
  if (spec === 'walk20') return {zone:'walk',title:'20 min walk',detail:'Easy conversational pace',totalMin:20,isQ:false};
  if (spec === 'walk30') return {zone:'walk',title:'30 min walk',detail:'Easy conversational pace',totalMin:30,isQ:false};
  if (spec === 'walk35') return {zone:'walk',title:'35 min walk',detail:'Easy conversational pace',totalMin:35,isQ:false};
  if (spec === 'walk40') return {zone:'walk',title:'40 min walk',detail:'Easy conversational pace',totalMin:40,isQ:false};
  if (spec === 'run10') return {zone:'E',title:'10 min continuous run',detail:'Easy — you should be able to talk while running',totalMin:15,isQ:false};
  if (spec === 'run12') return {zone:'E',title:'12 min continuous run',detail:'Easy — you should be able to talk while running',totalMin:17,isQ:false};
  if (spec === 'run15') return {zone:'E',title:'15 min continuous run',detail:'Easy — you should be able to talk while running',totalMin:20,isQ:false};
  if (spec === 'run20') return {zone:'E',title:'20 min continuous run',detail:'Easy — you should be able to talk while running',totalMin:25,isQ:false};
  if (spec === 'run25') return {zone:'E',title:'25 min continuous run',detail:'Easy — you should be able to talk while running',totalMin:30,isQ:false};
  if (spec === 'run30') return {zone:'E',title:'30 min continuous run',detail:'Easy — you should be able to talk while running',totalMin:35,isQ:false};
  if (spec === 'RACE') return {zone:'race',title:'★ Race day',detail:'Your goal event. Have fun.',totalMin:0,isQ:false};
  var m = spec.match(/^rw_(\d+)_(\d+)_x(\d+)$/);
  if (m){
    var runMin = parseInt(m[1],10), walkMin = parseInt(m[2],10), reps = parseInt(m[3],10);
    var total = (runMin + walkMin) * reps + 10;
    return {zone:'runwalk',title:runMin+' min run / '+walkMin+' min walk',detail:'5 min walk + '+reps+' × ('+runMin+' min run / '+walkMin+' min walk) + 5 min walk',totalMin:total,isQ:false};
  }
  return {zone:'rest',title:'Rest',totalKm:0,detail:'',isQ:false};
}
function generateBeginnerPlan(cfg){
  var weeks = cfg.weeks;
  var longRunWeekday = cfg.longDay;
  var restWeekdays = cfg.restDays || new Set();
  var raceIdx = cfg.raceIdx;
  var out = [];
  var startIdx = 0;
  if (cfg.ability === '5min') startIdx = 3;
  else if (cfg.ability === '20min') startIdx = 7;
  var availableSlots = 12 - startIdx;
  var stride = availableSlots / weeks;
  for (var w = 1; w <= weeks; w++){
    var tplIdx = Math.min(11, Math.floor(startIdx + (w-1) * stride));
    var tpl = BEGINNER_12[tplIdx];
    var sessionSpecs = tpl.sessions.slice();
    var days = new Array(7).fill(null);
    var weekDates = computeWeekDates(cfg.startDate, w);
    var weekLen = weekDates.length;
    var longDayIdx = -1;
    for (var i = 0; i < weekLen; i++){ if (weekDates[i].getDay() === longRunWeekday){ longDayIdx = i; break; } }
    function isRest(i){ return restWeekdays.has(weekDates[i].getDay()); }
    var isRaceWeek = (w === weeks);
    var thisRaceIdx = isRaceWeek ? raceIdx : -1;
    var availableIndices = [];
    for (var i = 0; i < weekLen; i++){
      if (isRest(i)) continue;
      if (i === thisRaceIdx) continue;
      if (i === longDayIdx && !isRaceWeek) continue;
      availableIndices.push(i);
    }
    availableIndices.sort(function(a,b){ return a - b; });
    var shortIdx = availableIndices[0];
    var medIdx = availableIndices[Math.floor(availableIndices.length / 2)];
    var longIdx = longDayIdx >= 0 ? longDayIdx : availableIndices[availableIndices.length - 1];
    if (isRaceWeek){
      var shortSpec = sessionSpecs[0], medSpec = sessionSpecs[1];
      if (shortIdx !== undefined) days[shortIdx] = beginnerSessionFromSpec(shortSpec);
      if (medIdx !== undefined && medIdx !== shortIdx) days[medIdx] = beginnerSessionFromSpec(medSpec);
      if (thisRaceIdx >= 0){ days[thisRaceIdx] = { zone:'race', title:'★ RACE — '+cfg.goalLabel, detail:'Race day', totalMin:0, isQ:false }; }
    } else {
      var shortSpec = sessionSpecs[0], medSpec = sessionSpecs[1], longSpec = sessionSpecs[2];
      if (shortIdx !== undefined) days[shortIdx] = beginnerSessionFromSpec(shortSpec);
      if (medIdx !== undefined && medIdx !== shortIdx) days[medIdx] = beginnerSessionFromSpec(medSpec);
      if (longIdx >= 0 && longIdx !== shortIdx && longIdx !== medIdx) days[longIdx] = beginnerSessionFromSpec(longSpec);
    }
    for (var i = 0; i < weekLen; i++){ if (!days[i]) days[i] = restDay(); }
    while (days.length < 7) days.push(null);
    var totalMin = 0;
    for (var i = 0; i < 7; i++){ var d = days[i]; if (d && isFinite(d.totalMin)) totalMin += d.totalMin; }
    var phase;
    if (w <= Math.ceil(weeks * 0.25)) phase = 'A';
    else if (w <= Math.ceil(weeks * 0.5)) phase = 'B';
    else if (w <= Math.ceil(weeks * 0.85)) phase = 'C';
    else phase = 'D';
    out.push({ number: w, phase: phase, totalKm: totalMin, days: days, paces: null, isBeginner: true, isRace: isRaceWeek, startDate: cfg.startDate, weekLen: weekLen });
  }
  return { weeks: out, startDate: cfg.startDate, isBeginner: true };
}
function purposeFor(day, isBeginner){
  if (!day) return '';
  if (day.isBeginner) {
    var z = day.zone;
    if (z === 'rest') return 'Rest and recovery — this is when your body adapts.';
    if (z === 'race') return 'The goal. Enjoy the moment.';
    if (z === 'walk') return 'Time on feet. Builds the habit and the aerobic base.';
    if (z === 'runwalk') return 'Alternating work and recovery. Trains the body to run further without stopping.';
    if (z === 'E') return 'Continuous running. Your body is learning to sustain effort.';
    return '';
  }
  var z=day.zone;
  var t=(day.title||'').toLowerCase();
  var d=(day.detail||'').toLowerCase();
  if(day.adjusted){
    if(day.adjustMode==='sick')return 'Rest. The immune system needs energy to fight off illness.';
    if(day.adjustMode==='fatigue')return 'Eased day — reduce stress, keep the rhythm.';
    if(day.adjustMode==='busy')return 'Compressed session — maintain, do not build.';
  }
  if(z==='rest')return 'Adaptation happens here — repair, glycogen, hormones.';
  if(z==='race')return 'The payoff. Execution matters more than any workout.';
  if(z==='tt')return 'Fitness checkpoint — verifies VDOT, recalibrates the plan.';
  if(day.isSim)return 'Race rehearsal. Practice fueling and pacing at current-fitness marathon pace; target pace is separate.';
  if(z==='E'){
    if(t.indexOf('strides')>=0)return 'Base + leg speed. Strides sharpen turnover without fatigue.';
    if(t.indexOf('long')>=0)return 'Aerobic & muscular endurance — confidence for race distance.';
    return 'Builds aerobic base, strengthens heart, increases injury resistance.';
  }
  if(z==='M'){ if(t.indexOf('+')>=0&&t.indexOf('km')>=0)return 'Race-pace rehearsal with fuel practice.'; return 'Race-pace rehearsal. Trains fat-burning, glycogen sparing.'; }
  if(z==='T'){ if(t.indexOf('goal')>=0)return 'Goal-pace rehearsal — makes race pace feel familiar.'; if(t.indexOf('sharpener')>=0||d.indexOf('sharpener')>=0)return 'Keeps sharpness without adding fatigue before the race.'; return 'Improves lactate clearance — you hold a faster pace, longer.'; }
  if(z==='I')return 'Raises VO2max — your aerobic ceiling, lifting all paces.';
  if(z==='R')return 'Speed, economy, neuromuscular power. Full recovery = high quality.';
  return '';
}
function inlinePace(day, paces, isBeginner){
  if(!day || isBeginner) return '';
  if(!paces) return '';
  var z = day.zone;
  if(z==='rest'||z==='race') return '';
  if(isFinite(day.paceOverrideSecPerKm)) return paceKm(day.paceOverrideSecPerKm);
  if(z==='E') return paceKmShort(paces.E_slow)+'–'+paceKmShort(paces.E_fast)+'/km';
  if(z==='M') return paceKm(paces.M);
  if(z==='T') return paceKm(paces.T);
  if(z==='I') return paceKm(paces.I);
  if(z==='R') return paceKm(paces.R);
  if(z==='tt') return '';
  return '';
}
function escapeHtml(s){if(s===null||s===undefined)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function renderVerdict(a,userName,cfg){
  var safeName = escapeHtml(userName);
  var html='';
  if (a.goalIsEasier) {
    var gapSec = a.currentGoalTime - a.goalTime;
    var gapMin = Math.floor(gapSec/60), gapSecRem = Math.round(gapSec%60);
    var gapStr = gapMin+':'+(gapSecRem<10?'0':'')+gapSecRem;
    var distName = RACE_META[String(a.goalDist)].name;
    var curDistName = RACE_META[String(cfg.curDist)] ? RACE_META[String(cfg.curDist)].name : 'recent race';
    html+='<div class="verdict-banner green"><div class="icon">🎯</div><div class="body">';
    html+='<div class="label">Good news, '+safeName+'</div><div class="title">You can aim higher than this goal</div>';
    html+='<div class="desc">Your recent '+curDistName+' of <strong>'+fmtTime(cfg.curTime)+'</strong> predicts a '+distName+' of <strong>'+fmtTime(a.currentGoalTime)+'</strong> — that\'s about <strong>'+gapStr+' faster</strong> than your goal of '+fmtTime(a.goalTime)+'. You\'re already capable of beating this goal by a comfortable margin.<br><br>Want to <strong>keep training for '+fmtTime(a.goalTime)+'</strong> anyway, or <strong>aim higher</strong> at '+fmtTime(a.suggestedGoalTime)+'?</div>';
    html+='<div class="goal-actions"><button class="btn" id="keepGoalBtn">Keep my goal '+fmtTime(a.goalTime)+'</button><button class="btn primary" id="useFasterBtn">Aim for '+fmtTime(a.suggestedGoalTime)+' →</button></div>';
    html+='</div></div>';
    html+='<div class="card"><h2>Forecast</h2><div class="check-grid">';
    html+=checkItem('Weeks available',a.weeks+' wk','Minimum guidance: '+(cfg.minimumWeeks||'—')+' wk · recommended: '+(cfg.recommendedWeeks||'—')+' wk',a.weeks>=(cfg.minimumWeeks||10)?'pass':'warn');
    html+=checkItem('Goal',fmtTime(a.goalTime),'Easier than your current ability','pass');
    html+=checkItem('Your current ability',fmtTime(a.currentGoalTime),'Based on your recent '+curDistName,'pass');
    html+=checkItem('Suggested goal',fmtTime(a.suggestedGoalTime),'A realistic target to aim for','pass');
    html+=checkItem('Calculated peak',a.peakKm+' km/week',a.volOk?'Derived from current load, goal and available weeks':'Calculated build remains below the typical volume estimate',a.volOk?'pass':'warn');
    html+=checkItem('Peak long run','~'+Math.round(a.targetLongMin)+' min target',a.planCanReachLongRun?'Plan builds to this duration':'Long-run duration is constrained by current load and available build time',a.planCanReachLongRun?'pass':'warn');
    html+='</div></div>';
    return html;
  }
  var cfgLabel={green:'On track',amber:'Ambitious — reassess at the time trial',red:'Stretch goal — very likely out of reach'};
  var icon={green:'✓',amber:'⚠',red:'⚠'};
  var intro;
  if (a.severity === 'red') {
    intro = safeName+', the current model estimates a finish around <strong>'+fmtTime(a.predictedTime)+'</strong> from your current fitness, available weeks and planned volume. This is a simplified planning estimate, not a guarantee. The goal of '+fmtTime(a.goalTime)+' requires a <strong>+'+a.vdotGap.toFixed(1)+'-VDOT jump</strong>, compared with an estimated training gain of about '+a.achievableGain.toFixed(1)+' points. <strong>You decide.</strong> We\'ll build for your race date and reassess at the time trial.';
  } else if (a.severity === 'amber') {
    intro = safeName+', this is an <strong>ambitious</strong> goal for the time and volume you have. We build the plan for the race date anyway. At Week '+(a.ttWeekText||'the midpoint')+' you\'ll run a time trial — if your fitness then supports this goal, we continue as planned. If not, we\'ll suggest a revised goal. <strong>You decide.</strong>';
  } else {
    intro = safeName+', your inputs are compatible with this goal. Race date is locked — we build for it and check fitness at the mid-block time trial.';
  }
  html+='<div class="verdict-banner '+a.severity+'"><div class="icon">'+icon[a.severity]+'</div><div class="body"><div class="label">Goal outlook</div><div class="title">'+cfgLabel[a.severity]+'</div><div class="desc">'+intro+'</div></div></div>';
  html+='<div class="card"><h2>Forecast</h2><div class="check-grid">';
  html+=checkItem('Weeks available',a.weeks+' wk','Minimum guidance: '+(cfg.minimumWeeks||'—')+' wk · recommended: '+(cfg.recommendedWeeks||'—')+' wk',a.weeks>=(cfg.minimumWeeks||10)?'pass':'warn');
  var goalDisplay, goalDetail, goalStatus;
  if (a.vdotGap < 0) { goalDisplay = 'Headroom'; goalDetail = 'Goal is easier than current fitness'; goalStatus = 'pass'; }
  else if (a.vdotGap < 0.5) { goalDisplay = 'At current level'; goalDetail = 'Goal matches current ability'; goalStatus = 'pass'; }
  else { goalDisplay = '+'+a.vdotGap.toFixed(1)+' VDOT'; goalDetail = 'Requires '+a.targetVdot.toFixed(1)+' at race day'; goalStatus = a.vdotFeasible?'pass':(a.severity==='amber'?'warn':'fail'); }
  html+=checkItem('Goal',goalDisplay,goalDetail,goalStatus);
  html+=checkItem('Modelled at race',fmtTime(a.predictedTime),'Simplified planning estimate, not a guarantee',(a.vdotGap<=1?'pass':(a.severity==='amber'?'warn':'fail')));
  html+=checkItem('Calculated peak',a.peakKm+' km/week',a.volOk?'Derived from current load, goal and available weeks':'Calculated build remains below the typical volume estimate',a.volOk?'pass':'warn');
  html+=checkItem('Peak long run','~'+Math.round(a.targetLongMin)+' min target',a.planCanReachLongRun?'Plan builds to this duration':'Long-run duration is constrained by current load and available build time',a.planCanReachLongRun?'pass':'warn');
  if (a.noVolumeGrowth){
    html+=checkItem('Volume growth','Limited','Current training load is already near the calculated ceiling for this timeline.',(a.severity==='red'?'fail':'warn'));
  }
  html+='</div></div>';
  return html;
}
function checkItem(name,value,detail,cls){return '<div class="check '+cls+'"><div class="check-name">'+name+'</div><div class="check-value">'+value+'</div><div class="check-detail">'+detail+'</div></div>';}
function paceRow(zone,name,primary,secondary){
  return '<div class="pace-row"><span class="zone-badge z-'+zone+'">'+zone+'</span><div><div class="pace-name">'+name+'</div><div class="pace-values"><span class="primary">'+primary+'</span>'+(secondary?'<span class="secondary">'+secondary+'</span>':'')+'</div></div></div>';
}
function renderPaceSummary(paces){
  return '<h2 style="margin-top:14px">Training paces</h2>'+
    paceRow('E','Easy / Long',paceKm(paces.E_slow)+' – '+paceKm(paces.E_fast),'')+
    paceRow('M','Marathon pace (current VDOT)',paceKm(paces.M),'Use target race pace only when your goal is validated')+
    paceRow('T','Threshold',paceKm(paces.T),pace400(paces.T400)+' /400m')+
    paceRow('I','Interval',paceKm(paces.I),pace400(paces.I400)+' /400m')+
    paceRow('R','Repetition',paceKm(paces.R),pace400(paces.R400)+' /400m · 200m '+Math.round(paces.R200)+'s');
}
function renderBeginnerLegend(){
  return '<h2 style="margin-top:14px">Session types</h2>'+
    '<div class="pace-row"><span class="zone-badge z-walk">W</span><div><div class="pace-name">Walk</div><div class="pace-values"><span class="primary">Easy conversational pace</span><span class="secondary">Just moving</span></div></div></div>'+
    '<div class="pace-row"><span class="zone-badge z-runwalk">R/W</span><div><div class="pace-name">Run/walk</div><div class="pace-values"><span class="primary">Alternating intervals</span><span class="secondary">By time</span></div></div></div>'+
    '<div class="pace-row"><span class="zone-badge z-E">E</span><div><div class="pace-name">Continuous run</div><div class="pace-values"><span class="primary">Easy, conversational</span><span class="secondary">Able to talk</span></div></div></div>';
}
function renderWeek(w,startDate){
  var dates=computeWeekDates(startDate,w.number);
  var weekLen=dates.length;
  var paces=w.paces || null;
  var isBeginner = !!w.isBeginner;
  var html='';
  html+='<div class="week-card">';
  html+='<div class="week-head"><div><span class="wk-num">Week '+w.number+'</span><span class="wk-phase phase-'+w.phase+'">Phase '+w.phase+'</span><span class="wk-dates">'+fmtDateShort(dates[0])+' – '+fmtDateShort(dates[weekLen-1])+'</span>';
  if(w.isCutback) html+='<span style="font-size:10.5px;color:#16a34a;font-weight:600;margin-left:8px">↻ Recovery week</span>';
  if(w.isModReduced && !w.isCutback) html+='<span style="font-size:10.5px;color:#16a34a;font-weight:600;margin-left:8px">↓ Reduced</span>';
  html+='</div><span class="wk-total">'+(isBeginner ? w.totalKm.toFixed(0)+' min' : (w.raceKm>0 ? w.trainingKm.toFixed(0)+' km training · '+w.raceKm.toFixed(1)+' km race · '+w.totalRunningKm.toFixed(1)+' km total' : w.totalKm.toFixed(0)+' km'))+'</span></div>';
  html+='<table class="week-grid"><tr class="header-row">';
  for(var i=0;i<weekLen;i++)html+='<td><div class="header-day"><span>'+dayNameOf(dates[i]).toUpperCase()+'</span><span class="header-date">'+fmtDateShort(dates[i])+'</span></div></td>';
  html+='</tr><tr>';
  for(var i=0;i<weekLen;i++){
    var day=w.days[i];
    if(!day){ html+='<td class="rest-cell"><div class="cell-title">—</div></td>'; continue; }
    var zone=day.zone||'E';
    var cellClass='';
    if(day.adjusted){ cellClass = 'adjusted-cell ' + day.adjustMode; }
    else if(zone==='rest')cellClass='rest-cell';
    else if(zone==='race')cellClass='race-cell';
    else if(zone==='tt')cellClass='tt-cell';
    else if(day.isSim)cellClass='sim-cell';
    else if(zone==='walk')cellClass='walk-cell';
    else if(zone==='runwalk')cellClass='runwalk-cell';
    else if(w.isCutback && zone==='E' && !day.isLongRun) cellClass='cutback-cell';
    else if(w.isModReduced && zone==='E' && !day.isLongRun) cellClass='reduced-cell';
    html+='<td class="'+cellClass+'"><div class="badge-row">';
    var badgeText=zone==='rest'?'—':zone==='race'?'★':zone==='tt'?'TT':zone==='walk'?'W':zone==='runwalk'?'R/W':zone;
    var badgeClass='z-'+zone;
    if(zone==='tt')badgeClass='z-I';
    if(zone==='race')badgeClass='z-R';
    html+='<span class="day-type '+badgeClass+'">'+badgeText+'</span>';
    if(day.qRank)html+='<span class="q-badge">'+day.qRank+'</span>';
    if(day.adjusted){
      var ab = day.adjustMode==='sick' ? '🛌 rest' : (day.adjustMode==='busy' ? '⏱ short' : '↓ eased');
      html+='<span class="adjust-badge '+day.adjustMode+'">'+ab+'</span>';
    }
    html+='</div><div class="cell-title">'+day.title+'</div>';
    if(day.detail)html+='<div class="cell-detail">'+day.detail+'</div>';
    var metaParts=[];
    if (isBeginner){
      if (day.totalMin > 0) metaParts.push(day.totalMin+' min');
    } else {
      if(day.totalKm>0) {
        if(zone==='tt' && day.testDistanceKm) metaParts.push(day.totalKm.toFixed(1)+' km total · '+day.testDistanceKm.toFixed(day.testDistanceKm%1?1:0)+' km test');
        else metaParts.push(day.totalKm.toFixed(1)+' km');
      }
      var paceStr=inlinePace(day,paces,false);
      if(paceStr){ metaParts.push('<span class="pace-bit">'+paceStr+'</span>'); }
    }
    var metaHtml=metaParts.join(' · ');
    if(metaHtml) html+='<div class="cell-meta">'+metaHtml+'</div>';
    if(day.adjusted && day.originalTitle) html+='<div class="adjust-was">was: '+escapeHtml(day.originalTitle)+'</div>';
    var purpose=purposeFor(day, isBeginner);
    if(purpose)html+='<div class="cell-why">'+purpose+'</div>';
    html+='</td>';
  }
  html+='</tr></table>';
  html+='<div class="week-why"><strong>Focus:</strong> '+weekWhy(w)+'</div>';
  html+='</div>';
  return html;
}
function weekWhy(w){
  if (w.isBeginner){
    var p = w.phase;
    if (p === 'A') return 'Getting moving. Building the habit and general fitness.';
    if (p === 'B') return 'Longer intervals. Your body is learning to sustain effort.';
    if (p === 'C') return 'Continuous running. Walking breaks are becoming optional.';
    return 'Race preparation and taper. You are ready.';
  }
  var p2=w.phase;
  if(w.isCutback) return 'Recovery week — reduced volume to absorb the previous block\'s training.';
  if(w.isSim)return 'Race-pace simulation week — long run combines E and M-pace blocks.';
  if(p2==='I')return 'Aerobic base, injury resistance, and neuromuscular priming through strides.';
  if(p2==='II')return 'Repetition work sharpens speed and economy; T sessions build lactate clearance.';
  if(p2==='III')return 'Interval work raises VO2max; sustained T and M runs build race-specific endurance.';
  return 'Goal-pace rehearsal and reduced volume — arriving at the race fresh and sharp.';
}
function renderPlan(result,meta,userName){
  var weeks=result.weeks,caps=result.caps,paces=result.paces;
  var isBeginner = !!result.isBeginner;
  var totalKm=0,peakKm=0;
  for(var i=0;i<weeks.length;i++){
    totalKm+=weeks[i].totalKm;
    if(weeks[i].totalKm>peakKm)peakKm=weeks[i].totalKm;
  }
  var html='';
  html+='<div class="card"><div class="plan-header">';
  html+='<div class="name-display">'+escapeHtml(userName)+"'s plan</div>";
  html+='<h2>'+meta.eventLabel+'</h2>';
  html+='<p>'+meta.subtitle+'</p>';
  html+='<div class="plan-version">Generated with Pre-Flight Coach '+APP_VERSION+' · '+weeks.length+'-week '+(isBeginner?'beginner':'Daniels')+' plan</div>';
  html+='<div class="print-info-grid">';
  if (isBeginner){
    html+='<div class="print-info-item"><div class="pi-label">Plan type</div><div class="pi-value big">Beginner</div></div>';
    html+='<div class="print-info-item"><div class="pi-label">Starting level</div><div class="pi-value">'+escapeHtml(meta.startingLevel||'—')+'</div></div>';
    html+='<div class="print-info-item"><div class="pi-label">Days per week</div><div class="pi-value">'+meta.daysPerWeek+'</div></div>';
  } else {
    html+='<div class="print-info-item"><div class="pi-label">Current VDOT</div><div class="pi-value big">'+meta.currentVdot.toFixed(1)+'</div></div>';
    html+='<div class="print-info-item"><div class="pi-label">Target VDOT</div><div class="pi-value big">'+meta.targetVdot.toFixed(1)+'</div></div>';
    html+='<div class="print-info-item"><div class="pi-label">Current ability</div><div class="pi-value">'+meta.currentAbilityStr+'</div></div>';
  }
  html+='<div class="print-info-item"><div class="pi-label">Race day</div><div class="pi-value">'+meta.raceDateStr+'</div></div>';
  html+='<div class="print-info-item"><div class="pi-label">Plan start</div><div class="pi-value">'+meta.firstDayStr+'</div></div>';
  html+='<div class="print-info-item"><div class="pi-label">Total weeks</div><div class="pi-value">'+weeks.length+'</div></div>';
  if (!isBeginner){
    html+='<div class="print-info-item"><div class="pi-label">Peak weekly (actual plan)</div><div class="pi-value">'+peakKm.toFixed(1).replace(/\.0$/,'')+' km</div></div>';
  }
  html+='<div class="print-info-item"><div class="pi-label">Long run day</div><div class="pi-value">'+meta.longRunDay+'</div></div>';
  html+='</div></div>';
  if(!isBeginner && meta.goalOutlookTitle && meta.goalOutlookDetail){
    html+='<div class="verdict-banner '+escapeHtml(meta.goalSeverity||'amber')+' plan-goal-note"><div class="body"><div class="label">Goal outlook</div><div class="title">'+escapeHtml(meta.goalOutlookTitle)+'</div><div class="desc">'+escapeHtml(meta.goalOutlookDetail)+'</div></div></div>';
  }
  if (isBeginner) html+=renderBeginnerLegend();
  else html+=renderPaceSummary(paces);
  html+='</div>';
  if (!isBeginner && result.ttWeek){
    html+='<div class="recal-panel no-print" id="recalPanel">';
    html+='<h3>Mid-block time trial — Week '+result.ttWeek+'</h3>';
    html+='<p>Week '+result.ttWeek+' includes a <strong>'+result.ttDistanceLabel+' time trial</strong>. Warm up, run the test distance hard and evenly, then cool down. The distance shown on the workout card includes warm-up and cool-down. Enter only the test result below and we\'ll re-check your fitness.</p>';
    html+='<div class="recal-row">';
    html+='<div class="field"><label>Distance</label><select id="ttDistance">'+ttSelectOptions(result.ttDistance)+'</select></div>';
    html+='<div class="field"><label>Time</label><div class="time-input"><input type="tel" id="ttTimeH" maxlength="2" placeholder="00" inputmode="numeric"><span class="sep">:</span><input type="tel" id="ttTimeM" maxlength="2" placeholder="00" inputmode="numeric"><span class="sep">:</span><input type="tel" id="ttTimeS" maxlength="2" placeholder="00" inputmode="numeric"></div></div>';
    html+='<button class="btn primary" id="recalBtn" style="padding:8px 16px">Recalculate</button>';
    html+='</div></div>';
  }
  for(var i=0;i<weeks.length;i++)html+=renderWeek(weeks[i],result.startDate);
  return html;
}
function ttSelectOptions(selectedMeters){
  var options=[{m:1000,label:'1,000 m'},{m:1500,label:'1,500 m'},{m:1609,label:'1 mile'},{m:3000,label:'3,000 m'},{m:5000,label:'5,000 m'},{m:10000,label:'10,000 m'}];
  var html='';
  for(var i=0;i<options.length;i++){ var sel=(options[i].m===selectedMeters)?' selected':''; html+='<option value="'+options[i].m+'"'+sel+'>'+options[i].label+'</option>'; }
  return html;
}

var state={analysis:null,plan:null,planOriginal:null,planMeta:null,cfg:null,allRestDays:new Set(),longDay:6,currentVdotOverride:null,userName:'',originalGoalTime:null,adjustedGoalTime:null,feelMode:null,feelDays:0,feelStartDate:null,planType:'standard',beginnerRestDays:new Set(),beginnerLongDay:6};

function minimumPlanWeeks(goalDist,currentKm,experience){
  var base=({'5000':6,'10000':8,'21097.5':10,'42195':14})[String(goalDist)]||8;
  if(currentKm<15) base+=4;
  else if(currentKm<30) base+=2;
  if(experience==='returning') base+=3;
  else if(experience==='experienced') base=Math.max(6,base-1);
  return base;
}
function recommendedPlanWeeks(goalDist,currentKm,experience){
  return minimumPlanWeeks(goalDist,currentKm,experience)+(String(goalDist)==='42195'?4:3);
}
function calculatePeakKm(currentKm,goalDist,goalTime,weeks,experience){
  if(!currentKm||currentKm<=0||!goalDist||!goalTime)return 0;
  var targetVdot;
  try{targetVdot=Vdot.fromRace(goalDist,goalTime);}catch(e){targetVdot=40;}
  var volumeTarget=minAdequateVolume(goalDist,targetVdot);
  var multiplier=({'5000':1.20,'10000':1.25,'21097.5':1.30,'42195':1.40})[String(goalDist)]||1.25;
  var desired=Math.max(currentKm*multiplier,volumeTarget);
  var growthPer12=experience==='returning'?0.20:(experience==='experienced'?0.45:0.32);
  var allowedMultiplier=1+growthPer12*(Math.max(0,weeks-3)/12);
  // Keep the calculated peak tied to the runner's current base and available build time.
  var peak=Math.min(desired,currentKm*allowedMultiplier);
  peak=Math.max(currentKm,peak);
  return Math.round(peak/2.5)*2.5;
}
function setStartDateForDuration(which){
  var goal=parseFloat(document.getElementById('goalDist').value)||0;
  var current=parseFloat(document.getElementById('currentKm').value)||0;
  var exp=document.getElementById('experienceLevel').value||'regular';
  var raceStr=document.getElementById('raceDate').value||'';
  if(!goal||!current||!raceStr){alert('Choose a goal distance, current weekly mileage and race date first.');return;}
  var weeks=which==='minimum'?minimumPlanWeeks(goal,current,exp):recommendedPlanWeeks(goal,current,exp);
  var race=parseLocalDate(raceStr); if(!race)return;
  race.setDate(race.getDate()-Math.max(0,weeks-1)*7);
  // Align the selected plan duration to Monday so the first displayed week is full.
  var backToMonday=(race.getDay()+6)%7;
  race.setDate(race.getDate()-backToMonday);
  var yyyy=race.getFullYear(),mm=String(race.getMonth()+1).padStart(2,'0'),dd=String(race.getDate()).padStart(2,'0');
  document.getElementById('startDate').value=yyyy+'-'+mm+'-'+dd;
  updateInputState();
}

function updateDurationGuidance(){
  var el=document.getElementById('durationGuidance');
  if(!el)return;
  var goal=parseFloat(document.getElementById('goalDist').value)||0;
  var current=parseFloat(document.getElementById('currentKm').value)||0;
  var exp=document.getElementById('experienceLevel').value||'regular';
  var weeks=computeWeeks(document.getElementById('startDate').value||'',document.getElementById('raceDate').value||'');
  if(!goal||!current||!weeks){el.textContent='Choose race distance, current mileage and dates';el.className='computed-box empty';return;}
  var minW=minimumPlanWeeks(goal,current,exp), recW=recommendedPlanWeeks(goal,current,exp);
  var msg=weeks<minW?'Short: '+weeks+' weeks · minimum guidance '+minW+' weeks':(weeks<recW?'Minimum met: '+weeks+' weeks · recommended '+recW+' weeks':'Good runway: '+weeks+' weeks · recommended '+recW+' weeks');
  el.textContent=msg;
  el.className='computed-box'+(weeks<minW?' empty':'');
}

function readCfgStandard(){
  var rawCur=document.getElementById('currentKm').value;
  var curDist=parseFloat(document.getElementById('curDist').value) || 0;
  var goalDist=parseFloat(document.getElementById('goalDist').value) || 0;
  var curTimeRes = readTimeField('curTime');
  var goalTimeRes = readTimeField('goalTime');
  var weeksAvailable=computeWeeks(document.getElementById('startDate').value||'',document.getElementById('raceDate').value||'')||0;
  var experienceLevel=document.getElementById('experienceLevel').value||'regular';
  var calculatedPeak=calculatePeakKm(rawCur===''?0:parseFloat(rawCur),goalDist,goalTimeRes.seconds,weeksAvailable,experienceLevel);
  document.getElementById('peakKm').value=calculatedPeak||'';
  return {
    planType:'standard',
    userName:(document.getElementById('userName').value||'').trim(),
    startDate:document.getElementById('startDate').value||'',
    raceDate:document.getElementById('raceDate').value||'',
    longDay:parseInt(document.getElementById('longRunDay').value),
    curDist:curDist, curTime:curTimeRes.seconds,
    curTimeEmpty:curTimeRes.empty, curTimeInvalid:curTimeRes.invalid,
    currentKm:rawCur===''?0:parseFloat(rawCur),
    goalDist:goalDist, goalTime:goalTimeRes.seconds,
    goalTimeEmpty:goalTimeRes.empty, goalTimeInvalid:goalTimeRes.invalid,
    peakKm:calculatedPeak, experienceLevel:experienceLevel, minimumWeeks:minimumPlanWeeks(goalDist,rawCur===''?0:parseFloat(rawCur),experienceLevel),
    recommendedWeeks:recommendedPlanWeeks(goalDist,rawCur===''?0:parseFloat(rawCur),experienceLevel),
    restDays:state.allRestDays
  };
}
function readCfgBeginner(){
  var bAbility = document.getElementById('bAbility').value;
  var abilityLabel = bAbility==='5min'?'Runs ~5 min':'Runs ~20 min';
  if (bAbility==='none') abilityLabel = 'Not running yet';
  return {
    planType:'beginner',
    userName:(document.getElementById('userName').value||'').trim(),
    startDate:document.getElementById('bStartDate').value||'',
    raceDate:document.getElementById('bRaceDate').value||'',
    longDay:parseInt(document.getElementById('bLongRunDay').value),
    ability:bAbility, abilityLabel:abilityLabel,
    daysPerWeek:parseInt(document.getElementById('bDays').value),
    goal:(document.getElementById('bGoal').value||''),
    restDays:state.beginnerRestDays
  };
}
function validateStandard(cfg){
  var missing=[];
  var fieldMap={userName:'field-userName',startDate:'field-startDate',raceDate:'field-raceDate',curDist:'field-curDist',curTime:'field-curTime',currentKm:'field-currentKm',goalDist:'field-goalDist',goalTime:'field-goalTime'};
  for(var key in fieldMap){var el=document.getElementById(fieldMap[key]);if(el)el.classList.remove('invalid');}
  if(!cfg.userName){missing.push('name');markInvalid('field-userName');}
  if(!cfg.startDate){missing.push('start date');markInvalid('field-startDate');}
  if(!cfg.raceDate){missing.push('race date');markInvalid('field-raceDate');}
  var weeks=computeWeeks(cfg.startDate,cfg.raceDate);
  if(cfg.startDate&&cfg.raceDate&&(!weeks||weeks<2)){missing.push('race date at least 2 weeks after start');markInvalid('field-raceDate');}
  if(!cfg.curDist||isNaN(cfg.curDist)){missing.push('recent race distance');markInvalid('field-curDist');}
  if(cfg.curTimeInvalid){missing.push('valid race time (min and sec 0–59)');markInvalid('field-curTime');}
  else if(!cfg.curTime){missing.push('recent race time');markInvalid('field-curTime');}
  else {
    var check1 = validateRaceInput(cfg.curDist, cfg.curTime);
    if (!check1.valid){missing.push('valid race time ('+check1.reason+')'); markInvalid('field-curTime');}
  }
  if(!cfg.currentKm||cfg.currentKm<=0){missing.push('current weekly km');markInvalid('field-currentKm');}
  if(!cfg.goalDist||isNaN(cfg.goalDist)){missing.push('goal distance');markInvalid('field-goalDist');}
  if(cfg.goalTimeInvalid){missing.push('valid goal time (min and sec 0–59)');markInvalid('field-goalTime');}
  else if(!cfg.goalTime){missing.push('goal time');markInvalid('field-goalTime');}
  else {
    var check2 = validateRaceInput(cfg.goalDist, cfg.goalTime);
    if (!check2.valid){missing.push('valid goal time ('+check2.reason+')'); markInvalid('field-goalTime');}
  }
  return missing;
}
function validateBeginner(cfg){
  var missing=[];
  var fieldMap={userName:'field-userName',bStartDate:'field-bStartDate',bRaceDate:'field-bRaceDate',bAbility:'field-bAbility',bDays:'field-bDays',bGoal:'field-bGoal'};
  for(var key in fieldMap){var el=document.getElementById(fieldMap[key]);if(el)el.classList.remove('invalid');}
  if(!cfg.userName){missing.push('name');markInvalid('field-userName');}
  if(!cfg.startDate){missing.push('start date');markInvalid('field-bStartDate');}
  if(!cfg.raceDate){missing.push('race day');markInvalid('field-bRaceDate');}
  var weeks=computeWeeks(cfg.startDate,cfg.raceDate);
  if(cfg.startDate&&cfg.raceDate&&(!weeks||weeks<4)){missing.push('race day at least 4 weeks after start');markInvalid('field-bRaceDate');}
  if(!cfg.ability){missing.push('current ability');markInvalid('field-bAbility');}
  if(!cfg.goal){missing.push('goal');markInvalid('field-bGoal');}
  return missing;
}
function markInvalid(id){var el=document.getElementById(id);if(el)el.classList.add('invalid');}
function updateWeeksDisplay(){
  updateDurationGuidance();
  if (state.planType === 'standard'){
    var s=document.getElementById('startDate').value,r=document.getElementById('raceDate').value;
    var box=document.getElementById('weeksBox');
    var weeks=computeWeeks(s,r);
    if(!s||!r){box.textContent='Set dates to compute';box.className='computed-box empty';return;}
    if(!weeks||weeks<2){box.textContent='Race must be ≥2 weeks after start';box.className='computed-box empty';return;}
    box.textContent=weeks+' weeks';box.className='computed-box';
  } else {
    var s=document.getElementById('bStartDate').value,r=document.getElementById('bRaceDate').value;
    var box=document.getElementById('bWeeksBox');
    var weeks=computeWeeks(s,r);
    if(!s||!r){box.textContent='Set dates to compute';box.className='computed-box empty';return;}
    if(!weeks||weeks<4){box.textContent='Race must be ≥4 weeks after start';box.className='computed-box empty';return;}
    box.textContent=weeks+' weeks';box.className='computed-box';
  }
}
function updateInputState(){
  updateWeeksDisplay();
  var missing, btn=document.getElementById('analyzeBtn'), status=document.getElementById('inputStatus');
  if (state.planType === 'standard'){
    var cfg = readCfgStandard();
    missing = validateStandard(cfg);
  } else {
    var cfgB = readCfgBeginner();
    missing = validateBeginner(cfgB);
  }
  if(missing.length===0){btn.disabled=false;btn.textContent='Analyze & generate plan →';status.className='input-status ready';status.textContent='All inputs received — ready to generate.';}
  else {btn.disabled=true;btn.textContent='Fill all fields →';status.className='input-status missing';status.textContent='Still needed: '+missing.join(', ')+'.';}
}
function runAnalysis(){ if (state.planType === 'beginner'){ runBeginnerAnalysis(); } else { runStandardAnalysis(); } }

function runStandardAnalysis(){
  var cfg=readCfgStandard();
  var missing=validateStandard(cfg);
  if(missing.length>0){updateInputState();return;}
  var weeks=computeWeeks(cfg.startDate,cfg.raceDate);
  var raceIdx=raceDayIndexInFinalWeek(cfg.startDate,cfg.raceDate,weeks);
  cfg.weeks=weeks; cfg.raceIdx=raceIdx;
  state.cfg=cfg; state.userName=cfg.userName; state.longDay=cfg.longDay;
  state.originalGoalTime=cfg.goalTime; state.adjustedGoalTime=cfg.goalTime;
  state.currentVdotOverride=null;
  var a=analyze(cfg);
  state.analysis=a;
  var planCfg={weeks:cfg.weeks,peakKm:cfg.peakKm,currentKm:cfg.currentKm,paceVdot:a.currentVdot,currentVdot:a.currentVdot,targetVdot:a.targetVdot,goalDist:cfg.goalDist,goalTime:cfg.goalTime,restDays:state.allRestDays,longDay:state.longDay,startDate:cfg.startDate,raceIdx:raceIdx};
  state.plan=generatePlan(planCfg);
  state.planOriginal=JSON.parse(JSON.stringify(state.plan));
  a.ttWeekText=state.plan.ttWeek || '—';
  document.getElementById('verdict').innerHTML=renderVerdict(a,cfg.userName,cfg);
  var keepBtn=document.getElementById('keepGoalBtn');
  var useFasterBtn=document.getElementById('useFasterBtn');
  if(keepBtn)keepBtn.addEventListener('click',function(){ document.getElementById('verdict').innerHTML=''; });
  if(useFasterBtn)useFasterBtn.addEventListener('click',function(){
    writeTimeField('goalTime', a.suggestedGoalTime);
    updateInputState();
    runStandardAnalysis();
  });
  var raceDateObj=parseLocalDate(cfg.raceDate); var startDateObj=parseLocalDate(cfg.startDate);
  state.planMeta={
    eventLabel:RACE_META[String(cfg.goalDist)].name.charAt(0).toUpperCase()+RACE_META[String(cfg.goalDist)].name.slice(1)+' — goal '+fmtTime(cfg.goalTime),
    goalTimeStr:fmtTime(cfg.goalTime),
    subtitle:'Generated with Daniels\u2019 VDOT system · '+weeks+' weeks · '+RACE_META[String(cfg.goalDist)].name+' training',
    currentVdot:a.currentVdot, targetVdot:a.targetVdot,
    currentAbilityStr:fmtTime(findRaceTime(a.currentVdot,cfg.goalDist)),
    raceDateStr:fmtDateLong(raceDateObj), firstDayStr:fmtDateLong(startDateObj),
    peakKm:cfg.peakKm, longRunDay:DAY_FULL_NAMES[cfg.longDay],
    goalSeverity:a.severity,
    goalOutlookTitle:({green:'Goal compatible with current fitness estimate',amber:'Ambitious goal — reassess at the time trial',red:'Stretch goal — current fitness is far from target'})[a.severity],
    goalOutlookDetail:(a.goalIsEasier ? 'Current-fitness estimate: '+fmtTime(a.currentGoalTime)+'. Goal: '+fmtTime(cfg.goalTime)+'. The target is easier than the current estimate; keep the goal if you prefer a conservative race.' : 'Current-fitness estimate: '+fmtTime(a.currentGoalTime)+'. Goal: '+fmtTime(cfg.goalTime)+'. Target gap: '+(a.vdotGap>=0?'+':'')+a.vdotGap.toFixed(1)+' VDOT; modelled training gain: about '+a.achievableGain.toFixed(1)+' points. The race-time forecast is a heuristic, not a guarantee. Reassess after the Week '+(state.plan.ttWeek||'mid-plan')+' time trial.')
  };
  document.getElementById('plan').innerHTML=renderPlan(state.plan,state.planMeta,state.userName);
  if (state.plan.ttWeek){
    document.getElementById('recalBtn').addEventListener('click',handleRecalibrate);
    setupTimeField('ttTime');
  }
  updateFeelNote();
  document.getElementById('plan').scrollIntoView({behavior:'smooth',block:'start'});
}
function runBeginnerAnalysis(){
  var cfg = readCfgBeginner();
  var missing = validateBeginner(cfg);
  if(missing.length>0){updateInputState();return;}
  var weeks = computeWeeks(cfg.startDate, cfg.raceDate);
  var raceIdx = raceDayIndexInFinalWeek(cfg.startDate, cfg.raceDate, weeks);
  cfg.weeks = weeks; cfg.raceIdx = raceIdx;
  cfg.goalLabel = cfg.goal==='5k'?'5K':(cfg.goal==='10k'?'10K':'Half marathon');
  state.cfg = cfg; state.userName = cfg.userName; state.longDay = cfg.longDay;
  state.analysis = null;
  var planResult = generateBeginnerPlan(cfg);
  state.plan = planResult;
  state.planOriginal = JSON.parse(JSON.stringify(planResult));
  document.getElementById('verdict').innerHTML = '';
  var raceDateObj = parseLocalDate(cfg.raceDate);
  var startDateObj = parseLocalDate(cfg.startDate);
  state.planMeta = {
    eventLabel: 'Beginner plan — goal: finish a '+cfg.goalLabel,
    goalTimeStr: '', subtitle: 'Build from walking and run/walk intervals to continuous running · '+weeks+' weeks',
    startingLevel: cfg.abilityLabel, daysPerWeek: cfg.daysPerWeek,
    raceDateStr: fmtDateLong(raceDateObj), firstDayStr: fmtDateLong(startDateObj),
    longRunDay: DAY_FULL_NAMES[cfg.longDay], peakKm: 0
  };
  document.getElementById('plan').innerHTML = renderPlan(planResult, state.planMeta, state.userName);
  updateFeelNote();
  document.getElementById('plan').scrollIntoView({behavior:'smooth',block:'start'});
}
function handleRecalibrate(){
  var dist=parseFloat(document.getElementById('ttDistance').value);
  var tRes = readTimeField('ttTime');
  var t = tRes.seconds;
  if (tRes.invalid){ alert('Minutes and seconds must be 0–59.'); return; }
  if(!t||t<=0){alert('Enter a valid TT time (e.g. 22:10).');return;}
  if(!state.plan.ttWeek){alert('No time trial scheduled in this plan.');return;}
  var check = validateRaceInput(dist, t);
  if (!check.valid){ alert(check.reason.replace(/<[^>]+>/g,'')); return; }
  var newVdot=Vdot.fromRace(dist,t);
  state.currentVdotOverride=newVdot;
  var ttWeek=state.plan.ttWeek;
  var oldPlan=state.plan, oldOriginal=state.planOriginal, cfg=state.cfg;
  var savedFeelMode = state.feelMode, savedFeelDays = state.feelDays, savedFeelStartDate = state.feelStartDate;
  var newResult=generatePlan({
    weeks:cfg.weeks, peakKm:cfg.peakKm, currentKm:cfg.currentKm,
    paceVdot:newVdot, currentVdot:newVdot, targetVdot:Vdot.fromRace(cfg.goalDist,state.adjustedGoalTime), goalDist:cfg.goalDist, goalTime:state.adjustedGoalTime,
    restDays:state.allRestDays, longDay:state.longDay,
    startDate:cfg.startDate, raceIdx:cfg.raceIdx
  });
  for (var i = 0; i < ttWeek-1; i++){ if (oldPlan.weeks[i]) newResult.weeks[i] = oldPlan.weeks[i]; }
  state.plan = newResult;
  var newOriginal = JSON.parse(JSON.stringify(newResult));
  for (var i = 0; i < ttWeek-1; i++){ if (oldOriginal.weeks[i]) newOriginal.weeks[i] = JSON.parse(JSON.stringify(oldOriginal.weeks[i])); }
  state.planOriginal = newOriginal;
  if (savedFeelMode && savedFeelStartDate){
    applyFeelingAdjustment(state.plan, savedFeelMode, savedFeelDays, savedFeelStartDate);
    state.feelMode = savedFeelMode; state.feelDays = savedFeelDays; state.feelStartDate = savedFeelStartDate;
  }
  var remainingWeeks=cfg.weeks-ttWeek;
  var extraGain=realisticGain(cfg.peakKm,minAdequateVolume(cfg.goalDist,newVdot),Math.max(remainingWeeks,1))*(remainingWeeks/8);
  var projectedAtRace=newVdot+Math.max(0,extraGain*0.5);
  var projectedTime=findRaceTime(projectedAtRace,cfg.goalDist);
  state.planMeta.targetVdot=newVdot;
  state.planMeta.currentVdot=newVdot;
  state.planMeta.currentAbilityStr=fmtTime(findRaceTime(newVdot,cfg.goalDist));
  var recalGoalVdot=Vdot.fromRace(cfg.goalDist,state.adjustedGoalTime);
  var recalGap=recalGoalVdot-newVdot;
  state.planMeta.goalSeverity=recalGap<=0.5?'green':(recalGap<=Math.max(1,extraGain*1.5)?'amber':'red');
  state.planMeta.goalOutlookTitle=state.planMeta.goalSeverity==='green'?'Goal now aligns with time-trial fitness':(state.planMeta.goalSeverity==='amber'?'Goal remains ambitious — keep reassessing':'Stretch goal — current time-trial fitness is below target');
  state.planMeta.goalOutlookDetail='Week '+ttWeek+' time trial: '+dist+' m in '+fmtTime(t)+' (VDOT '+newVdot.toFixed(1)+'). Goal: '+fmtTime(state.adjustedGoalTime)+'; VDOT gap '+(recalGap>=0?'+':'')+recalGap.toFixed(1)+'. Modelled race estimate after remaining training: '+fmtTime(projectedTime)+'; this is a heuristic, not a guarantee.';
  state.planMeta.subtitle='Recalibrated after Week '+ttWeek+' TT — new VDOT '+newVdot.toFixed(1)+' ('+fmtTime(t)+' @ '+dist+'m)';
  document.getElementById('plan').innerHTML=renderPlan(state.plan,state.planMeta,state.userName);
  var goalCheckHtml=renderGoalCheck(projectedTime,projectedAtRace,newVdot);
  document.getElementById('plan').insertAdjacentHTML('afterbegin',goalCheckHtml);
  var keepBtn2=document.getElementById('keepGoalBtn2');
  var acceptBtn=document.getElementById('acceptGoalBtn');
  var resetBtn=document.getElementById('resetGoalBtn');
  if(keepBtn2)keepBtn2.addEventListener('click',function(){dismissGoalCheck('keep');});
  if(acceptBtn)acceptBtn.addEventListener('click',function(){
    writeTimeField('goalTime', projectedTime);
    updateInputState();
    runStandardAnalysis();
  });
  if(resetBtn)resetBtn.addEventListener('click',function(){
    var input=prompt('Enter your new goal time (HH:MM:SS):',fmtTime(state.originalGoalTime));
    if(input){
      var t2=parseTime(input, state.cfg.goalDist);
      if(t2&&t2>0){
        writeTimeField('goalTime', t2);
        updateInputState();
        runStandardAnalysis();
      }
    }
  });
  if (state.plan.ttWeek){
    document.getElementById('recalBtn').addEventListener('click',handleRecalibrate);
    setupTimeField('ttTime');
  }
  updateFeelNote();
  document.getElementById('plan').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderGoalCheck(projectedTime,projectedVdot,currentVdot){
  var originalTime=state.originalGoalTime;
  var projectedIsFaster=projectedTime<originalTime;
  var gapSec=Math.abs(projectedTime-originalTime);
  var gapMin=Math.floor(gapSec/60); var gapSecRem=Math.round(gapSec%60);
  var gapStr=gapMin+':'+(gapSecRem<10?'0':'')+gapSecRem;
  var message;
  if(projectedIsFaster||gapSec<60){ message='Your time trial shows you\'re on track (or ahead) for your original goal of '+fmtTime(originalTime)+'. Keep going as planned.'; }
  else { message='Your time trial shows fitness at <strong>VDOT '+currentVdot.toFixed(1)+'</strong>. With the remaining weeks, your realistic finish is closer to <strong>'+fmtTime(projectedTime)+'</strong> — about '+gapStr+' slower than your original goal of '+fmtTime(originalTime)+'. <strong>What would you like to do?</strong>'; }
  return '<div class="goal-check no-print" id="goalCheck"><h3>Goal check — after the time trial</h3><p>'+message+'</p><div class="compare"><div class="compare-item"><div class="ci-label">Original goal</div><div class="ci-value">'+fmtTime(originalTime)+'</div><div class="ci-sub">Entered at plan start</div></div><div class="compare-item"><div class="ci-label">Projected at race day</div><div class="ci-value">'+fmtTime(projectedTime)+'</div><div class="ci-sub">Based on time trial + remaining weeks</div></div></div><div class="actions"><button class="btn primary" id="keepGoalBtn2">Keep original goal '+fmtTime(originalTime)+'</button><button class="btn green" id="acceptGoalBtn">Accept realistic goal '+fmtTime(projectedTime)+'</button><button class="btn" id="resetGoalBtn">Adjust goal manually</button></div></div>';
}
function dismissGoalCheck(action,newTime){ var panel=document.getElementById('goalCheck'); if(!panel)return; panel.remove(); }

function refreshRestDaysUI(){
  var longDay=parseInt(document.getElementById('longRunDay').value);
  state.longDay=longDay;
  var labels=document.querySelectorAll('#restDays label');
  for(var i=0;i<labels.length;i++){
    var lbl=labels[i]; var d=parseInt(lbl.getAttribute('data-d'));
    if(d===longDay){lbl.classList.add('disabled');lbl.classList.remove('on');state.allRestDays.delete(d);}
    else {lbl.classList.remove('disabled');}
  }
}
function refreshBeginnerRestDaysUI(){
  var longDay=parseInt(document.getElementById('bLongRunDay').value);
  state.beginnerLongDay=longDay;
  var labels=document.querySelectorAll('#bRestDays label');
  for(var i=0;i<labels.length;i++){
    var lbl=labels[i]; var d=parseInt(lbl.getAttribute('data-d'));
    if(d===longDay){lbl.classList.add('disabled');lbl.classList.remove('on');state.beginnerRestDays.delete(d);}
    else {lbl.classList.remove('disabled');}
  }
}
var restLabels=document.querySelectorAll('#restDays label');
for(var i=0;i<restLabels.length;i++){
  (function(lbl){
    lbl.addEventListener('click',function(e){
      e.preventDefault();
      var d=parseInt(lbl.getAttribute('data-d'));
      if(d===state.longDay)return;
      if(state.allRestDays.has(d))state.allRestDays.delete(d);else state.allRestDays.add(d);
      if(state.allRestDays.has(d))lbl.classList.add('on');else lbl.classList.remove('on');
    });
  })(restLabels[i]);
}
var bRestLabels=document.querySelectorAll('#bRestDays label');
for(var i=0;i<bRestLabels.length;i++){
  (function(lbl){
    lbl.addEventListener('click',function(e){
      e.preventDefault();
      var d=parseInt(lbl.getAttribute('data-d'));
      if(d===state.beginnerLongDay)return;
      if(state.beginnerRestDays.has(d))state.beginnerRestDays.delete(d);else state.beginnerRestDays.add(d);
      if(state.beginnerRestDays.has(d))lbl.classList.add('on');else lbl.classList.remove('on');
    });
  })(bRestLabels[i]);
}
document.getElementById('longRunDay').addEventListener('change',function(){refreshRestDaysUI();updateInputState();});
document.getElementById('bLongRunDay').addEventListener('change',function(){refreshBeginnerRestDaysUI();updateInputState();});

document.querySelectorAll('.plan-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    document.querySelectorAll('.plan-tab').forEach(function(t){ t.classList.remove('on'); });
    tab.classList.add('on');
    state.planType = tab.getAttribute('data-ptype');
    if (state.planType === 'standard'){
      document.getElementById('standardInputs').style.display = 'block';
      document.getElementById('beginnerInputs').style.display = 'none';
    } else {
      document.getElementById('standardInputs').style.display = 'none';
      document.getElementById('beginnerInputs').style.display = 'block';
    }
    updateInputState();
  });
});

var feelPanel=document.getElementById('feelPanel');
var feelHead=document.getElementById('feelHead');
var feelToggle=document.getElementById('feelToggle');
var modeButtons=document.querySelectorAll('.mode-card');
var feelApplyBtn=document.getElementById('feelApply');
var feelClearBtn=document.getElementById('feelClear');
var feelNote=document.getElementById('feelNote');

feelHead.addEventListener('click',function(){
  feelPanel.classList.toggle('collapsed');
  feelPanel.classList.toggle('open');
  feelToggle.textContent = feelPanel.classList.contains('open') ? 'close ▴' : 'open ▾';
});
modeButtons.forEach(function(btn){
  btn.addEventListener('click',function(){
    modeButtons.forEach(function(b){ b.classList.remove('on'); });
    btn.classList.add('on');
    state.feelMode = btn.getAttribute('data-mode');
    feelApplyBtn.disabled = false;
    updateFeelNote();
  });
});
feelApplyBtn.addEventListener('click',function(){
  if(!state.feelMode){ alert('Pick a mode first.'); return; }
  if(!state.planOriginal){ alert('Generate a plan first, then apply.'); return; }
  if(state.planType === 'beginner'){ alert('The feeling adjuster isn\'t available for beginner plans yet. Just take an extra rest day if you need one.'); return; }
  var days=parseInt(document.getElementById('feelDays').value);
  var startSel=document.getElementById('feelStart').value;
  var startDate;
  if(startSel==='today'){
    startDate=new Date(); startDate.setHours(0,0,0,0);
    var planStart=parseLocalDate(state.cfg.startDate); planStart.setHours(0,0,0,0);
    if(startDate < planStart) startDate = new Date(planStart);
  } else {
    startDate=parseLocalDate(state.cfg.startDate); startDate.setHours(0,0,0,0);
  }
  state.feelDays=days; state.feelStartDate=startDate;
  var adjusted=JSON.parse(JSON.stringify(state.planOriginal));
  var count=applyFeelingAdjustment(adjusted, state.feelMode, days, startDate);
  state.plan=adjusted;
  document.getElementById('plan').innerHTML=renderPlan(adjusted,state.planMeta,state.userName);
  if (state.plan.ttWeek){
    document.getElementById('recalBtn').addEventListener('click',handleRecalibrate);
    setupTimeField('ttTime');
  }
  updateFeelNote(count);
  document.getElementById('plan').scrollIntoView({behavior:'smooth',block:'start'});
});
feelClearBtn.addEventListener('click',function(){
  if(!state.planOriginal) return;
  state.plan=JSON.parse(JSON.stringify(state.planOriginal));
  state.feelMode=null; state.feelDays=0; state.feelStartDate=null;
  modeButtons.forEach(function(b){ b.classList.remove('on'); });
  feelApplyBtn.disabled=true;
  document.getElementById('plan').innerHTML=renderPlan(state.plan,state.planMeta,state.userName);
  if (state.plan.ttWeek){
    document.getElementById('recalBtn').addEventListener('click',handleRecalibrate);
    setupTimeField('ttTime');
  }
  updateFeelNote();
});
function updateFeelNote(count){
  if (state.planType === 'beginner'){
    feelNote.innerHTML = 'Beginner plans don\'t support auto-adjustment. If you need a lighter day, take an extra rest day.';
    feelApplyBtn.disabled = true;
    return;
  }
  var parts=[];
  if(state.feelMode){
    var label = state.feelMode==='fatigue' ? 'Fatigued' : (state.feelMode==='sick' ? 'Sick' : 'Busy');
    parts.push('Mode: <strong>'+label+'</strong>');
  }
  if(count && count > 0){ parts.push(count+' day'+(count===1?'':'s')+' adjusted in the plan below.'); }
  if(parts.length === 0){ feelNote.textContent = 'Select a mode and click Apply. The adjusted days will be highlighted; other days stay untouched.'; }
  else { feelNote.innerHTML = parts.join(' · '); }
}
function applyFeelingAdjustment(plan, mode, days, startDate){
  var startT = startDate.getTime();
  var endDate = new Date(startDate); endDate.setDate(endDate.getDate() + days - 1);
  var endT = endDate.getTime();
  var count = 0;
  var isFirstQOfWeek = {};
  for (var w = 0; w < plan.weeks.length; w++){
    var week = plan.weeks[w];
    isFirstQOfWeek[week.number] = true;
    var weekDates = computeWeekDates(plan.startDate, week.number);
    for (var d = 0; d < weekDates.length; d++){
      var thisDate = new Date(weekDates[d]); thisDate.setHours(0,0,0,0);
      var thisT = thisDate.getTime();
      if (thisT < startT) continue;
      if (thisT > endT) continue;
      var day = week.days[d];
      if (!day) continue;
      if (day.zone === 'race') continue;
      var adj = adjustWorkout(day, mode, isFirstQOfWeek[week.number]);
      if (adj){
        day.originalTitle = day.title; day.originalZone = day.zone; day.originalTotalKm = day.totalKm;
        day.adjusted = true; day.adjustMode = mode;
        day.zone = adj.zone; day.title = adj.title; day.detail = adj.detail || ''; day.totalKm = adj.totalKm;
        day.isQ = false; day.qRank = null; day.isLongRun = false; day.isSim = false;
        if (day.originalZone === 'T' || day.originalZone === 'I' || day.originalZone === 'R' || day.originalZone === 'M' || day.originalZone === 'tt') { isFirstQOfWeek[week.number] = false; }
        count++;
      }
    }
  }
  for (var w = 0; w < plan.weeks.length; w++){
    var tot = 0;
    for (var d = 0; d < plan.weeks[w].days.length; d++){ var dd = plan.weeks[w].days[d]; if (dd && isFinite(dd.totalKm)) tot += dd.totalKm; }
    plan.weeks[w].totalKm = tot;
  }
  return count;
}
function adjustWorkout(day, mode, isFirstQOfWeek){
  var z = day.zone;
  if (z === 'rest' || z === 'race') return null;
  var isQuality = (z === 'T' || z === 'I' || z === 'R' || z === 'M' || z === 'tt');
  if (mode === 'sick'){ return { zone: 'rest', title: 'Rest / walk only', detail: 'Was: ' + (day.originalTitle || day.title), totalKm: 0 }; }
  if (mode === 'fatigue'){
    if (day.isLongRun) return { zone: 'E', title: 'Eased long run', detail: 'Was: ' + (day.originalTitle || day.title), totalKm: Math.max(6, Math.round(day.totalKm * 0.6)) };
    if (isQuality){ if (z === 'T') return { zone: 'T', title: 'Short T session', detail: 'Was: ' + (day.originalTitle || day.title), totalKm: 5 }; return { zone: 'E', title: '25 min E', detail: 'Was: ' + (day.originalTitle || day.title), totalKm: 4 }; }
    return { zone: 'E', title: '20 min E', detail: 'Was: ' + (day.originalTitle || day.title), totalKm: 3 };
  }
  if (mode === 'busy'){
    if (day.isLongRun) return { zone: 'E', title: '40 min E', detail: 'Was: ' + (day.originalTitle || day.title), totalKm: 7 };
    if (isQuality){
      if (isFirstQOfWeek){ var shortened = Math.max(5, Math.round(day.totalKm * 0.55)); return { zone: z, title: 'Short ' + z, detail: 'Was: ' + (day.originalTitle || day.title), totalKm: shortened }; }
      return { zone: 'E', title: '25 min E', detail: 'Was: ' + (day.originalTitle || day.title), totalKm: 4 };
    }
    return { zone: 'E', title: '25 min E', detail: 'Was: ' + (day.originalTitle || day.title), totalKm: 4 };
  }
  return null;
}

/* Time field numeric input setup */
setupTimeField('curTime');
setupTimeField('goalTime');

var inputIds=['userName','startDate','raceDate','curDist','currentKm','goalDist','experienceLevel','bStartDate','bRaceDate','bAbility','bDays','bGoal','curTimeH','curTimeM','curTimeS','goalTimeH','goalTimeM','goalTimeS'];
for(var i=0;i<inputIds.length;i++){
  (function(id){
    var el=document.getElementById(id);
    if (!el) return;
    el.addEventListener('input',updateInputState);
    el.addEventListener('change',updateInputState);
  })(inputIds[i]);
}
document.getElementById('useMinimumWeeksBtn').addEventListener('click',function(){setStartDateForDuration('minimum');});
document.getElementById('useRecommendedWeeksBtn').addEventListener('click',function(){setStartDateForDuration('recommended');});
document.getElementById('analyzeBtn').addEventListener('click',runAnalysis);
document.getElementById('printBtn').addEventListener('click',function(){window.print();});

function showToast(msg){
  var toast=document.getElementById('copyToast');
  toast.textContent=msg; toast.classList.add('show');
  setTimeout(function(){toast.classList.remove('show');},2000);
}
document.getElementById('copyEmailBtn').addEventListener('click',function(){
  var email=document.getElementById('feedbackEmail').textContent.trim();
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(email).then(function(){showToast('Email address copied');}).catch(function(){
      var ta=document.createElement('textarea');
      ta.value=email; ta.style.position='fixed'; ta.style.left='-9999px';
      document.body.appendChild(ta); ta.select();
      try{document.execCommand('copy');showToast('Email address copied');}catch(e){showToast('Copy failed — please note down: '+email);}
      document.body.removeChild(ta);
    });
  } else {
    var ta=document.createElement('textarea');
    ta.value=email; ta.style.position='fixed'; ta.style.left='-9999px';
    document.body.appendChild(ta); ta.select();
    try{document.execCommand('copy');showToast('Email address copied');}catch(e){showToast('Copy failed — please note down: '+email);}
    document.body.removeChild(ta);
  }
});
document.getElementById('feedbackLink').addEventListener('click',function(e){
  setTimeout(function(){
    var email=document.getElementById('feedbackEmail').textContent.trim();
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).catch(function(){});
  }, 100);
});

refreshRestDaysUI();
refreshBeginnerRestDaysUI();
updateInputState();
