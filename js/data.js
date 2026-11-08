/* =========================================================
   STANDARDDATA: varekatalog, jobber, hendelseskort, tilbud
   ========================================================= */

/* Varekatalog
   [id, navn, kategori, minecraft-navn, enhet, pris, data(farge), maks per rute]
   enhet: 'stack' = 64 blokker, 'stk' = per stykk                         */
const STANDARD_KATALOG = [
  ['bjork','Bjørk','bygg','birch_planks','stack',1200],
  ['morkeik','Mørk eik','bygg','dark_oak_planks','stack',1800],
  ['kirsebaer','Kirsebær','bygg','cherry_planks','stack',2000],
  ['hvitbetong','Hvit betong','bygg','white_concrete','stack',2400],
  ['graabetong','Grå betong','bygg','gray_concrete','stack',2400],
  ['steinmur','Steinmurstein','bygg','stone_bricks','stack',1600],
  ['grus','Grus','bygg','gravel','stack',300],
  ['stillas','Stillas','bygg','scaffolding','stack',500],
  ['eiketrapp','Eiketrapp','detaljer','oak_stairs','stk',10],
  ['morkeiketrapp','Mørk eiketrapp','detaljer','dark_oak_stairs','stk',10],
  ['bjorketrapp','Bjørketrapp','detaljer','birch_stairs','stk',10],
  ['grantrapp','Grantrapp','detaljer','spruce_stairs','stk',10],
  ['kirsebaertrapp','Kirsebærtrapp','detaljer','cherry_stairs','stk',15],
  ['steintrapp','Steintrapp','detaljer','normal_stone_stairs','stk',10],
  ['steinmurtrapp','Steinmurtrapp','detaljer','stone_brick_stairs','stk',15],
  ['skifertrapp','Skifertrapp (takstein)','detaljer','deepslate_tile_stairs','stk',20],
  ['eikegjerde','Eikegjerde','detaljer','oak_fence','stk',10],
  ['bjorkegjerde','Bjørkegjerde','detaljer','birch_fence','stk',10],
  ['kirsebaergjerde','Kirsebærgjerde','detaljer','cherry_fence','stk',10],
  ['eikegrind','Eikegrind','detaljer','fence_gate','stk',40],
  ['bjorkegrind','Bjørkegrind','detaljer','birch_fence_gate','stk',40],
  ['kirsebaergrind','Kirsebærgrind','detaljer','cherry_fence_gate','stk',40],
  ['eikedor','Eikedør','detaljer','wooden_door','stk',100],
  ['grandor','Grandør','detaljer','spruce_door','stk',100],
  ['kirsebaerdor','Kirsebærdør','detaljer','cherry_door','stk',150],
  ['eikeluke','Eikeluke','detaljer','trapdoor','stk',50],
  ['glassrute','Glassrute','detaljer','glass_pane','stk',50],
  ['glassblokk','Glassblokk','detaljer','glass','stk',60],
  ['stige','Stige','detaljer','ladder','stk',5],
  ['steinhelle','Steinhelle','detaljer','smooth_stone_slab','stk',5],
  ['skilt','Skilt','detaljer','oak_sign','stk',30,null,16],
  ['lys_hvit','Stearinlys, hvitt','lys','white_candle','stk',30],
  ['lys_rod','Stearinlys, rødt','lys','red_candle','stk',30],
  ['lys_bla','Stearinlys, blått','lys','blue_candle','stk',30],
  ['lys_gronn','Stearinlys, grønt','lys','green_candle','stk',30],
  ['lys_gul','Stearinlys, gult','lys','yellow_candle','stk',30],
  ['lys_rosa','Stearinlys, rosa','lys','pink_candle','stk',30],
  ['lykt','Lykt','lys','lantern','stk',200],
  ['endestav','Endestav (lampe)','lys','end_rod','stk',100],
  ['seng_hvit','Seng, hvit','interior','bed','stk',500,0,1],
  ['seng_rod','Seng, rød','interior','bed','stk',500,14,1],
  ['seng_gronn','Seng, grønn','interior','bed','stk',500,13,1],
  ['seng_bla','Seng, blå','interior','bed','stk',500,11,1],
  ['kiste','Kiste','interior','chest','stk',400],
  ['tonne','Tønne','interior','barrel','stk',300],
  ['smelteovn','Smelteovn','interior','furnace','stk',800],
  ['leirbaal','Leirbål','interior','campfire','stk',200],
  ['bokhylle','Bokhylle','interior','bookshelf','stk',100],
  ['teppe_hvit','Teppe, hvitt','interior','white_carpet','stk',20],
  ['teppe_graa','Teppe, grått','interior','gray_carpet','stk',20],
  ['teppe_rod','Teppe, rødt','interior','red_carpet','stk',20],
  ['teppe_bla','Teppe, blått','interior','blue_carpet','stk',20],
  ['blomsterpotte','Blomsterpotte','interior','flower_pot','stk',50],
  ['bilderamme','Bilderamme','interior','frame','stk',100],
  ['maleri','Maleri','interior','painting','stk',300],
  ['kull','Kull','husholdning','coal','stk',5],
  ['kylling','Kylling','husholdning','chicken','stk',20],
  ['svin','Svinekjøtt','husholdning','porkchop','stk',20],
  ['storfe','Storfekjøtt','husholdning','beef','stk',30],
  ['faar','Fårekjøtt','husholdning','mutton','stk',30],
  ['kanin','Kaninkjøtt','husholdning','rabbit','stk',10],
  ['torsk','Torsk','husholdning','cod','stk',20],
  ['laks','Laks','husholdning','salmon','stk',30],
  ['brod','Brød','husholdning','bread','stk',10],
  ['eple','Eple','husholdning','apple','stk',5],
  ['gulrot','Gulrot','husholdning','carrot','stk',5],
  ['kake','Kake','husholdning','cake','stk',150,null,1],
  ['vannbotte','Vannbøtte','husholdning','water_bucket','stk',150,null,1],
  ['oks','Øks (jern)','husholdning','iron_axe','stk',100,null,1],
  ['hakke','Hakke (jern)','husholdning','iron_pickaxe','stk',100,null,1],
  ['spade','Spade (jern)','husholdning','iron_shovel','stk',100,null,1],
  ['krafse','Krafse (jern)','husholdning','iron_hoe','stk',100,null,1],
  ['fiskestang','Fiskestang','husholdning','fishing_rod','stk',100,null,1],
  ['valmue','Valmue','hage','poppy','stk',5],
  ['orkide','Blå orkidé','hage','blue_orchid','stk',5],
  ['prydlok','Prydløk','hage','allium','stk',5],
  ['tulipan_rod','Rød tulipan','hage','red_tulip','stk',5],
  ['tulipan_rosa','Rosa tulipan','hage','pink_tulip','stk',5],
  ['prestekrage','Prestekrage','hage','oxeye_daisy','stk',5],
  ['solsikke','Solsikke','hage','sunflower','stk',20],
  ['syrin','Syrin','hage','lilac','stk',50],
  ['rosebusk','Rosebusk','hage','rose_bush','stk',50],
  ['peon','Peon','hage','peony','stk',50],
  ['gress','Gressblokk','hage','grass_block','stk',1],
  ['ungeik','Ung eik','hage','oak_sapling','stk',100],
  ['unggran','Ung gran','hage','spruce_sapling','stk',100],
  ['ungbjork','Ung bjørk','hage','birch_sapling','stk',100],
  ['beinmel','Beinmel','hage','bone_meal','stk',20],
].reduce((o, [id, navn, kat, mc, enhet, pris, data, maks], i) => {
  o[id] = { navn, kat, mc, enhet, pris, data: data ?? null, maks: maks ?? 64, aktiv: true, rekkefolge: i };
  return o;
}, {});

