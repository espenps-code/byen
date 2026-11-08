/* =========================================================
   FELLES: hjelpefunksjoner og beregninger for elev og lærer
   ========================================================= */
const kr = n => (Math.round(Number(n) || 0)).toLocaleString('nb-NO') + ' kr';
const dato = t => new Date(t).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
const datoTid = t => new Date(t).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = sel => document.querySelector(sel);
const liste = obj => Object.entries(obj || {}).map(([id, v]) => ({ id, ...v }));

/* Enkel hash for PIN (hindrer at PIN-koder står i klartekst i databasen) */
function hashPin(pin, salt) {
  const str = salt + ':' + String(pin).trim();
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const B = {
  /* ---------- Innstillinger og katalog ---------- */
  innst() { return { ...STANDARD_INNSTILLINGER, ...(Store.hent('innstillinger') || {}) }; },
  katalog() {
    const lagret = Store.hent('katalog') || {};
    return Object.entries(STANDARD_KATALOG).map(([id, v]) => ({ id, ...v, ...(lagret[id] || {}) }))
      .sort((a, b) => a.rekkefolge - b.rekkefolge);
  },
  vare(id) { return this.katalog().find(v => v.id === id); },
  enhet: v => v.enhet === 'stack' ? 'stack (64)' : 'stk',

  /* ---------- Kontoer ---------- */
  kontoer(type) {
    return liste(Store.hent('kontoer')).filter(k => !type || k.type === type)
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'hh' ? -1 : 1) || (Number(a.tomt) || 999) - (Number(b.tomt) || 999) || String(a.navn).localeCompare(b.navn));
  },
  konto(id) { const k = Store.hent('kontoer/' + id); return k ? { id, ...k } : null; },
  kontoNavn(id) { const k = this.konto(id); return k ? (k.type === 'hh' ? `Tomt ${k.tomt} – ${k.navn}` : k.navn) : '?'; },
  medlemmer(k) { return (k && k.medlemmer) ? Object.values(k.medlemmer).filter(Boolean) : []; },

  /* ---------- Bank ---------- */
  trans(kontoId) { return liste(Store.hent('trans/' + kontoId)).sort((a, b) => a.tid - b.tid); },
  saldo(kontoId) { return this.trans(kontoId).reduce((s, t) => s + (Number(t.belop) || 0), 0); },
  sumBestilling: b => (b.linjer || []).reduce((s, l) => s + l.antall * l.pris, 0),
  reservert(kontoId) {
    const best = liste(Store.hent('bestillinger')).filter(b => b.kontoId === kontoId && (b.status === 'sendt' || b.status === 'godkjent'))
      .reduce((s, b) => s + this.sumBestilling(b), 0);
    return best;
  },
  disponibelt(kontoId) { return this.saldo(kontoId) - this.reservert(kontoId); },
  async trans_ny(kontoId, belop, tekst, kat, ekstra = {}) {
    return Store.leggTil('trans/' + kontoId, { tid: Date.now(), belop: Math.round(belop), tekst, kat, ...ekstra });
  },
  async post_ny(kontoId, obj) {
    return Store.leggTil('post/' + kontoId, { tid: Date.now(), lest: false, ...obj });
  },
  post(kontoId) { return liste(Store.hent('post/' + kontoId)).sort((a, b) => b.tid - a.tid); },
  ulest(kontoId) { return this.post(kontoId).filter(p => !p.lest).length; },

  /* ---------- Byens butikker (elevbedrifter) ---------- */
  butikk(id) { return Store.hent('butikker/' + id) || {}; },
  butikkVarer(id) { return liste(this.butikk(id).varer).sort((a, b) => (a.tid || 0) - (b.tid || 0)); },
  apneButikker() { return this.kontoer('bedrift').filter(b => this.butikk(b.id).apen && this.butikkVarer(b.id).some(v => v.aktiv !== false)); },
  kjop(filter) { return liste(Store.hent('kjop')).filter(filter || (() => true)).sort((a, b) => b.tid - a.tid); },
  kode: id => String(id).replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase(),
  // Betaling: trekk fra kjøper og sett inn hos bedriften i én og samme skriving
  async betal(fra, til, linjer, av) {
    const sum = linjer.reduce((s, l) => s + l.antall * l.pris, 0);
    if (!sum || sum <= 0) throw new Error('Tomt kjøp');
    const id = Store.nyNokkel('kjop'), tid = Date.now();
    const tekst = linjer.map(l => `${l.antall}× ${l.navn}`).join(', ');
    const fordeling = {};
    linjer.forEach(l => { const k = l.kat || 'annet'; fordeling[k] = (fordeling[k] || 0) + l.antall * l.pris; });
    await Store.flere({
      ['kjop/' + id]: { fra, til, linjer, sum, tid, av: av || '', status: 'betalt' },
      [`trans/${fra}/${id}`]: { tid, belop: -sum, tekst: `Kjøp hos ${this.kontoNavn(til)}: ${tekst}`, kat: 'kjop', fordeling, kjopId: id },
      [`trans/${til}/${id}`]: { tid, belop: sum, tekst: `Salg til ${this.kontoNavn(fra)}${av ? ' (' + av + ')' : ''}: ${tekst}`, kat: 'salg', kjopId: id }
    });
    return id;
  },
  /* Tabell over kjøp/salg. rolle: 'kunde' viser butikken, 'selger' viser kunden, 'laerer' viser begge */
  kjopTabell(rader, rolle, knapp) {
    if (!rader.length) return UI.tom(rolle === 'kunde' ? 'Ingen kjøp ennå.' : 'Ingen salg ennå.');
    return `<div class="tabellboks"><table><tr><th>Tid</th><th>Kode</th>${rolle !== 'kunde' ? '<th>Kunde</th>' : ''}${rolle !== 'selger' ? '<th>Butikk</th>' : ''}<th>Varer</th><th class="tall">Sum</th><th>Status</th>${knapp ? '<th></th>' : ''}</tr>
      ${rader.map(k => `<tr><td>${datoTid(k.tid)}</td><td><b>${this.kode(k.id)}</b></td>
        ${rolle !== 'kunde' ? `<td>${esc(this.kontoNavn(k.fra))}${k.av ? `<br><span class="dempet">${esc(k.av)}</span>` : ''}</td>` : ''}
        ${rolle !== 'selger' ? `<td>${esc(this.kontoNavn(k.til))}</td>` : ''}
        <td>${(k.linjer || []).map(l => `${l.antall}× ${esc(l.navn)}`).join('<br>')}</td><td class="tall">${kr(k.sum)}</td><td>${UI.merke(k.status)}</td>
        ${knapp ? `<td>${knapp(k)}</td>` : ''}</tr>`).join('')}</table></div>`;
  },

  /* ---------- Jobber ---------- */
  jobber() {
    const lagret = Store.hent('jobber');
    return liste(lagret || {}).sort((a, b) => (a.type === b.type ? 0 : a.type === 'offentlig' ? -1 : 1) || a.navn.localeCompare(b.navn));
  },
  // ansettelser: { 'kontoId~indeks': jobbId }
  ansatte(jobbId) {
    return Object.entries(Store.hent('ansettelser') || {}).filter(([, j]) => j === jobbId).map(([n]) => {
      const [kontoId, i] = n.split('~'); const k = this.konto(kontoId);
      return { nokkel: n, kontoId, indeks: i, navn: k ? (this.medlemmer(k)[i] || '?') : '?' };
    });
  },
  jobbFor(kontoId, i) { const j = (Store.hent('ansettelser') || {})[kontoId + '~' + i]; return j ? { id: j, ...(Store.hent('jobber/' + j) || {}) } : null; },

  /* =========================================================
     BYGGESØKNAD: analyse av tegning, regelsjekk og estimat
     Rutenett: én streng per rad per etasje.
       '.' tomt  'v' vegg  'd' dør  'w' vindu  'r' rom  's' soverom  't' trapp
     ========================================================= */
  tomUtgave(bredde, dybde) { return Array.from({ length: dybde }, () => '.'.repeat(bredde)); },
  /* Lengste rette rekke med trappruter i én etasje */
  lengsteTrapp(e) {
    let best = 0;
    e.forEach((r, y) => [...r].forEach((c, x) => {
      if (c !== 't') return;
      if ((r[x - 1] || '.') !== 't') { let n = 0; while (r[x + n] === 't') n++; best = Math.max(best, n); }
      if (((e[y - 1] || '')[x] || '.') !== 't') { let n = 0; while ((e[y + n] || '')[x] === 't') n++; best = Math.max(best, n); }
    }));
    return best;
  },
  /* Hvor høyt (1, 2, 3 …) trappetrinnet i ruta står: teller fra starten av rekka */
  trappTrinn(e, x, y) {
    const r = e[y];
    const vannrett = r[x - 1] === 't' || r[x + 1] === 't';
    let k = 0;
    if (vannrett) while (r[x - 1 - k] === 't') k++;
    else while ((e[y - 1 - k] || '')[x] === 't') k++;
    return k + 1;
  },
  /* Antall ruter i etasjen over som står rett over trappa (der blir det hull i gulvet) */
  hullOverTrapp(under, over) {
    let n = 0;
    under.forEach((r, y) => [...r].forEach((c, x) => { if (c === 't' && (over[y] || '')[x] && over[y][x] !== '.') n++; }));
    return n;
  },
  analyser(soknad, innst = this.innst()) {
    const etg = (soknad.etasjer || []).filter(e => e && e.some(r => /[vdwrst]/.test(r)));
    const antEtg = etg.length;
    const bredde = (soknad.etasjer && soknad.etasjer[0] && soknad.etasjer[0][0] || '').length;
    const dybde = soknad.etasjer && soknad.etasjer[0] ? soknad.etasjer[0].length : 0;
    const tell = (e, re) => e.reduce((s, r) => s + (r.match(re) || []).length, 0);
    const forste = etg[0] || [];
    const bebygd = tell(forste, /[vdwrst]/g);
    const tomtAreal = bredde * dybde;
    const maksBebygd = Math.floor(tomtAreal * innst.maksAndel);

    // Bounding box for øverste etasje (til tak)
    const bbox = e => {
      let x0 = 99, x1 = -1, y0 = 99, y1 = -1;
      e.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
      return x1 < 0 ? { b: 0, d: 0 } : { b: x1 - x0 + 1, d: y1 - y0 + 1 };
    };
    const topp = etg[antEtg - 1] || [];
    const tb = bbox(topp);
    const kort = Math.min(tb.b, tb.d), lang = Math.max(tb.b, tb.d);
    const skratt = soknad.tak === 'skratt';
    const vegghoyde = innst.etasjeHoyde - 1;
    const takHoyde = skratt ? Math.ceil(kort / 2) : 0;
    const hoyde = antEtg ? (skratt ? antEtg * vegghoyde + antEtg - 1 + takHoyde : antEtg * innst.etasjeHoyde) : 0;

    // Estimat
    let material = 0, dorer = 0, ruter = 0;
    let innertrapper = 0;
    etg.forEach((e, i) => {
      const V = tell(e, /v/g), D = tell(e, /d/g), W = tell(e, /w/g);
      material += V * vegghoyde + (D + W) * Math.max(0, vegghoyde - 2);
      material += tell(e, /[vdwrst]/g); // gulv
      if (i > 0) material -= this.hullOverTrapp(etg[i - 1], e); // hull i gulvet over trappa
      dorer += D; ruter += W * 2; innertrapper += tell(e, /t/g);
    });
    let taktrapper = 0;
    if (antEtg) {
      if (skratt) {
        const rader = Math.floor(kort / 2);
        taktrapper = 2 * rader * lang;
        if (kort % 2 === 1) material += lang; // mønerad
        for (let k = 1; k < Math.ceil(kort / 2); k++) material += 2 * Math.max(0, kort - 2 * k); // gavler
      } else {
        material += tell(topp, /[vdwrst]/g); // flatt tak
      }
    }
    const stacks = Math.ceil(material / 64);

    // Regelsjekk
    const sjekker = [];
    const legg = (ok, tekst) => sjekker.push({ ok, tekst });
    legg(antEtg > 0, 'Huset er tegnet');
    legg(!!soknad.materiale, 'Byggemateriale er valgt');
    legg(bebygd <= maksBebygd, `Bebygd areal ${bebygd} av maks ${maksBebygd} ruter (${Math.round(innst.maksAndel * 100)} % av tomten)`);
    legg(hoyde <= innst.maksHoyde, `Høyde ca. ${hoyde} blokker (maks ${innst.maksHoyde})`);
    legg(tell(forste, /d/g) > 0, 'Minst én dør i 1. etasje');
    // Soverom med vindu
    let soverom = 0, soveromUtenVindu = 0;
    etg.forEach(e => {
      const sett = new Set();
      e.forEach((r, y) => [...r].forEach((c, x) => {
        if (c !== 's' || sett.has(x + ',' + y)) return;
        soverom++;
        let vindu = false; const ko = [[x, y]]; sett.add(x + ',' + y);
        while (ko.length) {
          const [cx, cy] = ko.pop();
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
            const nx = cx + dx, ny = cy + dy, n = (e[ny] || '')[nx];
            if (n === 'w') vindu = true;
            if (n === 's' && !sett.has(nx + ',' + ny)) { sett.add(nx + ',' + ny); ko.push([nx, ny]); }
          });
        }
        if (!vindu) soveromUtenVindu++;
      }));
    });
    legg(soverom > 0, soverom > 0 ? `${soverom} soverom` : 'Huset må ha minst ett soverom');
    if (soverom > 0) legg(soveromUtenVindu === 0, soveromUtenVindu ? `${soveromUtenVindu} soverom mangler vindu` : 'Alle soverom har vindu');
    // Etasjer over må stå på noe
    let svevende = 0;
    for (let i = 1; i < antEtg; i++) etg[i].forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.' && (etg[i - 1][y] || '')[x] === '.') svevende++; }));
    // Trapp mellom etasjene
    for (let i = 0; i < antEtg - 1; i++) {
      const lengst = this.lengsteTrapp(etg[i]);
      legg(lengst >= innst.etasjeHoyde, lengst >= innst.etasjeHoyde ? `Trapp fra ${i + 1}. til ${i + 2}. etasje`
        : `Trapp fra ${i + 1}. til ${i + 2}. etasje mangler (minst ${innst.etasjeHoyde} trappruter på rad${lengst ? `, dere har ${lengst}` : ''})`);
    }
    if (antEtg && tell(etg[antEtg - 1], /t/g)) legg(false, antEtg === 1 ? 'Huset har bare én etasje – fjern trappa' : 'Trapp i øverste etasje fører ingen steder – fjern den');
    if (antEtg > 1) legg(svevende === 0, svevende ? `${svevende} ruter i etasjen over står ikke på noe` : 'Etasjene står oppå hverandre');

    const kat = this.katalog();
    const pris = id => (kat.find(v => v.id === id) || { pris: 0 }).pris;
    const trappId = TAKTRAPP[soknad.materiale] || 'eiketrapp';
    const kostnad = stacks * pris(soknad.materiale) + dorer * pris('eikedor') + ruter * pris('glassrute') + (taktrapper + innertrapper) * pris(trappId);

    return {
      antEtg, bredde, dybde, bebygd, maksBebygd, hoyde, takHoyde, sjekker, ok: sjekker.every(s => s.ok),
      estimat: { material, stacks, dorer, ruter, taktrapper, innertrapper, trappId, kostnad }
    };
  },

  /* =========================================================
     KISTEPROGRAM (Code Builder / MakeCode)
     En dobbeltkiste = kiste på x og x+1 (54 ruter, rute 0–26 øverst).
     Neste dobbeltkiste settes 3 blokker mot øst.
     ========================================================= */
  ruterForLinje(l) {
    const stk = l.antall * (l.enhet === 'stack' ? 64 : 1);
    const maks = l.maks || 64, r = [];
    for (let igjen = stk; igjen > 0; igjen -= maks) {
      const n = Math.min(maks, igjen);
      r.push(l.mc + ' ' + n + (l.data !== null && l.data !== undefined ? ' ' + l.data : ''));
    }
    return r;
  },
  kisterFor(konto, ruter) {
    const k = [];
    for (let i = 0; i < ruter.length; i += 54) {
      const n = k.length;
      k.push({ x: Number(konto.x) + 3 * n, y: Number(konto.y), z: Number(konto.z), varer: ruter.slice(i, i + 54) });
    }
    return k;
  },
  lagProgram(grupper, chatOrd) {
    let ant = 0, kropp = '';
    grupper.forEach(g => {
      kropp += '    // ' + String(g.tittel).replace(/[\r\n]/g, ' ') + '\n';
      g.kister.forEach(k => {
        ant++;
        kropp += `    fyllKiste(${k.x}, ${k.y}, ${k.z}, [\n` + k.varer.map(s => `        "${s}"`).join(',\n') + '\n    ])\n';
      });
    });
    return `player.onChat("${chatOrd}", function () {\n`
      + `    player.say("Leverer til ${ant} dobbeltkiste${ant === 1 ? '' : 'r'}...")\n`
      + kropp
      + `    player.say("Ferdig! Alle kister er fylt.")\n})\n\n`
      + `// Setter ut en dobbeltkiste (x og x+1) og fyller opptil 54 ruter\n`
      + `function fyllKiste(x: number, y: number, z: number, varer: string[]) {\n`
      + `    let pos = x + " " + y + " " + z\n`
      + `    player.execute("setblock " + pos + " chest")\n`
      + `    player.execute("setblock " + (x + 1) + " " + y + " " + z + " chest")\n`
      + `    for (let i = 0; i < varer.length; i++) {\n`
      + `        player.execute("replaceitem block " + pos + " slot.container " + i + " " + varer[i])\n`
      + `    }\n}\n`;
  },
  harKoordinater: k => [k.x, k.y, k.z].every(v => v !== '' && v !== undefined && v !== null && !isNaN(Number(v)))
};

