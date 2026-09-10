(function(){
'use strict';

// ==================== DATA ====================

const FLAGS_DATA = [
  {name:'Sweden',code:'SE',emoji:'\u{1F1F8}\u{1F1EA}',color:'#006AA7'},
  {name:'Mongolia',code:'MN',emoji:'\u{1F1F2}\u{1F1F3}',color:'#C4272F'},
  {name:'USA',code:'US',emoji:'\u{1F1FA}\u{1F1F8}',color:'#3C3B6E'},
  {name:'China',code:'CN',emoji:'\u{1F1E8}\u{1F1F3}',color:'#DE2910'},
  {name:'Russia',code:'RU',emoji:'\u{1F1F7}\u{1F1FA}',color:'#0039A6'},
  {name:'Argentina',code:'AR',emoji:'\u{1F1E6}\u{1F1F7}',color:'#74ACDF'},
  {name:'Israel',code:'IL',emoji:'\u{1F1EE}\u{1F1F1}',color:'#0038B8'},
  {name:'North Korea',code:'KP',emoji:'\u{1F1F0}\u{1F1F5}',color:'#024FA2'},
  {name:'Australia',code:'AU',emoji:'\u{1F1E6}\u{1F1FA}',color:'#00008B'},
  {name:'Nigeria',code:'NG',emoji:'\u{1F1F3}\u{1F1EC}',color:'#008751'},
];

function getFlagEmoji(name){
  const f=FLAGS_DATA.find(x=>x.name.toLowerCase()===name.toLowerCase());
  return f?f.emoji:'\u{1F30D}';
}

const ALL_UNIT_IDS=['infantry','artillery','tanks','fighterJets','bombers','navalForces','specialForces','airTurrets'];
const UNIT_NAMES={infantry:'Infantry',artillery:'Artillery',tanks:'Tanks',fighterJets:'Fighter Jets',bombers:'Bombers',navalForces:'Naval Forces',specialForces:'Special Forces',airTurrets:'Air Turrets'};

const DEFAULT_UNIT_CONFIGS={
  infantry:{id:'infantry',name:'Infantry',tierRatios:[1.00,1.10,1.20,1.30,1.40],counters:['artillery'],counteredBy:['tanks','fighterJets','bombers']},
  artillery:{id:'artillery',name:'Artillery',tierRatios:[1.20,1.35,1.50,1.65,1.80],counters:['tanks'],counteredBy:['specialForces','fighterJets']},
  tanks:{id:'tanks',name:'Tanks',tierRatios:[1.40,1.60,1.80,2.00,2.20],counters:['infantry','artillery'],counteredBy:['fighterJets','bombers']},
  fighterJets:{id:'fighterJets',name:'Fighter Jets',tierRatios:[1.50,1.75,2.00,2.25,2.50],counters:['bombers','tanks','artillery'],counteredBy:['airTurrets','fighterJets']},
  bombers:{id:'bombers',name:'Bombers',tierRatios:[1.60,1.85,2.10,2.35,2.60],counters:['airTurrets','tanks','infantry'],counteredBy:['fighterJets','airTurrets']},
  navalForces:{id:'navalForces',name:'Naval Forces',tierRatios:[1.20,1.40,1.60,1.80,2.00],counters:[],counteredBy:['fighterJets','bombers']},
  specialForces:{id:'specialForces',name:'Special Forces',tierRatios:[1.70,1.90,2.10,2.30,2.50],counters:['artillery','infantry'],counteredBy:['tanks','airTurrets']},
  airTurrets:{id:'airTurrets',name:'Air Turrets',tierRatios:[1.30,1.50,1.70,1.90,2.10],counters:['fighterJets','bombers'],counteredBy:['tanks','infantry','artillery']},
};

const DEFAULT_MATCHUPS=[
  {attackerUnit:'infantry',defenderUnit:'infantry',modifier:1.00},
  {attackerUnit:'tanks',defenderUnit:'infantry',modifier:1.25},
  {attackerUnit:'infantry',defenderUnit:'tanks',modifier:0.75},
  {attackerUnit:'artillery',defenderUnit:'tanks',modifier:1.20},
  {attackerUnit:'tanks',defenderUnit:'artillery',modifier:1.10},
  {attackerUnit:'fighterJets',defenderUnit:'bombers',modifier:1.30},
  {attackerUnit:'bombers',defenderUnit:'fighterJets',modifier:0.75},
  {attackerUnit:'fighterJets',defenderUnit:'fighterJets',modifier:1.00},
  {attackerUnit:'airTurrets',defenderUnit:'fighterJets',modifier:1.40},
  {attackerUnit:'fighterJets',defenderUnit:'airTurrets',modifier:0.70},
  {attackerUnit:'airTurrets',defenderUnit:'bombers',modifier:1.30},
  {attackerUnit:'bombers',defenderUnit:'airTurrets',modifier:0.75},
  {attackerUnit:'bombers',defenderUnit:'tanks',modifier:1.25},
  {attackerUnit:'bombers',defenderUnit:'infantry',modifier:1.25},
  {attackerUnit:'bombers',defenderUnit:'artillery',modifier:1.20},
  {attackerUnit:'navalForces',defenderUnit:'navalForces',modifier:1.00},
  {attackerUnit:'navalForces',defenderUnit:'infantry',modifier:0.60},
  {attackerUnit:'navalForces',defenderUnit:'tanks',modifier:0.55},
  {attackerUnit:'navalForces',defenderUnit:'artillery',modifier:0.65},
  {attackerUnit:'specialForces',defenderUnit:'artillery',modifier:1.25},
  {attackerUnit:'specialForces',defenderUnit:'infantry',modifier:1.15},
  {attackerUnit:'specialForces',defenderUnit:'tanks',modifier:0.80},
  {attackerUnit:'specialForces',defenderUnit:'specialForces',modifier:1.00},
  {attackerUnit:'airTurrets',defenderUnit:'infantry',modifier:0.70},
  {attackerUnit:'airTurrets',defenderUnit:'tanks',modifier:0.60},
  {attackerUnit:'tanks',defenderUnit:'tanks',modifier:1.00},
  {attackerUnit:'infantry',defenderUnit:'fighterJets',modifier:0.50},
  {attackerUnit:'infantry',defenderUnit:'bombers',modifier:0.55},
  {attackerUnit:'fighterJets',defenderUnit:'infantry',modifier:1.15},
  {attackerUnit:'fighterJets',defenderUnit:'tanks',modifier:1.10},
];

const RESEARCH_TIERS=[
  {tier:1,gdpRange:[0,24],label:'Basic',items:['Basic Army','Basic Industry','Basic Diplomacy']},
  {tier:2,gdpRange:[25,49],label:'Advanced',items:['Advanced Army','Tanks','Basic Navy','Improved Industry','Special Forces']},
  {tier:3,gdpRange:[50,74],label:'Superior',items:['Advanced Tanks','Advanced Artillery','Fighter Jets','Advanced Navy','Trade Network','Advanced Industry']},
  {tier:4,gdpRange:[75,99],label:'Elite',items:['Elite Military','Advanced Fighters','Bombers','Elite Industry']},
  {tier:5,gdpRange:[100,Infinity],label:'Supreme',items:['Top Military','Strategic Weapons','Advanced Aircraft','Global Trade','Top Navy']},
];

const ECONOMIC_INVESTMENT_COST=4000;
const ECONOMIC_INVESTMENT_GDP_GAIN=2;
const ECONOMIC_INVESTMENT_GDP_CAP=5;
const OCCUPIED_MONEY_INCOME=1000;
const OCCUPIED_MP_INCOME=250;
const INTEGRATED_MONEY_INCOME=3000;
const INTEGRATED_MP_INCOME=500;
const OCCUPATION_DAYS=3;

const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

function makeId(){return Date.now().toString(36)+Math.random().toString(36).substring(2,9)}

function getResearchTierForGDP(gdp){
  for(const tier of RESEARCH_TIERS){if(gdp>=tier.gdpRange[0]&&gdp<=tier.gdpRange[1])return tier.tier;}
  return 1;
}

function getUnitRatio(config,unitId,tier){
  const unit=config.unitConfigs[unitId];
  if(!unit)return 1.0;
  const idx=Math.max(0,Math.min(tier-1,unit.tierRatios.length-1));
  return unit.tierRatios[idx];
}

function getMatchupModifier(config,attackerUnit,defenderUnit){
  const found=config.matchups.find(m=>m.attackerUnit===attackerUnit&&m.defenderUnit===defenderUnit);
  return found?found.modifier:1.0;
}

function formatMoney(amount){return amount.toLocaleString()}

const MONTHS_SHORT=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDate(dateStr){
  const parts=dateStr.trim().split(' ');
  if(parts.length<3)return null;
  const day=parseInt(parts[0]);
  const month=MONTHS.indexOf(parts[1]);
  const year=parseInt(parts[2]);
  if(isNaN(day)||month<0||isNaN(year))return null;
  return new Date(year,month,day);
}

function formatDateStr(date){return date.getDate()+' '+MONTHS[date.getMonth()]+' '+date.getFullYear();}

function advanceDate(dateStr,days){
  days=days||1;
  const date=parseDate(dateStr);
  if(!date)return dateStr;
  date.setDate(date.getDate()+days);
  return formatDateStr(date);
}

function dateToInputValue(dateStr){
  const date=parseDate(dateStr);
  if(!date)return'';
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+d;
}

function inputValueToDate(value){
  if(!value)return'';
  const parts=value.split('-').map(Number);
  const date=new Date(parts[0],parts[1]-1,parts[2]);
  return formatDateStr(date);
}

function makeCountry(name){
  return{
    id:makeId(),name,playerName:'',leaderName:'',governmentName:'',
    flag:getFlagEmoji(name),alive:true,dateCreated:'10 September 2026',
    money:10000,mp:1500,gdp:20,dailyIncome:1500,dailyMP:300,
    researchTier:1,investmentGDP:0,completedResearch:[],
    militaryUnits:{infantry:10,artillery:2,tanks:0,fighterJets:0,bombers:0,navalForces:0,specialForces:0,airTurrets:0},
    unitInventory:{infantry:{mp:10,tier:1},artillery:{mp:2,tier:1},tanks:{mp:0,tier:1},fighterJets:{mp:0,tier:1},bombers:{mp:0,tier:1},navalForces:{mp:0,tier:1},specialForces:{mp:0,tier:1},airTurrets:{mp:0,tier:1}},
    territories:[],capturedTerritories:[],territoryCaptureHistory:[],
    battles:[],wars:[],alliances:[],treaties:[],notes:[],manualOverrides:{}
  };
}

function getInitialCountries(){
  const names=['Sweden','Mongolia','USA','China','Russia','Argentina','Israel','North Korea','Australia','Nigeria'];
  const countries={};
  names.forEach(n=>{const c=makeCountry(n);countries[c.id]=c;});
  return countries;
}

function getDefaultMilitaryConfig(){
  return{
    unitConfigs:JSON.parse(JSON.stringify(DEFAULT_UNIT_CONFIGS)),
    matchups:JSON.parse(JSON.stringify(DEFAULT_MATCHUPS)),
    tierResearchRequirements:{1:'Basic Army',2:'Advanced Army',3:'Modern Military',4:'Advanced Military',5:'Elite Military'}
  };
}

function calculateMilitaryPower(country,config){
  if(config&&country.unitInventory){
    let total=0;
    for(const [unitType,slot] of Object.entries(country.unitInventory)){
      if(slot.mp>0){const ratio=getUnitRatio(config,unitType,slot.tier);total+=slot.mp*ratio;}
    }
    return total;
  }
  return 0;
}

function getEffectiveValue(calculated,overrides,field){
  if(overrides&&overrides[field]!==undefined)return{value:overrides[field],overridden:true};
  return{value:calculated,overridden:false};
}

function calculateDailyIncome(country){
  const territoryIncome=country.capturedTerritories.filter(t=>t.status==='integrated').reduce((s,t)=>s+t.moneyIncome,0);
  const calculated=country.dailyIncome+territoryIncome;
  return getEffectiveValue(calculated,country.manualOverrides,'dailyIncome');
}

function autoDistributeLoss(mpLost,units){
  const participating=units.filter(u=>u.mpCommitted>0);
  if(participating.length===0||mpLost<=0)return{};
  const totalCommitted=participating.reduce((s,u)=>s+u.mpCommitted,0);
  if(totalCommitted<=0)return{};
  const losses={};
  let remaining=mpLost;
  const sorted=[...participating].sort((a,b)=>b.mpCommitted-a.mpCommitted);
  for(let i=0;i<sorted.length;i++){
    const u=sorted[i];
    if(i===sorted.length-1){const take=Math.min(remaining,u.mpCommitted);if(take>0)losses[u.unitType]=(losses[u.unitType]||0)+take;remaining-=take;continue;}
    let share=Math.floor(mpLost*(u.mpCommitted/totalCommitted));
    if(share>u.mpCommitted)share=u.mpCommitted;
    if(share>remaining)share=remaining;
    if(share<0)share=0;
    if(share>0)losses[u.unitType]=(losses[u.unitType]||0)+share;
    remaining-=share;
  }
  return losses;
}

function calculateBattle(config,attacker,defender){
  const breakdown=[];
  const attackerUnits=[];
  const defenderUnits=[];
  let attackerTotalMP=0,defenderTotalMP=0,attackerEffectivePower=0,defenderEffectivePower=0;

  for(const au of attacker.units){
    if(au.mp<=0)continue;
    const ratio=getUnitRatio(config,au.unitType,au.tier);
    let bestMatchup=1.0;
    for(const du of defender.units){const m=getMatchupModifier(config,au.unitType,du.unitType);if(m>bestMatchup)bestMatchup=m;}
    const ep=au.mp*ratio*bestMatchup;
    attackerUnits.push({unitType:au.unitType,tier:au.tier,mpCommitted:au.mp,ratio,matchupModifier:bestMatchup,effectivePower:Math.round(ep)});
    attackerTotalMP+=au.mp;
    attackerEffectivePower+=ep;
    breakdown.push('ATK '+au.unitType+' T'+au.tier+': '+au.mp+' x '+ratio.toFixed(2)+' x '+bestMatchup.toFixed(2)+' = '+Math.round(ep));
  }

  for(const du of defender.units){
    if(du.mp<=0)continue;
    const ratio=getUnitRatio(config,du.unitType,du.tier);
    let bestMatchup=1.0;
    for(const au of attacker.units){const m=getMatchupModifier(config,du.unitType,au.unitType);if(m>bestMatchup)bestMatchup=m;}
    const ep=du.mp*ratio*bestMatchup;
    defenderUnits.push({unitType:du.unitType,tier:du.tier,mpCommitted:du.mp,ratio,matchupModifier:bestMatchup,effectivePower:Math.round(ep)});
    defenderTotalMP+=du.mp;
    defenderEffectivePower+=ep;
    breakdown.push('DEF '+du.unitType+' T'+du.tier+': '+du.mp+' x '+ratio.toFixed(2)+' x '+bestMatchup.toFixed(2)+' = '+Math.round(ep));
  }

  attackerEffectivePower=Math.round(attackerEffectivePower);
  defenderEffectivePower=Math.round(defenderEffectivePower);
  const winner=attackerEffectivePower>=defenderEffectivePower?'attacker':'defender';

  return{attackerUnits,defenderUnits,attackerTotalMP,defenderTotalMP,attackerEffectivePower,defenderEffectivePower,winner,breakdown};
}

// ==================== STATE ====================

const STORAGE_KEY='era-of-empires-game-state';
let state={};
let activeModal=null;
let selectedCountryId=null;
let showDayInput=false;
let showDateInput=false;
let gameDayInput='';
let gameDateInput='';
let saveStatus='saved';

function getInitialState(){
  try{
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved){
      const parsed=JSON.parse(saved);
      if(!parsed.militaryConfig)parsed.militaryConfig=getDefaultMilitaryConfig();
      if(!parsed.wars)parsed.wars={};
      if(!parsed.warScoreEvents)parsed.warScoreEvents=[];
      if(!parsed.treaties)parsed.treaties={};
      for(const c of Object.values(parsed.countries)){
        if(!c.unitInventory)c.unitInventory={infantry:{mp:c.militaryUnits?.infantry||0,tier:1},artillery:{mp:c.militaryUnits?.artillery||0,tier:1},tanks:{mp:c.militaryUnits?.tanks||0,tier:1},fighterJets:{mp:c.militaryUnits?.fighterJets||0,tier:1},bombers:{mp:c.militaryUnits?.bombers||0,tier:1},navalForces:{mp:c.militaryUnits?.navalForces||0,tier:1},specialForces:{mp:c.militaryUnits?.specialForces||0,tier:1},airTurrets:{mp:c.militaryUnits?.airTurrets||0,tier:1}};
        if(!c.militaryUnits)c.militaryUnits={infantry:0,artillery:0,tanks:0,fighterJets:0,bombers:0,navalForces:0,specialForces:0,airTurrets:0};
        if(c.investmentGDP===undefined)c.investmentGDP=0;
        if(!c.capturedTerritories)c.capturedTerritories=[];
        if(!c.notes)c.notes=[];
        if(!c.territoryCaptureHistory)c.territoryCaptureHistory=[];
        if(!c.wars)c.wars=[];
        if(!c.battles)c.battles=[];
        if(!c.alliances)c.alliances=[];
        if(!c.treaties)c.treaties=[];
        if(!c.manualOverrides)c.manualOverrides={};
        if(!c.completedResearch)c.completedResearch=[];
      }
      if(!parsed.allBattles)parsed.allBattles=[];
      if(!parsed.allExpenses)parsed.allExpenses=[];
      if(!parsed.allMoneyChanges)parsed.allMoneyChanges=[];
      if(!parsed.allMPChanges)parsed.allMPChanges=[];
      return parsed;
    }
  }catch(e){console.error('Failed to load state:',e);}

  return{
    gameDay:1,gameDate:'10 September 2026',countries:getInitialCountries(),
    dailySnapshots:{},allBattles:[],allExpenses:[],allMoneyChanges:[],allMPChanges:[],
    militaryConfig:getDefaultMilitaryConfig(),wars:{},warScoreEvents:[],treaties:{}
  };
}

function saveState(){
  saveStatus='saving';
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){console.error('Save failed:',e);}
  setTimeout(()=>{saveStatus='saved';renderHeader();},300);
}