const KATEGORIER = {
  bygg: 'Byggematerialer', detaljer: 'Byggedetaljer', lys: 'Lys',
  interior: 'Interiør', husholdning: 'Mat og husholdning', hage: 'Hage'
};

/* Byggematerialer elevene kan velge i byggesøknaden (vare-id i katalogen) */
const BYGGEMATERIALER = ['bjork', 'morkeik', 'kirsebaer', 'hvitbetong', 'graabetong', 'steinmur'];
/* Trapp som passer til hvert materiale (til skråtak) */
const TAKTRAPP = { bjork: 'bjorketrapp', morkeik: 'morkeiketrapp', kirsebaer: 'kirsebaertrapp',
  hvitbetong: 'skifertrapp', graabetong: 'skifertrapp', steinmur: 'steinmurtrapp' };

/* Standardinnstillinger */
const STANDARD_INNSTILLINGER = {
  byNavn: '', startbonus: 30000, bedriftBonus: 15000,
  maksHoyde: 15, maksAndel: 0.67, etasjeHoyde: 4, tomtBredde: 14, tomtDybde: 14,
  skatteModell: 'fordelt', skattProsent: 25, forsikringPerUke: 750, ferdigBonus: 2000,
  offentligLonn: 1280, visSummer: false, chatOrd: 'lever',
  kreverByggesoknad: true, laererPin: '1234'
};