/* ---------- Små UI-hjelpere ---------- */
const UI = {
  merke(status) {
    const t = { utkast: 'Utkast', sendt: 'Venter', godkjent: 'Godkjent', levert: 'Levert', avvist: 'Avvist', samler: 'Samler støtte', betalt: 'Betalt', refundert: 'Refundert', ferdig: 'Ferdigattest', klar: 'Klar til avstemming', vedtatt: 'Vedtatt', forkastet: 'Forkastet' }[status] || status;
    return `<span class="merke m-${status}">${t}</span>`;
  },
  tom: tekst => `<div class="tom">${tekst}</div>`,
  toast(tekst, type = 'ok') {
    const el = document.createElement('div');
    el.className = 'toast t-' + type; el.textContent = tekst;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('vis'), 10);
    setTimeout(() => { el.classList.remove('vis'); setTimeout(() => el.remove(), 300); }, 2600);
  },
  kopier(tekst, knapp) {
    const ferdig = () => { if (knapp) { const o = knapp.textContent; knapp.textContent = 'Kopiert!'; setTimeout(() => knapp.textContent = o, 1500); } };
    if (navigator.clipboard) navigator.clipboard.writeText(tekst).then(ferdig, ferdig);
    else { const t = document.createElement('textarea'); t.value = tekst; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); ferdig(); }
  },
  /* Tegner en byggetegning som SVG (plan for én etasje) */
  planSvg(rader, celle = 18) {
    if (!rader || !rader.length) return '';
    const b = rader[0].length, d = rader.length;
    const F = { v: '#7a5230', d: '#c98a3d', w: '#7ec8e3', r: '#f3ead6', s: '#d9c8f0', t: '#e07a5f' };
    let r = `<svg class="plan" viewBox="0 0 ${b * celle} ${d * celle}" width="${b * celle}" height="${d * celle}">`;
    r += `<rect width="${b * celle}" height="${d * celle}" fill="#e3efd3"/>`;
    rader.forEach((rad, y) => [...rad].forEach((c, x) => {
      if (c !== '.') r += `<rect x="${x * celle}" y="${y * celle}" width="${celle}" height="${celle}" fill="${F[c]}"/>`;
      if (c === 't') r += `<text x="${(x + .5) * celle}" y="${(y + .5) * celle}" font-size="${celle * .55}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-weight="700">${B.trappTrinn(rader, x, y)}</text>`;
    }));
    for (let i = 0; i <= b; i++) r += `<line x1="${i * celle}" y1="0" x2="${i * celle}" y2="${d * celle}" stroke="#00000014"/>`;
    for (let i = 0; i <= d; i++) r += `<line x1="0" y1="${i * celle}" x2="${b * celle}" y2="${i * celle}" stroke="#00000014"/>`;
    return r + '</svg>';
  },
  /* Snur tegningen så valgt side vender mot betrakteren (nederste rad = nærmest) */
  roter(rader, side) {
    const D = rader.length, Bb = rader[0].length;
    const ny = (b, d, f) => Array.from({ length: d }, (_, y) => Array.from({ length: b }, (_, x) => f(x, y)).join(''));
    if (side === 'nord') return ny(Bb, D, (x, y) => rader[D - 1 - y][Bb - 1 - x]);
    if (side === 'ost') return ny(D, Bb, (x, y) => rader[D - 1 - x][y]);
    if (side === 'vest') return ny(D, Bb, (x, y) => rader[x][Bb - 1 - y]);
    return rader;
  },
  materialFarge(id) {
    return ({ bjork: '#e6d8a8', morkeik: '#5a3c22', kirsebaer: '#e7b3ad', hvitbetong: '#eceeee', graabetong: '#4d5157', steinmur: '#8f8f8f' })[id] || '#b8925a';
  },
  morkere(hex, f = 0.75) {
    const n = parseInt(hex.slice(1), 16);
    return '#' + [16, 8, 0].map(s => Math.round(((n >> s) & 255) * f).toString(16).padStart(2, '0')).join('');
  },
  /* Fasade sett fra én side: 'sor' (forfra), 'ost', 'nord', 'vest' */
  fasadeSvg(soknad, innst, celle = 14, side = 'sor') {
    const etg = (soknad.etasjer || []).filter(e => e && e.some(r => /[vdwrst]/.test(r))).map(e => this.roter(e, side));
    if (!etg.length) return '';
    const b = etg[0][0].length, vh = innst.etasjeHoyde - 1;
    const skratt = soknad.tak === 'skratt';
    const vegg = this.materialFarge(soknad.materiale), kant = this.morkere(vegg, 0.78), takF = '#4a4a52', takL = '#6a6a74';
    const front = e => Array.from({ length: b }, (_, x) => { for (let y = e.length - 1; y >= 0; y--) if (e[y][x] !== '.') return e[y][x]; return null; });
    const fr = etg.map(front);
    // Takets mål: øverste etasje, bredde sett forfra og dybde
    const topp = etg[etg.length - 1];
    let x0 = 99, x1 = -1, y0 = 99, y1 = -1;
    topp.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
    const tw = x1 - x0 + 1, td = y1 - y0 + 1, kort = Math.min(tw, td);
    const takH = skratt ? Math.ceil(kort / 2) : 1;
    const hoyde = etg.length * (vh + 1) + takH;
    const W = (b + 2) * celle, H = (hoyde + 1) * celle;
    const rute = (x, y, f) => `<rect x="${(x + 1) * celle}" y="${y}" width="${celle}" height="${celle}" fill="${f}" stroke="#0000001f"/>`;
    let r = `<svg class="fasade" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#dceefa"/>`;
    r += `<rect y="${H - celle}" width="${W}" height="${celle}" fill="#6ab04c"/>`;
    let bunn = H - celle;
    fr.forEach(rad => {
      rad.forEach((c, x) => {
        if (!c) return;
        for (let h = 0; h <= vh; h++) {
          let f = h === 0 ? kant : vegg;
          if (c === 'd' && (h === 1 || h === 2)) f = '#6b4a2b';
          if (c === 'w' && h >= 2 && h <= 3 && h <= vh) f = '#9fd6ea';
          r += rute(x, bunn - (h + 1) * celle, f);
        }
      });
      bunn -= (vh + 1) * celle;
    });
    if (!skratt) {
      for (let x = x0; x <= x1; x++) r += rute(x, bunn - celle, takF);
    } else if (tw <= td) {
      // Gavlen vender mot oss: trekant
      for (let k = 0; k < takH; k++) {
        const fra = x0 + k, til = x1 - k;
        for (let x = fra; x <= til; x++) r += rute(x, bunn - (k + 1) * celle, x === fra || x === til ? takF : vegg);
      }
    } else {
      // Langsiden vender mot oss: takflaten
      for (let k = 0; k < takH; k++) for (let x = x0; x <= x1; x++) r += rute(x, bunn - (k + 1) * celle, k % 2 ? takL : takF);
    }
    return r + '</svg>';
  },
  fasadeVelger(soknad, innst, valgt, onclick, celle = 10) {
    const sider = [['sor', 'Forfra (sør)'], ['ost', 'Høyre (øst)'], ['nord', 'Bakfra (nord)'], ['vest', 'Venstre (vest)']];
    return `<div class="chips" style="margin-bottom:8px">${sider.map(([s, n]) => `<button class="${valgt === s ? 'aktiv' : ''}" onclick="${onclick}('${s}')">${n}</button>`).join('')}</div>
      ${this.fasadeSvg(soknad, innst, celle, valgt)}`;
  },

  /* =========================================================
     3D-VISNING (three.js lastes ved behov)
     ========================================================= */
  voksler(soknad, innst) {
    const etg = (soknad.etasjer || []).filter(e => e && e.some(r => /[vdwrst]/.test(r)));
    const vh = innst.etasjeHoyde - 1, v = [];
    etg.forEach((e, f) => {
      const base = f * innst.etasjeHoyde;
      e.forEach((rad, z) => [...rad].forEach((c, x) => {
        if (c === '.') return;
        if (!(f > 0 && etg[f - 1][z][x] === 't')) v.push({ x, y: base, z, t: 'gulv' });
        if (c === 't') v.push({ x, y: base + Math.min(B.trappTrinn(e, x, z), innst.etasjeHoyde), z, t: 'trapp' });
        if (c === 'v' || c === 'd' || c === 'w') for (let h = 1; h <= vh; h++) {
          let t = 'vegg';
          if (c === 'd' && h <= 2) t = 'dor';
          if (c === 'w' && h >= 2 && h <= 3) t = 'glass';
          v.push({ x, y: base + h, z, t });
        }
      }));
    });
    if (!etg.length) return v;
    const topp = etg[etg.length - 1], toppBase = (etg.length - 1) * innst.etasjeHoyde;
    if (soknad.tak !== 'skratt') {
      topp.forEach((rad, z) => [...rad].forEach((c, x) => { if (c !== '.') v.push({ x, y: toppBase + vh + 1, z, t: 'tak' }); }));
      return v;
    }
    let x0 = 99, x1 = -1, z0 = 99, z1 = -1;
    topp.forEach((r, z) => [...r].forEach((c, x) => { if (c !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } }));
    const bx = x1 - x0 + 1, bz = z1 - z0 + 1, langsX = bx >= bz, kort = Math.min(bx, bz), takH = Math.ceil(kort / 2);
    for (let k = 0; k < takH; k++) {
      const y = toppBase + vh + 1 + k;
      for (let i = 0; i < kort; i++) {
        const avstand = Math.min(i, kort - 1 - i);
        if (avstand < k) continue;
        const kantRad = avstand === k;
        const L = langsX ? bx : bz;
        for (let j = 0; j < L; j++) {
          const endeGavl = j === 0 || j === L - 1;
          if (!kantRad && !endeGavl) continue;
          const x = langsX ? x0 + j : x0 + i, z = langsX ? z0 + i : z0 + j;
          v.push({ x, y, z, t: kantRad ? 'tak' : 'gavl' });
        }
      }
    }
    return v;
  },
  lastThree() {
    if (window.THREE) return Promise.resolve();
    return new Promise((ok, feil) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = ok; s.onerror = () => feil(new Error('Fikk ikke lastet 3D-motoren (krever internett).'));
      document.head.appendChild(s);
    });
  },
  async vis3d(soknad, innst, tittel = 'Huset i 3D') {
    const el = document.createElement('div');
    el.className = 'tavle tredje';
    el.innerHTML = `<button class="sek lukk">Lukk</button><h2 style="color:#fff;margin:0 0 8px">${esc(tittel)}</h2>
      <p style="opacity:.8;margin:0 0 12px">Dra for å snu huset · rull eller knip for å zoome</p><div class="lerret3d"><div class="laster3d"><div class="klosser"><span></span><span></span><span></span></div><p>Bygger huset …</p></div></div>
      <div class="rad" style="margin-top:12px;justify-content:center"><button class="sek" data-r="-1">↺ Snu</button><button class="sek" data-r="1">Snu ↻</button><label style="color:#fff"><input type="checkbox" class="skjulTak"> Ta av taket</label></div>`;
    document.body.appendChild(el);
    let stopp = false;
    el.querySelector('.lukk').onclick = () => { stopp = true; el.remove(); };
    try { await this.lastThree(); } catch (e) { el.querySelector('.lerret3d').innerHTML = `<p>${esc(e.message)}</p>`; return; }
    const T = window.THREE, boks = el.querySelector('.lerret3d');
    const bredde = Math.min(window.innerWidth - 40, 900), hoyde = Math.min(window.innerHeight - 220, 560);
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(bredde, hoyde);
    boks.innerHTML = '';
    boks.appendChild(renderer.domElement);
    const scene = new T.Scene(); scene.background = new T.Color('#bfe0f5');
    const kamera = new T.PerspectiveCamera(45, bredde / hoyde, 0.1, 500);
    scene.add(new T.HemisphereLight(0xffffff, 0x88aa66, 0.85));
    const sol = new T.DirectionalLight(0xffffff, 0.7); sol.position.set(20, 40, 25); scene.add(sol);
    const rader = soknad.etasjer[0], TB = rader[0].length, TD = rader.length;
    const bakke = new T.Mesh(new T.BoxGeometry(TB + 6, 1, TD + 6), new T.MeshLambertMaterial({ color: '#7cbd52' }));
    bakke.position.set(TB / 2, -1, TD / 2); scene.add(bakke);
    const tomt = new T.Mesh(new T.BoxGeometry(TB, 0.04, TD), new T.MeshLambertMaterial({ color: '#94cc6c' }));
    tomt.position.set(TB / 2, -0.48, TD / 2); scene.add(tomt);
    const vegg = this.materialFarge(soknad.materiale);
    const mat = {
      vegg: new T.MeshLambertMaterial({ color: vegg }), gulv: new T.MeshLambertMaterial({ color: this.morkere(vegg, 0.8) }),
      dor: new T.MeshLambertMaterial({ color: '#6b4a2b' }), glass: new T.MeshLambertMaterial({ color: '#9fd6ea', transparent: true, opacity: 0.45 }),
      tak: new T.MeshLambertMaterial({ color: '#4a4a52' })
    };
    mat.gavl = mat.vegg; mat.trapp = new T.MeshLambertMaterial({ color: '#c0603f' });
    const geo = new T.BoxGeometry(1, 1, 1), tak = [];
    const v = this.voksler(soknad, innst);
    const per = {}; v.forEach(b => (per[b.t] = per[b.t] || []).push(b));
    Object.entries(per).forEach(([t, liste]) => {
      const m = new T.InstancedMesh(geo, mat[t], liste.length), d = new T.Object3D();
      liste.forEach((b, i) => { d.position.set(b.x + 0.5, b.y, b.z + 0.5); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
      scene.add(m); if (t === 'tak' || t === 'gavl') tak.push(m);
    });
    const maksY = v.reduce((s, b) => Math.max(s, b.y), 0);
    // Taklaget på flatt tak og øverste del av skråtak skjules med «Ta av taket»
    el.querySelector('.skjulTak').onchange = e => { tak.forEach(m => { m.visible = !e.target.checked; }); };
    const senter = new T.Vector3(TB / 2, maksY / 2, TD / 2);
    let vinkel = 0.7, hevning = 0.55, avstand = Math.max(TB, TD, maksY) * 1.9;
    const plasser = () => {
      kamera.position.set(senter.x + avstand * Math.cos(hevning) * Math.sin(vinkel), senter.y + avstand * Math.sin(hevning), senter.z + avstand * Math.cos(hevning) * Math.cos(vinkel));
      kamera.lookAt(senter);
    };
    let drar = null, knip = null;
    const c = renderer.domElement; c.style.touchAction = 'none'; c.style.borderRadius = '12px';
    const pekere = new Map();
    c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); pekere.set(e.pointerId, [e.clientX, e.clientY]); drar = [e.clientX, e.clientY]; });
    c.addEventListener('pointermove', e => {
      if (!pekere.has(e.pointerId)) return;
      pekere.set(e.pointerId, [e.clientX, e.clientY]);
      if (pekere.size === 2) {
        const [a, b] = [...pekere.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (knip) avstand = Math.min(150, Math.max(6, avstand * knip / d));
        knip = d; return;
      }
      if (!drar) return;
      vinkel -= (e.clientX - drar[0]) * 0.008; hevning = Math.min(1.45, Math.max(0.05, hevning + (e.clientY - drar[1]) * 0.006));
      drar = [e.clientX, e.clientY];
    });
    const slipp = e => { pekere.delete(e.pointerId); knip = null; drar = pekere.size ? [...pekere.values()][0] : null; };
    c.addEventListener('pointerup', slipp); c.addEventListener('pointercancel', slipp);
    c.addEventListener('wheel', e => { e.preventDefault(); avstand = Math.min(150, Math.max(6, avstand * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });
    el.querySelectorAll('[data-r]').forEach(k => { k.onclick = () => { vinkel += Number(k.dataset.r) * Math.PI / 2; }; });
    const tegn = () => { if (stopp) { renderer.dispose(); return; } plasser(); renderer.render(scene, kamera); requestAnimationFrame(tegn); };
    tegn();
  }
};
