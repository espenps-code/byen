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
    const sm = liste(Store.hent('smaragd')).filter(x => x.kontoId === kontoId && x.type === 'uttak' && (x.status === 'sendt' || x.status === 'godkjent'))
      .reduce((s, x) => s + x.antall * this.innst().smaragdVerdi, 0);
    return best + sm;
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
       '.' tomt  'v' vegg  'd' dør  'w' vindu  'r' rom  's' soverom
     ========================================================= */
  tomUtgave(bredde, dybde) { return Array.from({ length: dybde }, () => '.'.repeat(bredde)); },
  analyser(soknad, innst = this.innst()) {
    const etg = (soknad.etasjer || []).filter(e => e && e.some(r => /[vdwrs]/.test(r)));
    const antEtg = etg.length;
    const bredde = (soknad.etasjer && soknad.etasjer[0] && soknad.etasjer[0][0] || '').length;
    const dybde = soknad.etasjer && soknad.etasjer[0] ? soknad.etasjer[0].length : 0;
    const tell = (e, re) => e.reduce((s, r) => s + (r.match(re) || []).length, 0);
    const forste = etg[0] || [];
    const bebygd = tell(forste, /[vdwrs]/g);
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
    etg.forEach(e => {
      const V = tell(e, /v/g), D = tell(e, /d/g), W = tell(e, /w/g);
      material += V * vegghoyde + (D + W) * Math.max(0, vegghoyde - 2);
      material += tell(e, /[vdwrs]/g); // gulv
      dorer += D; ruter += W * 2;
    });
    let taktrapper = 0;
    if (antEtg) {
      if (skratt) {
        const rader = Math.floor(kort / 2);
        taktrapper = 2 * rader * lang;
        if (kort % 2 === 1) material += lang; // mønerad
        for (let k = 1; k < Math.ceil(kort / 2); k++) material += 2 * Math.max(0, kort - 2 * k); // gavler
      } else {
        material += tell(topp, /[vdwrs]/g); // flatt tak
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
    if (antEtg > 1) legg(svevende === 0, svevende ? `${svevende} ruter i etasjen over står ikke på noe` : 'Etasjene står oppå hverandre');

    const kat = this.katalog();
    const pris = id => (kat.find(v => v.id === id) || { pris: 0 }).pris;
    const trappId = TAKTRAPP[soknad.materiale] || 'eiketrapp';
    const kostnad = stacks * pris(soknad.materiale) + dorer * pris('eikedor') + ruter * pris('glassrute') + taktrapper * pris(trappId);

    return {
      antEtg, bredde, dybde, bebygd, maksBebygd, hoyde, takHoyde, sjekker, ok: sjekker.every(s => s.ok),
      estimat: { material, stacks, dorer, ruter, taktrapper, trappId, kostnad }
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
    const t = { utkast: 'Utkast', sendt: 'Venter', godkjent: 'Godkjent', levert: 'Levert', avvist: 'Avvist', samler: 'Samler støtte', klar: 'Klar til avstemming', vedtatt: 'Vedtatt', forkastet: 'Forkastet' }[status] || status;
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
    const F = { v: '#7a5230', d: '#c98a3d', w: '#7ec8e3', r: '#f3ead6', s: '#d9c8f0' };
    let r = `<svg class="plan" viewBox="0 0 ${b * celle} ${d * celle}" width="${b * celle}" height="${d * celle}">`;
    r += `<rect width="${b * celle}" height="${d * celle}" fill="#e3efd3"/>`;
    rader.forEach((rad, y) => [...rad].forEach((c, x) => {
      if (c !== '.') r += `<rect x="${x * celle}" y="${y * celle}" width="${celle}" height="${celle}" fill="${F[c]}"/>`;
    }));
    for (let i = 0; i <= b; i++) r += `<line x1="${i * celle}" y1="0" x2="${i * celle}" y2="${d * celle}" stroke="#00000014"/>`;
    for (let i = 0; i <= d; i++) r += `<line x1="0" y1="${i * celle}" x2="${b * celle}" y2="${i * celle}" stroke="#00000014"/>`;
    return r + '</svg>';
  },
  /* Fasade sett forfra (fra sør = nederste rad) */
  fasadeSvg(soknad, innst, celle = 14) {
    const etg = (soknad.etasjer || []).filter(e => e && e.some(r => /[vdwrs]/.test(r)));
    if (!etg.length) return '';
    const b = etg[0][0].length, vh = innst.etasjeHoyde - 1;
    const skratt = soknad.tak === 'skratt';
    // Fremste rute i hver kolonne per etasje
    const front = e => Array.from({ length: b }, (_, x) => { for (let y = e.length - 1; y >= 0; y--) if (e[y][x] !== '.') return e[y][x]; return null; });
    const fr = etg.map(front);
    const kol = fr[fr.length - 1].map((c, x) => c ? x : -1).filter(x => x >= 0);
    const x0 = Math.min(...fr[0].map((c, x) => c ? x : 99)), x1 = Math.max(...fr[0].map((c, x) => c ? x : -1));
    const tx0 = kol.length ? Math.min(...kol) : x0, tx1 = kol.length ? Math.max(...kol) : x1;
    const takH = skratt ? Math.ceil((tx1 - tx0 + 1) / 2) : 1;
    const hoyde = etg.length * (vh + 1) + takH;
    const W = (b + 2) * celle, H = (hoyde + 1) * celle;
    let r = `<svg class="fasade" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#dceefa"/>`;
    r += `<rect y="${H - celle}" width="${W}" height="${celle}" fill="#6ab04c"/>`;
    let bunn = H - celle;
    fr.forEach((rad, i) => {
      rad.forEach((c, x) => {
        if (!c) return;
        for (let h = 0; h < vh + 1; h++) {
          const y = bunn - (h + 1) * celle;
          let f = '#b8925a';
          if (h === 0 || h === vh) f = '#8a6438';
          if (c === 'd' && (h === 1 || h === 2)) f = '#5a3c22';
          if (c === 'w' && (h === 1 || h === 2)) f = '#9fd6ea';
          r += `<rect x="${(x + 1) * celle}" y="${y}" width="${celle}" height="${celle}" fill="${f}" stroke="#0000001a"/>`;
        }
      });
      bunn -= (vh + 1) * celle;
    });
    if (skratt) {
      const w = tx1 - tx0 + 1;
      for (let k = 0; k < takH; k++) {
        const fra = tx0 + k, til = tx1 - k;
        for (let x = fra; x <= til; x++) r += `<rect x="${(x + 1) * celle}" y="${bunn - (k + 1) * celle}" width="${celle}" height="${celle}" fill="${x === fra || x === til ? '#4a4a52' : '#8a6438'}" stroke="#0000001a"/>`;
      }
    } else {
      for (let x = tx0; x <= tx1; x++) r += `<rect x="${(x + 1) * celle}" y="${bunn - celle}" width="${celle}" height="${celle}" fill="#4a4a52" stroke="#0000001a"/>`;
    }
    return r + '</svg>';
  }
};
