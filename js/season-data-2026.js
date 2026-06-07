/**
 * season-data-2026.js
 * Shared data module for the 2025/26 racing season.
 * Loaded by index.html, season-2026.html.
 * All picks, results and scoring logic in one place.
 */

// ── Utility ────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Scoring ────────────────────────────────────────────────────────────────
function scorePick(horse, results, raceKey) {
  if (!horse) return { pts:0, code:'skip' };
  const res = results[raceKey];
  if (!res || res.winner === null) return { pts:0, code:'pending' };
  const h = horse.toLowerCase().trim();
  const w = (res.winner  || '').toLowerCase().trim();
  const s = (res.second  || '').toLowerCase().trim();
  const t = (res.third   || '').toLowerCase().trim();
  if (h === w)           return { pts:3, code:'win' };
  if (h === s || h === t) return { pts:1, code:'place' };
  return { pts:0, code:'miss' };
}

function scoreEvent(tipsterPicks, results) {
  let wins=0, places=0, misses=0, pts=0;
  Object.keys(results).forEach(k => {
    const horse = tipsterPicks[k];
    if (!horse) return;
    const r = scorePick(horse, results, k);
    if (r.code === 'win')   { wins++;   pts += 3; }
    else if (r.code === 'place') { places++; pts += 1; }
    else if (r.code === 'miss')  { misses++; }
  });
  const total = wins + places + misses;
  const strikeRate = total > 0 ? Math.round(wins / total * 100) : 0;
  const ptsPerPick = total > 0 ? (pts / total).toFixed(2) : '0.00';
  return { wins, places, misses, pts, total, strikeRate, ptsPerPick };
}