/* Jobber fra Byen vår 2020/2021. type: 'offentlig' = fast lønn fra byen (betales med skatt),
   'privat' = tjener det bedriften selger for */
const STANDARD_JOBBER = {
  politi:     { navn: 'Politi', type: 'offentlig', plasser: 2, beskrivelse: 'Ta imot personer, skrive rapporter om mistenkelige ting og patruljere i gatene.' },
  brann:      { navn: 'Brannvesen', type: 'offentlig', plasser: 3, beskrivelse: 'Sjekke at husene er brannsikre (vindu på soverom, peis ved åpent ildsted) og slukke branner.' },
  sykehus:    { navn: 'Sykehus', type: 'offentlig', plasser: 3, beskrivelse: 'Ta imot og undersøke pasienter, skrive pasientrapporter og dele ut medisin.' },
  matbutikk:  { navn: 'Matbutikk', type: 'privat', plasser: 3, beskrivelse: 'Prisskilt, lager og kasse. Sørge for nok varer og ta imot betaling.' },
  byggevare:  { navn: 'Byggevare- og hagebutikk', type: 'privat', plasser: 3, beskrivelse: 'Selge byggevarer og hagevarer. Passe på lageret.' },
  restaurant: { navn: 'Restaurant', type: 'privat', plasser: 3, beskrivelse: 'Meny med priser, kjøkken, ta imot bestillinger og lage mat.' },
  basseng:    { navn: 'Svømmehall', type: 'privat', plasser: 2, beskrivelse: 'Selge billetter, bassengregler og være livreddere.' },
  rush:       { navn: 'Trampolinepark', type: 'privat', plasser: 2, beskrivelse: 'Selge billetter og lage mange kjekke aktiviteter.' }
};

/* Hendelseskort (fra «Hendelseskort» 2020/2021)
   type: 'penger' (belop +/-), 'forsikring' (kost med/uten forsikring),
         'skriv' (eleven skriver svar i portalen), 'oppdrag' (gjøres i Minecraft) */
/* Regler man kan få bot for (i tillegg kommer lovene bystyret har vedtatt) */
const BOTREGLER = [
  'Bygget utenfor egen tomt', 'Hogget trær eller gravd i bakken', 'Brukt klosser som ikke er kjøpt',
  'Ødelagt eller endret naboens hus', 'Bygget annerledes enn byggetegningen', 'Uhøflig eller ufin oppførsel mot andre innbyggere'
];