function dispatch(action){
  switch(action.type){
    case 'LOAD_STATE':state=action.payload;saveState();break;
    case 'NEXT_DAY':{
      const newDay=state.gameDay+1;
      const newDate=advanceDate(state.gameDate,1);
      const newCountries={...state.countries};
      const growGDP=newDay%3===0;
      for(const id of Object.keys(newCountries)){
        const c=newCountries[id];
        if(!c.alive)continue;
        let moneyGain=c.dailyIncome;
        let mpGain=c.dailyMP;
        const updatedTerritories=c.capturedTerritories.map(t=>{
          if(t.status==='occupied'){
            const daysHeld=newDay-t.capturedOnDay;
            if(daysHeld>=OCCUPATION_DAYS)return{...t,status:'integrated',moneyIncome:INTEGRATED_MONEY_INCOME};
            moneyGain+=OCCUPIED_MONEY_INCOME;
            mpGain+=OCCUPIED_MP_INCOME;
            return t;
          }else{
            moneyGain+=(t.moneyIncome>0?t.moneyIncome:INTEGRATED_MONEY_INCOME);
            mpGain+=INTEGRATED_MP_INCOME;
            return t;
          }
        });
        const gdpGain=growGDP?2:0;
        newCountries[id]={...c,money:c.money+moneyGain,mp:c.mp+mpGain,gdp:c.gdp+gdpGain,capturedTerritories:updatedTerritories};
      }
      state={...state,gameDay:newDay,gameDate:newDate,countries:newCountries};
      saveState();break;
    }
    case 'SET_GAME_DAY':state={...state,gameDay:action.payload};saveState();break;
    case 'SET_GAME_DATE':state={...state,gameDate:action.payload};saveState();break;
    case 'ADD_COUNTRY':state={...state,countries:{...state.countries,[action.payload.id]:action.payload}};saveState();break;
    case 'UPDATE_COUNTRY':state={...state,countries:{...state.countries,[action.payload.id]:{...state.countries[action.payload.id],...action.payload.updates}}};saveState();break;
    case 'DECLARE_DEAD':state={...state,countries:{...state.countries,[action.payload]:{...state.countries[action.payload],alive:false}}};saveState();break;
    case 'REVIVE_COUNTRY':state={...state,countries:{...state.countries,[action.payload]:{...state.countries[action.payload],alive:true}}};saveState();break;
    case 'ADD_EXPENSE':{
      const exp=action.payload;
      state={...state,allExpenses:[...state.allExpenses,exp],countries:{...state.countries,[exp.countryId]:{...state.countries[exp.countryId],money:state.countries[exp.countryId].money-exp.amount}}};
      saveState();break;
    }
    case 'ADD_BATTLE':{
      const battle=action.payload;
      const nc={...state.countries};
      if(nc[battle.attackerId]){nc[battle.attackerId]={...nc[battle.attackerId],mp:nc[battle.attackerId].mp-battle.mpLostAttacker,battles:[...nc[battle.attackerId].battles,battle.id]};}
      if(nc[battle.defenderId]){nc[battle.defenderId]={...nc[battle.defenderId],mp:nc[battle.defenderId].mp-battle.mpLostDefender,battles:[...nc[battle.defenderId].battles,battle.id]};}
      if(battle.territoryCaptured&&battle.territoryName&&nc[battle.attackerId]){
        const attacker=nc[battle.attackerId];
        const newTerr={id:makeId(),name:battle.territoryName,owner:battle.attackerId,capturingCountryId:battle.attackerId,capturedOnDay:battle.day,capturedOnDate:battle.date,status:'occupied',moneyIncome:OCCUPIED_MONEY_INCOME};
        nc[battle.attackerId]={...attacker,capturedTerritories:[...(attacker.capturedTerritories||[]),newTerr],territoryCaptureHistory:[...(attacker.territoryCaptureHistory||[]),{day:battle.day,date:battle.date,territories:[{name:battle.territoryName,fromCountryId:battle.defenderId}]}]};
      }
      state={...state,allBattles:[...state.allBattles,battle],countries:nc};
      saveState();break;
    }
    case 'ADD_MONEY_CHANGE':{
      const mc=action.payload;
      state={...state,allMoneyChanges:[...state.allMoneyChanges,mc],countries:{...state.countries,[mc.countryId]:{...state.countries[mc.countryId],money:state.countries[mc.countryId].money+mc.amount}}};
      saveState();break;
    }
    case 'ADD_MP_CHANGE':{
      const mpc=action.payload;
      state={...state,allMPChanges:[...state.allMPChanges,mpc],countries:{...state.countries,[mpc.countryId]:{...state.countries[mpc.countryId],mp:state.countries[mpc.countryId].mp+mpc.amount}}};
      saveState();break;
    }
    case 'ADD_TERRITORY_CAPTURE':{
      const{countryId,territory,historyEntry}=action.payload;
      const c=state.countries[countryId];
      state={...state,countries:{...state.countries,[countryId]:{...c,capturedTerritories:[...c.capturedTerritories,territory],territoryCaptureHistory:[...c.territoryCaptureHistory,historyEntry]}}};
      saveState();break;
    }
    case 'UPDATE_TERRITORY_STATUS':{
      const{countryId,territoryId,status}=action.payload;
      const c=state.countries[countryId];
      state={...state,countries:{...state.countries,[countryId]:{...c,capturedTerritories:c.capturedTerritories.map(t=>t.id===territoryId?{...t,status}:t)}}};
      saveState();break;
    }
    case 'RENAME_TERRITORY':{
      const{countryId,territoryId,newName}=action.payload;
      const c=state.countries[countryId];
      state={...state,countries:{...state.countries,[countryId]:{...c,capturedTerritories:c.capturedTerritories.map(t=>t.id===territoryId?{...t,name:newName}:t)}}};
      saveState();break;
    }
    case 'DELETE_TERRITORY':{
      const{countryId,territoryId}=action.payload;
      const c=state.countries[countryId];
      state={...state,countries:{...state.countries,[countryId]:{...c,capturedTerritories:c.capturedTerritories.filter(t=>t.id!==territoryId)}}};
      saveState();break;
    }
    case 'ADD_NOTE':{
      const{countryId,note}=action.payload;
      const c=state.countries[countryId];
      state={...state,countries:{...state.countries,[countryId]:{...c,notes:[...c.notes,note]}}};
      saveState();break;
    }
    case 'DELETE_NOTE':{
      const{countryId,noteId}=action.payload;
      const c=state.countries[countryId];
      state={...state,countries:{...state.countries,[countryId]:{...c,notes:c.notes.filter(n=>n.id!==noteId)}}};
      saveState();break;
    }
    case 'UPDATE_UNIT_INVENTORY':{
      const{countryId,unitType,mp,tier}=action.payload;
      const c=state.countries[countryId];
      if(!c)break;
      const unitInventory={...c.unitInventory};
      unitInventory[unitType]={mp,tier};
      const militaryUnits={...c.militaryUnits};
      militaryUnits[unitType]=mp;
      state={...state,countries:{...state.countries,[countryId]:{...c,unitInventory,militaryUnits}}};
      saveState();break;
    }
    case 'INVEST_ECONOMY':{
      const{countryId,cost,gdpGain}=action.payload;
      const c=state.countries[countryId];
      if(!c||c.money<cost)break;
      const cur=c.investmentGDP||0;
      if(cur>=5)break;
      const actualGain=Math.min(gdpGain,5-cur);
      state={...state,countries:{...state.countries,[countryId]:{...c,money:c.money-cost,gdp:c.gdp+actualGain,investmentGDP:cur+actualGain}}};
      saveState();break;
    }
    case 'ADD_WAR':state={...state,wars:{...state.wars,[action.payload.id]:action.payload}};saveState();break;
    case 'UPDATE_WAR':state={...state,wars:{...state.wars,[action.payload.id]:{...state.wars[action.payload.id],...action.payload.updates}}};saveState();break;
    case 'ADD_BATTLE_TO_WAR':{
      const{warId,battleId}=action.payload;
      const war=state.wars[warId];
      if(war)state={...state,wars:{...state.wars,[warId]:{...war,battles:[...war.battles,battleId]}}};
      saveState();break;
    }
    case 'ADD_WAR_SCORE_EVENT':state={...state,warScoreEvents:[...state.warScoreEvents,action.payload]};saveState();break;
    case 'DELETE_WAR':{const nw={...state.wars};delete nw[action.payload];state={...state,wars:nw};saveState();break;}
    case 'UPDATE_UNIT_RATIO':{
      const{unitId,tier,ratio}=action.payload;
      const config={...state.militaryConfig};
      const unitConfigs={...config.unitConfigs};
      const unit={...unitConfigs[unitId]};
      const tierRatios=[...unit.tierRatios];
      tierRatios[tier-1]=ratio;
      unit.tierRatios=tierRatios;
      unitConfigs[unitId]=unit;
      state={...state,militaryConfig:{...config,unitConfigs}};
      saveState();break;
    }
    case 'UPDATE_MATCHUP':{
      const{index,modifier}=action.payload;
      const matchups=[...state.militaryConfig.matchups];
      matchups[index]={...matchups[index],modifier};
      state={...state,militaryConfig:{...state.militaryConfig,matchups}};
      saveState();break;
    }
    case 'ADD_MATCHUP':state={...state,militaryConfig:{...state.militaryConfig,matchups:[...state.militaryConfig.matchups,action.payload]}};saveState();break;
    case 'DELETE_MATCHUP':{const m=[...state.militaryConfig.matchups];m.splice(action.payload,1);state={...state,militaryConfig:{...state.militaryConfig,matchups:m}};saveState();break;}
    case 'RESET_MILITARY_CONFIG':state={...state,militaryConfig:getDefaultMilitaryConfig()};saveState();break;
    case 'ADD_TREATY':state={...state,treaties:{...state.treaties,[action.payload.id]:action.payload}};saveState();break;
    case 'UPDATE_TREATY':state={...state,treaties:{...state.treaties,[action.payload.id]:{...state.treaties[action.payload.id],...action.payload.updates}}};saveState();break;
    case 'DELETE_TREATY':{const nt={...state.treaties};delete nt[action.payload];state={...state,treaties:nt};saveState();break;}
    default:break;
  }
}

