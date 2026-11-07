/* =========================================================
   ELEVSIDEN
   ========================================================= */
const BUDSJETTKAT = {
  bygg: 'Byggematerialer', interior: 'Interiør og lys', mat: 'Mat og husholdning', hage: 'Hage',
  forsikring: 'Forsikring', lotto: 'Lotto', skatt: 'Skatt', fritid: 'Tilbud og fritid',
  kontanter: 'Smaragder (kontanter)', annet: 'Annet'
};
const VAREKAT_TIL_BUDSJETT = { bygg: 'bygg', detaljer: 'bygg', interior: 'interior', lys: 'interior', husholdning: 'mat', hage: 'hage' };
const VERKTOY = [
  { k: 'v', navn: 'Vegg', farge: '#7a5230' }, { k: 'w', navn: 'Vindu', farge: '#7ec8e3' },
  { k: 'd', navn: 'Dør', farge: '#c98a3d' }, { k: 'r', navn: 'Rom', farge: '#f3ead6' },
  { k: 's', navn: 'Soverom', farge: '#d9c8f0' }, { k: '.', navn: 'Viskelær', farge: '#e3efd3' }
];

const Elev = {
  kontoId: sessionStorage.getItem('byenvar_elev') || null,
  side: 'hjem',
  kurv: {}, feilForsok: 0, kategori: 'alle', sok: '', handleFor: null,
  tegning: null, verktoy: 'v', etasje: 0, rektangel: true, aapnePost: new Set(),

  get konto() { return this.kontoId ? B.konto(this.kontoId) : null; },

  /* ---------- Hovedtegning ---------- */
  tegn() {
    const k = this.konto;
    if (!k) { this.kontoId = null; return this.tegnInnlogging(); }
    if (!k.avtale || !k.avtale.signert) return this.tegnAvtale();
    // Ikke tegn tegnebrettet på nytt mens eleven tegner
    if (this.side === 'bygg' && $('#brett') && this.tegning) {
      const lagret = Store.hent('soknader/' + this.kontoId);
      const status = lagret ? lagret.status : 'utkast';
      if (status === 'utkast' || status === this.tegning.status) { this.tegnMeny(); return; }
    }
    const sider = { hjem: 'sideHjem', bygg: 'sideBygg', butikk: 'sideButikk', bank: 'sideBank', budsjett: 'sideBudsjett', regnskap: 'sideRegnskap', post: 'sidePost', jobb: 'sideJobb', bystyre: 'sideBystyre' };
    $('#rot').innerHTML = `<div class="app"><nav class="meny" id="elevMeny"></nav><main class="innhold" id="elevInnhold">${this[sider[this.side] || 'sideHjem']()}</main></div>`;
    this.tegnMeny();
    if (this.side === 'bygg') this.monterBrett();
  },
  gaaTil(side) { this.side = side; this.tegn(); window.scrollTo({ top: 0, behavior: 'smooth' }); },

  tegnMeny() {
    const el = $('#elevMeny'); if (!el) return;
    const k = this.konto;
    const ulest = B.ulest(k.id);
    const s = Store.hent('soknader/' + k.id);
    const punkt = (id, ik, navn, teller) => `<button class="punkt ${this.side === id ? 'aktiv' : ''}" onclick="Elev.gaaTil('${id}')"><span class="ik">${ik}</span>${navn}${teller ? `<span class="teller">${teller}</span>` : ''}</button>`;
    el.innerHTML = `
      <div class="hvem"><div class="dempet">Tomt ${esc(k.tomt)}</div><div class="navn">${esc(k.navn)}</div>
        <div class="dempet">${esc(B.medlemmer(k).join(' og '))}</div>
        <div class="saldo" style="margin-top:8px">${kr(B.saldo(k.id))}</div><div class="dempet liten">på konto</div></div>
      ${punkt('hjem', '🏡', 'Hjem')}
      ${punkt('bygg', '📐', 'Byggesøknad', s && s.status === 'avvist' ? '!' : '')}
      ${punkt('butikk', '🛒', 'Butikken')}
      ${punkt('post', '✉️', 'Postkassen', ulest || '')}
      <div class="skille"></div>
      ${punkt('bank', '🏦', 'Banken')}
      ${punkt('budsjett', '📊', 'Budsjett')}
      ${punkt('regnskap', '📒', 'Regnskap')}
      <div class="skille"></div>
      ${punkt('jobb', '💼', 'Jobb')}
      ${punkt('bystyre', '🏛️', 'Bystyret')}
      <div class="skille"></div>
      <button class="punkt" onclick="Elev.loggUt()"><span class="ik">🚪</span>Logg ut</button>`;
  },

  /* ---------- Innlogging ---------- */
  tegnInnlogging() {
    const hh = B.kontoer('hh');
    $('#rot').innerHTML = `<div class="innlogging"><div class="kort">
      <h2>Logg inn</h2>
      ${hh.length ? `
        <label class="felt" for="velgHh">Husholdning</label>
        <select id="velgHh">${hh.map(h => `<option value="${h.id}">Tomt ${esc(h.tomt)} – ${esc(h.navn)}</option>`).join('')}</select>
        <label class="felt" for="elevPin">PIN-kode</label>
        <input id="elevPin" class="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" onkeydown="if(event.key==='Enter')Elev.loggInn()">
        <div id="innFeil"></div>
        <p style="margin-top:16px"><button onclick="Elev.loggInn()">Logg inn</button></p>`
      : UI.tom('Bysjefen har ikke lagt inn noen husholdninger ennå.')}
    </div></div>`;
  },
  loggInn() {
    const id = $('#velgHh').value, k = B.konto(id), pin = $('#elevPin').value;
    if (!k || k.pinHash !== hashPin(pin, id)) { $('#innFeil').innerHTML = '<div class="melding feil">Feil PIN-kode. Prøv igjen.</div>'; return; }
    this.kontoId = id; sessionStorage.setItem('byenvar_elev', id);
    this.side = 'hjem'; this.kurv = {}; this.tegning = null; this.handleFor = null;
    this.tegn();
  },
  loggUt() { this.kontoId = null; sessionStorage.removeItem('byenvar_elev'); this.tegn(); },

  /* ---------- Avtale ---------- */
  tegnAvtale() {
    const I = B.innst(), k = this.konto;
    const tall = [...Array(10).keys()];
    $('#rot').innerHTML = `<div class="innlogging" style="max-width:640px"><div class="kort">
      <h1 style="color:var(--jord-mork)">Avtale</h1>
      <p>Velkommen til ${esc(I.byNavn || 'byen')}, ${esc(B.medlemmer(k).join(' og ') || k.navn)}! Før dere kan flytte inn, må dere fylle ut avtalen.</p>
      <div class="melding info">Dere får en startbonus på <b>${kr(I.startbonus)}</b> til å bygge og innrede huset.</div>
      <h3>Forsikring – ${kr(I.forsikringPerUke)} per uke</h3>
      <p class="dempet">Med forsikring blir det mye billigere hvis noe går galt i huset (vannlekkasje, skadedyr …).</p>
      <div class="rad"><label><input type="radio" name="fors" value="ja"> Ja, vi vil ha forsikring</label>
        <label><input type="radio" name="fors" value="nei"> Nei takk</label></div>
      <h3>Lotto – ${kr(I.lottoPerUke)} per uke</h3>
      <p class="dempet">Hver uke trekkes tre tall. Tre rette gir ${kr(I.lottoPremie3)}${I.lottoPremie2 ? `, to rette gir ${kr(I.lottoPremie2)}` : ''}.</p>
      <div class="rad"><label><input type="radio" name="lotto" value="ja" onchange="$('#lottoTall').classList.remove('skjult')"> Ja, vi tipper</label>
        <label><input type="radio" name="lotto" value="nei" onchange="$('#lottoTall').classList.add('skjult')"> Nei takk</label></div>
      <div id="lottoTall" class="skjult" style="margin-top:10px"><p class="dempet">Velg tre forskjellige tall:</p>
        <div class="rad">${tall.map(t => `<label style="background:var(--flate);padding:6px 10px;border-radius:10px"><input type="checkbox" class="lt" value="${t}" onchange="Elev.begrensLotto(this)"> ${t}</label>`).join('')}</div></div>
      <h3>Regler</h3>
      <label class="sjekk"><input type="checkbox" id="regler"> Vi skal følge alle reglene i byen.</label>
      <label class="sjekk"><input type="checkbox" id="respekt"> Vi skal respektere de andre i byen.</label>
      <label class="felt" for="signatur">Signatur (skriv navnene deres)</label>
      <input id="signatur" style="width:100%" placeholder="${esc(B.medlemmer(k).join(' og '))}">
      <div id="avtaleFeil"></div>
      <div class="rad" style="margin-top:16px"><button onclick="Elev.signerAvtale()">Signer avtalen</button>
        <button class="sek" onclick="Elev.loggUt()">Logg ut</button></div>
    </div></div>`;
  },
  begrensLotto(boks) {
    const valgt = [...document.querySelectorAll('.lt:checked')];
    if (valgt.length > 3) boks.checked = false;
  },
  async signerAvtale() {
    const fors = document.querySelector('input[name=fors]:checked'), lotto = document.querySelector('input[name=lotto]:checked');
    const tall = [...document.querySelectorAll('.lt:checked')].map(b => Number(b.value));
    const feil = [];
    if (!fors) feil.push('Velg om dere vil ha forsikring.');
    if (!lotto) feil.push('Velg om dere vil tippe lotto.');
    if (lotto && lotto.value === 'ja' && tall.length !== 3) feil.push('Velg nøyaktig tre lottotall.');
    if (!$('#regler').checked || !$('#respekt').checked) feil.push('Dere må godta reglene.');
    if ($('#signatur').value.trim().length < 2) feil.push('Skriv navnene deres som signatur.');
    if (feil.length) { $('#avtaleFeil').innerHTML = `<div class="melding feil">${feil.join('<br>')}</div>`; return; }
    await Store.sett('kontoer/' + this.kontoId + '/avtale', {
      forsikring: fors.value === 'ja', lotto: lotto.value === 'ja', tall: lotto.value === 'ja' ? tall : [],
      signatur: $('#signatur').value.trim(), signert: true, tid: Date.now()
    });
    UI.toast('Avtalen er signert. Velkommen!');
  },

  /* ---------- Hjem ---------- */
  sideHjem() {
    const k = this.konto, I = B.innst();
    const s = Store.hent('soknader/' + k.id);
    const best = liste(Store.hent('bestillinger')).filter(b => b.kontoId === k.id);
    const jobber = B.medlemmer(k).map((n, i) => B.jobbFor(k.id, i));
    const sjekk = (status, tekst, side) => `<div class="sjekk ${status}" ${side ? `style="cursor:pointer" onclick="Elev.gaaTil('${side}')"` : ''}><span class="pr">${status === 'ja' ? '✓' : status === 'nei' ? '!' : '·'}</span><span>${tekst}</span></div>`;
    const sStatus = !s ? ['venter', 'Tegn huset og send byggesøknad'] : s.status === 'godkjent' ? ['ja', 'Byggesøknaden er godkjent'] : s.status === 'sendt' ? ['venter', 'Byggesøknaden venter på svar fra Bysjefen'] : s.status === 'avvist' ? ['nei', 'Byggesøknaden ble ikke godkjent – se meldingen og prøv igjen'] : ['venter', 'Byggesøknaden er ikke sendt ennå'];
    const post = B.post(k.id).slice(0, 3);
    return `
      <div class="sidetittel"><h1>Hei, ${esc(B.medlemmer(k).join(' og ') || k.navn)}!</h1><p class="dempet">Tomt ${esc(k.tomt)} i ${esc(I.byNavn || 'byen')}</p></div>
      <div class="rutenett" style="margin-bottom:18px">
        <div class="stat"><div class="tall">${kr(B.saldo(k.id))}</div><div class="etikett">På konto</div></div>
        <div class="stat"><div class="tall">${kr(B.disponibelt(k.id))}</div><div class="etikett">Disponibelt (etter bestillinger som venter)</div></div>
        <div class="stat klikk" onclick="Elev.gaaTil('post')"><div class="tall">${B.ulest(k.id)}</div><div class="etikett">Uleste brev</div></div>
      </div>
      <div class="rutenett to">
        <div class="kort"><h2>Dette må dere gjøre</h2>
          ${sjekk('ja', 'Avtalen er signert')}
          ${sjekk(sStatus[0], sStatus[1], 'bygg')}
          ${sjekk(best.length ? 'ja' : 'venter', best.length ? `${best.length} bestilling${best.length === 1 ? '' : 'er'} sendt` : 'Bestill materialer i butikken', 'butikk')}
          ${sjekk(liste(Store.hent('regnskap/' + k.id)).length ? 'ja' : 'venter', 'Før regnskap over inntekter og utgifter', 'regnskap')}
          ${B.jobber().length ? sjekk(jobber.every(Boolean) ? 'ja' : 'venter', jobber.every(Boolean) ? 'Alle har jobb' : 'Søk jobb i byen', 'jobb') : ''}
        </div>
        <div class="kort"><h2>Siste post</h2>
          ${post.length ? post.map(p => `<div class="sjekk ${p.lest ? 'venter' : 'nei'}" style="cursor:pointer" onclick="Elev.gaaTil('post')"><span class="pr">✉</span><span><b>${esc(p.tittel)}</b><br><span class="dempet">${dato(p.tid)}</span></span></div>`).join('') : UI.tom('Postkassen er tom.')}
        </div>
      </div>
      <div class="kort"><h2>Avtalen deres</h2>
        <p>Forsikring: <b>${k.avtale.forsikring ? 'Ja' : 'Nei'}</b> · Lotto: <b>${k.avtale.lotto ? 'Ja, tallene ' + (k.avtale.tall || []).join(', ') : 'Nei'}</b></p>
      </div>`;
  },

  /* =========================================================
     BYGGESØKNAD
     ========================================================= */
  lastTegning() {
    const I = B.innst(), k = this.konto;
    const lagret = Store.hent('soknader/' + k.id);
    const b = Number(k.tomtB) || I.tomtBredde, d = Number(k.tomtD) || I.tomtDybde;
    const maksEtg = Math.max(1, Math.floor(I.maksHoyde / I.etasjeHoyde));
    if (lagret) {
      const t = JSON.parse(JSON.stringify(lagret));
      t.etasjer = Array.from({ length: maksEtg }, (_, i) => (t.etasjer && t.etasjer[i] && t.etasjer[i].length === d) ? t.etasjer[i] : B.tomUtgave(b, d));
      t.elevEstimat = t.elevEstimat || {};
      this.tegning = t;
    } else {
      this.tegning = { status: 'utkast', tak: 'flatt', materiale: '', etasjer: Array.from({ length: maksEtg }, () => B.tomUtgave(b, d)), elevEstimat: {} };
    }
    this.etasje = 0;
  },
  sideBygg() {
    const I = B.innst();
    if (!this.tegning || this.tegning._konto !== this.kontoId) { this.lastTegning(); this.tegning._konto = this.kontoId; }
    const lagret = Store.hent('soknader/' + this.kontoId);
    const status = lagret ? lagret.status : 'utkast';
    if (lagret && status !== this.tegning.status && (status === 'godkjent' || status === 'sendt' || status === 'avvist')) { this.lastTegning(); this.tegning._konto = this.kontoId; }
    if (status === 'sendt' || status === 'godkjent') return this.byggVisning(lagret);
    const t = this.tegning;
    const maksEtg = t.etasjer.length;
    return `
      <div class="sidetittel"><h1>Byggesøknad</h1><p class="dempet">Tegn huset ovenfra, rute for rute. Hver rute er én blokk i Minecraft.</p></div>
      ${status === 'avvist' ? `<div class="melding feil"><b>Søknaden ble ikke godkjent.</b> ${esc(lagret.melding || '')} Rett opp tegningen og send på nytt.</div>` : ''}
      <div class="kort">
        <h2>Regler i ${esc(I.byNavn || 'kommunen')}</h2>
        <div class="rutenett">
          <div>🏠 Bygg på maks <b>${Math.round(I.maksAndel * 100)} %</b> av tomten</div>
          <div>📏 Maks høyde <b>${I.maksHoyde} blokker</b></div>
          <div>🪟 Alle soverom må ha <b>vindu</b></div>
          <div>⛏️ Det er ikke lov å bygge under bakken</div>
        </div>
      </div>
      <div class="tegn">
        <div class="kort">
          <div class="rad mellom" style="margin-bottom:10px">
            <div class="rad">${maksEtg > 1 ? Array.from({ length: maksEtg }, (_, i) => `<button class="sma ${this.etasje === i ? '' : 'sek'}" onclick="Elev.velgEtasje(${i})">${i + 1}. etasje</button>`).join('') : '<b>1. etasje</b>'}</div>
            <div class="rad">
              <label class="liten"><input type="checkbox" ${this.rektangel ? 'checked' : ''} onchange="Elev.rektangel=this.checked" data-lov="1"> Tegn som rektangel</label>
              ${this.etasje > 0 ? `<button class="sma sek" onclick="Elev.kopierYttervegg()">Kopier ytterveggene fra etasjen under</button>` : ''}
              <button class="sma sek" onclick="Elev.tomEtasje()">Tøm etasjen</button>
            </div>
          </div>
          <div class="verktoy">${VERKTOY.map(v => `<button class="${this.verktoy === v.k ? 'aktiv' : ''}" onclick="Elev.velgVerktoy('${v.k}', this)"><span class="prøve" style="background:${v.farge}"></span>${v.navn}</button>`).join('')}</div>
          <div class="brett-ramme"><div class="brett" id="brett"></div></div>
          <p class="dempet liten" style="margin-top:8px">Tips: Tegn ytterveggene som et rektangel, fyll innsiden med «Rom» og «Soverom», og sett dører og vinduer i veggene. Skraverte ruter viser etasjen under.</p>
        </div>
        <div>
          <div class="kort">
            <h2>Huset</h2>
            <label class="felt" for="materiale">Byggemateriale</label>
            <select id="materiale" data-lov="1" onchange="Elev.settTegning('materiale', this.value)" style="width:100%">
              <option value="">Velg …</option>
              ${BYGGEMATERIALER.map(id => { const v = B.vare(id); return v ? `<option value="${id}" ${t.materiale === id ? 'selected' : ''}>${esc(v.navn)} (${kr(v.pris)} per stack)</option>` : ''; }).join('')}
            </select>
            <label class="felt">Tak</label>
            <div class="rad"><label><input type="radio" name="tak" value="flatt" ${t.tak !== 'skratt' ? 'checked' : ''} onchange="Elev.settTegning('tak','flatt')" data-lov="1"> Flatt</label>
              <label><input type="radio" name="tak" value="skratt" ${t.tak === 'skratt' ? 'checked' : ''} onchange="Elev.settTegning('tak','skratt')" data-lov="1"> Skrått</label></div>
          </div>
          <div class="kort" id="analyse"></div>
          <div class="kort">
            <h2>Deres eget estimat</h2>
            <p class="dempet">Regn ut hvor mye dere trenger <i>før</i> dere sender. Etter at søknaden er godkjent, får dere se hvor nær dere var!</p>
            <table>
              <tr><td>Stacks byggemateriale</td><td class="tall"><input type="number" min="0" id="estStacks" value="${t.elevEstimat.stacks ?? ''}" onchange="Elev.settEstimat('stacks', this.value)"></td></tr>
              <tr><td>Dører</td><td class="tall"><input type="number" min="0" id="estDorer" value="${t.elevEstimat.dorer ?? ''}" onchange="Elev.settEstimat('dorer', this.value)"></td></tr>
              <tr><td>Glassruter</td><td class="tall"><input type="number" min="0" id="estRuter" value="${t.elevEstimat.ruter ?? ''}" onchange="Elev.settEstimat('ruter', this.value)"></td></tr>
              ${t.tak === 'skratt' ? `<tr><td>Trapper til taket</td><td class="tall"><input type="number" min="0" value="${t.elevEstimat.trapper ?? ''}" onchange="Elev.settEstimat('trapper', this.value)"></td></tr>` : ''}
            </table>
            <label class="felt" for="estForklaring">Hvordan regnet dere?</label>
            <textarea id="estForklaring" onchange="Elev.settEstimat('forklaring', this.value)" placeholder="F.eks.: Veggen er 40 ruter rundt, og 3 blokker høy …">${esc(t.elevEstimat.forklaring || '')}</textarea>
            <div id="sendFeil"></div>
            <div class="rad" style="margin-top:12px"><button onclick="Elev.sendSoknad()">Send byggesøknad</button><span class="dempet liten" id="lagretTekst"></span></div>
          </div>
        </div>
      </div>`;
  },
  byggVisning(s) {
    const I = B.innst(), a = B.analyser(s, I), e = a.estimat, el = s.elevEstimat || {};
    const godkjent = s.status === 'godkjent';
    const mat = B.vare(s.materiale);
    const diff = (elev, fasit) => {
      if (elev === undefined || elev === '' || elev === null) return '<span class="dempet">–</span>';
      const d = Number(elev) - fasit;
      return d === 0 ? '<span class="pluss">Helt likt! 🎯</span>' : `<span class="${Math.abs(d) <= Math.max(1, fasit * 0.15) ? 'pluss' : 'minus'}">${d > 0 ? '+' : ''}${d}</span>`;
    };
    return `
      <div class="sidetittel"><h1>Byggesøknad</h1></div>
      ${godkjent ? `<div class="melding ok"><b>Byggesøknaden er godkjent!</b> ${esc(s.melding || '')} Husk å bygge huset slik dere har tegnet det.</div>`
        : `<div class="melding advarsel"><b>Søknaden er sendt.</b> Bysjefen ser på den så snart som mulig.</div>`}
      <div class="kort"><h2>Tegningene</h2>
        <div class="tegninger">
          ${s.etasjer.map((e2, i) => e2 && e2.some(r => /[vdwrs]/.test(r)) ? `<figure>${UI.planSvg(e2, 16)}<figcaption>Plantegning ${i + 1}. etasje</figcaption></figure>` : '').join('')}
          <figure>${UI.fasadeSvg(s, I, 12)}<figcaption>Fasade forfra</figcaption></figure>
        </div>
        <p style="margin-top:12px">Materiale: <b>${esc(mat ? mat.navn : '?')}</b> · Tak: <b>${s.tak === 'skratt' ? 'Skrått' : 'Flatt'}</b> · ${a.antEtg} etasje${a.antEtg === 1 ? '' : 'r'} · Bebygd areal: <b>${a.bebygd} ruter</b></p>
      </div>
      ${godkjent ? `
      <div class="kort"><h2>Hvor nær var dere?</h2>
        <table class="sammenlign">
          <tr><th></th><th class="tall">Deres estimat</th><th class="tall">Byens estimat</th><th class="tall">Forskjell</th></tr>
          <tr><td>Stacks ${esc(mat ? mat.navn.toLowerCase() : '')} (${e.material} blokker)</td><td class="tall">${el.stacks ?? '–'}</td><td class="tall">${e.stacks}</td><td class="tall">${diff(el.stacks, e.stacks)}</td></tr>
          <tr><td>Dører</td><td class="tall">${el.dorer ?? '–'}</td><td class="tall">${e.dorer}</td><td class="tall">${diff(el.dorer, e.dorer)}</td></tr>
          <tr><td>Glassruter</td><td class="tall">${el.ruter ?? '–'}</td><td class="tall">${e.ruter}</td><td class="tall">${diff(el.ruter, e.ruter)}</td></tr>
          ${s.tak === 'skratt' ? `<tr><td>Trapper til taket</td><td class="tall">${el.trapper ?? '–'}</td><td class="tall">${e.taktrapper}</td><td class="tall">${diff(el.trapper, e.taktrapper)}</td></tr>` : ''}
        </table>
        <p class="dempet" style="margin-top:10px">Byens estimat regner med vegger på ${I.etasjeHoyde - 1} blokker, gulv i hver etasje, dører og vinduer på 2 blokker og ${s.tak === 'skratt' ? 'skråtak med trapper' : 'flatt tak'}. Det er et overslag – det kan lønne seg å bestille litt ekstra.</p>
        <p>Byens overslag over pris: <b>ca. ${kr(e.kostnad)}</b></p>
        <button onclick="Elev.bestillFraEstimat()">Legg byens estimat i handlekurven</button>
      </div>` : ''}`;
  },
  monterBrett() {
    const brett = $('#brett'); if (!brett || !this.tegning) return;
    const t = this.tegning, rader = t.etasjer[this.etasje], under = this.etasje > 0 ? t.etasjer[this.etasje - 1] : null;
    const b = rader[0].length;
    brett.style.gridTemplateColumns = `repeat(${b}, auto)`;
    let html = '';
    rader.forEach((r, y) => [...r].forEach((c, x) => {
      const u = under && under[y][x] !== '.' && c === '.' ? ' under' : '';
      html += `<div class="celle c-${c === '.' ? 'tom' : c}${u}" data-x="${x}" data-y="${y}"></div>`;
    }));
    brett.innerHTML = html;
    let start = null, forrige = null;
    const celle = ev => { const el = document.elementFromPoint(ev.clientX, ev.clientY); return el && el.classList.contains('celle') ? [Number(el.dataset.x), Number(el.dataset.y)] : null; };
    const enkelt = ['d', 'w'].includes(this.verktoy);
    brett.onpointerdown = ev => {
      const c = celle(ev); if (!c) return;
      ev.preventDefault(); brett.setPointerCapture(ev.pointerId);
      start = c; forrige = c;
      if (!this.rektangel || ['d', 'w'].includes(this.verktoy)) this.malCelle(c[0], c[1]);
      else this.forhand(start, c);
    };
    brett.onpointermove = ev => {
      if (!start) return;
      const c = celle(ev); if (!c || (forrige && c[0] === forrige[0] && c[1] === forrige[1])) return;
      forrige = c;
      if (!this.rektangel || ['d', 'w'].includes(this.verktoy)) this.malCelle(c[0], c[1]);
      else this.forhand(start, c);
    };
    const slutt = () => {
      if (start && this.rektangel && !['d', 'w'].includes(this.verktoy) && forrige) this.malRektangel(start, forrige);
      start = null; forrige = null;
      document.querySelectorAll('.celle.forhånd').forEach(e => e.classList.remove('forhånd'));
      this.oppdaterAnalyse(); this.autolagre();
    };
    brett.onpointerup = slutt; brett.onpointercancel = slutt;
    this.oppdaterAnalyse();
  },
  settCelle(x, y, verdi) {
    const rader = this.tegning.etasjer[this.etasje];
    const r = rader[y];
    rader[y] = r.substring(0, x) + verdi + r.substring(x + 1);
    const el = document.querySelector(`.celle[data-x="${x}"][data-y="${y}"]`);
    if (el) {
      const under = this.etasje > 0 && this.tegning.etasjer[this.etasje - 1][y][x] !== '.' && verdi === '.';
      el.className = 'celle c-' + (verdi === '.' ? 'tom' : verdi) + (under ? ' under' : '');
    }
  },
  malCelle(x, y) { this.settCelle(x, y, this.verktoy); },
  forhand(a, b) {
    document.querySelectorAll('.celle.forhånd').forEach(e => e.classList.remove('forhånd'));
    const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])], [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (this.verktoy === 'v' && !(x === x0 || x === x1 || y === y0 || y === y1)) continue;
      const el = document.querySelector(`.celle[data-x="${x}"][data-y="${y}"]`); if (el) el.classList.add('forhånd');
    }
  },
  malRektangel(a, b) {
    const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])], [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const kant = x === x0 || x === x1 || y === y0 || y === y1;
      if (this.verktoy === 'v') { if (kant) this.settCelle(x, y, 'v'); }
      else if (this.verktoy === 'r' || this.verktoy === 's') { if (this.tegning.etasjer[this.etasje][y][x] === '.' || /[rs]/.test(this.tegning.etasjer[this.etasje][y][x])) this.settCelle(x, y, this.verktoy); }
      else this.settCelle(x, y, this.verktoy);
    }
  },
  velgVerktoy(k, knapp) {
    this.verktoy = k;
    document.querySelectorAll('.verktoy button').forEach(b => b.classList.toggle('aktiv', b === knapp));
  },
  velgEtasje(i) { this.etasje = i; this.tegnBygg(); },
  tegnBygg() { $('#elevInnhold').innerHTML = this.sideBygg(); this.monterBrett(); },
  kopierYttervegg() {
    const under = this.tegning.etasjer[this.etasje - 1];
    under.forEach((r, y) => [...r].forEach((c, x) => {
      if (c === '.') return;
      const kant = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ((under[y + dy] || '')[x + dx] || '.') === '.');
      this.settCelle(x, y, kant ? 'v' : 'r');
    }));
    this.oppdaterAnalyse(); this.autolagre();
  },
  tomEtasje() {
    if (!confirm('Tømme hele denne etasjen?')) return;
    const r = this.tegning.etasjer[this.etasje];
    this.tegning.etasjer[this.etasje] = B.tomUtgave(r[0].length, r.length);
    this.tegnBygg(); this.autolagre();
  },
  settTegning(felt, verdi) {
    this.tegning[felt] = verdi;
    if (felt === 'tak') { this.autolagre(); this.tegnBygg(); return; }
    this.oppdaterAnalyse(); this.autolagre();
  },
  settEstimat(felt, verdi) {
    this.tegning.elevEstimat[felt] = felt === 'forklaring' ? verdi : (verdi === '' ? null : Math.max(0, parseInt(verdi) || 0));
    this.autolagre();
  },
  oppdaterAnalyse() {
    const el = $('#analyse'); if (!el) return;
    const I = B.innst(), a = B.analyser(this.tegning, I);
    el.innerHTML = `<h2>Sjekk av reglene</h2>
      ${a.sjekker.map(s => `<div class="sjekk ${s.ok ? 'ja' : 'nei'}"><span class="pr">${s.ok ? '✓' : '!'}</span><span>${s.tekst}</span></div>`).join('')}
      ${a.antEtg ? `<h3>Fasade forfra</h3>${UI.fasadeSvg(this.tegning, I, 10)}` : ''}`;
  },
  autolagre() {
    clearTimeout(this._lagreTimer);
    const t = $('#lagretTekst'); if (t) t.textContent = 'Lagrer …';
    this._lagreTimer = setTimeout(async () => {
      const { _konto, ...data } = this.tegning;
      data.status = 'utkast'; this.tegning.status = 'utkast'; data.tid = Date.now();
      await Store.sett('soknader/' + this.kontoId, data);
      const t2 = $('#lagretTekst'); if (t2) t2.textContent = 'Utkast lagret ✓';
    }, 900);
  },
  async sendSoknad() {
    clearTimeout(this._lagreTimer);
    const a = B.analyser(this.tegning), e = this.tegning.elevEstimat;
    const feil = [];
    if (!a.ok) feil.push('Tegningen følger ikke alle reglene ennå (se sjekklisten).');
    if (e.stacks == null || e.dorer == null || e.ruter == null) feil.push('Fyll ut deres eget estimat først.');
    if (this.tegning.tak === 'skratt' && e.trapper == null) feil.push('Regn ut hvor mange trapper dere trenger til taket.');
    if (feil.length) { $('#sendFeil').innerHTML = `<div class="melding feil">${feil.join('<br>')}</div>`; return; }
    const { _konto, ...data } = this.tegning;
    data.status = 'sendt'; data.tid = Date.now(); data.melding = '';
    this.tegning.status = 'sendt';
    await Store.sett('soknader/' + this.kontoId, data);
    UI.toast('Byggesøknaden er sendt!');
    this.tegn();
  },
  bestillFraEstimat() {
    const s = Store.hent('soknader/' + this.kontoId), e = B.analyser(s).estimat;
    this.kurv = {};
    if (e.stacks) this.kurv[s.materiale] = e.stacks;
    if (e.dorer) this.kurv.eikedor = e.dorer;
    if (e.ruter) this.kurv.glassrute = e.ruter;
    if (e.taktrapper) this.kurv[e.trappId] = e.taktrapper;
    this.handleFor = this.kontoId;
    this.gaaTil('butikk');
    UI.toast('Estimatet ligger i handlekurven. Juster om dere vil!');
  },

  /* =========================================================
     BUTIKK
     ========================================================= */
  mineKontoer() {
    // Egen husholdning + bedrifter der noen i husholdningen jobber
    const k = this.konto, res = [k];
    B.medlemmer(k).forEach((n, i) => {
      const j = B.jobbFor(k.id, i);
      if (j && j.bedriftId) { const b = B.konto(j.bedriftId); if (b && !res.find(x => x.id === b.id)) res.push(b); }
    });
    return res;
  },
  kontoVelger(funksjon) {
    const kontoer = this.mineKontoer();
    if (kontoer.length < 2) return '';
    const valgt = this.handleFor || this.kontoId;
    return `<div class="rad" style="margin-bottom:14px"><span class="dempet">Konto:</span>${kontoer.map(k => `<button class="sma ${k.id === valgt ? '' : 'sek'}" onclick="Elev.handleFor='${k.id}';Elev.kurv={};${funksjon}">${k.type === 'hh' ? 'Husholdningen' : esc(k.navn)}</button>`).join('')}</div>`;
  },
  sideButikk() {
    const I = B.innst(), kontoId = this.handleFor || this.kontoId, konto = B.konto(kontoId);
    const s = Store.hent('soknader/' + this.kontoId);
    if (konto.type === 'hh' && I.kreverByggesoknad && (!s || s.status !== 'godkjent')) {
      return `<div class="sidetittel"><h1>Butikken</h1></div>${this.kontoVelger("Elev.tegn()")}
        <div class="kort">${UI.tom('Butikken åpner for dere når byggesøknaden er godkjent. <br><br><button onclick="Elev.gaaTil(\'bygg\')">Gå til byggesøknaden</button>')}</div>`;
    }
    const kat = B.katalog().filter(v => v.aktiv);
    const sok = this.sok.toLowerCase();
    const vis = kat.filter(v => (this.kategori === 'alle' || v.kat === this.kategori) && (!sok || v.navn.toLowerCase().includes(sok)));
    return `
      <div class="sidetittel"><h1>Butikken</h1><p class="dempet">Det dere bestiller nå, ligger i kisten på tomten neste gang dere spiller.</p></div>
      ${this.kontoVelger("Elev.tegn()")}
      <div class="butikk">
        <div>
          <div class="rad" style="margin-bottom:10px"><input type="search" placeholder="Søk etter vare …" value="${esc(this.sok)}" oninput="Elev.sok=this.value;Elev.tegnVarer()" data-lov="1" style="flex:1;min-width:200px"></div>
          <div class="chips"><button class="${this.kategori === 'alle' ? 'aktiv' : ''}" onclick="Elev.kategori='alle';Elev.tegn()">Alle</button>
            ${Object.entries(KATEGORIER).map(([id, n]) => `<button class="${this.kategori === id ? 'aktiv' : ''}" onclick="Elev.kategori='${id}';Elev.tegn()">${n}</button>`).join('')}</div>
          <div class="varer" id="varer">${this.varerHtml(vis)}</div>
        </div>
        <div class="kurv kort" id="kurv">${this.kurvHtml()}</div>
      </div>`;
  },
  varerHtml(vis) {
    if (!vis.length) return UI.tom('Ingen varer funnet.');
    return vis.map(v => {
      const n = this.kurv[v.id] || 0;
      return `<div class="vare ${n ? 'valgt' : ''}" id="v_${v.id}">
        <div class="bilde">${Ikon.vare(v)}</div>
        <div class="navn">${esc(v.navn)}</div>
        <div class="pris">${kr(v.pris)} / ${B.enhet(v)}</div>
        <div class="teller-felt"><button class="sek" onclick="Elev.endreKurv('${v.id}',-1)" aria-label="Færre">−</button>
          <input type="number" min="0" value="${n || ''}" placeholder="0" onchange="Elev.settKurv('${v.id}',this.value)" aria-label="Antall ${esc(v.navn)}">
          <button class="sek" onclick="Elev.endreKurv('${v.id}',1)" aria-label="Flere">+</button></div>
      </div>`;
    }).join('');
  },
  tegnVarer() {
    const kat = B.katalog().filter(v => v.aktiv), sok = this.sok.toLowerCase();
    $('#varer').innerHTML = this.varerHtml(kat.filter(v => (this.kategori === 'alle' || v.kat === this.kategori) && (!sok || v.navn.toLowerCase().includes(sok))));
  },
  kurvHtml() {
    const I = B.innst(), kontoId = this.handleFor || this.kontoId;
    const linjer = Object.entries(this.kurv).filter(([, n]) => n > 0).map(([id, n]) => ({ v: B.vare(id), n })).filter(l => l.v);
    let h = `<h2>Handlekurv</h2><p class="dempet liten">Disponibelt: <b>${kr(B.disponibelt(kontoId))}</b></p>`;
    if (!linjer.length) return h + UI.tom('Tom. Trykk + på varene.');
    h += linjer.map(l => `<div class="linje">${Ikon.vare(l.v)}<div class="tekst"><b>${esc(l.v.navn)}</b><br><span class="dempet">${l.n} × ${kr(l.v.pris)}${l.v.enhet === 'stack' ? ' per stack' : ''}</span></div>
      ${I.visSummer ? `<b>${kr(l.n * l.v.pris)}</b>` : ''}<button class="sek ikon sma" onclick="Elev.settKurv('${l.v.id}',0)" aria-label="Fjern">✕</button></div>`).join('');
    if (I.visSummer) h += `<p style="margin-top:10px"><b>Totalt: ${kr(linjer.reduce((s, l) => s + l.n * l.v.pris, 0))}</b></p>`;
    h += `<label class="felt" for="elevTotal">Regn ut totalen selv:</label>
      <div class="rad"><input type="number" id="elevTotal" min="0" placeholder="kr" style="flex:1" onkeydown="if(event.key==='Enter')Elev.sendBestilling()"><button onclick="Elev.sendBestilling()">Send</button></div>
      <div id="bestillSvar"></div>
      <p style="margin-top:10px"><button class="sek sma" onclick="Elev.kurv={};Elev.tegn()">Tøm kurven</button></p>`;
    return h;
  },
  settKurv(id, verdi) {
    const n = Math.max(0, Math.min(999, parseInt(verdi) || 0));
    if (n) this.kurv[id] = n; else delete this.kurv[id];
    this.feilForsok = 0;
    const el = $('#v_' + id);
    if (el) { el.classList.toggle('valgt', n > 0); el.querySelector('input').value = n || ''; }
    $('#kurv').innerHTML = this.kurvHtml();
  },
  endreKurv(id, d) { this.settKurv(id, (this.kurv[id] || 0) + d); },
  async sendBestilling() {
    const kontoId = this.handleFor || this.kontoId, svar = $('#bestillSvar');
    const linjer = Object.entries(this.kurv).filter(([, n]) => n > 0).map(([id, n]) => {
      const v = B.vare(id); return { vareId: id, navn: v.navn, kat: v.kat, mc: v.mc, data: v.data, enhet: v.enhet, maks: v.maks, pris: v.pris, antall: n };
    });
    if (!linjer.length) return;
    const riktig = linjer.reduce((s, l) => s + l.antall * l.pris, 0);
    const elev = parseInt($('#elevTotal').value);
    if (isNaN(elev)) { svar.innerHTML = '<div class="melding feil">Skriv inn totalen dere har regnet ut.</div>'; return; }
    if (elev !== riktig) {
      this.feilForsok++;
      let tips = this.feilForsok >= 2 ? ' Tips: Regn ut hver linje for seg (antall × pris) og legg sammen til slutt.' : '';
      if (this.feilForsok >= 3) tips += ' Har dere tatt med alle varene?';
      svar.innerHTML = `<div class="melding feil">Totalen stemmer ikke. Regn over igjen!${tips}</div>`; return;
    }
    if (riktig > B.disponibelt(kontoId)) { svar.innerHTML = `<div class="melding feil">Riktig regnet – men dere har ikke råd. Dere har ${kr(B.disponibelt(kontoId))} disponibelt.</div>`; return; }
    await Store.leggTil('bestillinger', { kontoId, bestiltAv: this.kontoId, tid: Date.now(), linjer, elevTotal: elev, forsok: this.feilForsok + 1, status: 'sendt' });
    this.kurv = {}; this.feilForsok = 0;
    UI.toast('Riktig regnet! Bestillingen er sendt. 🎉');
    this.tegn();
  },

  /* =========================================================
     BANK
     ========================================================= */
  sideBank() {
    const I = B.innst(), kontoId = this.handleFor || this.kontoId, konto = B.konto(kontoId);
    const tr = B.trans(kontoId).slice().reverse();
    const sm = liste(Store.hent('smaragd')).filter(x => x.kontoId === kontoId).sort((a, b) => b.tid - a.tid);
    let saldo = B.saldo(kontoId);
    return `
      <div class="sidetittel"><h1>Banken</h1><p class="dempet">${konto.type === 'hh' ? 'Husholdningens konto' : 'Bedriftskonto: ' + esc(konto.navn)}</p></div>
      ${this.kontoVelger("Elev.tegn()")}
      <div class="rutenett" style="margin-bottom:18px">
        <div class="stat"><div class="tall">${kr(saldo)}</div><div class="etikett">Saldo</div></div>
        <div class="stat"><div class="tall">${kr(B.disponibelt(kontoId))}</div><div class="etikett">Disponibelt</div></div>
        <div class="stat"><div class="tall"><span class="miniikon">${Ikon.smaragd()}</span> ${kr(I.smaragdVerdi)}</div><div class="etikett">Verdi av 1 smaragd</div></div>
      </div>
      <div class="rutenett to">
        <div class="kort"><h2>Ta ut smaragder</h2>
          <p class="dempet">Smaragder er pengene i Minecraft. De leveres i kisten deres.</p>
          <div class="rad"><input type="number" id="uttak" min="1" placeholder="Antall"><button onclick="Elev.smaragd('uttak')">Ta ut</button></div>
          <h3>Sett inn smaragder</h3>
          <p class="dempet">Har dere fått smaragder (f.eks. i butikken deres)? Legg dem i kisten og registrer innskuddet her.</p>
          <div class="rad"><input type="number" id="innskudd" min="1" placeholder="Antall"><button class="sek" onclick="Elev.smaragd('innskudd')">Sett inn</button></div>
          <div id="smSvar"></div>
          ${sm.length ? `<h3>Mine forespørsler</h3><table>${sm.slice(0, 8).map(x => `<tr><td>${dato(x.tid)}</td><td>${x.type === 'uttak' ? 'Uttak' : 'Innskudd'} ${x.antall} smaragder</td><td class="tall">${UI.merke(x.status)}</td></tr>`).join('')}</table>` : ''}
        </div>
        <div class="kort"><h2>Kontoutskrift</h2>
          ${tr.length ? `<div class="tabellboks"><table><tr><th>Dato</th><th>Tekst</th><th class="tall">Beløp</th><th class="tall">Saldo</th></tr>
            ${tr.map(t => { const r = `<tr><td>${dato(t.tid)}</td><td>${esc(t.tekst)}</td><td class="tall ${t.belop < 0 ? 'minus' : 'pluss'}">${t.belop > 0 ? '+' : ''}${kr(t.belop)}</td><td class="tall">${kr(saldo)}</td></tr>`; saldo -= t.belop; return r; }).join('')}
          </table></div>` : UI.tom('Ingen transaksjoner ennå.')}
        </div>
      </div>`;
  },
  async smaragd(type) {
    const I = B.innst(), kontoId = this.handleFor || this.kontoId;
    const n = parseInt($('#' + type).value);
    if (!n || n < 1) { $('#smSvar').innerHTML = '<div class="melding feil">Skriv inn antall smaragder.</div>'; return; }
    if (type === 'uttak' && n * I.smaragdVerdi > B.disponibelt(kontoId)) { $('#smSvar').innerHTML = `<div class="melding feil">Dere har ikke nok penger. ${n} smaragder koster ${kr(n * I.smaragdVerdi)}.</div>`; return; }
    await Store.leggTil('smaragd', { kontoId, type, antall: n, tid: Date.now(), status: 'sendt', av: this.kontoId });
    UI.toast(type === 'uttak' ? `Uttak av ${n} smaragder er sendt til banken.` : `Innskudd av ${n} smaragder er registrert.`);
    this.tegn();
  },

  /* =========================================================
     BUDSJETT
     ========================================================= */
  forbruk(kontoId) {
    const res = Object.fromEntries(Object.keys(BUDSJETTKAT).map(k => [k, 0]));
    let inntekt = 0;
    B.trans(kontoId).forEach(t => {
      if (t.belop >= 0) { inntekt += t.belop; return; }
      if (t.fordeling) Object.entries(t.fordeling).forEach(([kat, sum]) => { res[VAREKAT_TIL_BUDSJETT[kat] || 'annet'] += sum; });
      else {
        const m = { forsikring: 'forsikring', lotto: 'lotto', skatt: 'skatt', tilbud: 'fritid', smaragd: 'kontanter' }[t.kat] || 'annet';
        res[m] += -t.belop;
      }
    });
    return { res, inntekt };
  },
  sideBudsjett() {
    const k = this.konto, plan = Store.hent('budsjett/' + k.id) || {};
    const { res, inntekt } = this.forbruk(k.id);
    const sumPlan = Object.values(plan).reduce((s, v) => s + (Number(v) || 0), 0);
    const sumBrukt = Object.values(res).reduce((s, v) => s + v, 0);
    return `
      <div class="sidetittel"><h1>Budsjett</h1><p class="dempet">Planlegg hvor mye dere vil bruke på hver ting – og følg med på hvor mye dere faktisk har brukt.</p></div>
      <div class="rutenett" style="margin-bottom:18px">
        <div class="stat"><div class="tall">${kr(inntekt)}</div><div class="etikett">Inntekter totalt</div></div>
        <div class="stat"><div class="tall">${kr(sumPlan)}</div><div class="etikett">Planlagt brukt</div></div>
        <div class="stat ${sumBrukt > sumPlan && sumPlan ? 'varsel' : ''}"><div class="tall">${kr(sumBrukt)}</div><div class="etikett">Faktisk brukt</div></div>
      </div>
      ${sumPlan > inntekt ? `<div class="melding advarsel">Dere har planlagt å bruke mer enn dere har tjent. Husk at det også kommer faste utgifter hver uke!</div>` : ''}
      <div class="kort"><div class="tabellboks"><table>
        <tr><th>Post</th><th class="tall">Planlagt</th><th class="tall">Brukt</th><th class="tall">Igjen</th><th></th></tr>
        ${Object.entries(BUDSJETTKAT).map(([id, navn]) => {
          const p = Number(plan[id]) || 0, b = Math.round(res[id]);
          const pst = p ? Math.min(100, b / p * 100) : (b ? 100 : 0);
          return `<tr><td>${navn}</td><td class="tall"><input type="number" min="0" value="${p || ''}" placeholder="0" onchange="Elev.settBudsjett('${id}',this.value)" style="width:110px"></td>
            <td class="tall">${kr(b)}</td><td class="tall ${p - b < 0 ? 'minus' : ''}">${p ? kr(p - b) : '–'}</td>
            <td style="width:30%"><div class="stolpe ${p && b > p ? 'over' : ''}"><div style="width:${pst}%"></div></div></td></tr>`;
        }).join('')}
        <tr class="sum"><td>Sum</td><td class="tall">${kr(sumPlan)}</td><td class="tall">${kr(sumBrukt)}</td><td class="tall">${kr(sumPlan - sumBrukt)}</td><td></td></tr>
      </table></div></div>`;
  },
  settBudsjett(id, v) { Store.sett(`budsjett/${this.kontoId}/${id}`, Math.max(0, parseInt(v) || 0)); },

  /* =========================================================
     REGNSKAP (elevene fører selv)
     ========================================================= */
  sideRegnskap() {
    const k = this.konto, poster = liste(Store.hent('regnskap/' + k.id)).sort((a, b) => String(a.dato).localeCompare(String(b.dato)) || a.tid - b.tid);
    let saldo = 0;
    const idag = new Date().toISOString().slice(0, 10);
    return `
      <div class="sidetittel"><h1>Regnskap</h1><p class="dempet">Før inn alle inntekter og utgifter selv – fra fakturaer, lønnsslipper og brev i postkassen. Sjekk at det stemmer med banken!</p></div>
      <div class="kort"><h2>Ny post</h2>
        <div class="rad">
          <input type="date" id="rDato" value="${idag}">
          <input id="rTekst" placeholder="Hva gjelder det?" style="flex:2;min-width:180px">
          <select id="rType"><option value="ut">Utgift</option><option value="inn">Inntekt</option></select>
          <input type="number" id="rBelop" placeholder="Beløp" min="0" onkeydown="if(event.key==='Enter')Elev.nyPost()">
          <button onclick="Elev.nyPost()">Legg til</button>
        </div>
      </div>
      <div class="kort"><div class="rad mellom"><h2 style="margin:0">Regnskapet</h2><button class="gul" onclick="Elev.sjekkRegnskap()">Sjekk mot banken</button></div>
        <div id="sjekkSvar"></div>
        ${poster.length ? `<div class="tabellboks"><table><tr><th>Dato</th><th>Tekst</th><th class="tall">Inntekt</th><th class="tall">Utgift</th><th class="tall">Saldo</th><th></th></tr>
          ${poster.map(p => { saldo += p.type === 'inn' ? p.belop : -p.belop; return `<tr><td>${esc(p.dato)}</td><td>${esc(p.tekst)}</td><td class="tall pluss">${p.type === 'inn' ? kr(p.belop) : ''}</td><td class="tall minus">${p.type === 'ut' ? kr(p.belop) : ''}</td><td class="tall"><b>${kr(saldo)}</b></td><td><button class="sek ikon sma" onclick="Elev.slettPost('${p.id}')" aria-label="Slett">✕</button></td></tr>`; }).join('')}
          <tr class="sum"><td colspan="4">Saldo i regnskapet</td><td class="tall">${kr(saldo)}</td><td></td></tr></table></div>`
        : UI.tom('Ingen poster ennå. Start med startbonusen!')}
      </div>`;
  },
  async nyPost() {
    const tekst = $('#rTekst').value.trim(), belop = parseInt($('#rBelop').value);
    if (!tekst || !belop || belop < 0) { UI.toast('Fyll ut tekst og beløp.', 'feil'); return; }
    await Store.leggTil('regnskap/' + this.kontoId, { dato: $('#rDato').value, tekst, type: $('#rType').value, belop, tid: Date.now() });
    this.tegn(); setTimeout(() => $('#rTekst') && $('#rTekst').focus(), 30);
  },
  slettPost(id) { if (confirm('Slette denne posten?')) Store.sett(`regnskap/${this.kontoId}/${id}`, null); },
  sjekkRegnskap() {
    const poster = liste(Store.hent('regnskap/' + this.kontoId));
    const egen = poster.reduce((s, p) => s + (p.type === 'inn' ? p.belop : -p.belop), 0);
    const bank = B.saldo(this.kontoId), antBank = B.trans(this.kontoId).length;
    const d = egen - bank;
    $('#sjekkSvar').innerHTML = d === 0
      ? `<div class="melding ok"><b>Det stemmer!</b> Regnskapet viser ${kr(egen)}, akkurat som banken. Godt jobbet! 🎉</div>`
      : `<div class="melding feil"><b>Det stemmer ikke helt.</b> Regnskapet deres viser ${kr(egen)}, men banken har ${kr(bank)}. Forskjellen er ${kr(Math.abs(d))}.
         ${poster.length < antBank ? `Banken har ${antBank} poster, dere har ført ${poster.length}. Mangler dere noe fra postkassen?` : 'Sjekk om dere har ført noe som inntekt i stedet for utgift, eller skrevet feil beløp.'}</div>`;
  },

  /* =========================================================
     POSTKASSE
     ========================================================= */
  sidePost() {
    const post = B.post(this.kontoId);
    return `<div class="sidetittel"><h1>Postkassen</h1><p class="dempet">Husk å føre fakturaer, lønnsslipper og andre beløp inn i regnskapet!</p></div>
      ${post.length ? post.map(p => this.brevHtml(p)).join('') : `<div class="kort">${UI.tom('Postkassen er tom.')}</div>`}`;
  },
  brevHtml(p) {
    const aapen = this.aapnePost.has(p.id) || !p.lest;
    const typer = { faktura: '🧾 Faktura', brev: '✉️ Brev', tilbud: '🎁 Tilbud', hendelse: '🎲 Hendelse', lonnsslipp: '💰 Lønnsslipp', lotto: '🎱 Lotto', jobb: '💼 Jobb' };
    let kropp = '';
    if (p.type === 'faktura') {
      kropp = `<div class="dempet">Fra: ${esc(p.fra || 'Byggevarehandelen')}${p.nr ? ' · Faktura nr. ' + p.nr : ''}</div>
        <div class="tabellboks"><table style="margin-top:8px"><tr><th></th><th>Vare</th><th class="tall">Antall</th><th class="tall">Pris</th><th class="tall">Sum</th></tr>
        ${(p.linjer || []).map(l => { const v = B.vare(l.vareId) || l; return `<tr><td class="miniikon">${v.mc ? Ikon.vare(v) : ''}</td><td>${esc(l.navn)}</td><td class="tall">${l.antall} ${l.enhet === 'stack' ? 'stack' : 'stk'}</td><td class="tall">${kr(l.pris)}</td><td class="tall">${kr(l.antall * l.pris)}</td></tr>`; }).join('')}
        <tr class="sum"><td></td><td colspan="3">Å betale (trukket fra kontoen)</td><td class="tall">${kr(p.sum)}</td></tr></table></div>`;
    } else if (p.type === 'tilbud') {
      kropp = `<p>${esc(p.tekst)}</p><p><b>Pris: ${kr(p.pris)}</b></p>` + (p.svar
        ? `<div class="melding ${p.svar === 'ja' ? 'ok' : 'info'}">Dere svarte ${p.svar === 'ja' ? 'JA – beløpet er trukket fra kontoen.' : 'nei takk.'}</div>`
        : `<div class="rad"><button onclick="Elev.svarTilbud('${p.id}', true)">Ja, vi kjøper</button><button class="sek" onclick="Elev.svarTilbud('${p.id}', false)">Nei takk</button></div>`);
    } else if (p.type === 'hendelse') {
      const godt = p.tittel === 'Hurra!' || p.tittel === 'Hello!';
      kropp = `<div class="hendelseskort ${godt ? 'godt' : 'vondt'}"><div class="stor">${esc(p.tittel)}</div><p style="font-size:19px">${esc(p.tekst)}</p>
        ${p.belop ? `<p><b>${p.belop > 0 ? '+' : ''}${kr(p.belop)}</b> ${p.belop > 0 ? 'er satt inn på' : 'er trukket fra'} kontoen.</p>` : ''}</div>`;
      if (p.skriv) kropp += p.svar ? `<h3>Det dere skrev</h3><p style="white-space:pre-wrap">${esc(p.svar)}</p>`
        : `<label class="felt" for="svar_${p.id}">Skriv her:</label><textarea id="svar_${p.id}"></textarea><p style="margin-top:8px"><button onclick="Elev.svarSkriv('${p.id}')">Send</button></p>`;
    } else if (p.type === 'lonnsslipp') {
      kropp = `<table><tr><td>${esc(p.navn || '')}, ${esc(p.jobb || '')}</td><td class="tall"><b>${kr(p.sum)}</b></td></tr></table><p class="dempet">Lønnen er satt inn på husholdningens konto.</p>`;
    } else {
      kropp = `<p style="white-space:pre-wrap">${esc(p.tekst || '')}</p>`;
    }
    return `<div class="brev ${p.lest ? '' : 'ulest'}">
      <div class="hode" onclick="Elev.apneBrev('${p.id}')"><div><div class="type">${typer[p.type] || 'Post'}</div><div class="emne">${esc(p.tittel)}</div></div><div class="dempet">${datoTid(p.tid)}</div></div>
      ${aapen ? `<div class="kropp">${kropp}</div>` : ''}</div>`;
  },
  apneBrev(id) {
    const p = Store.hent(`post/${this.kontoId}/${id}`);
    if (this.aapnePost.has(id) && p.lest) this.aapnePost.delete(id); else this.aapnePost.add(id);
    if (p && !p.lest) Store.sett(`post/${this.kontoId}/${id}/lest`, true); else this.tegn();
  },
  async svarTilbud(id, ja) {
    const p = Store.hent(`post/${this.kontoId}/${id}`); if (!p || p.svar) return;
    if (ja) {
      if (p.pris > B.disponibelt(this.kontoId)) { UI.toast('Dere har ikke råd til dette tilbudet.', 'feil'); return; }
      if (!confirm(`Kjøpe «${p.tittel}» for ${kr(p.pris)}?`)) return;
      await B.trans_ny(this.kontoId, -p.pris, p.tittel, 'tilbud');
    }
    await Store.sett(`post/${this.kontoId}/${id}/svar`, ja ? 'ja' : 'nei');
  },
  async svarSkriv(id) {
    const t = $('#svar_' + id).value.trim();
    if (t.length < 10) { UI.toast('Skriv litt mer først.', 'feil'); return; }
    await Store.sett(`post/${this.kontoId}/${id}/svar`, t);
    UI.toast('Sendt!');
  },

  /* =========================================================
     JOBB
     ========================================================= */
  sideJobb() {
    const k = this.konto, jobber = B.jobber();
    if (!jobber.length) return `<div class="sidetittel"><h1>Jobb</h1></div><div class="kort">${UI.tom('Byen har ingen ledige jobber ennå. Bysjefen sier fra når dere kan søke!')}</div>`;
    const kort = B.medlemmer(k).map((navn, i) => {
      const jobb = B.jobbFor(k.id, i), s = Store.hent('jobbsoknader/' + k.id + '~' + i);
      if (jobb && jobb.navn) {
        const bedrift = jobb.bedriftId ? B.konto(jobb.bedriftId) : null;
        return `<div class="kort"><h2>${esc(navn)}</h2><div class="melding ok">Du jobber i <b>${esc(jobb.navn)}</b>!</div>
          <p>${esc(jobb.beskrivelse || '')}</p>
          <p>${jobb.type === 'offentlig' ? `Lønn: <b>${kr(B.innst().offentligLonn)} i uken</b> fra byen.` : 'Lønn: Det bedriften tjener, deles på de ansatte.'}</p>
          ${bedrift ? `<p>Bedriftens saldo: <b>${kr(B.saldo(bedrift.id))}</b> – du kan handle og se banken for bedriften under Butikken og Banken.</p>` : ''}</div>`;
      }
      const valg = (s && s.valg) || ['', '', ''];
      return `<div class="kort"><h2>${esc(navn)}</h2>
        ${s ? `<div class="melding info">Søknaden er sendt (${dato(s.tid)}). Du kan endre den til Bysjefen har bestemt.</div>` : ''}
        ${[0, 1, 2].map(n => `<label class="felt">${n + 1}. valg</label><select id="jv_${i}_${n}" style="width:100%"><option value="">Velg …</option>${jobber.map(j => `<option value="${j.id}" ${valg[n] === j.id ? 'selected' : ''}>${esc(j.navn)}</option>`).join('')}</select>`).join('')}
        <label class="felt" for="ja_${i}">Tre gode argumenter for at du passer til jobben du ønsker mest</label>
        <textarea id="ja_${i}" placeholder="1. Jeg er flink til …&#10;2. …&#10;3. …">${esc(s ? s.argumenter : '')}</textarea>
        <p style="margin-top:10px"><button onclick="Elev.sokJobb(${i})">${s ? 'Oppdater søknaden' : 'Send søknad'}</button></p></div>`;
    });
    return `<div class="sidetittel"><h1>Jobb</h1><p class="dempet">Alle i husholdningen søker hver sin jobb. Ranger tre ønsker.</p></div>
      <div class="kort"><h2>Jobbene i byen</h2><div class="tabellboks"><table>${jobber.map(j => `<tr><td><b>${esc(j.navn)}</b><br><span class="dempet">${esc(j.beskrivelse || '')}</span></td><td>${j.type === 'offentlig' ? 'Fast lønn' : 'Lønn fra salg'}</td><td class="tall">${j.plasser || '?'} plasser</td></tr>`).join('')}</table></div></div>
      <div class="rutenett to">${kort.join('')}</div>`;
  },
  async sokJobb(i) {
    const valg = [0, 1, 2].map(n => $(`#jv_${i}_${n}`).value);
    const arg = $('#ja_' + i).value.trim();
    if (!valg[0] || new Set(valg.filter(Boolean)).size !== valg.filter(Boolean).length) { UI.toast('Velg minst ett ønske, og ikke samme jobb to ganger.', 'feil'); return; }
    if (arg.length < 20) { UI.toast('Skriv tre gode argumenter.', 'feil'); return; }
    await Store.sett('jobbsoknader/' + this.kontoId + '~' + i, { kontoId: this.kontoId, indeks: i, navn: B.medlemmer(this.konto)[i], valg, argumenter: arg, tid: Date.now() });
    UI.toast('Søknaden er sendt!');
  },

  /* =========================================================
     BYSTYRET
     ========================================================= */
  sideBystyre() {
    const alle = liste(Store.hent('forslag')).sort((a, b) => b.tid - a.tid);
    const mine = alle.filter(f => f.kontoId === this.kontoId);
    const stotte = f => Object.keys(f.stotte || {}).length;
    const statusFor = f => f.status === 'samler' && stotte(f) >= 2 ? 'klar' : f.status;
    const samler = alle.filter(f => f.status === 'samler');
    const ferdige = alle.filter(f => f.status === 'vedtatt' || f.status === 'forkastet');
    return `<div class="sidetittel"><h1>Bystyret</h1><p class="dempet">Vil dere endre en lov i byen? Et forslag trenger støtte fra to andre husholdninger for å komme opp til avstemming.</p></div>
      <div class="rutenett to">
        <div class="kort"><h2>Nytt lovforslag</h2>
          ${mine.length >= 2 ? '<div class="melding info">Dere har sendt to forslag – det er maks.</div>' : `
          <textarea id="forslag" placeholder="Det skal være lov til å …"></textarea>
          <p style="margin-top:10px"><button onclick="Elev.nyttForslag()">Send forslag</button> <span class="dempet liten">${2 - mine.length} igjen</span></p>`}
        </div>
        <div class="kort"><h2>Trenger støtte</h2>
          ${samler.length ? samler.map(f => {
            const egen = f.kontoId === this.kontoId, harStottet = f.stotte && f.stotte[this.kontoId];
            return `<div class="brev" style="box-shadow:none;border:1px solid var(--kant);border-left-width:6px"><p><b>${esc(f.tekst)}</b></p>
              <div class="rad mellom"><span>${UI.merke(statusFor(f))} <span class="dempet">${stotte(f)}/2 støtter</span></span>
              ${egen ? '<span class="dempet liten">Deres forslag</span>' : harStottet ? '<span class="pluss">Dere støtter ✓</span>' : `<button class="sma" onclick="Elev.stott('${f.id}')">Støtt forslaget</button>`}</div></div>`;
          }).join('') : UI.tom('Ingen forslag trenger støtte nå.')}
        </div>
      </div>
      <div class="kort"><h2>Avstemte forslag</h2>
        ${ferdige.length ? `<table>${ferdige.map(f => `<tr><td>${esc(f.tekst)}</td><td class="tall">${f.ja ?? 0} ja – ${f.nei ?? 0} nei</td><td class="tall">${UI.merke(f.status)}</td></tr>`).join('')}</table>` : UI.tom('Ingen avstemminger ennå.')}
      </div>`;
  },
  async nyttForslag() {
    const t = $('#forslag').value.trim();
    if (t.length < 8) { UI.toast('Skriv forslaget litt tydeligere.', 'feil'); return; }
    await Store.leggTil('forslag', { kontoId: this.kontoId, tekst: t, tid: Date.now(), status: 'samler' });
    UI.toast('Forslaget er sendt! Nå trenger dere støtte fra to andre.');
  },
  stott(id) { Store.sett(`forslag/${id}/stotte/${this.kontoId}`, true); }
};