const HENDELSESKORT = [
  { id: 'syk_mage', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Du føler deg ikke helt frisk! Du har vondt i magen og må ta deg en tur til sykehuset.' },
  { id: 'syk_fot', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Du har vondt i foten og må ta deg en tur til sykehuset.' },
  { id: 'syk_hode', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Du har vondt i hodet og må ta deg en tur til sykehuset.' },
  { id: 'syk_arm', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Du har vondt i armen og må ta deg en tur til sykehuset.' },
  { id: 'ovn', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Ovnen din har gått i stykker! Du må kjøpe en ny smelteovn.' },
  { id: 'seng', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Sengen din har gått i stykker! Du må kjøpe en ny.' },
  { id: 'mistenkelig1', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Du har sett en mistenkelig person i nabolaget med hatt og mørk jakke som snek rundt et av husene. Rapporter til politiet!' },
  { id: 'mistenkelig2', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Du har sett en mistenkelig person med lue og rød jakke utenfor rådhuset. Rapporter til politiet!' },
  { id: 'mistenkelig3', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Du har sett en mistenkelig person med briller og gul jakke som gikk etter deg. Rapporter til politiet!' },
  { id: 'vannlekkasje', type: 'forsikring', tittel: 'Å nei!', tekst: 'Du har hatt vannlekkasje og må ringe rørleggeren.', medForsikring: 100, utenForsikring: 500 },
  { id: 'rotter', type: 'forsikring', tittel: 'Å nei!', tekst: 'Du har fått rotter i huset og må ringe skadedyrbekjemperen.', medForsikring: 100, utenForsikring: 500 },
  { id: 'skjeggkre', type: 'forsikring', tittel: 'Å nei!', tekst: 'Du har skjeggkre i huset og må ringe skadedyrbekjemperen.', medForsikring: 100, utenForsikring: 500 },
  { id: 'onkel', type: 'skriv', tittel: 'Hello!', tekst: "I'm your great uncle from America! I hear you have a new house and a new job. Write me a letter and tell me about it! (Skriv brevet på engelsk. Start med «Dear …» og avslutt med f.eks. «Best wishes».)" },
  { id: 'bursdag', type: 'penger', tittel: 'Hurra!', tekst: 'Du har bursdag og får 500 kr i gave! Skriv en takketale.', belop: 500, skriv: true },
  { id: 'flaks', type: 'penger', tittel: 'Hurra!', tekst: 'Du vant 100 kr på et Flaks-lodd!', belop: 100 },
  { id: 'nabo', type: 'skriv', tittel: 'Hurra!', tekst: 'Du er kåret til byens beste nabo! Skriv en takketale. Husk å takke noen spesielt og ønske alle lykke til.' },
  { id: 'svomming', type: 'oppdrag', tittel: 'Hurra!', tekst: 'Det er fint vær i dag! Du tar deg en svømmetur i svømmehallen.' },
  { id: 'restaurant', type: 'oppdrag', tittel: 'Hurra!', tekst: 'Du vil feire en spesiell anledning med en tur på restaurant!' },
  { id: 'trampoline', type: 'oppdrag', tittel: 'Hurra!', tekst: 'Du er så glad at du nesten hopper i taket! Ta en tur til trampolineparken.' },
  { id: 'lat', type: 'oppdrag', tittel: 'Å nei!', tekst: 'Du er litt lat i dag og kjøper ferdig middag i matbutikken eller restauranten.' },
  { id: 'regning', type: 'penger', tittel: 'Å nei!', tekst: 'Du har glemt å betale en regning og får et gebyr på 200 kr.', belop: -200 },
  { id: 'hageseier', type: 'penger', tittel: 'Hurra!', tekst: 'Naboene synes hagen din er så fin at dere får 300 kr fra velforeningen!', belop: 300 }
];

/* Tilbudsmaler læreren kan sende */
const TILBUDSMALER = [
  { tittel: 'Supertilbud! Leksefri uke', tekst: 'Gjelder for begge i husholdningen, og begge må være enige. Huset må være ferdig.', pris: 5000 },
  { tittel: 'Gulltime', tekst: 'En time der dere selv velger aktivitet (innenfor rimelighetens grenser).', pris: 3000 },
  { tittel: 'Leketime ute', tekst: 'Ekstra friminutt for husholdningen.', pris: 2000 }
];