// ==================== RENDERING ====================

function el(tag,attrs,children){
  const e=document.createElement(tag);
  if(attrs)for(const[k,v] of Object.entries(attrs)){
    if(k==='className')e.className=v;
    else if(k==='onclick')e.addEventListener('click',v);
    else if(k==='onchange')e.addEventListener('change',v);
    else if(k==='onkeydown')e.addEventListener('keydown',v);
    else if(k==='innerHTML')e.innerHTML=v;
    else if(k==='textContent')e.textContent=v;
    else e.setAttribute(k,v);
  }
  if(children){
    if(typeof children==='string')e.textContent=children;
    else if(Array.isArray(children))children.forEach(c=>{if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c);});
    else e.appendChild(typeof children==='string'?document.createTextNode(children):children);
  }
  return e;
}

function h(tag,attrs){
  const e=document.createElement(tag);
  if(attrs)for(const[k,v] of Object.entries(attrs)){
    if(k==='className')e.className=v;
    else if(k==='onclick')e.addEventListener('click',v);
    else if(k==='onchange')e.addEventListener('change',v);
    else if(k==='onkeydown')e.addEventListener('keydown',v);
    else e.setAttribute(k,v);
  }
  return e;
}

function openModal(type){activeModal=type;renderModal();}
function closeModal(){activeModal=null;selectedCountryId=null;renderAll();}

function renderAll(){
  renderHeader();
  renderSubNav();
  renderMain();
  renderFooter();
  renderModal();
}

// ==================== HEADER ====================

function renderHeader(){
  const hdr=document.getElementById('header');
  hdr.innerHTML='';

  const left=h('div',{className:'header-left'});
  left.appendChild(el('h1',{className:'title',textContent:'Era of Empires'}));
  const dayDisp=h('div',{className:'game-day-display'});
  dayDisp.appendChild(el('span',{className:'label',textContent:'DAY'}));
  dayDisp.appendChild(el('span',{className:'value',textContent:String(state.gameDay)}));
  dayDisp.appendChild(el('span',{className:'sep',textContent:'|'}));
  dayDisp.appendChild(el('span',{className:'label',textContent:'DATE'}));
  const dateSpan=el('span',{className:'value clickable',textContent:state.gameDate,onclick:()=>{showDateInput=!showDateInput;showDayInput=false;renderHeader();}});
  dayDisp.appendChild(dateSpan);
  if(showDateInput){
    const dig=h('span',{className:'day-input-group'});
    const di=el('input',{type:'date',className:'input-sm',value:dateToInputValue(state.gameDate)});
    di.addEventListener('change',e=>{gameDateInput=e.target.value;});
    di.addEventListener('keydown',e=>{if(e.key==='Enter'){const ds=inputValueToDate(gameDateInput);if(ds){dispatch({type:'SET_GAME_DATE',payload:ds});showDateInput=false;renderAll();}}});
    dig.appendChild(di);
    dig.appendChild(el('button',{className:'btn btn-sm',textContent:'SET',onclick:()=>{const ds=inputValueToDate(gameDateInput);if(ds){dispatch({type:'SET_GAME_DATE',payload:ds});showDateInput=false;renderAll();}}}));
    dig.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{showDateInput=false;renderHeader();}}));
    dayDisp.appendChild(dig);
  }
  left.appendChild(dayDisp);
  hdr.appendChild(left);

  const center=h('div',{className:'header-center'});
  center.appendChild(el('button',{className:'btn btn-sm',textContent:'NEXT DAY',onclick:()=>dispatch({type:'NEXT_DAY'})}));
  if(showDayInput){
    const dig=h('span',{className:'day-input-group'});
    const di=el('input',{type:'number',className:'input-sm',placeholder:'Day #'});
    di.addEventListener('keydown',e=>{if(e.key==='Enter'){const v=parseInt(di.value);if(!isNaN(v)&&v>0){dispatch({type:'SET_GAME_DAY',payload:v});showDayInput=false;renderAll();}}});
    dig.appendChild(di);
    dig.appendChild(el('button',{className:'btn btn-sm',textContent:'SET',onclick:()=>{const v=parseInt(di.value);if(!isNaN(v)&&v>0){dispatch({type:'SET_GAME_DAY',payload:v});showDayInput=false;renderAll();}}}));
    dig.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{showDayInput=false;renderHeader();}}));
    center.appendChild(dig);
  }else{
    center.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'SET DAY',onclick:()=>{showDayInput=true;showDateInput=false;renderHeader();}}));
  }
  center.appendChild(el('button',{className:'btn btn-sm btn-accent',textContent:'DAILY UPDATE',onclick:()=>openModal('dailyUpdate')}));
  center.appendChild(el('button',{className:'btn btn-sm btn-accent',textContent:'NOTEBOOK',onclick:()=>openModal('notebook')}));
  hdr.appendChild(center);

  const right=h('div',{className:'header-right'});
  right.appendChild(el('button',{className:'btn btn-sm',textContent:'+ COUNTRY',onclick:()=>openModal('createCountry')}));
  right.appendChild(el('button',{className:'btn btn-sm btn-accent',textContent:'BATTLE CALC',onclick:()=>openModal('battleCalc')}));
  right.appendChild(el('button',{className:'btn btn-sm btn-accent',textContent:'WARS',onclick:()=>openModal('warManager')}));
  right.appendChild(el('button',{className:'btn btn-sm',textContent:'TREATIES',onclick:()=>openModal('treaty')}));
  right.appendChild(el('button',{className:'btn btn-sm',textContent:'+ TERRITORY',onclick:()=>openModal('addTerritory')}));
  right.appendChild(el('button',{className:'btn btn-sm',textContent:'+$ CHANGE',onclick:()=>openModal('addMoneyChange')}));
  right.appendChild(el('button',{className:'btn btn-sm',textContent:'+MP CHANGE',onclick:()=>openModal('addMPChange')}));
  right.appendChild(el('span',{className:'save-indicator '+saveStatus,textContent:saveStatus==='saved'?'\u2713 Saved':'Saving...'}));
  hdr.appendChild(right);
}

function renderSubNav(){
  const nav=document.getElementById('sub-nav');
  nav.innerHTML='';
  nav.appendChild(el('button',{className:'btn btn-xs',textContent:'MILITARY RATIOS',onclick:()=>openModal('militaryRatios')}));
  nav.appendChild(el('button',{className:'btn btn-xs',textContent:'MATCHUP TABLE',onclick:()=>openModal('matchupTable')}));
}

function renderFooter(){
  const f=document.getElementById('footer');
  f.innerHTML='';
  f.appendChild(el('button',{className:'btn btn-sm',textContent:'EXPORT GAME',onclick:exportGame}));
  f.appendChild(el('button',{className:'btn btn-sm',textContent:'IMPORT GAME',onclick:importGame}));
  f.appendChild(el('button',{className:'btn btn-sm btn-danger',textContent:'RESET GAME',onclick:resetGame}));
}