// ════════════════════════════════════════════════════════════════════════════
// FESTIVAL REGISTRY
// ════════════════════════════════════════════════════════════════════════════
const FESTIVALS_2026 = [
  {
    slug:'cheltenham-2026', name:'Cheltenham Festival 2026', shortName:'Cheltenham',
    icon:'🏆', dates:['2026-03-10','2026-03-11','2026-03-12','2026-03-13'],
    dateLabel:'10–13 Mar 2026', venue:'Cheltenham', type:'NH',
    theme:'theme-green', accentColor:'#2d7a4f', url:'cheltenham-2026.html',
    races:28, headline:'Gaelic Warrior wins the Gold Cup', headlineRace:'Gold Cup',
  },
  {
    slug:'grand-national-2026', name:'Randox Grand National Festival 2026', shortName:'Grand National',
    icon:'🏇', dates:['2026-04-09','2026-04-10','2026-04-11'],
    dateLabel:'9–11 Apr 2026', venue:'Aintree', type:'NH',
    theme:'theme-red', accentColor:'#c0392b', url:'grand-national-2026.html',
    races:21, headline:'Mirabad wins the Grand National', headlineRace:'Grand National',
  },
  {
    slug:'scottish-grand-national-2026', name:'Scottish Grand National 2026', shortName:'Scottish GN',
    icon:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', dates:['2026-04-17','2026-04-18'],
    dateLabel:'17–18 Apr 2026', venue:'Ayr', type:'NH',
    theme:'theme-indigo', accentColor:'#4338ca', url:'scottish-grand-national-2026.html',
    races:14, headline:'Kap Vert (20/1) wins the Scottish Grand National', headlineRace:'Scottish Grand National',
  },
  {
    slug:'guineas-2026', name:'Qipco Guineas Festival 2026', shortName:'Guineas',
    icon:'🌿', dates:['2026-05-01','2026-05-02','2026-05-03'],
    dateLabel:'1–3 May 2026', venue:'Newmarket', type:'Flat',
    theme:'theme-blue', accentColor:'#1d4ed8', url:'guineas-2026.html',
    races:21, headline:null, headlineRace:'2000 Guineas',
  },
  {
    slug:'chester-2026', name:'Boodles Chester May Festival 2026', shortName:'Chester',
    icon:'🟡', dates:['2026-05-06','2026-05-07','2026-05-08'],
    dateLabel:'6–8 May 2026', venue:'Chester (Roodee)', type:'Flat',
    theme:'theme-amber', accentColor:'#d97706', url:'chester-2026.html',
    races:22, headline:'A Piece Of Heaven (7/1) wins the Chester Cup · Engine ROI +47% (£41.59 net on £88.50)', headlineRace:'Chester Cup',
  },
  {
    slug:'dante-2026', name:'Dante Festival 2026', shortName:'Dante',
    icon:'🐎', dates:['2026-05-13','2026-05-14','2026-05-15'],
    dateLabel:'13–15 May 2026', venue:'York (Knavesmire)', type:'Flat',
    theme:'theme-violet', accentColor:'#7c3aed', url:'dante-2026.html',
    races:21, concluded:true,
    headline:'14 winners over 3 days · 3 of 5 three-source crossover signals landed (Klassleader 15/8, Legacy Link 6/4, Portcullis EvensF) · Christmas Day 4x quad placed 3rd in the Dante · Engine ROI −36.3% (−£34.99 on £96.50)',
    headlineRace:'Dante Stakes (G2) · Thu 14 May',
  },
  {
    slug:'epsom-derby-2026', name:'Epsom Derby Festival 2026', shortName:'Epsom Derby',
    icon:'👑', dates:['2026-06-05','2026-06-06'],
    dateLabel:'5–6 June 2026', venue:'Epsom Downs', type:'Flat',
    theme:'theme-blue', accentColor:'#1d4ed8', url:'epsom-derby-2026.html',
    races:16, concluded:true,
    headline:'Christmas Day (7/1) wins the Derby · Thundering On the Oaks · Sparks Fly (NAP · 4x crossover · L15 anchor) WON · 4 winners, Benvenuto Cellini a Derby non-runner · Engine ROI −38% (−£24.10 on £63)',
    headlineRace:'Betfred Derby (G1) · won by Christmas Day · Sat 6 Jun',
  },
  {
    slug:'royal-ascot-2026', name:'Royal Ascot 2026', shortName:'Royal Ascot',
    icon:'🎩', dates:['2026-06-16','2026-06-17','2026-06-18','2026-06-19','2026-06-20'],
    dateLabel:'16–20 June 2026', venue:'Ascot', type:'Flat',
    theme:'theme-violet', accentColor:'#7c3aed', url:'royal-ascot-2026.html',
    races:35, headline:null,
    headlineRace:'Gold Cup (G1) Thu 18 Jun · Prince of Wales’s Stakes (G1) Wed · Queen Anne (G1) Tue · Diamond Jubilee (G1) Sat',
  },
  {
    // PLACEHOLDER — fill in dates / dateLabel / races / headlineRace once the
    // Ffos Las fixture is confirmed. Empty `dates` keeps it off the live banner.
    slug:'ffos-las-2026', name:'Ffos Las Jump Festival 2026', shortName:'Ffos Las',
    icon:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', dates:[],
    dateLabel:'Dates TBC', venue:'Ffos Las (Carmarthenshire)', type:'NH',
    theme:'theme-emerald', accentColor:'#15803d', url:'ffos-las-2026.html',
    races:null, headline:null, headlineRace:'TBC',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// CHELTENHAM 2026 DATA
// ════════════════════════════════════════════════════════════════════════════
const CHELT_RESULTS = {
  '13:20-0':{ winner:'Old Park Star',      second:'Sober Glory',          third:'Mydaddypaddy' },
  '14:00-0':{ winner:'Kargese',            second:'Kopek Des Bordes',     third:'Lulamba' },
  '14:40-0':{ winner:'Saratoga',           second:'Winston Junior',       third:'Klycot' },
  '15:20-0':{ winner:'Johnnywho',          second:'Jagwar',               third:'Quebecois' },
  '16:00-0':{ winner:'Lossiemouth',        second:'Brighterdaysahead',    third:'The New Lion' },
  '16:40-0':{ winner:'Madara',             second:'Will The Wise',        third:"Moon D'Orange" },
  '17:20-0':{ winner:'Holloway Queen',     second:'King Of Answers',      third:'One Big Bang' },
  '13:20-1':{ winner:'King Rasko Grey',    second:'Act Of Innocence',     third:'Zeus Power' },
  '14:00-1':{ winner:'Kitzbuhel',          second:'Final Demand',         third:'Salver' },
  '14:40-1':{ winner:'Jingko Blue',        second:'Franciscan Rock',      third:'Storm Heart' },
  '15:20-1':{ winner:'Final Orders',       second:'Favori De Champdou',   third:'Vanillier' },
  '16:00-1':{ winner:'Il Etait Temps',     second:'Libberty Hunter',      third:"L'Eau Du Sud" },
  '16:40-1':{ winner:'Martator',           second:'Jazzy Matty',          third:'Break My Soul' },
  '17:20-1':{ winner:'The Mourne Rambler', second:'Mets Ta Ceinture',     third:'Bass Hunter' },
  '13:20-2':{ winner:'White Noise',        second:'Old School Outlaw',    third:'Place De La Nation' },
  '14:00-2':{ winner:'Meetmebythesea',     second:'Gold Dancer',          third:"Regent's Stroll" },
  '14:40-2':{ winner:'Wodhooh',            second:'Jade De Grugy',        third:null },
  '15:20-2':{ winner:'Home By The Lee',    second:'Ballyburn',            third:'Bob Olinger' },
  '16:00-2':{ winner:'Heart Wood',         second:'Jonbon',               third:null },
  '16:40-2':{ winner:'Supremely West',     second:'Lavida Adiva',         third:'Ikarak' },
  '17:20-2':{ winner:'Ask Brewster',       second:'Road To Home',         third:'Monbeg Genius' },
  '13:20-3':{ winner:'Apolon De Charnie',  second:'Maestro Conti',        third:'Minella Study' },
  '14:00-3':{ winner:'Wilful',             second:'Sticktotheplan',       third:'Joyeuse' },
  '14:40-3':{ winner:'Dinoblue',           second:'Only By Night',        third:'Panic Attack' },
  '15:20-3':{ winner:"Johnny's Jury",      second:'Fruit De Mer',         third:'The Passing Wife' },
  '16:00-3':{ winner:'Gaelic Warrior',     second:'Jango Baie',           third:'Inothewayurthinkin' },
  '16:40-3':{ winner:'Barton Snow',        second:'Its On The Line',      third:'Music Drive' },
  '17:20-3':{ winner:'Air Of Entitlement', second:'Hot Fuss',             third:'Jump Allen' },
};

const CHELT_PICKS = {
  'Our NAP':{ label:'Our NAP', color:'#34d399', icon:'⭐', picks:{
    '13:20-0':'Talk The Talk',       '14:00-0':'Lulamba',
    '14:40-0':'Kripticjim',          '15:20-0':'Handstands',
    '16:00-0':'The New Lion',        '16:40-0':'Madara',
    '17:20-0':'Grande Geste',        '13:20-1':'No Drama This End',
    '14:00-1':'Final Demand',        '14:40-1':'Iberico Lord',
    '15:20-1':'Favori De Champdou',  '16:00-1':'Majborough',
    '16:40-1':'Thistle Ask',         '17:20-1':'Keep Him Company',
    '13:20-2':'Bambino Fever',       '14:00-2':"Regent's Stroll",
    '14:40-2':'Lossiemouth',         '15:20-2':'Teahupoo',
    '16:00-2':'Fact To File',        '16:40-2':'Sire Du Berlais',
    '17:20-2':'Jeriko Du Reponet',   '13:20-3':'Selma De Vary',
    '14:00-3':'Anzadam',             '14:40-3':'Dinoblue',
    '15:20-3':'Doctor Steinberg',    '16:00-3':'Jango Baie',
    '16:40-3':'Bob And Co',          '17:20-3':'Son Of Anarchy',
  }},
  'Our NB':{ label:'Our NB', color:'#60a5fa', icon:'🔵', picks:{
    '13:20-0':'Old Park Star',       '14:00-0':'Kopek Des Bordes',
    '14:40-0':'Winston Junior',      '15:20-0':'Jagwar',
    '16:00-0':'Brighterdaysahead',   '16:40-0':'Captain Guinness',
    '17:20-0':'Backmersackme',       '13:20-1':'Mighty Park',
    '14:00-1':'Wendigo',             '14:40-1':'Skylight Hustle',
    '15:20-1':'Any Second Now',      '16:00-1':"L'Eau Du Sud",
    '16:40-1':'Be Aware',            '17:20-1':'Old School Outlaw',
    '13:20-2':'Old School Outlaw',   '14:00-2':'Backmersackme',
    '14:40-2':'Wodhooh',             '15:20-2':'Ma Shantou',
    '16:00-2':'Gaelic Warrior',      '16:40-2':'Ma Shantou',
    '17:20-2':"Paddy's Poem",        '13:20-3':'Mon Creuset',
    '14:00-3':'Good Land',           '14:40-3':'Panic Attack',
    '15:20-3':'Espresso Milan',      '16:00-3':'Gaelic Warrior',
    '16:40-3':'Its On The Line',     '17:20-3':"Paddy's Poem",
  }},
  'Playle (RP)':{ label:'Playle (RP)', color:'#f472b6', icon:'📰', picks:{
    '13:20-0':'Old Park Star','14:00-0':'Lulamba','14:40-0':'Winston Junior','15:20-0':'Myretown',
    '16:00-0':'Lossiemouth','16:40-0':'Madara','17:20-0':'Newton Tornado','13:20-1':'Skylight Hustle',
    '14:00-1':'Wendigo','14:40-1':'Indeevar Bleu','15:20-1':'Stumptown','16:00-1':"L'Eau Du Sud",
    '16:40-1':"Ryan's Rocket",'17:20-1':'Bambino Fever',
    '13:20-2':null,'14:00-2':null,'14:40-2':null,'15:20-2':null,'16:00-2':null,'16:40-2':null,'17:20-2':null,
    '13:20-3':null,'14:00-3':null,'14:40-3':null,'15:20-3':null,'16:00-3':null,'16:40-3':null,'17:20-3':null,
  }},
  'Kealy (RP)':{ label:'Kealy (RP)', color:'#f472b6', icon:'📰', picks:{
    '13:20-0':"Leader D'Allier",'14:00-0':'Lulamba','14:40-0':'Winston Junior','15:20-0':'Jagwar',
    '16:00-0':'Golden Ace','16:40-0':'Donnacha','17:20-0':'Brave Fortune','13:20-1':'Mighty Park',
    '14:00-1':'Wendigo','14:40-1':'Jingko Blue','15:20-1':'Favori De Champdou','16:00-1':'Majborough',
    '16:40-1':'Golden Joy','17:20-1':'Bambino Fever',
    '13:20-2':null,'14:00-2':null,'14:40-2':null,'15:20-2':null,'16:00-2':null,'16:40-2':null,'17:20-2':null,
    '13:20-3':null,'14:00-3':null,'14:40-3':null,'15:20-3':null,'16:00-3':null,'16:40-3':null,'17:20-3':null,
  }},
  'Dineen (RP)':{ label:'Dineen (RP)', color:'#f472b6', icon:'📰', picks:{
    '13:20-0':"Leader D'Allier",'14:00-0':'Lulamba','14:40-0':'Secret Force','15:20-0':'Jagwar',
    '16:00-0':'The New Lion','16:40-0':'McLaurey','17:20-0':'One Big Bang','13:20-1':'Mighty Park',
    '14:00-1':'Wendigo','14:40-1':'Jump Allen','15:20-1':'Favori De Champdou','16:00-1':'Majborough',
    '16:40-1':'Inthepocket','17:20-1':'Carrigmoornaspruce',
    '13:20-2':null,'14:00-2':null,'14:40-2':null,'15:20-2':null,'16:00-2':null,'16:40-2':null,'17:20-2':null,
    '13:20-3':null,'14:00-3':null,'14:40-3':null,'15:20-3':null,'16:00-3':null,'16:40-3':null,'17:20-3':null,
  }},
  'Wilson (RP)':{ label:'Wilson (RP)', color:'#f472b6', icon:'📰', picks:{
    '13:20-0':'Sober Glory','14:00-0':'Lulamba','14:40-0':'Ammes','15:20-0':"In D'Or",
    '16:00-0':'Anzadam','16:40-0':'Madara','17:20-0':'Backmersackme','13:20-1':'Mighty Park',
    '14:00-1':'Wendigo','14:40-1':'Indeevar Bleu','15:20-1':'Favori De Champdou','16:00-1':'Majborough',
    '16:40-1':'Be Aware','17:20-1':'Keep Him Company',
    '13:20-2':null,'14:00-2':null,'14:40-2':null,'15:20-2':null,'16:00-2':null,'16:40-2':null,'17:20-2':null,
    '13:20-3':null,'14:00-3':null,'14:40-3':null,'15:20-3':null,'16:00-3':null,'16:40-3':null,'17:20-3':null,
  }},
  'Segal (RP)':{ label:'Segal (RP)', color:'#c084fc', icon:'📰', picks:{
    '13:20-0':'Idaho Sun','14:00-0':'Kargese','14:40-0':'La Luna Artista','15:20-0':null,
    '16:00-0':'Golden Ace','16:40-0':null,'17:20-0':null,'13:20-1':'Shuttle Diplomacy',
    '14:00-1':'Sixmilebridge','14:40-1':'Storm Heart','15:20-1':null,'16:00-1':"L'Eau Du Sud",
    '16:40-1':'Ballysax Hank','17:20-1':'The Mourne Rambler',
    '13:20-2':null,'14:00-2':null,'14:40-2':null,'15:20-2':null,'16:00-2':null,'16:40-2':null,'17:20-2':null,
    '13:20-3':null,'14:00-3':null,'14:40-3':null,'15:20-3':null,'16:00-3':null,'16:40-3':null,'17:20-3':null,
  }},
  'Park (RP)':{ label:'Tom Park (RP)', color:'#6ee7b7', icon:'📰', picks:{
    '13:20-0':'Old Park Star','14:00-0':'Kopek Des Bordes',
    '14:40-0':null,'15:20-0':null,'16:00-0':null,'16:40-0':null,'17:20-0':null,
    '13:20-1':null,'14:00-1':null,'14:40-1':null,'15:20-1':null,'16:00-1':null,'16:40-1':null,'17:20-1':null,
    '13:20-2':null,'14:00-2':null,'14:40-2':null,'15:20-2':null,'16:00-2':null,'16:40-2':null,'17:20-2':null,
    '13:20-3':null,'14:00-3':null,'14:40-3':null,'15:20-3':null,'16:00-3':null,'16:40-3':null,'17:20-3':null,
  }},
  'Grimshaw (HRN)':{ label:'Grimshaw (HRN)', color:'#67e8f9', icon:'📺', picks:{
    '13:20-0':'Old Park Star','14:00-0':'Kopek Des Bordes','14:40-0':'Manlaga','15:20-0':'Handstands',
    '16:00-0':'Poniros','16:40-0':'Madara','17:20-0':'Wade Out','13:20-1':'Talk The Talk',
    '14:00-1':'Kitzbuhel','14:40-1':'Storm Heart','15:20-1':'Desertmore House','16:00-1':'Majborough',
    '16:40-1':null,'17:20-1':'Quiryn',
    '13:20-2':null,'14:00-2':null,'14:40-2':null,'15:20-2':null,'16:00-2':null,'16:40-2':null,'17:20-2':null,
    '13:20-3':null,'14:00-3':null,'14:40-3':null,'15:20-3':null,'16:00-3':null,'16:40-3':null,'17:20-3':null,
  }},
  'Mullington (WH)':{ label:'Mullington (WH)', color:'#fbbf24', icon:'📝', picks:{
    '13:20-0':'Mydaddypaddy','14:00-0':'Kawaboomga','14:40-0':'One Horse Town','15:20-0':'Resplendent Grey',
    '16:00-0':'The New Lion','16:40-0':'Jagwar','17:20-0':'Deep Cave','13:20-1':'Doctor Du Mesnil',
    '14:00-1':'Sixmilebridge','14:40-1':'East India Express','15:20-1':'Stumptown','16:00-1':'Marine Nationale',
    '16:40-1':'Unexpected Party','17:20-1':'Bentraghhill','13:20-2':'Wodhooh','14:00-2':'No Drama This End',
    '14:40-2':'Il Etait Temps','15:20-2':'The Yellow Clay','16:00-2':'Electric Mason','16:40-2':'Bambino Fever',
    '17:20-2':'Koktail Divin','13:20-3':'Proactif','14:00-3':'Anzadam','14:40-3':'July Flower',
    '15:20-3':'No Drama This End','16:00-3':'Fact To File','16:40-3':'Good Boy Bobby','17:20-3':'Son Of Anarchy',
  }},
};

// ════════════════════════════════════════════════════════════════════════════
// GRAND NATIONAL 2026 DATA
// ════════════════════════════════════════════════════════════════════════════
const GN_RESULTS = {
  '13:45-0':{ winner:'Mange Tout',         second:'Selma De Vary',     third:'Indian River' },
  '14:20-0':{ winner:'Koktail Divin',      second:"Blueking d'Oroux",  third:'Mambonumberfive' },
  '14:55-0':{ winner:'Jango Baie',         second:'Protektorat',       third:"Pic d'Orhy" },
  '15:30-0':{ winner:'Barton Snow',        second:'Lets Go Champ',     third:'Take All' },
  '16:05-0':{ winner:'Brighterdaysahead',  second:'The New Lion',      third:'Alexei' },
  '16:40-0':{ winner:"Ryan's Rocket",      second:'Highlands Legacy',  third:'Sans Bruit' },
  '17:15-0':{ winner:"Nan's Choice",       second:'Lennon Grove',      third:'Fairy Park' },
  '13:45-1':{ winner:'Wellington Arch',    second:'Ike Sport',         third:'Favour And Fortune' },
  '14:20-1':{ winner:'Gold Dancer',        second:"Regent's Stroll",   third:'Salver' },
  '14:55-1':{ winner:'Storming George',    second:'Sinnatra',          third:'Baron Noir' },
  '15:30-1':{ winner:'Grey Dawning',       second:'Solness',           third:'Heart Wood' },
  '16:05-1':{ winner:'Will The Wise',      second:'Ile Atlantique',    third:'Madara' },
  '16:40-1':{ winner:'Zeus Power',         second:'Catchintsavo',      third:"Johnny's Jury" },
  '17:15-1':{ winner:'Laafi',              second:'Melon',             third:'Harry Lowes' },
  '13:20-2':{ winner:'Wade Out',           second:'Eagle Fang',        third:'Chart Topper' },
  '13:55-2':{ winner:'Bossman Jack',       second:'Soldier Reeves',    third:'Ballyfad' },
  '14:30-2':{ winner:'Mr Hope Street',     second:'Lookaway',          third:'Konfusion' },
  '15:05-2':{ winner:'Home By The Lee',    second:'Take No Chances',   third:'Honesty Policy' },
  '16:00-2':{ winner:'I Am Maximus',       second:'Iroko',             third:'Jordans' },
  '17:00-2':{ winner:'Mirabad',            second:'Salvator Mundi',    third:'Be Aware' },
  '17:35-2':{ winner:'Forthfactor',        second:'Look Me',           third:'Merlin Allen' },
};

const GN_PICKS = {
  'Our NAP':{ label:'Our NAP', color:'#34d399', icon:'⭐', picks:{
    '13:45-0':'Apolon De Charnie','14:20-0':'Lulamba','14:55-0':'Jango Baie','15:30-0':'Barton Snow',
    '16:05-0':'Brighterdaysahead','16:40-0':'Sans Bruit','17:15-0':'White Noise',
    '13:45-1':'Handstands','14:20-1':'Jingko Blue','14:55-1':'Old Park Star','15:30-1':'Jonbon',
    '16:05-1':'Madara','16:40-1':"Johnny's Jury",'17:15-1':'Air of Entitlement',
    '13:20-2':'Supremely West','13:55-2':'King Rasko Grey','14:30-2':'Ask Brewster',
    '15:05-2':'Wodhooh','16:00-2':'I Am Maximus','17:00-2':'Kargese','17:35-2':'The Mourne Rambler',
  }},
  'Our NB':{ label:'Our NB', color:'#60a5fa', icon:'🔵', picks:{
    '13:45-0':'Mange Tout','14:20-0':'Koktail Divin','14:55-0':'Gaelic Warrior','15:30-0':'Music Drive',
    '16:05-0':'The New Lion','16:40-0':'Highlands Legacy','17:15-0':"Ti'mamzel",
    '13:45-1':'Kitzbuhel','14:20-1':'Stay Away Fay','14:55-1':'Kopek Des Bordes','15:30-1':'El Fabiolo',
    '16:05-1':'Will The Wise','16:40-1':'No Drama This End','17:15-1':'Lively Citizen',
    '13:20-2':'Jingko Blue','13:55-2':'Mystical Power','14:30-2':'Holloway Queen',
    '15:05-2':'Home By The Lee','16:00-2':'Grangeclare West','17:00-2':'Ballyburn','17:35-2':'Absolute Notions',
  }},
  'WH Racecard':{ label:'WH Racecard', color:'#a78bfa', icon:'💜', picks:{
    '13:45-0':'Selma De Vary','14:20-0':'Koktail Divin','14:55-0':'Jango Baie','15:30-0':'A Moments Madness',
    '16:05-0':'Brighterdaysahead','16:40-0':'Sans Bruit','17:15-0':"Nan's Choice",
    '13:45-1':'Indeevar Bleu','14:20-1':'Salver','14:55-1':'Sober Glory','15:30-1':'Solness',
    '16:05-1':'Boombawn','16:40-1':"Mondoui'boy",'17:15-1':'Pourquoi Pas Papa',
    '13:20-2':'Hold The Serve','13:55-2':'Fingle Bridge','14:30-2':'Glengouly',
    '15:05-2':'Honesty Policy','16:00-2':'Captain Cody','17:00-2':'Kalif Du Berlais','17:35-2':'Mossy Fen Road',
  }},
  'Mullington':{ label:'Mullington (WH)', color:'#fbbf24', icon:'📝', picks:{
    '13:45-0':'Minella Study','14:20-0':'Lulamba','14:55-0':'Jango Baie','15:30-0':'Gaboriot',
    '16:05-0':'El Fabiolo','16:40-0':'Javert Allen','17:15-0':'Martini Majesty',
    '13:45-1':'Favour And Fortune','14:20-1':'Miami Magic','14:55-1':'Starting Fifteen','15:30-1':'JPR One',
    '16:05-1':'Madara','16:40-1':"Johnny's Jury",'17:15-1':'Wreckless Eric',
    '13:20-2':'Harbour Lake','13:55-2':'Montemares','14:30-2':'Deep Cave',
    '15:05-2':'Lavida Adiva','16:00-2':'Captain Cody','17:00-2':'Kala Conti','17:35-2':'Merry Away',
  }},
  'WH Experts':{ label:'WH Experts', color:'#a3e635', icon:'🏆', picks:{
    '13:45-0':'Winston Junior','14:20-0':'Koktail Divin','14:55-0':"Spillane's Tower",'15:30-0':'Barton Snow',
    '16:05-0':'The New Lion','16:40-0':'Inthepocket','17:15-0':'Princess Day',
    '13:45-1':'Jazzy Matty','14:20-1':'Salver','14:55-1':'Sober Glory','15:30-1':'Solness',
    '16:05-1':'Will The Wise','16:40-1':"Mondou'boy",'17:15-1':'Harry Lowes',
    '13:20-2':'Supremely West','13:55-2':'Bossman Jack','14:30-2':'Brave Fortune',
    '15:05-2':'Honesty Policy','16:00-2':'I Am Maximus','17:00-2':'Salvator Mundi','17:35-2':'Bass Hunter',
  }},
  'Geraghty':{ label:'Barry Geraghty', color:'#fb7185', icon:'🎤', picks:{
    '13:45-0':'Mange Tout','14:20-0':'Lulamba','14:55-0':"Spillane's Tower",'15:30-0':'Barton Snow',
    '16:05-0':'Brighterdaysahead','16:40-0':'Inthepocket','17:15-0':'Princess Day',
    '13:45-1':'Trustintimes','14:20-1':'Gold Dancer','14:55-1':'Sober Glory','15:30-1':'Solness',
    '16:05-1':'Will The Wise','16:40-1':'Zeus Power','17:15-1':'Harry Lowes',
    '13:20-2':'Supremely West','13:55-2':'Bossman Jack','14:30-2':'Brave Fortune',
    '15:05-2':'Hiddenvalley Lake','16:00-2':'I Am Maximus','17:00-2':'Salvator Mundi','17:35-2':'Bass Hunter',
  }},
  'Nick Luck':{ label:'Nick Luck', color:'#38bdf8', icon:'🎙️', picks:{
    '13:45-0':'Winston Junior','14:20-0':'Koktail Divin','14:55-0':"Pic d'Orhy",'15:30-0':'Barton Snow',
    '16:05-0':'Alexei','16:40-0':'Jasko Des Dames','17:15-0':'Burds Of A Feather',
    '13:45-1':'Jazzy Matty','14:20-1':'Salver','14:55-1':'Baron Noir','15:30-1':'Gidleigh Park',
    '16:05-1':'Madara','16:40-1':"Mondou'boy",'17:15-1':'Harry Lowes',
    '13:20-2':null,'13:55-2':null,'14:30-2':null,'15:05-2':null,
    '16:00-2':null,'17:00-2':null,'17:35-2':null,
  }},
  'J. Mangan':{ label:'Jane Mangan', color:'#f9a8d4', icon:'🎤', picks:{
    '13:45-0':'Minella Study','14:20-0':null,'14:55-0':"Spillane's Tower",'15:30-0':"It's On The Line",
    '16:05-0':'The New Lion','16:40-0':null,'17:15-0':'Princess Day',
    '13:45-1':null,'14:20-1':"Regent's Stroll",'14:55-1':'Sober Glory','15:30-1':'Heart Wood',
    '16:05-1':'Gentleman De Mee','16:40-1':'Dalston Lad','17:15-1':'Pourquoi Pas Papa',
    '13:20-2':'Supremely West','13:55-2':'Masked Man','14:30-2':'Chance Another One',
    '15:05-2':'Honesty Policy','16:00-2':"Monty's Star",'17:00-2':null,'17:35-2':null,
  }},
  'Boom City':{ label:'Boom City', color:'#f59e0b', icon:'🐝', picks:{
    '13:45-0':'Minella Study','14:20-0':'Lulamba','14:55-0':'Jango Baie','15:30-0':'Unexpected Party',
    '16:05-0':'Brighterdaysahead','16:40-0':'Stencil','17:15-0':'Princess Day',
    '13:45-1':'Joyeuse','14:20-1':"Regent's Stroll",'14:55-1':null,'15:30-1':'Heart Wood',
    '16:05-1':'Madara','16:40-1':'No Drama This End','17:15-1':'Harry Lowes',
    '13:20-2':null,'13:55-2':null,'14:30-2':null,'15:05-2':null,
    '16:00-2':'Grangeclare West','17:00-2':null,'17:35-2':null,
  }},
  'Frick':{ label:"Frick's Tips", color:'#e879f9', icon:'🦆', picks:{
    '13:45-0':null,'14:20-0':null,'14:55-0':null,'15:30-0':null,
    '16:05-0':null,'16:40-0':null,'17:15-0':null,
    '13:45-1':'Top Jimmy','14:20-1':'Salver','14:55-1':'Sober Glory','15:30-1':'Heart Wood',
    '16:05-1':'Lisnamult Lad','16:40-1':null,'17:15-1':'Star Of Guiting',
    '13:20-2':'Quantum Quest','13:55-2':'Scorpio Rising','14:30-2':'Cruz Control',
    '15:05-2':'Impose Toi','16:00-2':'I Am Maximus','17:00-2':'Salvator Mundi','17:35-2':null,
  }},
  'RoadCheltenham':{ label:'RoadCheltenham', color:'#f97316', icon:'🏇', picks:{
    '13:45-0':'Winston Junior','14:20-0':'Koktail Divin','14:55-0':null,'15:30-0':'Unexpected Party',
    '16:05-0':null,'16:40-0':null,'17:15-0':null,
    '13:45-1':'Hot Fuss','14:20-1':null,'14:55-1':null,'15:30-1':'Heart Wood',
    '16:05-1':'Gentleman De Mee','16:40-1':null,'17:15-1':null,
    '13:20-2':null,'13:55-2':null,'14:30-2':null,'15:05-2':null,
    '16:00-2':'Jagwar','17:00-2':'Salvator Mundi','17:35-2':'Look Me',
  }},
  'Raceolly':{ label:'Raceolly', color:'#34d399', icon:'📱', picks:{
    '13:45-0':'Wolf Rayet','14:20-0':null,'14:55-0':null,'15:30-0':'Willewonga',
    '16:05-0':'Golden Ace','16:40-0':'Palamon','17:15-0':'Kiltybo',
    '13:45-1':'Ballykinlar','14:20-1':null,'14:55-1':null,'15:30-1':null,
    '16:05-1':'Boombawn','16:40-1':'Shadow Paddy','17:15-1':'Last Kingdom',
    '13:20-2':'Eagle Fang','13:55-2':null,'14:30-2':'Josh The Boss','15:05-2':null,
    '16:00-2':'Imperial Saint','17:00-2':null,'17:35-2':'Moments Away',
  }},
};

// ════════════════════════════════════════════════════════════════════════════
// SCOTTISH GRAND NATIONAL 2026 DATA
// ════════════════════════════════════════════════════════════════════════════
const SGN_RESULTS = {
  '13:10-1':{ winner:'Moudan',         second:'Le Nez Creux',      third:'Traprain Law' },
  '13:45-1':{ winner:'Pounding Poet',  second:'Big John Wayne',    third:'I Wish You' },
  '14:20-1':{ winner:'Dedicated Hero', second:'Captain Hugo',      third:'Ooh Betty' },
  '14:55-1':{ winner:'Game Colours',   second:'World Of Fortunes', third:'Love Of Neymore' },
  '15:35-1':{ winner:'Kap Vert',       second:'Git Maker',         third:'Kim Roque' },
  '16:15-1':{ winner:'Apache Tribe',   second:'Stride On',         third:'West Hill Verde' },
  '16:50-1':{ winner:'Skerry Hill',    second:'Old Habits',        third:'Close House' },
};

const SGN_PICKS = {
  'Our NAP':        { picks:{ '13:10-1':'Sans Bruit','13:45-1':'Big John Wayne','14:20-1':'Tutti Quanti','14:55-1':'Holly Hartingo','15:35-1':'King Of Answers','16:15-1':'Apache Tribe','16:50-1':'Brady Hartsfield' }},
  'Our NB':         { picks:{ '14:20-1':'Tellherthename','15:35-1':'Chasingouttheblues' }},
  'Newsboy':        { picks:{ '13:10-1':'Sans Bruit','13:45-1':'Big John Wayne','14:20-1':'Tutti Quanti','14:55-1':'Holly Hartingo','15:35-1':'Montregard','16:15-1':'Apache Tribe','16:50-1':'Brady Hartsfield' }},
  'Geraghty (WH)':  { picks:{ '13:10-1':'Le Nez Creux','13:45-1':'Blakey Boy','14:20-1':'Tellherthename','14:55-1':'Twistthenightaway','15:35-1':'King Of Answers','16:15-1':'West Hill Verde','16:50-1':'Brady Hartsfield' }},
  'WH Experts':     { picks:{ '15:35-1':'Promontory' }},
  'Mullington (WH)':{ picks:{ '13:10-1':'Moudan','13:45-1':'Milcree','14:20-1':'Ooh Betty','14:55-1':"Fox's Fancy",'15:35-1':'Promontory','16:15-1':'Stride On','16:50-1':'Old Habits' }},
  'Racing Post':    { picks:{ '15:35-1':'Chasingouttheblues' }},
  'Grimshaw (HRN)': { picks:{ '14:20-1':'Tutti Quanti','15:35-1':'Kim Roque' }},
  'Nick Luck (WH)': { picks:{ '13:10-1':'Le Nez Creux','13:45-1':'Kdeux Saint Fray','14:20-1':'All In You','14:55-1':'Game Colours','15:35-1':'Kim Roque' }},
  'Raceolly':       { picks:{ '13:45-1':'Ayiko','15:35-1':'Collectors Item' }},
};

// ════════════════════════════════════════════════════════════════════════════
// GUINEAS FESTIVAL 2026 DATA  (Friday complete · Sat/Sun in progress)
// ════════════════════════════════════════════════════════════════════════════
const GUINEAS_RESULTS = {
  // Friday 1 May — confirmed
  '13:45-0':{ winner:'Earth Shot',     second:'Velvet Vega',       third:'Wild Violet' },
  '14:20-0':{ winner:'Ancient Egypt',  second:'My Love Is King',   third:'Archers Bay' },
  '14:55-0':{ winner:'St Anton',       second:'Comic Hero',        third:'Fort Rock' },
  '15:30-0':{ winner:'Santorini Star', second:'Eydon',             third:'French Master' },
  '16:05-0':{ winner:'Billyjoh',       second:'Golden Redemption', third:'Silver Ghost' },
  '16:40-0':{ winner:'Saber Strike',   second:'Cerro Blanco',      third:'Stellar Sunrise' },
  '17:15-0':{ winner:'Cinque Verde',   second:'Lady Kodiac',       third:'Powdering' },
  // Saturday 2 May — pending
  // Sunday 3 May — pending
};

const GUINEAS_PICKS = {
  'Our NAP':{ label:'Our NAP', color:'#34d399', icon:'⭐', picks:{
    '13:10-1':'Flora Of Bermuda','13:45-1':'Double Rush','14:20-1':'Bullet Point',
    '14:55-1':'Asfoora','15:35-1':'Gstaad','16:10-1':'Sovereign Spell','16:45-1':'Gamrai',
  }},
  'Mullington (WH)':{ label:'Mullington (WH)', color:'#fbbf24', icon:'📝', picks:{
    '13:10-1':'Celandine','13:45-1':'Invictus Gold','14:20-1':'Botanical',
    '14:55-1':'JM Jungle','15:35-1':'Bow Echo','16:10-1':'Comical Point','16:45-1':'Nightime Dancer',
  }},
  'Grimshaw (HRN)':{ label:'Grimshaw (HRN)', color:'#67e8f9', icon:'📺', picks:{
    '14:55-1':'Quinault','15:35-1':'Into The Sky',
  }},
  'Raceolly':{ label:'Raceolly', color:'#f97316', icon:'📱', picks:{
    '14:55-1':'Miss Attitude',
  }},
  'Nick Luck (WH)':{ label:'Nick Luck (WH)', color:'#38bdf8', icon:'🎙️', picks:{
    '14:20-0':'My Love Is King','14:55-0':'St Anton',
    '15:30-0':'Bay City Roller','16:05-0':'Golden Redemption',
  }},
};

// ════════════════════════════════════════════════════════════════════════════
// CHESTER MAY FESTIVAL 2026 DATA · 22 races across 3 days · all settled
// ════════════════════════════════════════════════════════════════════════════
const CHESTER_RESULTS = {
  // Day 1 — Wed 6 May (Good To Firm)
  '13:30-0':{ winner:'Adonius',          second:'Hickory Lad',     third:null },
  '14:05-0':{ winner:'Supido',           second:'Snow Master',     third:'Lir Speciale' },
  '14:35-0':{ winner:'Amelia Earhart',   second:"I'm The One",     third:null },
  '15:05-0':{ winner:'Benvenuto Cellini',second:'Proposition',     third:null },
  '15:40-0':{ winner:'Cherry Baker',     second:"Ruby's Angel",    third:'Tricky Tel' },
  '16:10-0':{ winner:'Tornado Tower',    second:'El Nay',          third:null },
  '16:45-0':{ winner:'Dance In The Storm',second:'Sujet',          third:'Pietro' },
  // Day 2 — Thu 7 May Ladies Day (Good)
  '13:30-1':{ winner:'Roman Dragon',     second:'Dubai Bling',     third:'Atomic Force' },
  '14:05-1':{ winner:'Donegal Rose',     second:'Jazz Queen',      third:'Caturra Lights' },
  '14:35-1':{ winner:'Constitution River',second:'Generic',        third:null },
  '15:05-1':{ winner:'Jan Brueghel',     second:'Mount Atlas',     third:null },
  '15:40-1':{ winner:'Mcmurray',         second:"Monarch's Gold",  third:'Cool Molly' },
  '16:10-1':{ winner:"Let's Dream",      second:'Organ',           third:'Rastnet' },
  '16:45-1':{ winner:'Magnetude',        second:'Mythical Bay',    third:'Galilean Quality' },
  // Day 3 — Fri 8 May Cup Day (Good, Soft In Places)
  '13:30-2':{ winner:'Respond',          second:'Whip Cracker',    third:'Janey Mackers' },
  '14:05-2':{ winner:'Galiyan',          second:'Joulany',         third:null },
  '14:35-2':{ winner:'Lambourn',         second:'Bay City Roller', third:'Ice Max' },
  '15:05-2':{ winner:'A Piece Of Heaven',second:'Maxi King',       third:'Duraji' },
  '15:40-2':{ winner:'Rosenpur',         second:'The Good Biscuit',third:'Jonny Concrete' },
  '16:10-2':{ winner:'Shrimp Shady',     second:'Kingstonian',     third:'Tribal Star' },
  '16:45-2':{ winner:'Exclamation',      second:"Schrodinger's Cat",third:'One And Gone' },
  '17:20-2':{ winner:'Patagonia Girl',   second:'Renesmee',        third:'Newtown Duke' },
};

const CHESTER_PICKS = {
  'Our NAP':{ label:'Our NAP', color:'#34d399', icon:'⭐', picks:{
    '13:30-0':'Adonius','14:05-0':'Partisan Hero','14:35-0':"I'm The One",'15:05-0':'Benvenuto Cellini',
    '15:40-0':"Ruby's Angel",'16:10-0':'Norman Invasion','16:45-0':'Pietro',
    '13:30-1':'Roman Dragon','14:05-1':'Caturra Lights','14:35-1':'Morshdi','15:05-1':'Jan Brueghel',
    '15:40-1':'Mcmurray','16:10-1':"Let's Dream",'16:45-1':'Galilean Quality',
    '13:30-2':'El Burhan','14:05-2':'Glory Of The Seas','14:35-2':'Lambourn','15:05-2':'A Piece Of Heaven',
    '15:40-2':'Hoodie Hoo','16:10-2':'Kingstonian','16:45-2':'Ambishio','17:20-2':'Nightsinwhitesatin',
  }},
  'Our NB':{ label:'Our NB', color:'#60a5fa', icon:'🔵', picks:{
    '13:30-0':'Wait Geordie','14:05-0':'Snow Master','14:35-0':'Amelia Earhart','15:05-0':'Del Maro',
    '15:40-0':'Alaminos','16:10-0':'Arabian Desert','16:45-0':'Dance In The Storm',
    '13:30-1':'Seven Questions','14:05-1':'Koodini','14:35-1':'Constitution River','15:05-1':'Al Qareem',
    '15:40-1':'King Of Thunder','16:10-1':'Jupiter Ammon','16:45-1':'Mythical Bay',
    '13:30-2':'Bragbor','14:05-2':'Galiyan','14:35-2':"Kings Gambit",'15:05-2':'Peaky Blinder',
    '15:40-2':'Rosenpur','16:10-2':'Shrimp Shady','16:45-2':'Proof','17:20-2':'LEagle Aid',
  }},
  'Our LONG':{ label:'Our LONG', color:'#f472b6', icon:'🎯', picks:{
    '13:30-0':'Final Appeal','14:05-0':"Percys Lad",'14:35-0':'Sugar Island','15:05-0':'Mr Vettori',
    '15:40-0':'Temple Of Athena','16:10-0':'Tornado Tower','16:45-0':'Goldmoyne',
    '13:30-1':'Dapper Valley','14:05-1':'Furturra','14:35-1':'Golden Story','15:05-1':'Mount Atlas',
    '15:40-1':'Caballo Grande','16:10-1':'Hamadhan','16:45-1':'Be The Standard',
    '13:30-2':'Triple Double A','14:05-2':'Eben Al Khawaneej','14:35-2':'Starford','15:05-2':'Chemistry',
    '15:40-2':'Clonmacash','16:10-2':'Mr Escobar','16:45-2':"Schrodinger's Cat",'17:20-2':'Newtown Duke',
  }},
  'Mullington (WH)':{ label:'Mullington (WH)', color:'#fbbf24', icon:'📝', picks:{
    '13:30-0':'Adonius','14:05-0':'Partisan Hero','14:35-0':"I'm The One",'15:05-0':'Benvenuto Cellini',
    '15:40-0':"Ruby's Angel",'16:10-0':'Norman Invasion','16:45-0':'Pietro',
    '13:30-1':'Vintage Clarets','14:05-1':'Koodini','14:35-1':'Golden Story','15:05-1':'Al Qareem',
    '15:40-1':'King Of Thunder','16:10-1':'Hamadhan','16:45-1':'Galilean Quality',
    '13:30-2':'Janey Mackers','14:05-2':'Glory Of The Seas','14:35-2':"Kings Gambit",'15:05-2':'Zanndabad',
    '15:40-2':'Manila Scouse','16:10-2':'Morning Air','16:45-2':'Watcha Snoop','17:20-2':'Nightsinwhitesatin',
  }},
  'Nick Luck (WH)':{ label:'Nick Luck (WH)', color:'#5eead4', icon:'🎙️', picks:{
    '13:30-0':'Wait Geordie','14:05-0':'Supido','14:35-0':'Sugar Island','15:05-0':'Proposition',
    '15:40-0':'Star Material','16:10-0':null,'16:45-0':null,
    '13:30-1':'Roman Dragon','14:05-1':'Furturra','14:35-1':'Morshdi','15:05-1':'Jan Brueghel',
    '15:40-1':'Factual','16:10-1':null,'16:45-1':null,
    '13:30-2':'Triple Double A','14:05-2':'Galiyan','14:35-2':'Bay City Roller','15:05-2':'Chemistry',
    '15:40-2':'Manila Scouse','16:10-2':null,'16:45-2':null,'17:20-2':null,
  }},
  'Grimshaw (HRN)':{ label:'Grimshaw (HRN)', color:'#fdba74', icon:'📺', picks:{
    '13:30-0':'Wait Geordie','14:05-0':null,'14:35-0':null,'15:05-0':'Del Maro',
    '15:40-0':null,'16:10-0':null,'16:45-0':null,
    '13:30-1':"Canon's House",'14:05-1':null,'14:35-1':null,'15:05-1':'Jan Brueghel',
    '15:40-1':null,'16:10-1':null,'16:45-1':null,
    '13:30-2':null,'14:05-2':'Galiyan','14:35-2':"Kings Gambit",'15:05-2':'Chemistry',
    '15:40-2':null,'16:10-2':null,'16:45-2':null,'17:20-2':null,
  }},
  'HRN':{ label:'horseracing.net', color:'#7dd3fc', icon:'📰', picks:{
    '13:30-0':null,'14:05-0':null,'14:35-0':null,'15:05-0':null,
    '15:40-0':null,'16:10-0':null,'16:45-0':null,
    '13:30-1':'Seven Questions','14:05-1':'Donegal Rose','14:35-1':'Morshdi','15:05-1':'Rahiebb',
    '15:40-1':'King Of Thunder','16:10-1':"Let's Dream",'16:45-1':null,
    '13:30-2':'El Burhan','14:05-2':'Glory Of The Seas','14:35-2':'Lambourn','15:05-2':'Moon Over Miami',
    '15:40-2':'Jonny Concrete','16:10-2':null,'16:45-2':'Proof','17:20-2':null,
  }},
  'HRN BIG':{ label:'HRN Biggest Naps & Tips', color:'#fca5a5', icon:'🔥', picks:{
    '13:30-0':null,'14:05-0':null,'14:35-0':null,'15:05-0':null,
    '15:40-0':null,'16:10-0':null,'16:45-0':null,
    '13:30-1':'Vintage Clarets','14:05-1':null,'14:35-1':'Generic','15:05-1':null,
    '15:40-1':'Cool Molly','16:10-1':"Dante's Lad",'16:45-1':null,
    '13:30-2':null,'14:05-2':null,'14:35-2':'High Stock','15:05-2':'Aimeric',
    '15:40-2':null,'16:10-2':'Morning Air','16:45-2':null,'17:20-2':'Wise Counsellor',
  }},
  'Raceolly':{ label:'Raceolly', color:'#c4b5fd', icon:'📱', picks:{
    '13:30-0':null,'14:05-0':null,'14:35-0':null,'15:05-0':null,
    '15:40-0':null,'16:10-0':null,'16:45-0':null,
    '13:30-1':'Roach Power','14:05-1':null,'14:35-1':null,'15:05-1':null,
    '15:40-1':null,'16:10-1':null,'16:45-1':'Carwyn',
    '13:30-2':'Bravais','14:05-2':null,'14:35-2':null,'15:05-2':null,
    '15:40-2':'Intervention','16:10-2':'Carlton','16:45-2':'Exclamation','17:20-2':'Secret Beach',
  }},
};

// ════════════════════════════════════════════════════════════════════════════
// DANTE FESTIVAL 2026 DATA · 21 races across 3 days · all settled
// Day suffix: -0 Wed 13 May · -1 Thu 14 May (Dante Day) · -2 Fri 15 May (Yorkshire Cup Day)
// Where 2nd/3rd not confirmed in source results, value left null and picks at those
// positions register as 'pending' (no win/place/miss).
// ════════════════════════════════════════════════════════════════════════════
const DANTE_RESULTS = {
  // Wed 13 May
  '13:45-0':{ winner:'Cut A Dash',     second:'Varzi',              third:null },
  '14:20-0':{ winner:'Klassleader',    second:null,                 third:null },
  '14:55-0':{ winner:'Dark Thirty',    second:'Binhareer',          third:null },
  '15:30-0':{ winner:'Elmonjed',       second:null,                 third:null },
  '16:05-0':{ winner:'Legacy Link',    second:'Felicitas',          third:null },
  '16:40-0':{ winner:'Startled',       second:'Daydreama',          third:'The Resdev Scholar' },
  '17:15-0':{ winner:null,             second:null,                 third:null },
  // Thu 14 May — Dante Day
  '13:45-1':{ winner:'Persian Spring', second:null,                 third:null },
  '14:20-1':{ winner:null,             second:null,                 third:null },
  '14:55-1':{ winner:null,             second:'Cerulean Bay',       third:null },
  '15:30-1':{ winner:'See The Fire',   second:'Fallen Angel',       third:null },
  '16:05-1':{ winner:null,             second:'Action',             third:'Christmas Day' },
  '16:40-1':{ winner:'Dickensian',     second:null,                 third:'Aspect Island' },
  '17:15-1':{ winner:'Arc Ole Ole',    second:'Stoneacre Donny',    third:null },
  // Fri 15 May — Yorkshire Cup Day
  '13:45-2':{ winner:'Zarathos',       second:'Leadman',            third:'Orne' },
  '14:20-2':{ winner:'Lilt',           second:'So Regal',           third:null },
  '14:55-2':{ winner:'Warrant Holder', second:'Thunder Run',        third:'Altareq' },
  '15:30-2':{ winner:'Love A Giggle',  second:'Armor Supreme',      third:'Lover Girl' },
  '16:05-2':{ winner:'Rahiebb',        second:'Al Nayyir',          third:null },
  '16:40-2':{ winner:'Fortification',  second:'Stargazed',          third:"Naana's Shadow" },
  '17:15-2':{ winner:'Portcullis',     second:"Lord D'or",          third:null },
};

const DANTE_PICKS = {
  'Our NAP':{ label:'Our NAP', color:'#34d399', icon:'⭐', picks:{
    '13:45-0':'Varzi','14:20-0':'Klassleader','14:55-0':'Binhareer','15:30-0':'American Affair',
    '16:05-0':'Legacy Link','16:40-0':'Al Najashi','17:15-0':'Lightening Company',
    '13:45-1':'Sir Sirius','14:20-1':'Air Force One','14:55-1':'Sea Force','15:30-1':'See The Fire',
    '16:05-1':'Morshdi','16:40-1':'Aspect Island','17:15-1':'Sudbury Hill',
    '13:45-2':'Zarathos','14:20-2':'So Regal','14:55-2':'Warrant Holder','15:30-2':'Lover Girl',
    '16:05-2':'Amiloc','16:40-2':'Desert Treasure','17:15-2':'Portcullis',
  }},
  'Our NB':{ label:'Our NB', color:'#60a5fa', icon:'🔵', picks:{
    '13:45-0':'Spectacular Diver','14:20-0':'Stressfree','14:55-0':'Pilgrim','15:30-0':'Cool Hoof Luke',
    '16:05-0':'Felicitas','16:40-0':'Startled','17:15-0':'Minhad',
    '13:45-1':'Rock Steady Beat','14:20-1':'Against The Wind','14:55-1':'Mirsky','15:30-1':'Diamond Rain',
    '16:05-1':'Christmas Day','16:40-1':'Revival Power','17:15-1':'Stoneacre Donny',
    '13:45-2':'Mereside Diva','14:20-2':'Synchronicity','14:55-2':'Have Secret','15:30-2':'Princesse Dorange',
    '16:05-2':'Rahiebb','16:40-2':'Shes Got A Brother','17:15-2':'Weheedd',
  }},
  'Our LONG':{ label:'Our LONG', color:'#f472b6', icon:'🎯', picks:{
    '13:45-0':'Cut A Dash','14:20-0':'Dark Moon Rising','14:55-0':'Strike Red','15:30-0':'Quinault',
    '16:05-0':'Sea The Storm','16:40-0':'The Resdev Scholar','17:15-0':'Hermetic',
    '13:45-1':'Persian Spring','14:20-1':'Sports Coach','14:55-1':'Point Lynas','15:30-1':'Fairy Glen',
    '16:05-1':'Action','16:40-1':'Wor Faayth','17:15-1':'Arc Ole Ole',
    '13:45-2':'Stratocracy','14:20-2':'Botagoz','14:55-2':'Empire Of Light','15:30-2':'Lauralynn',
    '16:05-2':'Al Nayyir','16:40-2':"Naana's Shadow",'17:15-2':'Ervani',
  }},
  'Mullington (WH)':{ label:'Mullington (WH)', color:'#fbbf24', icon:'📝', picks:{
    '13:45-0':'Varzi','14:20-0':'Stressfree','14:55-0':'Strike Red','15:30-0':'Big Mojo',
    '16:05-0':'Sea The Storm','16:40-0':'Inishbeg','17:15-0':'Arrange',
    '13:45-1':'Leave The Bag In','14:20-1':'Stormy Impact','14:55-1':'Cerulean Boy','15:30-1':'Fallen Angel',
    '16:05-1':'Christmas Day','16:40-1':'Dickensian','17:15-1':'Stoneacre Donny',
    '13:45-2':'Spirit Genie','14:20-2':'Botagoz','14:55-2':'Have Secret','15:30-2':"Margaret's Pearl",
    '16:05-2':'Furthur','16:40-2':'Storm Esme','17:15-2':'Portcullis',
  }},
  'HRN':{ label:'horseracing.net', color:'#7dd3fc', icon:'📰', picks:{
    '13:45-0':'Varzi','14:20-0':'Klassleader','14:55-0':'Binhareer','15:30-0':'Time For Sandals',
    '16:05-0':'Legacy Link','16:40-0':'Inishbeg','17:15-0':'Minhad',
    '13:45-1':'Rock Steady Beat','14:20-1':'Hammer The Hammer','14:55-1':'Point Lynas','15:30-1':'See The Fire',
    '16:05-1':'Christmas Day','16:40-1':'Revival Power','17:15-1':'Arc Ole Ole',
    '13:45-2':'Style Of Life','14:20-2':'Synchronicity','14:55-2':'Per Contra','15:30-2':"Princesse Dorange",
    '16:05-2':'Amiloc','16:40-2':'Call Margot','17:15-2':'Portcullis',
  }},
  'Nick Luck (WH)':{ label:'Nick Luck (WH)', color:'#5eead4', icon:'🎙️', picks:{
    '13:45-0':null,'14:20-0':'Dark Moon Rising','14:55-0':'Dark Thirty','15:30-0':'Aramram',
    '16:05-0':'K Sarra','16:40-0':'First Legion','17:15-0':null,
    '13:45-1':null,'14:20-1':'Luna A Inbhir Nis','14:55-1':'Cerulean Bay','15:30-1':'Diamond Rain',
    '16:05-1':'Action','16:40-1':'Revival Power','17:15-1':null,
    '13:45-2':null,'14:20-2':'Pacific Mission','14:55-2':'Castle Stuart','15:30-2':"Princesse Dorange",
    '16:05-2':'Furthur','16:40-2':'Old Is Gold','17:15-2':null,
  }},
  'Steve Chambers':{ label:'Steve Chambers (HRN)', color:'#fda4af', icon:'📺', picks:{
    '13:45-0':null,'14:20-0':'Klassleader','14:55-0':'Kylian','15:30-0':'Time For Sandals',
    '16:05-0':'Legacy Link','16:40-0':null,'17:15-0':null,
    '13:45-1':null,'14:20-1':null,'14:55-1':null,'15:30-1':null,
    '16:05-1':null,'16:40-1':null,'17:15-1':null,
    '13:45-2':null,'14:20-2':'Synchronicity','14:55-2':'Thunder Run','15:30-2':'Lover Girl',
    '16:05-2':'Amiloc','16:40-2':null,'17:15-2':null,
  }},
  'Raceolly':{ label:'Raceolly', color:'#c4b5fd', icon:'📱', picks:{
    '13:45-0':null,'14:20-0':'Dark Moon Rising','14:55-0':'Tropical Storm','15:30-0':'Elmonjed',
    '16:05-0':null,'16:40-0':'Daydreama','17:15-0':'Military Cross',
    '13:45-1':null,'14:20-1':'Against The Wind','14:55-1':"Duke's Command",'15:30-1':null,
    '16:05-1':null,'16:40-1':'Boston Dan','17:15-1':'Parisian Scholar',
    '13:45-2':'Dingle','14:20-2':null,'14:55-2':'Zryan','15:30-2':'Lauralynn',
    '16:05-2':null,'16:40-2':'Shes Got A Brother','17:15-2':null,
  }},
  'Joe Napier':{ label:'Joe Napier (HRN)', color:'#a3e635', icon:'🎤', picks:{
    '13:45-0':null,'14:20-0':null,'14:55-0':null,'15:30-0':null,
    '16:05-0':null,'16:40-0':null,'17:15-0':null,
    '13:45-1':null,'14:20-1':'Air Force One','14:55-1':'Thunder Roar','15:30-1':null,
    '16:05-1':'Christmas Day','16:40-1':'Aspect Island','17:15-1':null,
    '13:45-2':null,'14:20-2':null,'14:55-2':null,'15:30-2':null,
    '16:05-2':null,'16:40-2':null,'17:15-2':null,
  }},
};

// ════════════════════════════════════════════════════════════════════════════
// EPSOM DERBY 2026 DATA  (day 0 = Fri 5 Jun Oaks Day · day 1 = Sat 6 Jun Derby Day)
// ════════════════════════════════════════════════════════════════════════════
const EPSOM_RESULTS = {
  // Fri 5 Jun — Oaks Day
  '13:30-0':{ winner:"Naana's Shadow",   second:'Call Margot',      third:'Shes Got A Brother' },
  '14:05-0':{ winner:'Hickory Lad',      second:"Alpe d'Huez",      third:'Rlasthope' },
  '14:40-0':{ winner:'Seagulls Eleven',  second:'Persica',          third:'Boiling Point' },
  '15:15-0':{ winner:'Sallaal',          second:'Respond',          third:'Spoken Truth' },
  '16:00-0':{ winner:'Thundering On',    second:'Legacy Link',      third:'Sugar Island' },
  '16:40-0':{ winner:'Mister Winston',   second:'Hot Cash',         third:'Man Of La Mancha' },
  '17:15-0':{ winner:'Ellusive Butterfly',second:'Greek Mythology', third:'Ardisia' },
  '17:50-0':{ winner:'Colombier',        second:'Zarathos',         third:'A War Eagle' },
  // Sat 6 Jun — Derby Day
  '13:30-1':{ winner:'Ten Bob Tony',     second:'Witness Stand',    third:'Poet Master' },
  '14:05-1':{ winner:'Sparks Fly',       second:'Love Dynasty',     third:'Pacific Mission' },
  '14:40-1':{ winner:'Bay City Roller',  second:'Jan Brueghel',     third:'Lambourn' },
  '15:15-1':{ winner:'Arklow Lad',       second:'Vintage Clarets',  third:'Lexington Blitz' },
  '16:00-1':{ winner:'Christmas Day',    second:'Maltese Cross',    third:'James J Braddock' },
  '16:40-1':{ winner:'Folk Pageant',     second:'Silver State',     third:'Pendella' },
  '17:20-1':{ winner:'Too Soon',         second:'Night Breeze',     third:'Bulletin' },
  '17:55-1':{ winner:'Sondad',           second:'Invictus Gold',    third:'Partisan Hero' },
};

// Non-runners are set to null (void — not scored).
const EPSOM_PICKS = {
  'Our NAP':{ label:'Our NAP', color:'#34d399', icon:'⭐', picks:{
    '13:30-0':'Wedonttelllies','14:05-0':'Possessive','14:40-0':'Persica','15:15-0':null,
    '16:00-0':'Amelia Earhart','16:40-0':'Celeborn','17:15-0':'Stellar Sunrise','17:50-0':'Dance In The Storm',
    '13:30-1':'Never So Brave','14:05-1':'Sparks Fly','14:40-1':'Calandagan','15:15-1':'Kinswoman',
    '16:00-1':null,'16:40-1':'Starlight Time','17:20-1':'Spinning Wheel','17:55-1':'Gold Star Hero',
  }},
  'Our NB':{ label:'Our NB', color:'#60a5fa', icon:'🔵', picks:{
    '13:30-0':'Shes Got A Brother','14:05-0':'Wild Terrain','14:40-0':'Seagulls Eleven','15:15-0':'Respond',
    '16:00-0':'Legacy Link','16:40-0':'Man Of La Mancha','17:15-0':null,'17:50-0':'Crimson Spirit',
    '13:30-1':'Ten Bob Tony','14:05-1':'Pina Sonata','14:40-1':'Jan Brueghel','15:15-1':'Lexington Blitz',
    '16:00-1':'Item','16:40-1':'Hell Yeah He Did','17:20-1':'Hengest','17:55-1':'Sondad',
  }},
  'Our LONG':{ label:'Our LONG', color:'#f472b6', icon:'🎯', picks:{
    '13:30-0':'Alfa Duplicate','14:05-0':'Dandyman Dan','14:40-0':'Chancellor','15:15-0':'Liberty Lane',
    '16:00-0':'On Message','16:40-0':'Sterling Knight','17:15-0':null,'17:50-0':'Pietro',
    '13:30-1':'Witness Stand','14:05-1':'Love Dynasty','14:40-1':'Lambourn','15:15-1':'Stormy Impact',
    '16:00-1':'Maltese Cross','16:40-1':'Silver State','17:20-1':'Night Breeze','17:55-1':'Badri',
  }},
  'Mullington (WH)':{ label:'Mullington (WH)', color:'#fbbf24', icon:'📝', picks:{
    '13:30-0':'Riley Rocks','14:05-0':'Ardad Steve','14:40-0':'Skukuza','15:15-0':'Spoken Truth',
    '16:00-0':'Amelia Earhart','16:40-0':'Asmen Warrior','17:15-0':null,'17:50-0':null,
    '13:30-1':'Poet Master','14:05-1':'Sparks Fly','14:40-1':'Calandagan','15:15-1':'Stormy Impact',
    '16:00-1':null,'16:40-1':'York Tower','17:20-1':null,'17:55-1':null,
  }},
  'HRN':{ label:'horseracing.net', color:'#7dd3fc', icon:'📰', picks:{
    '13:30-0':'Wedonttelllies','14:05-0':'Ardad Steve','14:40-0':'Qirat','15:15-0':'Alpha Crucis',
    '16:00-0':'Legacy Link','16:40-0':'Man Of La Mancha','17:15-0':'Greek Mythology','17:50-0':'Dance In The Storm',
    '13:30-1':'Alcantor','14:05-1':'Pina Sonata','14:40-1':'Jan Brueghel','15:15-1':'Dream Composer',
    '16:00-1':null,'16:40-1':'Folk Pageant','17:20-1':'Spinning Wheel','17:55-1':'Partisan Hero',
  }},
  'Nick Luck (WH)':{ label:'Nick Luck (WH)', color:'#5eead4', icon:'🎙️', picks:{
    '13:30-0':'Wedonttelllies','14:05-0':'Dandyman Dan','14:40-0':'Seagulls Eleven','15:15-0':'Auld Toon Loon',
    '16:00-0':'Legacy Link','16:40-0':'Stem','17:15-0':null,'17:50-0':null,
    '13:30-1':'Golden Mind','14:05-1':'Sparks Fly','14:40-1':'Bay City Roller','15:15-1':'Arklow Lad',
    '16:00-1':'James J Braddock','16:40-1':null,'17:20-1':null,'17:55-1':null,
  }},
  'Raceolly':{ label:'Raceolly', color:'#c4b5fd', icon:'📱', picks:{
    '13:30-0':'Rosie Frith','14:05-0':'Rlasthope','14:40-0':null,'15:15-0':'Beylerbeyi',
    '16:00-0':null,'16:40-0':'Final Night','17:15-0':'Ardisia','17:50-0':'Pietro',
    '13:30-1':'Golden Mind','14:05-1':'Love Dynasty','14:40-1':null,'15:15-1':"Ziggy's Triton",
    '16:00-1':null,'16:40-1':'Silver State','17:20-1':'Antrim','17:55-1':null,
  }},
  'Grimshaw (HRN)':{ label:'Grimshaw (HRN)', color:'#67e8f9', icon:'📺', picks:{
    '13:30-0':null,'14:05-0':null,'14:40-0':null,'15:15-0':null,
    '16:00-0':'Legacy Link','16:40-0':null,'17:15-0':null,'17:50-0':null,
    '13:30-1':null,'14:05-1':'Sparks Fly','14:40-1':'Calandagan','15:15-1':'Almaty Star',
    '16:00-1':'Ancient Egypt','16:40-1':null,'17:20-1':null,'17:55-1':null,
  }},
  'HRN BIG':{ label:'HRN BIG (longshots)', color:'#fca5a5', icon:'🔥', picks:{
    '13:30-0':null,'14:05-0':null,'14:40-0':null,'15:15-0':"King's Code",
    '16:00-0':'Sugar Island','16:40-0':'Ozat','17:15-0':null,'17:50-0':'Sunny Smile',
    '13:30-1':null,'14:05-1':null,'14:40-1':null,'15:15-1':"Ziggy's Triton",
    '16:00-1':null,'16:40-1':null,'17:20-1':'Lord Melbourne','17:55-1':null,
  }},
};

// ════════════════════════════════════════════════════════════════════════════
// SEASON MAP  — links tipster across all festivals
// ════════════════════════════════════════════════════════════════════════════
const SEASON_MAP = [
  { id:'Our NAP',       cKey:'Our NAP',        gnKey:'Our NAP',       sgnKey:'Our NAP',          guinKey:'Our NAP',         chKey:'Our NAP',         dKey:'Our NAP', eKey:'Our NAP',          label:'Our NAP',          color:'#34d399', icon:'⭐' },
  { id:'Our NB',        cKey:'Our NB',          gnKey:'Our NB',        sgnKey:'Our NB',            guinKey:null,              chKey:'Our NB',          dKey:'Our NB', eKey:'Our NB',           label:'Our NB',           color:'#60a5fa', icon:'🔵' },
  { id:'Our LONG',      cKey:null,              gnKey:null,            sgnKey:null,                guinKey:null,              chKey:'Our LONG',        dKey:'Our LONG', eKey:'Our LONG',         label:'Our LONG',         color:'#f472b6', icon:'🎯' },
  { id:'Mullington',    cKey:'Mullington (WH)', gnKey:'Mullington',    sgnKey:'Mullington (WH)',   guinKey:'Mullington (WH)', chKey:'Mullington (WH)', dKey:'Mullington (WH)', eKey:'Mullington (WH)',  label:'Mullington (WH)',  color:'#fbbf24', icon:'📝' },
  { id:'WH Experts',    cKey:null,              gnKey:'WH Experts',    sgnKey:'WH Experts',        guinKey:null,              chKey:null,              dKey:null,               label:'WH Experts',       color:'#a3e635', icon:'🏆' },
  { id:'Geraghty',      cKey:null,              gnKey:'Geraghty',      sgnKey:'Geraghty (WH)',     guinKey:null,              chKey:null,              dKey:null,               label:'Barry Geraghty',   color:'#fb7185', icon:'🎤' },
  { id:'Nick Luck',     cKey:null,              gnKey:'Nick Luck',     sgnKey:'Nick Luck (WH)',    guinKey:'Nick Luck (WH)',  chKey:'Nick Luck (WH)',  dKey:'Nick Luck (WH)', eKey:'Nick Luck (WH)',   label:'Nick Luck',        color:'#38bdf8', icon:'🎙️' },
  { id:'Raceolly',      cKey:null,              gnKey:'Raceolly',      sgnKey:'Raceolly',          guinKey:'Raceolly',        chKey:'Raceolly',        dKey:'Raceolly', eKey:'Raceolly',         label:'Raceolly',         color:'#f97316', icon:'📱' },
  { id:'Grimshaw (HRN)',cKey:'Grimshaw (HRN)',  gnKey:null,            sgnKey:'Grimshaw (HRN)',    guinKey:'Grimshaw (HRN)', chKey:'Grimshaw (HRN)', eKey:'Grimshaw (HRN)',  dKey:null,               label:'Grimshaw (HRN)',   color:'#67e8f9', icon:'📺' },
  { id:'HRN',           cKey:null,              gnKey:null,            sgnKey:null,                guinKey:null,              chKey:'HRN',             dKey:'HRN', eKey:'HRN',              label:'horseracing.net',  color:'#7dd3fc', icon:'📰' },
  { id:'HRN BIG',       cKey:null,              gnKey:null,            sgnKey:null,                guinKey:null,              chKey:'HRN BIG', eKey:'HRN BIG',         dKey:null,               label:'HRN BIG (longshots)',color:'#fca5a5', icon:'🔥' },
  { id:'Steve Chambers',cKey:null,              gnKey:null,            sgnKey:null,                guinKey:null,              chKey:null,              dKey:'Steve Chambers',   label:'Steve Chambers (HRN)', color:'#fda4af', icon:'📺' },
  { id:'Joe Napier',    cKey:null,              gnKey:null,            sgnKey:null,                guinKey:null,              chKey:null,              dKey:'Joe Napier',       label:'Joe Napier (HRN)', color:'#a3e635', icon:'🎤' },
  { id:'WH Racecard',   cKey:null,              gnKey:'WH Racecard',   sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'WH Racecard',      color:'#a78bfa', icon:'💜' },
  { id:'J. Mangan',     cKey:null,              gnKey:'J. Mangan',     sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'Jane Mangan',      color:'#f9a8d4', icon:'🎤' },
  { id:'Boom City',     cKey:null,              gnKey:'Boom City',     sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'Boom City',        color:'#f59e0b', icon:'🐝' },
  { id:'Frick',         cKey:null,              gnKey:'Frick',         sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:"Frick's Tips",     color:'#e879f9', icon:'🦆' },
  { id:'RoadCheltenham',cKey:null,              gnKey:'RoadCheltenham',sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'RoadCheltenham',   color:'#fb923c', icon:'🏇' },
  { id:'Newsboy',       cKey:null,              gnKey:null,            sgnKey:'Newsboy',           guinKey:null,              chKey:null,              dKey:null,               label:'Newsboy (Mirror)', color:'#f472b6', icon:'📰' },
  { id:'Racing Post',   cKey:null,              gnKey:null,            sgnKey:'Racing Post',       guinKey:null,              chKey:null,              dKey:null,               label:'Racing Post',      color:'#a78bfa', icon:'🗞️' },
  { id:'Playle (RP)',   cKey:'Playle (RP)',     gnKey:null,            sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'Playle (RP)',      color:'#f472b6', icon:'📰' },
  { id:'Kealy (RP)',    cKey:'Kealy (RP)',      gnKey:null,            sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'Kealy (RP)',       color:'#f472b6', icon:'📰' },
  { id:'Dineen (RP)',   cKey:'Dineen (RP)',     gnKey:null,            sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'Dineen (RP)',      color:'#f472b6', icon:'📰' },
  { id:'Wilson (RP)',   cKey:'Wilson (RP)',     gnKey:null,            sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'Wilson (RP)',      color:'#f472b6', icon:'📰' },
  { id:'Segal (RP)',    cKey:'Segal (RP)',      gnKey:null,            sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'Segal (RP)',       color:'#c084fc', icon:'📰' },
  { id:'Park (RP)',     cKey:'Park (RP)',       gnKey:null,            sgnKey:null,                guinKey:null,              chKey:null,              dKey:null,               label:'Tom Park (RP)',    color:'#6ee7b7', icon:'📰' },
];

// ════════════════════════════════════════════════════════════════════════════
// RECENT NOTABLE WINS  (chronological, newest first)
// ════════════════════════════════════════════════════════════════════════════
const RECENT_WINS = [
  { festival:'Guineas 2026',   date:'1 May',   horse:'St Anton',          tipster:'Nick Luck (WH)',  race:'14:55 Newmarket' },
  { festival:'Scottish GN',    date:'18 Apr',  horse:'Moudan',            tipster:'Mullington (WH)', race:'13:10 Ayr' },
  { festival:'GN Festival',    date:'11 Apr',  horse:'I Am Maximus',      tipster:'Our NAP',         race:'16:00 Aintree' },
  { festival:'GN Festival',    date:'9 Apr',   horse:'Brighterdaysahead', tipster:'Our NAP',         race:'16:05 Aintree' },
  { festival:'GN Festival',    date:'9 Apr',   horse:'Jango Baie',        tipster:'Our NAP',         race:'14:55 Aintree' },
];

// ════════════════════════════════════════════════════════════════════════════
// COMPUTED SEASON SCORES  (call once, use everywhere)
// ════════════════════════════════════════════════════════════════════════════
function computeSeasonScores() {
  return SEASON_MAP.map(t => {
    const cSc   = t.cKey    ? scoreEvent(CHELT_PICKS[t.cKey].picks,     CHELT_RESULTS)   : null;
    const gnSc  = t.gnKey   ? scoreEvent(GN_PICKS[t.gnKey].picks,       GN_RESULTS)      : null;
    const sgnSc = t.sgnKey  ? scoreEvent(SGN_PICKS[t.sgnKey].picks,     SGN_RESULTS)     : null;
    const guinSc= t.guinKey ? scoreEvent(GUINEAS_PICKS[t.guinKey].picks, GUINEAS_RESULTS) : null;
    const chSc  = t.chKey   ? scoreEvent(CHESTER_PICKS[t.chKey].picks,  CHESTER_RESULTS) : null;
    const dSc   = t.dKey    ? scoreEvent(DANTE_PICKS[t.dKey].picks,     DANTE_RESULTS)   : null;
    const eSc   = t.eKey    ? scoreEvent(EPSOM_PICKS[t.eKey].picks,     EPSOM_RESULTS)   : null;
    const total = (cSc?.pts||0) + (gnSc?.pts||0) + (sgnSc?.pts||0) + (guinSc?.pts||0) + (chSc?.pts||0) + (dSc?.pts||0) + (eSc?.pts||0);
    const totalPicks = (cSc?.total||0) + (gnSc?.total||0) + (sgnSc?.total||0) + (guinSc?.total||0) + (chSc?.total||0) + (dSc?.total||0) + (eSc?.total||0);
    const totalWins  = (cSc?.wins||0)  + (gnSc?.wins||0)  + (sgnSc?.wins||0)  + (guinSc?.wins||0)  + (chSc?.wins||0)  + (dSc?.wins||0)  + (eSc?.wins||0);
    const totalPlace = (cSc?.places||0)+ (gnSc?.places||0)+ (sgnSc?.places||0)+ (guinSc?.places||0)+ (chSc?.places||0)+ (dSc?.places||0)+ (eSc?.places||0);
    const totalMiss  = (cSc?.misses||0)+ (gnSc?.misses||0)+ (sgnSc?.misses||0)+ (guinSc?.misses||0)+ (chSc?.misses||0)+ (dSc?.misses||0)+ (eSc?.misses||0);
    const strikeRate = totalPicks > 0 ? Math.round(totalWins / totalPicks * 100) : 0;
    const ptsPerPick = totalPicks > 0 ? (total / totalPicks).toFixed(2) : '0.00';
    return { ...t, cSc, gnSc, sgnSc, guinSc, chSc, dSc, eSc, total, totalPicks, totalWins, totalPlace, totalMiss, strikeRate, ptsPerPick };
  }).sort((a,b) => b.total - a.total || b.totalWins - a.totalWins || b.strikeRate - a.strikeRate);
}