function exportGame(){
  const data=JSON.stringify(state,null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='era-of-empires-day-'+state.gameDay+'.json';a.click();
  URL.revokeObjectURL(url);
}

function importGame(){
  const input=document.createElement('input');
  input.type='file';input.accept='.json';
  input.onchange=e=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{dispatch({type:'LOAD_STATE',payload:JSON.parse(ev.target.result)});renderAll();}catch(err){alert('Failed to import: invalid file.');}
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetGame(){
  if(window.prompt('Type RESET to permanently delete all game data:')==='RESET'){
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
}

// ==================== MAIN VIEW ====================

function renderMain(){
  const main=document.getElementById('main');
  main.innerHTML='';
  if(selectedCountryId&&state.countries[selectedCountryId]){
    renderCountryDetail(main,state.countries[selectedCountryId]);
  }else{
    renderDashboard(main);
  }
}

// ==================== DASHBOARD ====================

function renderDashboard(container){
  const alive=Object.values(state.countries).filter(c=>c.alive);
  const dead=Object.values(state.countries).filter(c=>!c.alive);
  const all=[...alive,...dead];
  const totalGDP=alive.reduce((s,c)=>s+c.gdp,0);
  const totalMoney=alive.reduce((s,c)=>s+c.money,0);
  const totalMP=alive.reduce((s,c)=>s+c.mp,0);
  const totalTerritories=alive.reduce((s,c)=>s+c.capturedTerritories.length,0);
  const totalBattles=state.allBattles.length;

  const statsBar=h('div',{className:'stats-bar'});
  const stats=[
    ['Game Day',String(state.gameDay)],['Alive',String(alive.length)],['Dead',String(dead.length)],
    ['World GDP',formatMoney(totalGDP)],['World Money',formatMoney(totalMoney)],['World MP',formatMoney(totalMP)],
    ['Territories',String(totalTerritories)],['Battles',String(totalBattles)]
  ];
  stats.forEach(([label,value])=>{
    const s=h('div',{className:'stat'});
    s.appendChild(el('span',{className:'stat-label',textContent:label}));
    s.appendChild(el('span',{className:'stat-value',textContent:value}));
    statsBar.appendChild(s);
  });
  container.appendChild(statsBar);

  const controlsBar=h('div',{className:'controls-bar'});
  const searchInput=el('input',{type:'text',className:'search-input',placeholder:'Search countries...'});
  controlsBar.appendChild(searchInput);
  const filterGroup=h('div',{className:'filter-group'});
  let currentFilter='all';
  ['all','alive','dead'].forEach(f=>{
    const btn=el('button',{className:'btn btn-sm'+(f==='all'?' btn-active':''),textContent:f.charAt(0).toUpperCase()+f.slice(1),onclick:()=>{
      currentFilter=f;
      filterGroup.querySelectorAll('.btn').forEach(b=>b.className='btn btn-sm');
      btn.className='btn btn-sm btn-active';
      updateTable();
    }});
    filterGroup.appendChild(btn);
  });
  controlsBar.appendChild(filterGroup);
  controlsBar.appendChild(el('button',{className:'btn btn-success create-country-btn',textContent:'+ CREATE COUNTRY',onclick:()=>openModal('createCountry')}));
  container.appendChild(controlsBar);

  const tableWrapper=h('div',{className:'country-table-wrapper'});
  const table=h('table',{className:'country-table'});
  const thead=h('thead',{});
  const headerRow=h('tr',{});
  ['Flag','Country','Player','Leader','Money','MP','GDP','Daily Inc','Terr','Res','Battles','Status'].forEach(col=>{
    headerRow.appendChild(el('th',{textContent:col}));
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody=h('tbody',{});
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);

  function updateTable(){
    tbody.innerHTML='';
    let filtered=all;
    if(currentFilter==='alive')filtered=alive;
    else if(currentFilter==='dead')filtered=dead;
    const search=searchInput.value.toLowerCase();
    if(search)filtered=filtered.filter(c=>c.name.toLowerCase().includes(search)||c.playerName.toLowerCase().includes(search)||c.leaderName.toLowerCase().includes(search));

    if(filtered.length===0){
      const tr=h('tr',{});
      const td=el('td',{colspan:'12',className:'empty-state',textContent:'No countries found.'});
      tr.appendChild(td);tbody.appendChild(tr);return;
    }

    filtered.forEach(country=>{
      const tr=h('tr',{className:'country-row'+(!country.alive?' dead':''),onclick:()=>{selectedCountryId=country.id;renderAll();}});
      tr.appendChild(el('td',{className:'flag-cell',textContent:getFlagEmoji(country.name)}));
      tr.appendChild(el('td',{className:'name-cell',textContent:country.name}));
      tr.appendChild(el('td',{textContent:country.playerName||'\u2014'}));
      tr.appendChild(el('td',{textContent:country.leaderName||'\u2014'}));
      tr.appendChild(el('td',{className:'num',textContent:formatMoney(country.money)}));
      tr.appendChild(el('td',{className:'num',textContent:formatMoney(country.mp)}));
      tr.appendChild(el('td',{className:'num',textContent:String(country.gdp)}));
      tr.appendChild(el('td',{className:'num',textContent:formatMoney(country.dailyIncome)}));
      tr.appendChild(el('td',{className:'num',textContent:String(country.capturedTerritories.length)}));
      tr.appendChild(el('td',{className:'num',textContent:'T'+getResearchTierForGDP(country.gdp)}));
      tr.appendChild(el('td',{className:'num',textContent:String(country.battles.length)}));
      const statusBadge=el('span',{className:'status-badge '+(country.alive?'alive':'dead'),textContent:country.alive?'ALIVE':'DEAD'});
      const statusTd=h('td',{});statusTd.appendChild(statusBadge);tr.appendChild(statusTd);
      tbody.appendChild(tr);
    });
  }
  updateTable();
  searchInput.addEventListener('input',updateTable);
}

// ==================== COUNTRY DETAIL ====================

function renderCountryDetail(container,country){
  const c=country;
  const config=state.militaryConfig;
  const detail=h('div',{className:'country-detail'});

  // Header
  const dhdr=h('div',{className:'detail-header'});
  dhdr.appendChild(el('button',{className:'btn btn-sm',innerHTML:'&larr; BACK',onclick:()=>{selectedCountryId=null;renderAll();}}));
  dhdr.appendChild(el('span',{className:'detail-title',textContent:getFlagEmoji(c.name)+' '+c.name}));
  dhdr.appendChild(el('span',{className:'status-badge '+(c.alive?'alive':'dead'),textContent:c.alive?'ALIVE':'DEAD'}));
  if(!c.alive){
    dhdr.appendChild(el('button',{className:'btn btn-sm btn-success',textContent:'REVIVE COUNTRY',onclick:()=>{dispatch({type:'REVIVE_COUNTRY',payload:c.id});selectedCountryId=null;renderAll();}}));
  }else{
    dhdr.appendChild(el('button',{className:'btn btn-sm btn-danger',textContent:'DECLARE DEAD',onclick:()=>{if(window.confirm('Declare '+c.name+' as dead?')){dispatch({type:'DECLARE_DEAD',payload:c.id});selectedCountryId=null;renderAll();}}}));
  }
  detail.appendChild(dhdr);

  const grid=h('div',{className:'detail-grid'});

  // Identity section
  const idSec=h('section',{className:'detail-section'});
  idSec.appendChild(el('h3',{textContent:'IDENTITY'}));
  idSec.appendChild(makeFieldRow('Country Name',c.name,false,'name',c));
  idSec.appendChild(makeFieldRow('Player',c.playerName||'',false,'playerName',c));
  idSec.appendChild(makeFieldRow('Leader',c.leaderName||'',false,'leaderName',c));
  idSec.appendChild(makeFieldRow('Government',c.governmentName||'',false,'governmentName',c));
  idSec.appendChild(makeFieldRow('Date Created',c.dateCreated,false,'dateCreated',c));
  grid.appendChild(idSec);

  // Economy section
  const ecoSec=h('section',{className:'detail-section'});
  ecoSec.appendChild(el('h3',{textContent:'ECONOMY'}));
  const moneyVal=getEffectiveValue(c.money,c.manualOverrides,'money');
  const dailyIncomeVal=getEffectiveValue(c.dailyIncome,c.manualOverrides,'dailyIncome');
  const gdpVal=getEffectiveValue(c.gdp,c.manualOverrides,'gdp');
  const occupiedTerrCount=c.capturedTerritories.filter(t=>t.status==='occupied').length;
  const integratedTerrCount=c.capturedTerritories.filter(t=>t.status==='integrated').length;
  const effectiveDailyIncome=dailyIncomeVal.value+occupiedTerrCount*OCCUPIED_MONEY_INCOME+integratedTerrCount*INTEGRATED_MONEY_INCOME;
  const investmentGDP=c.investmentGDP||0;
  const canInvest=investmentGDP<ECONOMIC_INVESTMENT_GDP_CAP&&c.money>=ECONOMIC_INVESTMENT_COST;

  ecoSec.appendChild(makeFieldRow('Money',formatMoney(moneyVal.value),moneyVal.overridden,'money',c,true));
  ecoSec.appendChild(makeFieldRow('Daily Income',formatMoney(dailyIncomeVal.value),dailyIncomeVal.overridden,'dailyIncome',c,true));
  ecoSec.appendChild(makeFieldRow('Total Daily Income',formatMoney(effectiveDailyIncome),false));
  ecoSec.appendChild(makeFieldRow('GDP',String(gdpVal.value),gdpVal.overridden,'gdp',c,true));
  ecoSec.appendChild(makeFieldRow('Investment GDP',investmentGDP+' / '+ECONOMIC_INVESTMENT_GDP_CAP,false));
  const investRow=h('div',{className:'field-row'});
  investRow.appendChild(el('span',{className:'field-label',textContent:'Econ Investment'}));
  investRow.appendChild(el('button',{className:'btn btn-xs'+(canInvest?' btn-success':''),textContent:'INVEST '+formatMoney(ECONOMIC_INVESTMENT_COST)+' for +'+ECONOMIC_INVESTMENT_GDP_GAIN+' GDP',onclick:()=>{if(canInvest&&window.confirm('Invest '+ECONOMIC_INVESTMENT_COST.toLocaleString()+' money for +'+ECONOMIC_INVESTMENT_GDP_GAIN+' GDP?')){dispatch({type:'INVEST_ECONOMY',payload:{countryId:c.id,cost:ECONOMIC_INVESTMENT_COST,gdpGain:ECONOMIC_INVESTMENT_GDP_GAIN}});renderAll();}}}));
  ecoSec.appendChild(investRow);
  grid.appendChild(ecoSec);

  // Military section
  const milSec=h('section',{className:'detail-section full-width'});
  milSec.appendChild(el('h3',{textContent:'MILITARY'}));
  const mpVal=getEffectiveValue(c.mp,c.manualOverrides,'mp');
  const dailyMPVal=getEffectiveValue(c.dailyMP,c.manualOverrides,'dailyMP');
  const milPower=calculateMilitaryPower(c,config);
  milSec.appendChild(makeFieldRow('MP',formatMoney(mpVal.value),mpVal.overridden,'mp',c,true));
  milSec.appendChild(makeFieldRow('Daily MP',formatMoney(dailyMPVal.value),dailyMPVal.overridden,'dailyMP',c,true));
  milSec.appendChild(makeFieldRow('Total Effective Power',formatMoney(milPower),false));

  milSec.appendChild(el('h4',{textContent:'UNIT INVENTORY'}));
  const invTableWrapper=h('div',{className:'inventory-table-wrapper'});
  const invTable=h('table',{className:'inventory-table'});
  const invThead=h('thead',{});
  const invHdrRow=h('tr',{});
  ['Unit','Tier','MP','Ratio','Effective Power'].forEach(col=>invHdrRow.appendChild(el('th',{textContent:col})));
  invThead.appendChild(invHdrRow);
  invTable.appendChild(invThead);
  const invTbody=h('tbody',{});
  const inventory=c.unitInventory||{};
  ALL_UNIT_IDS.forEach(unitId=>{
    const slot=inventory[unitId]||{mp:0,tier:1};
    if(slot.mp===0)return;
    const ratio=getUnitRatio(config,unitId,slot.tier);
    const ep=Math.round(slot.mp*ratio);
    const tr=h('tr',{});
    tr.appendChild(el('td',{className:'unit-label',textContent:UNIT_NAMES[unitId]}));
    tr.appendChild(el('td',{textContent:'T'+slot.tier}));
    tr.appendChild(el('td',{className:'num',textContent:formatMoney(slot.mp)}));
    tr.appendChild(el('td',{className:'num',textContent:ratio.toFixed(2)}));
    tr.appendChild(el('td',{className:'num',textContent:formatMoney(ep)}));
    invTbody.appendChild(tr);
  });
  invTable.appendChild(invTbody);
  invTableWrapper.appendChild(invTable);
  milSec.appendChild(invTableWrapper);

  milSec.appendChild(el('button',{className:'btn btn-sm',textContent:'EDIT INVENTORY',onclick:()=>openModal('editInventory')}));
  grid.appendChild(milSec);

  // Research section
  const resSec=h('section',{className:'detail-section'});
  resSec.appendChild(el('h3',{textContent:'RESEARCH'}));
  const effectiveTier=getResearchTierForGDP(c.gdp);
  resSec.appendChild(makeFieldRow('Research Tier','T'+effectiveTier,false));
  const resTree=h('div',{className:'research-tree'});
  RESEARCH_TIERS.forEach(tier=>{
    const unlocked=effectiveTier>=tier.tier;
    const tierBlock=h('div',{className:'tier-block '+(unlocked?'unlocked':'locked')});
    const tierHeader=h('div',{className:'tier-header'});
    tierHeader.appendChild(el('span',{className:'tier-label',textContent:'Tier '+tier.tier+' \u2014 '+tier.label}));
    if(unlocked)tierHeader.appendChild(el('span',{className:'text-success',textContent:'UNLOCKED'}));
    tierBlock.appendChild(tierHeader);
    const tierItems=h('div',{className:'tier-items'});
    tier.items.forEach(item=>{
      tierItems.appendChild(el('span',{className:'research-tag '+(unlocked?'completed':'available'),textContent:(unlocked?'\u2713 ':' ')+item}));
    });
    tierBlock.appendChild(tierItems);
    resTree.appendChild(tierBlock);
  });
  resSec.appendChild(resTree);
  grid.appendChild(resSec);

  // Territory section
  const terrSec=h('section',{className:'detail-section'});
  terrSec.appendChild(el('h3',{textContent:'TERRITORY'}));
  terrSec.appendChild(makeFieldRow('Total Captured',String(c.capturedTerritories.length),false));
  terrSec.appendChild(makeFieldRow('Occupied',String(occupiedTerrCount),false));
  terrSec.appendChild(makeFieldRow('Integrated',String(integratedTerrCount),false));
  if(c.capturedTerritories.length>0){
    const terrList=h('div',{className:'territory-list'});
    c.capturedTerritories.forEach(t=>{
      const item=h('div',{className:'territory-item'});
      item.appendChild(el('span',{textContent:t.name}));
      item.appendChild(el('span',{className:'status-badge '+t.status,textContent:t.status}));
      item.appendChild(el('span',{textContent:'Day '+t.capturedOnDay}));
      if(t.status==='occupied'){
        const daysLeft=Math.max(0,OCCUPATION_DAYS-(state.gameDay-t.capturedOnDay));
        item.appendChild(el('span',{className:'text-muted',textContent:daysLeft>0?daysLeft+'d left':'auto-integrating'}));
        item.appendChild(el('button',{className:'btn btn-xs btn-success',textContent:'INTEGRATE',onclick:()=>{dispatch({type:'UPDATE_TERRITORY_STATUS',payload:{countryId:c.id,territoryId:t.id,status:'integrated'}});renderAll();}}));
      }
      item.appendChild(el('button',{className:'btn btn-xs btn-danger',textContent:'DEL',onclick:()=>{if(window.confirm('Delete territory "'+t.name+'"?')){dispatch({type:'DELETE_TERRITORY',payload:{countryId:c.id,territoryId:t.id}});renderAll();}}}));
      terrList.appendChild(item);
    });
    terrSec.appendChild(terrList);
  }
  grid.appendChild(terrSec);

  // Battles section
  const batSec=h('section',{className:'detail-section'});
  batSec.appendChild(el('h3',{textContent:'BATTLES ('+c.battles.length+')'}));
  const countryBattles=state.allBattles.filter(b=>b.attackerId===c.id||b.defenderId===c.id).sort((a,b)=>a.day-b.day);
  if(countryBattles.length>0){
    const batList=h('div',{className:'battle-list'});
    countryBattles.forEach(b=>{
      const item=h('div',{className:'battle-item'});
      item.appendChild(el('span',{textContent:'Day '+b.day}));
      const attackerName=state.countries[b.attackerId]?.name||'???';
      const defenderName=state.countries[b.defenderId]?.name||'???';
      item.appendChild(el('span',{textContent:attackerName+' vs '+defenderName}));
      item.appendChild(el('span',{textContent:b.target}));
      item.appendChild(el('span',{className:b.winner===c.id?'text-success':'text-danger',textContent:b.winner===c.id?'WON':'LOST'}));
      if(b.territoryCaptured)item.appendChild(el('span',{className:'text-accent',textContent:'+Terr: '+b.territoryName}));
      batList.appendChild(item);
    });
    batSec.appendChild(batList);
  }
  grid.appendChild(batSec);

  // Diplomacy section
  const dipSec=h('section',{className:'detail-section'});
  dipSec.appendChild(el('h3',{textContent:'DIPLOMACY'}));
  dipSec.appendChild(makeFieldRow('Alliances',c.alliances.length===0?'None':c.alliances.join(', '),false));
  dipSec.appendChild(makeFieldRow('Treaties',c.treaties.length===0?'None':c.treaties.join(', '),false));
  dipSec.appendChild(makeFieldRow('Wars',c.wars.length===0?'None':c.wars.map(wid=>{const w=state.wars[wid];return w?w.name:wid;}).join(', '),false));
  grid.appendChild(dipSec);

  // Notes section
  const noteSec=h('section',{className:'detail-section'});
  noteSec.appendChild(el('h3',{textContent:'NOTES'}));
  const notesInput=h('div',{className:'notes-input'});
  const noteInput=el('input',{type:'text',className:'input-sm',placeholder:'Add a note...'});
  notesInput.appendChild(noteInput);
  notesInput.appendChild(el('button',{className:'btn btn-sm',textContent:'ADD',onclick:()=>{if(noteInput.value.trim()){dispatch({type:'ADD_NOTE',payload:{countryId:c.id,note:{id:makeId(),text:noteInput.value.trim(),day:state.gameDay,date:state.gameDate}}});noteInput.value='';renderAll();}}}));
  noteInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&noteInput.value.trim()){dispatch({type:'ADD_NOTE',payload:{countryId:c.id,note:{id:makeId(),text:noteInput.value.trim(),day:state.gameDay,date:state.gameDate}}});noteInput.value='';renderAll();}});
  noteSec.appendChild(notesInput);
  const notesList=h('div',{className:'notes-list'});
  c.notes.forEach(note=>{
    const item=h('div',{className:'note-item'});
    item.appendChild(el('span',{className:'note-day',textContent:'Day '+note.day}));
    item.appendChild(el('span',{className:'note-text',textContent:note.text}));
    item.appendChild(el('button',{className:'btn btn-xs btn-ghost',textContent:'X',onclick:()=>{dispatch({type:'DELETE_NOTE',payload:{countryId:c.id,noteId:note.id}});renderAll();}}));
    notesList.appendChild(item);
  });
  noteSec.appendChild(notesList);
  grid.appendChild(noteSec);

  detail.appendChild(grid);
  container.appendChild(detail);
}

function makeFieldRow(label,value,overridden,field,country,isNum){
  const row=h('div',{className:'field-row'});
  row.appendChild(el('span',{className:'field-label',textContent:label}));
  if(field&&country){
    const valGroup=h('span',{className:'field-value-group'});
    const valSpan=el('span',{className:'field-value clickable',textContent:isNum?formatMoney(value):value||'\u2014'});
    valSpan.addEventListener('click',()=>{
      const editGroup=h('span',{className:'field-edit-group'});
      const input=el('input',{type:isNum?'number':'text',className:'input-sm',value:String(value)});
      editGroup.appendChild(input);
      editGroup.appendChild(el('button',{className:'btn btn-xs',textContent:'OK',onclick:()=>{
        const nv=isNum?parseFloat(input.value):input.value;
        if(isNum&&!isNaN(nv)){dispatch({type:'UPDATE_COUNTRY',payload:{id:country.id,updates:{[field]:nv}}});}
        else if(!isNum){dispatch({type:'UPDATE_COUNTRY',payload:{id:country.id,updates:{[field]:input.value}}});}
        renderAll();
      }}));
      editGroup.appendChild(el('button',{className:'btn btn-xs btn-ghost',textContent:'X',onclick:()=>renderAll()}));
      input.addEventListener('keydown',e=>{if(e.key==='Enter'){editGroup.querySelector('.btn-xs').click();}});
      valGroup.replaceChild(editGroup,valSpan);
      input.focus();
    });
    valGroup.appendChild(valSpan);
    if(overridden)valGroup.appendChild(el('span',{className:'manual-badge',textContent:'MANUAL'}));
    row.appendChild(valGroup);
  }else{
    row.appendChild(el('span',{className:'field-value',textContent:isNum?formatMoney(value):value||'\u2014'}));
  }
  return row;
}

// ==================== MODALS ====================

function renderModal(){
  const root=document.getElementById('modal-root');
  root.innerHTML='';
  if(!activeModal)return;

  const overlay=h('div',{className:'modal-overlay'});
  overlay.addEventListener('click',e=>{if(e.target===overlay){activeModal=null;renderModal();}});
  const modal=h('div',{className:'modal'+(['battleCalc','warManager','dailyUpdate','notebook','militaryRatios','matchupTable'].includes(activeModal)?' wide-modal':'')});
  modal.addEventListener('click',e=>e.stopPropagation());

  switch(activeModal){
    case 'createCountry':renderCreateCountryModal(modal);break;
    case 'battleCalc':renderBattleCalcModal(modal);break;
    case 'warManager':renderWarManagerModal(modal);break;
    case 'addTerritory':renderAddTerritoryModal(modal);break;
    case 'addMoneyChange':renderAddMoneyChangeModal(modal);break;
    case 'addMPChange':renderAddMPChangeModal(modal);break;
    case 'militaryRatios':renderMilitaryRatiosModal(modal);break;
    case 'matchupTable':renderMatchupTableModal(modal);break;
    case 'notebook':renderNotebookModal(modal);break;
    case 'dailyUpdate':renderDailyUpdateModal(modal);break;
    case 'treaty':renderTreatyModal(modal);break;
    case 'editInventory':renderEditInventoryModal(modal);break;
    default:activeModal=null;return;
  }

  overlay.appendChild(modal);
  root.appendChild(overlay);
}

function renderCreateCountryModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'CREATE COUNTRY'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const form=h('div',{className:'form-grid'});
  const nameInput=el('input',{type:'text',className:'input-sm full-width',placeholder:'Country name...'});
  const playerInput=el('input',{type:'text',className:'input-sm full-width',placeholder:'Player name...'});
  const leaderInput=el('input',{type:'text',className:'input-sm full-width',placeholder:'Leader name...'});
  const govInput=el('input',{type:'text',className:'input-sm full-width',placeholder:'Government type...'});

  form.appendChild(el('label',{textContent:'Country Name'}));form.appendChild(nameInput);
  form.appendChild(el('label',{textContent:'Player Name'}));form.appendChild(playerInput);
  form.appendChild(el('label',{textContent:'Leader Name'}));form.appendChild(leaderInput);
  form.appendChild(el('label',{textContent:'Government'}));form.appendChild(govInput);
  modal.appendChild(form);

  modal.appendChild(el('div',{className:'center-row'},[
    el('button',{className:'btn btn-success',textContent:'CREATE',onclick:()=>{
      if(!nameInput.value.trim())return;
      const c=makeCountry(nameInput.value.trim());
      c.playerName=playerInput.value.trim();
      c.leaderName=leaderInput.value.trim();
      c.governmentName=govInput.value.trim();
      dispatch({type:'ADD_COUNTRY',payload:c});
      activeModal=null;renderModal();renderMain();
    }})
  ]));
}

function renderBattleCalcModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'BATTLE CALCULATOR'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const alive=Object.values(state.countries).filter(c=>c.alive);
  let attackerId='',defenderId='';
  let attackerUnits=[{unitType:'infantry',tier:1,mp:0}];
  let defenderUnits=[{unitType:'infantry',tier:1,mp:0}];
  let result=null;
  let mpLostAttacker=0,mpLostDefender=0;
  let attackerLossDist={},defenderLossDist={};
  let target='',warId='',territoryCaptured=false,territoryName='',notes='';

  function re-render(){
    modal.innerHTML='';
    const hdr=h('div',{className:'modal-header'});
    hdr.appendChild(el('h2',{textContent:'BATTLE CALCULATOR'}));
    hdr.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
    modal.appendChild(hdr);

    const grid=h('div',{className:'battle-calc-grid'});

    // Attacker side
    const atkSide=h('div',{className:'battle-side'});
    atkSide.appendChild(el('h3',{textContent:'ATTACKER'}));
    const atkSelect=el('select',{className:'input-sm full-width'});
    atkSelect.appendChild(el('option',{value:'',textContent:'Select attacker...'}));
    alive.forEach(c=>atkSelect.appendChild(el('option',{value:c.id,textContent:getFlagEmoji(c.name)+' '+c.name})));
    atkSelect.value=attackerId;
    atkSelect.addEventListener('change',e=>{attackerId=e.target.value;re-render();});
    atkSide.appendChild(atkSelect);

    attackerUnits.forEach((u,i)=>{
      const row=h('div',{className:'battle-unit-row'});
      const unitSel=el('select',{className:'input-sm'});
      ALL_UNIT_IDS.forEach(id=>unitSel.appendChild(el('option',{value:id,textContent:UNIT_NAMES[id]})));
      unitSel.value=u.unitType;
      unitSel.addEventListener('change',e=>{attackerUnits[i].unitType=e.target.value;re-render();});
      row.appendChild(unitSel);
      const tierSel=el('select',{className:'input-sm tier-select'});
      [1,2,3,4,5].forEach(t=>tierSel.appendChild(el('option',{value:String(t),textContent:'T'+t})));
      tierSel.value=String(u.tier);
      tierSel.addEventListener('change',e=>{attackerUnits[i].tier=parseInt(e.target.value);re-render();});
      row.appendChild(tierSel);
      const mpIn=el('input',{type:'number',className:'input-sm mp-input',placeholder:'MP',value:String(u.mp||'')});
      mpIn.addEventListener('change',e=>{attackerUnits[i].mp=parseInt(e.target.value)||0;re-render();});
      row.appendChild(mpIn);
      if(attackerUnits.length>1)row.appendChild(el('button',{className:'btn btn-xs btn-ghost',textContent:'X',onclick:()=>{attackerUnits.splice(i,1);re-render();}}));
      atkSide.appendChild(row);
    });
    atkSide.appendChild(el('button',{className:'btn btn-xs',textContent:'+ ADD UNIT',onclick:()=>{attackerUnits.push({unitType:'infantry',tier:1,mp:0});re-render();}}));
    const atkCountry=state.countries[attackerId];
    if(atkCountry)atkSide.appendChild(el('div',{className:'side-info',textContent:'Total MP Available: '+formatMoney(atkCountry.mp)}));
    grid.appendChild(atkSide);

    grid.appendChild(el('div',{className:'battle-vs',innerHTML:'<span>VS</span>'}));

    // Defender side
    const defSide=h('div',{className:'battle-side'});
    defSide.appendChild(el('h3',{textContent:'DEFENDER'}));
    const defSelect=el('select',{className:'input-sm full-width'});
    defSelect.appendChild(el('option',{value:'',textContent:'Select defender...'}));
    alive.forEach(c=>defSelect.appendChild(el('option',{value:c.id,textContent:getFlagEmoji(c.name)+' '+c.name})));
    defSelect.value=defenderId;
    defSelect.addEventListener('change',e=>{defenderId=e.target.value;re-render();});
    defSide.appendChild(defSelect);

    defenderUnits.forEach((u,i)=>{
      const row=h('div',{className:'battle-unit-row'});
      const unitSel=el('select',{className:'input-sm'});
      ALL_UNIT_IDS.forEach(id=>unitSel.appendChild(el('option',{value:id,textContent:UNIT_NAMES[id]})));
      unitSel.value=u.unitType;
      unitSel.addEventListener('change',e=>{defenderUnits[i].unitType=e.target.value;re-render();});
      row.appendChild(unitSel);
      const tierSel=el('select',{className:'input-sm tier-select'});
      [1,2,3,4,5].forEach(t=>tierSel.appendChild(el('option',{value:String(t),textContent:'T'+t})));
      tierSel.value=String(u.tier);
      tierSel.addEventListener('change',e=>{defenderUnits[i].tier=parseInt(e.target.value);re-render();});
      row.appendChild(tierSel);
      const mpIn=el('input',{type:'number',className:'input-sm mp-input',placeholder:'MP',value:String(u.mp||'')});
      mpIn.addEventListener('change',e=>{defenderUnits[i].mp=parseInt(e.target.value)||0;re-render();});
      row.appendChild(mpIn);
      if(defenderUnits.length>1)row.appendChild(el('button',{className:'btn btn-xs btn-ghost',textContent:'X',onclick:()=>{defenderUnits.splice(i,1);re-render();}}));
      defSide.appendChild(row);
    });
    defSide.appendChild(el('button',{className:'btn btn-xs',textContent:'+ ADD UNIT',onclick:()=>{defenderUnits.push({unitType:'infantry',tier:1,mp:0});re-render();}}));
    const defCountry=state.countries[defenderId];
    if(defCountry)defSide.appendChild(el('div',{className:'side-info',textContent:'Total MP Available: '+formatMoney(defCountry.mp)}));
    grid.appendChild(defSide);

    modal.appendChild(grid);

    // Target row
    const targetRow=h('div',{className:'battle-target-row'});
    const targetIn=el('input',{className:'input-sm',placeholder:'Target (e.g. Siberian Front)',value:target});
    targetIn.addEventListener('change',e=>{target=e.target.value;});
    targetRow.appendChild(targetIn);
    const activeWars=Object.values(state.wars).filter(w=>w.status==='active');
    if(activeWars.length>0){
      const warSel=el('select',{className:'input-sm'});
      warSel.appendChild(el('option',{value:'',textContent:'No War'}));
      activeWars.forEach(w=>warSel.appendChild(el('option',{value:w.id,textContent:w.name})));
      warSel.value=warId;
      warSel.addEventListener('change',e=>{warId=e.target.value;});
      targetRow.appendChild(warSel);
    }
    modal.appendChild(targetRow);

    modal.appendChild(el('div',{className:'center-row'},[
      el('button',{className:'btn btn-accent',textContent:'CALCULATE BATTLE',onclick:()=>{
        if(!attackerId||!defenderId)return;
        result=calculateBattle(state.militaryConfig,{countryId:attackerId,units:attackerUnits.filter(u=>u.mp>0)},{countryId:defenderId,units:defenderUnits.filter(u=>u.mp>0)});
        mpLostAttacker=0;mpLostDefender=0;attackerLossDist={};defenderLossDist={};
        re-render();
      }})
    ]));

    if(result){
      const winnerName=result.winner==='attacker'?(state.countries[attackerId]?.name||'ATTACKER'):(state.countries[defenderId]?.name||'DEFENDER');
      modal.appendChild(el('div',{className:'winner-banner '+result.winner,textContent:'WINNER: '+winnerName}));

      const resGrid=h('div',{className:'result-grid'});
      // Attacker breakdown
      const atkRes=h('div',{className:'result-side'});
      atkRes.appendChild(el('h4',{textContent:'ATTACKER BREAKDOWN'}));
      atkRes.appendChild(makeResultRow('Total MP',formatMoney(result.attackerTotalMP)));
      atkRes.appendChild(makeResultRow('Effective Power',formatMoney(result.attackerEffectivePower),true));
      result.attackerUnits.forEach(u=>{
        atkRes.appendChild(el('div',{className:'result-unit',innerHTML:UNIT_NAMES[u.unitType]+' T'+u.tier+' &mdash; '+formatMoney(u.mpCommitted)+' &times; '+u.ratio.toFixed(2)+' &times; '+u.matchupModifier.toFixed(2)+' = <strong>'+formatMoney(u.effectivePower)+'</strong>'}));
      });
      resGrid.appendChild(atkRes);
      // Defender breakdown
      const defRes=h('div',{className:'result-side'});
      defRes.appendChild(el('h4',{textContent:'DEFENDER BREAKDOWN'}));
      defRes.appendChild(makeResultRow('Total MP',formatMoney(result.defenderTotalMP)));
      defRes.appendChild(makeResultRow('Effective Power',formatMoney(result.defenderEffectivePower),true));
      result.defenderUnits.forEach(u=>{
        defRes.appendChild(el('div',{className:'result-unit',innerHTML:UNIT_NAMES[u.unitType]+' T'+u.tier+' &mdash; '+formatMoney(u.mpCommitted)+' &times; '+u.ratio.toFixed(2)+' &times; '+u.matchupModifier.toFixed(2)+' = <strong>'+formatMoney(u.effectivePower)+'</strong>'}));
      });
      resGrid.appendChild(defRes);
      modal.appendChild(resGrid);

      // MP Loss section
      const lossSec=h('div',{className:'mp-loss-section'});
      lossSec.appendChild(el('h4',{textContent:'MP LOSSES'}));
      const atkLossRow=h('div',{className:'loss-row'});
      atkLossRow.appendChild(el('label',{textContent:'Attacker MP Lost:'}));
      const atkLossInput=el('input',{type:'number',className:'input-sm',value:String(mpLostAttacker)});
      atkLossInput.addEventListener('change',e=>{mpLostAttacker=parseInt(e.target.value)||0;});
      atkLossRow.appendChild(atkLossInput);
      atkLossRow.appendChild(el('button',{className:'btn btn-xs',textContent:'AUTO DIST',onclick:()=>{attackerLossDist=autoDistributeLoss(mpLostAttacker,result.attackerUnits);re-render();}}));
      lossSec.appendChild(atkLossRow);
      if(Object.keys(attackerLossDist).length>0){
        const dist=h('div',{className:'loss-dist'});
        Object.entries(attackerLossDist).forEach(([unit,loss])=>dist.appendChild(el('span',{className:'loss-item',textContent:UNIT_NAMES[unit]+': -'+formatMoney(loss)})));
        lossSec.appendChild(dist);
      }
      const defLossRow=h('div',{className:'loss-row'});
      defLossRow.appendChild(el('label',{textContent:'Defender MP Lost:'}));
      const defLossInput=el('input',{type:'number',className:'input-sm',value:String(mpLostDefender)});
      defLossInput.addEventListener('change',e=>{mpLostDefender=parseInt(e.target.value)||0;});
      defLossRow.appendChild(defLossInput);
      defLossRow.appendChild(el('button',{className:'btn btn-xs',textContent:'AUTO DIST',onclick:()=>{defenderLossDist=autoDistributeLoss(mpLostDefender,result.defenderUnits);re-render();}}));
      lossSec.appendChild(defLossRow);
      if(Object.keys(defenderLossDist).length>0){
        const dist=h('div',{className:'loss-dist'});
        Object.entries(defenderLossDist).forEach(([unit,loss])=>dist.appendChild(el('span',{className:'loss-item',textContent:UNIT_NAMES[unit]+': -'+formatMoney(loss)})));
        lossSec.appendChild(dist);
      }
      modal.appendChild(lossSec);

      // Territory checkbox
      const terrRow=h('div',{className:'territory-result'});
      const terrCheck=el('input',{type:'checkbox'});
      terrCheck.checked=territoryCaptured;
      terrCheck.addEventListener('change',e=>{territoryCaptured=e.target.checked;re-render();});
      terrRow.appendChild(terrCheck);
      terrRow.appendChild(el('label',{textContent:'Territory Captured?'}));
      if(territoryCaptured){
        const terrIn=el('input',{className:'input-sm',placeholder:'Territory name',value:territoryName});
        terrIn.addEventListener('change',e=>{territoryName=e.target.value;});
        terrRow.appendChild(terrIn);
      }
      modal.appendChild(terrRow);

      // Notes
      const notesRow=h('div',{className:'battle-notes-row'});
      const notesIn=el('input',{className:'input-sm full-width',placeholder:'Battle notes...',value:notes});
      notesIn.addEventListener('change',e=>{notes=e.target.value;});
      notesRow.appendChild(notesIn);
      modal.appendChild(notesRow);

      // Record button
      modal.appendChild(el('div',{className:'center-row'},[
        el('button',{className:'btn btn-success',textContent:'RECORD BATTLE',onclick:()=>{
          if(!result||!attackerId||!defenderId)return;
          const battle={
            id:makeId(),warId:warId||undefined,day:state.gameDay,date:state.gameDate,
            attackerId,defenderId,target:target||'General',
            attackerUnits:result.attackerUnits,defenderUnits:result.defenderUnits,
            attackerMP:result.attackerTotalMP,defenderMP:result.defenderTotalMP,
            attackerEffectivePower:result.attackerEffectivePower,defenderEffectivePower:result.defenderEffectivePower,
            winner:result.winner==='attacker'?attackerId:defenderId,
            result:result.winner==='attacker'?'Attacker Victory':'Defender Victory',
            mpLostAttacker,mpLostDefender,territoryCaptured,territoryName:territoryCaptured?territoryName:'',notes
          };
          dispatch({type:'ADD_BATTLE',payload:battle});
          if(warId)dispatch({type:'ADD_BATTLE_TO_WAR',payload:{warId,battleId:battle.id}});
          activeModal=null;renderModal();renderMain();
        }})
      ]));
    }
  }
  re-render();
}

function makeResultRow(label,value,isTotal){
  const row=h('div',{className:'result-row'+(isTotal?' total':'')});
  row.appendChild(el('span',{textContent:label}));
  row.appendChild(el('span',{className:'num',textContent:value}));
  return row;
}

function renderWarManagerModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'WAR MANAGER'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const alive=Object.values(state.countries).filter(c=>c.alive);
  let showCreate=false;
  let warName='',attackers=[],defenders=[];
  let expandedWar=null;

  function re-render(){
    modal.innerHTML='';
    const hdr=h('div',{className:'modal-header'});
    hdr.appendChild(el('h2',{textContent:'WAR MANAGER'}));
    hdr.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
    modal.appendChild(hdr);

    modal.appendChild(el('button',{className:'btn btn-sm btn-accent',textContent:showCreate?'CANCEL':'+ DECLARE WAR',onclick:()=>{showCreate=!showCreate;re-render();}}));

    if(showCreate){
      const form=h('div',{className:'war-create-form'});
      const nameIn=el('input',{className:'input-sm full-width',placeholder:'War name...'});
      nameIn.addEventListener('change',e=>{warName=e.target.value;});
      form.appendChild(nameIn);
      const sides=h('div',{className:'war-sides'});
      const atkDiv=h('div',{});atkDiv.appendChild(el('h4',{textContent:'Attackers'}));
      const defDiv=h('div',{});defDiv.appendChild(el('h4',{textContent:'Defenders'}));
      alive.forEach(c=>{
        const atkLabel=h('label',{className:'war-toggle'});
        const atkCb=el('input',{type:'checkbox'});
        atkCb.checked=attackers.includes(c.id);
        atkCb.addEventListener('change',()=>{attackers=attackers.includes(c.id)?attackers.filter(x=>x!==c.id):[...attackers,c.id];defenders=defenders.filter(x=>x!==c.id);re-render();});
        atkLabel.appendChild(atkCb);atkLabel.appendChild(document.createTextNode(' '+getFlagEmoji(c.name)+' '+c.name));
        atkDiv.appendChild(atkLabel);
        const defLabel=h('label',{className:'war-toggle'});
        const defCb=el('input',{type:'checkbox'});
        defCb.checked=defenders.includes(c.id);
        defCb.addEventListener('change',()=>{defenders=defenders.includes(c.id)?defenders.filter(x=>x!==c.id):[...defenders,c.id];attackers=attackers.filter(x=>x!==c.id);re-render();});
        defLabel.appendChild(defCb);defLabel.appendChild(document.createTextNode(' '+getFlagEmoji(c.name)+' '+c.name));
        defDiv.appendChild(defLabel);
      });
      sides.appendChild(atkDiv);sides.appendChild(defDiv);
      form.appendChild(sides);
      form.appendChild(el('button',{className:'btn btn-success',textContent:'CREATE WAR',onclick:()=>{
        if(!warName||attackers.length===0||defenders.length===0)return;
        dispatch({type:'ADD_WAR',payload:{id:makeId(),name:warName,attackerIds:attackers,defenderIds:defenders,startDate:state.gameDate,startDay:state.gameDay,endDate:'',endDay:0,status:'active',battles:[],territoriesCaptured:[],territoriesLost:[],warScore:{},notes:''}});
        warName='';attackers=[];defenders=[];showCreate=false;re-render();
      }}));
      modal.appendChild(form);
    }

    const wars=Object.values(state.wars).sort((a,b)=>b.startDay-a.startDay);
    const warsList=h('div',{className:'wars-list'});
    if(wars.length===0)warsList.appendChild(el('div',{className:'empty-state',textContent:'No wars declared.'}));

    wars.forEach(war=>{
      const card=h('div',{className:'war-card'});
      const wHeader=h('div',{className:'war-header',onclick:()=>{expandedWar=expandedWar===war.id?null:war.id;re-render();}});
      wHeader.appendChild(el('span',{className:'status-badge '+war.status,textContent:war.status.toUpperCase()}));
      wHeader.appendChild(el('strong',{textContent:war.name}));
      wHeader.appendChild(el('span',{textContent:'Day '+war.startDay}));
      wHeader.appendChild(el('span',{textContent:'Atk: '+war.attackerIds.map(id=>state.countries[id]?.name||'???').join(', ')}));
      wHeader.appendChild(el('span',{textContent:'Def: '+war.defenderIds.map(id=>state.countries[id]?.name||'???').join(', ')}));
      wHeader.appendChild(el('span',{textContent:expandedWar===war.id?'\u25BC':'\u25B6'}));
      card.appendChild(wHeader);

      if(expandedWar===war.id){
        const detail=h('div',{className:'war-detail'});
        detail.appendChild(el('h4',{textContent:'War Scores'}));
        Object.entries(war.warScore).forEach(([cid,score])=>{
          const row=h('div',{className:'score-row'});
          row.appendChild(el('span',{textContent:state.countries[cid]?.name||'???'}));
          row.appendChild(el('span',{className:score>0?'text-success':score<0?'text-danger':'',textContent:String(score)}));
          detail.appendChild(row);
        });

        detail.appendChild(el('div',{className:'war-actions'},[
          war.status!=='active'?el('button',{className:'btn btn-xs',textContent:'SET ACTIVE',onclick:()=>{dispatch({type:'UPDATE_WAR',payload:{id:war.id,updates:{status:'active'}}});re-render();}}):null,
          war.status==='active'?el('button',{className:'btn btn-xs btn-warning',textContent:'TRUCE',onclick:()=>{dispatch({type:'UPDATE_WAR',payload:{id:war.id,updates:{status:'truce'}}});re-render();}}):null,
          war.status!=='ended'?el('button',{className:'btn btn-xs btn-danger',textContent:'END WAR',onclick:()=>{dispatch({type:'UPDATE_WAR',payload:{id:war.id,updates:{status:'ended',endDate:state.gameDate,endDay:state.gameDay}}});re-render();}}):null,
          el('button',{className:'btn btn-xs btn-danger',textContent:'DELETE',onclick:()=>{if(window.confirm('Delete war permanently?')){dispatch({type:'DELETE_WAR',payload:war.id});re-render();}}}),
        ].filter(Boolean)));
        card.appendChild(detail);
      }
      warsList.appendChild(card);
    });
    modal.appendChild(warsList);
  }
  re-render();
}

function renderAddTerritoryModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'ADD TERRITORY'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const alive=Object.values(state.countries).filter(c=>c.alive);
  const form=h('div',{className:'form-grid'});
  const countrySel=el('select',{className:'input-sm full-width'});
  countrySel.appendChild(el('option',{value:'',textContent:'Select country...'}));
  alive.forEach(c=>countrySel.appendChild(el('option',{value:c.id,textContent:getFlagEmoji(c.name)+' '+c.name})));
  const terrName=el('input',{type:'text',className:'input-sm full-width',placeholder:'Territory name...'});
  form.appendChild(el('label',{textContent:'Country'}));form.appendChild(countrySel);
  form.appendChild(el('label',{textContent:'Territory Name'}));form.appendChild(terrName);
  form.appendChild(el('label',{textContent:'Income'}));
  const incomeIn=el('input',{type:'number',className:'input-sm full-width',value:String(OCCUPIED_MONEY_INCOME)});
  form.appendChild(incomeIn);
  modal.appendChild(form);
  modal.appendChild(el('div',{className:'center-row'},[
    el('button',{className:'btn btn-success',textContent:'ADD TERRITORY',onclick:()=>{
      if(!countrySel.value||!terrName.value.trim())return;
      const income=parseInt(incomeIn.value)||OCCUPIED_MONEY_INCOME;
      const territory={id:makeId(),name:terrName.value.trim(),owner:countrySel.value,capturingCountryId:countrySel.value,capturedOnDay:state.gameDay,capturedOnDate:state.gameDate,status:'occupied',moneyIncome:income};
      dispatch({type:'ADD_TERRITORY_CAPTURE',payload:{countryId:countrySel.value,territory,historyEntry:{day:state.gameDay,date:state.gameDate,territories:[{name:terrName.value.trim(),fromCountryId:''}]}}});
      activeModal=null;renderModal();renderMain();
    }})
  ]));
}

function renderAddMoneyChangeModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'ADD MONEY CHANGE'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const alive=Object.values(state.countries).filter(c=>c.alive);
  const form=h('div',{className:'form-grid'});
  const countrySel=el('select',{className:'input-sm full-width'});
  countrySel.appendChild(el('option',{value:'',textContent:'Select country...'}));
  alive.forEach(c=>countrySel.appendChild(el('option',{value:c.id,textContent:getFlagEmoji(c.name)+' '+c.name})));
  const amountIn=el('input',{type:'number',className:'input-sm full-width',placeholder:'Amount (positive = receive, negative = send)'});
  const descIn=el('input',{type:'text',className:'input-sm full-width',placeholder:'Description...'});
  form.appendChild(el('label',{textContent:'Country'}));form.appendChild(countrySel);
  form.appendChild(el('label',{textContent:'Amount'}));form.appendChild(amountIn);
  form.appendChild(el('label',{textContent:'Description'}));form.appendChild(descIn);
  modal.appendChild(form);
  modal.appendChild(el('div',{className:'center-row'},[
    el('button',{className:'btn btn-success',textContent:'ADD CHANGE',onclick:()=>{
      if(!countrySel.value||!amountIn.value)return;
      dispatch({type:'ADD_MONEY_CHANGE',payload:{id:makeId(),day:state.gameDay,date:state.gameDate,countryId:countrySel.value,amount:parseInt(amountIn.value)||0,type:'manual',from:'',to:'',description:descIn.value.trim()||'Manual change'}});
      activeModal=null;renderModal();renderMain();
    }})
  ]));
}

function renderAddMPChangeModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'ADD MP CHANGE'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const alive=Object.values(state.countries).filter(c=>c.alive);
  const form=h('div',{className:'form-grid'});
  const countrySel=el('select',{className:'input-sm full-width'});
  countrySel.appendChild(el('option',{value:'',textContent:'Select country...'}));
  alive.forEach(c=>countrySel.appendChild(el('option',{value:c.id,textContent:getFlagEmoji(c.name)+' '+c.name})));
  const amountIn=el('input',{type:'number',className:'input-sm full-width',placeholder:'Amount (positive = gain, negative = loss)'});
  const descIn=el('input',{type:'text',className:'input-sm full-width',placeholder:'Description...'});
  form.appendChild(el('label',{textContent:'Country'}));form.appendChild(countrySel);
  form.appendChild(el('label',{textContent:'Amount'}));form.appendChild(amountIn);
  form.appendChild(el('label',{textContent:'Description'}));form.appendChild(descIn);
  modal.appendChild(form);
  modal.appendChild(el('div',{className:'center-row'},[
    el('button',{className:'btn btn-success',textContent:'ADD CHANGE',onclick:()=>{
      if(!countrySel.value||!amountIn.value)return;
      dispatch({type:'ADD_MP_CHANGE',payload:{id:makeId(),day:state.gameDay,date:state.gameDate,countryId:countrySel.value,amount:parseInt(amountIn.value)||0,type:'manual',description:descIn.value.trim()||'Manual change'}});
      activeModal=null;renderModal();renderMain();
    }})
  ]));
}

function renderMilitaryRatiosModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'MILITARY RATIOS'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const config=state.militaryConfig;
  const wrapper=h('div',{className:'ratio-table-wrapper'});
  const table=h('table',{className:'ratio-table'});
  const thead=h('thead',{});
  const hdrRow=h('tr',{});
  hdrRow.appendChild(el('th',{textContent:'Unit'}));
  [1,2,3,4,5].forEach(t=>hdrRow.appendChild(el('th',{textContent:'T'+t+' Ratio'})));
  thead.appendChild(hdrRow);
  table.appendChild(thead);
  const tbody=h('tbody',{});
  ALL_UNIT_IDS.forEach(unitId=>{
    const unit=config.unitConfigs[unitId];
    if(!unit)return;
    const tr=h('tr',{});
    tr.appendChild(el('td',{className:'unit-label',textContent:UNIT_NAMES[unitId]}));
    unit.tierRatios.forEach((ratio,tier)=>{
      const td=h('td',{});
      const input=el('input',{type:'number',className:'input-sm ratio-input',value:ratio.toFixed(2),step:'0.05'});
      input.addEventListener('change',e=>{
        dispatch({type:'UPDATE_UNIT_RATIO',payload:{unitId,tier:tier+1,ratio:parseFloat(e.target.value)||1.0}});
      });
      td.appendChild(input);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  modal.appendChild(wrapper);

  modal.appendChild(el('div',{className:'center-row'},[
    el('button',{className:'btn btn-danger',textContent:'RESET TO DEFAULTS',onclick:()=>{if(window.confirm('Reset all ratios to defaults?')){dispatch({type:'RESET_MILITARY_CONFIG'});activeModal=null;renderModal();}}})
  ]));
}

function renderMatchupTableModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'MATCHUP TABLE'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const config=state.militaryConfig;
  const wrapper=h('div',{className:'matchup-table-wrapper'});
  const table=h('table',{className:'matchup-table'});
  const thead=h('thead',{});
  const hdrRow=h('tr',{});
  hdrRow.appendChild(el('th',{textContent:'Attacker'}));
  hdrRow.appendChild(el('th',{textContent:'Defender'}));
  hdrRow.appendChild(el('th',{textContent:'Modifier'}));
  thead.appendChild(hdrRow);
  table.appendChild(thead);
  const tbody=h('tbody',{});
  config.matchups.forEach((m,i)=>{
    const tr=h('tr',{});
    tr.appendChild(el('td',{textContent:UNIT_NAMES[m.attackerUnit]||m.attackerUnit}));
    tr.appendChild(el('td',{textContent:UNIT_NAMES[m.defenderUnit]||m.defenderUnit}));
    const td=h('td',{});
    const input=el('input',{type:'number',className:'input-sm ratio-input',value:m.modifier.toFixed(2),step:'0.05'});
    input.addEventListener('change',e=>{
      dispatch({type:'UPDATE_MATCHUP',payload:{index:i,modifier:parseFloat(e.target.value)||1.0}});
    });
    td.appendChild(input);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  modal.appendChild(wrapper);
}

function renderNotebookModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'NOTEBOOK'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const lines=[];
  lines.push('DAY '+state.gameDay+' \u2014 '+state.gameDate.replace(/\d{4}$/,()=>"'" +state.gameDate.slice(-2)));
  lines.push('');
  const alive=Object.values(state.countries).filter(c=>c.alive).sort((a,b)=>a.name.localeCompare(b.name));
  alive.forEach(c=>{
    const occupiedCount=c.capturedTerritories.filter(t=>t.status==='occupied').length;
    const integratedCount=c.capturedTerritories.filter(t=>t.status==='integrated').length;
    const nameStr=c.playerName?c.name+' \u2014 '+c.playerName:c.name;
    lines.push(nameStr);
    lines.push('  Money: '+formatMoney(c.money)+' | Income: +'+formatMoney(c.dailyIncome));
    lines.push('  MP: '+formatMoney(c.mp)+' | Daily MP: +'+formatMoney(c.dailyMP));
    lines.push('  Terr: '+c.capturedTerritories.length+' | GDP: '+c.gdp+' | Res: T'+getResearchTierForGDP(c.gdp));
    lines.push('');
  });

  const output=h('div',{className:'notebook-output',textContent:lines.join('\n')});
  modal.appendChild(output);
}

function renderDailyUpdateModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'DAILY UPDATE'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const list=h('div',{className:'daily-update-list'});
  const alive=Object.values(state.countries).filter(c=>c.alive).sort((a,b)=>a.name.localeCompare(b.name));

  alive.forEach(c=>{
    const card=h('div',{className:'daily-update-card'});
    card.appendChild(el('h4',{textContent:getFlagEmoji(c.name)+' '+c.name}));
    const occupiedCount=c.capturedTerritories.filter(t=>t.status==='occupied').length;
    const integratedCount=c.capturedTerritories.filter(t=>t.status==='integrated').length;
    const terrIncome=occupiedCount*OCCUPIED_MONEY_INCOME+integratedCount*INTEGRATED_MONEY_INCOME;
    const totalIncome=c.dailyIncome+terrIncome;

    const rows=[
      'Money: '+formatMoney(c.money)+' \u2192 '+formatMoney(c.money+totalIncome)+' (+'+formatMoney(totalIncome)+')',
      'MP: '+formatMoney(c.mp)+' \u2192 '+formatMoney(c.mp+c.dailyMP)+' (+'+formatMoney(c.dailyMP)+')',
      'GDP: '+c.gdp+(c.gdp%3===0?' \u2192 '+String(c.gdp+2)+' (+2)':' (no change)'),
      'Territories: '+c.capturedTerritories.length+' ('+occupiedCount+' occ / '+integratedCount+' int)',
    ];
    rows.forEach(r=>card.appendChild(el('div',{className:'du-row',textContent:r})));
    list.appendChild(card);
  });
  modal.appendChild(list);

  modal.appendChild(el('div',{className:'center-row'},[
    el('button',{className:'btn btn-accent',textContent:'ADVANCE TO NEXT DAY',onclick:()=>{dispatch({type:'NEXT_DAY'});activeModal=null;renderModal();renderMain();}})
  ]));
}

function renderTreatyModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'TREATIES'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const alive=Object.values(state.countries).filter(c=>c.alive);
  const form=h('div',{className:'treaty-form'});
  const nameIn=el('input',{type:'text',className:'input-sm full-width',placeholder:'Treaty name...'});
  const countrySel=el('select',{className:'input-sm full-width'});
  countrySel.appendChild(el('option',{value:'',textContent:'Select territory owner...'}));
  alive.forEach(c=>countrySel.appendChild(el('option',{value:c.id,textContent:getFlagEmoji(c.name)+' '+c.name})));
  const terrIn=el('input',{type:'text',className:'input-sm full-width',placeholder:'Territory name...'});

  form.appendChild(el('label',{textContent:'Treaty Name'}));form.appendChild(nameIn);
  form.appendChild(el('label',{textContent:'Territory Owner'}));form.appendChild(countrySel);
  form.appendChild(el('label',{textContent:'Territory'}));form.appendChild(terrIn);
  form.appendChild(el('button',{className:'btn btn-success',textContent:'CREATE TREATY',onclick:()=>{
    if(!nameIn.value.trim()||!countrySel.value||!terrIn.value.trim())return;
    dispatch({type:'ADD_TREATY',payload:{id:makeId(),name:nameIn.value.trim(),countryIds:[countrySel.value],territoryId:'',territoryOwnerId:countrySel.value,splits:[{countryId:countrySel.value,percent:100}],day:state.gameDay,date:state.gameDate,notes:''}});
    activeModal=null;renderModal();
  }}));
  modal.appendChild(form);

  const treaties=Object.values(state.treaties);
  if(treaties.length>0){
    const list=h('div',{className:'treaty-list'});
    treaties.forEach(t=>{
      const item=h('div',{className:'treaty-item'});
      item.appendChild(el('span',{textContent:t.name}));
      item.appendChild(el('span',{textContent:'Owner: '+(state.countries[t.territoryOwnerId]?.name||'???')}));
      item.appendChild(el('button',{className:'btn btn-xs btn-danger',textContent:'DELETE',onclick:()=>{dispatch({type:'DELETE_TREATY',payload:t.id});activeModal=null;renderModal();}}));
      list.appendChild(item);
    });
    modal.appendChild(list);
  }
}

function renderEditInventoryModal(modal){
  const header=h('div',{className:'modal-header'});
  header.appendChild(el('h2',{textContent:'EDIT UNIT INVENTORY'}));
  header.appendChild(el('button',{className:'btn btn-sm btn-ghost',textContent:'X',onclick:()=>{activeModal=null;renderModal();}}));
  modal.appendChild(header);

  const country=state.countries[selectedCountryId];
  if(!country){modal.appendChild(el('div',{className:'empty-state',textContent:'No country selected.'}));return;}

  const inventory=country.unitInventory||{};
  const edits={};
  ALL_UNIT_IDS.forEach(id=>{const s=inventory[id]||{mp:0,tier:1};edits[id]={mp:s.mp,tier:s.tier};});

  const editDiv=h('div',{className:'inventory-edit'});
  ALL_UNIT_IDS.forEach(unitId=>{
    const row=h('div',{className:'inv-edit-row'});
    row.appendChild(el('span',{className:'unit-label',textContent:UNIT_NAMES[unitId]}));
    const tierSel=el('select',{className:'input-sm tier-select'});
    [1,2,3,4,5].forEach(t=>tierSel.appendChild(el('option',{value:String(t),textContent:'T'+t})));
    tierSel.value=String(edits[unitId].tier);
    tierSel.addEventListener('change',e=>{edits[unitId].tier=parseInt(e.target.value);updateInfo();});
    row.appendChild(tierSel);
    const mpIn=el('input',{type:'number',className:'input-sm mp-input',placeholder:'MP',value:String(edits[unitId].mp)});
    mpIn.addEventListener('change',e=>{edits[unitId].mp=parseInt(e.target.value)||0;updateInfo();});
    row.appendChild(mpIn);
    const info=el('span',{className:'text-muted'});
    row.appendChild(info);
    editDiv.appendChild(row);

    function updateInfo(){
      const ratio=getUnitRatio(state.militaryConfig,unitId,edits[unitId].tier);
      const ep=Math.round(edits[unitId].mp*ratio);
      info.textContent='Ratio: '+ratio.toFixed(2)+' | EP: '+ep;
    }
    updateInfo();
  });

  modal.appendChild(editDiv);
  modal.appendChild(el('div',{className:'center-row'},[
    el('button',{className:'btn btn-sm btn-success',textContent:'SAVE',onclick:()=>{
      Object.entries(edits).forEach(([unitType,vals])=>{
        dispatch({type:'UPDATE_UNIT_INVENTORY',payload:{countryId:country.id,unitType,mp:vals.mp,tier:vals.tier}});
      });
      activeModal=null;renderModal();renderMain();
    }}),
    el('button',{className:'btn btn-sm btn-ghost',textContent:'CANCEL',onclick:()=>{activeModal=null;renderModal();}}),
  ]));
}

// ==================== INIT ====================

state=getInitialState();
renderAll();

})();
