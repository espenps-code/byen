/* =========================================================
   LÆRERSIDEN («Bysjefen»)
   ========================================================= */
const Laerer = {
  inne: sessionStorage.getItem('byenvar_laerer_' + Store.byId) === '1',
  side: 'oversikt',
  valgtKonto: null,
  nyePin: {},
  fasadeSide: 'sor',
  settFasade(s) { this.fasadeSide = s; this.tegn(); },

  tegn() {
    // Firebase: lærer må være logget inn med e-post. Lokalt: PIN per klasse.
    if (Store.firebaseModus && !Store.erLaerer) return this.tegnInnlogging();
    if (!Store.byId) return this.tegnKlasser();
    if (Store.firebaseModus) {
      const eier = Store.hent('laererUid');
      if (!eier) return this.tegnFeil('Fant ikke klassen', 'Klassen finnes ikke, eller den er slettet.');
      if (eier !== Store.uid) return this.tegnFeil('Ikke din klasse', 'Du er logget inn med en annen lærerkonto enn den som eier denne klassen.');
    } else if (!this.inne) return this.tegnInnlogging();
    const sider = {
      oversikt: 'sideOversikt', soknader: 'sideSoknader', bestillinger: 'sideBestillinger', levering: 'sideLevering',
      bank: 'sideBank', uke: 'sideUke', post: 'sidePost', hendelser: 'sideHendelser',
      jobber: 'sideJobber', butikker: 'sideButikker', bystyre: 'sideBystyre', kontoer: 'sideKontoer', katalog: 'sideKatalog', innstillinger: 'sideInnstillinger', laereplan: 'sideLaereplan'
    };
    $('#rot').innerHTML = `<div class="app"><nav class="meny" id="lMeny"></nav><main class="innhold">${this[sider[this.side] || 'sideOversikt']()}</main></div>`;
    this.tegnMeny();
    this.tegnQr();
  },
  gaaTil(s) { this.side = s; this.tegn(); window.scrollTo({ top: 0 }); },
  ventende() {
    const best = liste(Store.hent('bestillinger'));
    return {
      soknader: liste(Store.hent('soknader')).filter(s => s.status === 'sendt').length,
      bestillinger: best.filter(b => b.status === 'sendt').length,
      levering: best.filter(b => b.status === 'godkjent').length,
      jobber: Object.keys(Store.hent('jobbsoknader') || {}).filter(n => !(Store.hent('ansettelser') || {})[n]).length,
      bystyre: liste(Store.hent('forslag')).filter(f => f.status === 'samler' && Object.keys(f.stotte || {}).length >= 2).length
    };
  },
  tegnMeny() {
    const v = this.ventende();
    const p = (id, ik, navn) => `<button class="punkt ${this.side === id ? 'aktiv' : ''}" onclick="Laerer.gaaTil('${id}')"><span class="ik">${ik}</span>${navn}${v[id] ? `<span class="teller">${v[id]}</span>` : ''}</button>`;
    $('#lMeny').innerHTML = `
      <div class="hvem"><div class="dempet">Innlogget som</div><div class="navn">Bysjefen</div><div class="dempet">${esc(B.innst().byNavn || 'Byen')}</div></div>
      ${p('oversikt', '🏙️', 'Oversikt')}
      <div class="skille"></div>
      ${p('soknader', '📐', 'Byggesøknader')}${p('bestillinger', '📥', 'Bestillinger')}${p('levering', '🚚', 'Leveringssentral')}${p('bank', '🏦', 'Bank')}
      <div class="skille"></div>
      ${p('uke', '📅', 'Ukeoppgjør')}${p('post', '✉️', 'Post og tilbud')}${p('hendelser', '🎲', 'Hendelser')}
      ${p('jobber', '💼', 'Jobber og bedrifter')}${p('butikker', '🏪', 'Byens butikker')}${p('bystyre', '🏛️', 'Bystyret')}
      <div class="skille"></div>
      ${p('kontoer', '🏠', 'Husholdninger')}${p('katalog', '📋', 'Varekatalog')}${p('innstillinger', '⚙️', 'Innstillinger')}
      ${p('laereplan', '🎯', 'Læreplanmål')}
      <div class="skille"></div>
      <button class="punkt" onclick="location.href='laerer.html'"><span class="ik">🗂️</span>Mine klasser</button>
      <button class="punkt" onclick="Laerer.loggUt()"><span class="ik">🚪</span>Logg ut</button>`;
  },

  /* ---------- Innlogging ---------- */
  tegnInnlogging() {
    const fb = Store.firebaseModus;
    $('#rot').innerHTML = `<div class="velkomst"><div class="innlogging"><div class="kort"><h2>Logg inn som lærer</h2>
      ${fb ? `<label class="felt" for="lEpost">E-post</label><input id="lEpost" type="email" autocomplete="username">
              <label class="felt" for="lPass">Passord</label><input id="lPass" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')Laerer.loggInn()">
              <p class="dempet liten" style="margin-top:8px">Bruk lærerkontoen du opprettet i Firebase (Authentication → Users).</p>`
        : `<p class="dempet">${esc(B.innst().byNavn || '')}</p><label class="felt" for="lPin">Lærer-PIN</label><input id="lPin" class="pin" type="password" onkeydown="if(event.key==='Enter')Laerer.loggInn()">
           <p class="dempet liten" style="margin-top:8px">Første gang er PIN-koden <b>1234</b>. Bytt den under Innstillinger.</p>`}
      <div id="lFeil"></div><p style="margin-top:14px"><button onclick="Laerer.loggInn()">Logg inn</button></p></div></div></div>`;
  },
  async loggInn() {
    try {
      if (Store.firebaseModus) {
        await Store.laererLoggInn($('#lEpost').value.trim(), $('#lPass').value);
        if (Store.byId) await Store.kobleTil();
      } else {
        if ($('#lPin').value !== String(B.innst().laererPin)) throw new Error('Feil PIN.');
        this.inne = true; sessionStorage.setItem('byenvar_laerer_' + Store.byId, '1');
      }
      this.tegn();
    } catch (e) {
      const m = /password|user|credential/i.test(e.code || e.message) ? 'Feil e-post eller passord.' : e.message;
      $('#lFeil').innerHTML = `<div class="melding feil">${esc(m)}</div>`;
    }
  },
  tegnFeil(tittel, tekst) {
    $('#rot').innerHTML = `<div class="innlogging"><div class="kort"><h2>${esc(tittel)}</h2><p>${esc(tekst)}</p>
      <div class="rad"><button onclick="location.href='laerer.html'">Mine klasser</button><button class="sek" onclick="Laerer.loggUt()">Logg ut</button></div></div></div>`;
  },

  /* ---------- Mine klasser ---------- */
  eierNokkel() { return 'laerere/' + (Store.firebaseModus ? Store.uid : 'lokal') + '/byer'; },
  async tegnKlasser() {
    $('#rot').innerHTML = `<div class="velkomst"><div class="innlogging" style="max-width:720px"><div class="kort"><h1 style="color:var(--jord-mork)">Mine klasser</h1>
      <div id="klasseliste" class="dempet">Henter …</div></div>
      <div class="kort"><h2>Ny klasse</h2><p class="dempet">Gi byen et navn – for eksempel «Galtvang 7A». Hver klasse får sin egen elevlenke.</p>
        <div class="rad"><input id="nyKlasse" placeholder="Navn på byen" style="flex:1" onkeydown="if(event.key==='Enter')Laerer.nyKlasse()"><button onclick="Laerer.nyKlasse()">Opprett klasse</button></div>
        <div id="klasseFeil"></div></div>
      ${Store.firebaseModus ? '<p style="text-align:center"><button class="sek" onclick="Laerer.loggUt()">Logg ut</button></p>' : ''}</div></div>`;
    const klasser = Object.entries(await Store.hentGlobal(this.eierNokkel()) || {}).sort((a, b) => (b[1].tid || 0) - (a[1].tid || 0));
    $('#klasseliste').innerHTML = klasser.length ? klasser.map(([id, k]) => `<div class="brev" style="box-shadow:none;border:1px solid var(--kant);border-left-width:6px;cursor:pointer" onclick="Laerer.aapneKlasse('${id}')">
        <div class="rad mellom"><div><div class="emne">${esc(k.navn)}</div><div class="dempet">Opprettet ${dato(k.tid)}</div></div><button class="sma">Åpne</button></div></div>`).join('')
      : UI.tom('Du har ingen klasser ennå. Opprett den første nedenfor!');
  },
  aapneKlasse(id) {
    if (!Store.firebaseModus) sessionStorage.setItem('byenvar_laerer_' + id, '1');
    location.href = 'laerer.html?by=' + encodeURIComponent(id);
  },
  async nyKlasse() {
    const navn = $('#nyKlasse').value.trim();
    if (navn.length < 2) { $('#klasseFeil').innerHTML = '<div class="melding feil">Skriv et navn på byen.</div>'; return; }
    const slug = navn.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'by';
    const id = slug + '-' + Math.random().toString(36).slice(2, 6);
    try {
      if (Store.firebaseModus) await Store.settIBy(id, 'laererUid', Store.uid);
      await Store.settIBy(id, 'innstillinger/byNavn', navn);
      await Store.settGlobal(this.eierNokkel() + '/' + id, { navn, tid: Date.now() });
      this.aapneKlasse(id);
    } catch (e) { $('#klasseFeil').innerHTML = `<div class="melding feil">Kunne ikke opprette klassen: ${esc(e.message)}</div>`; }
  },
  elevLenke() { return new URL('elev.html?by=' + Store.byId, location.href).href; },
  delKort() {
    const lenke = this.elevLenke();
    return `<div class="kort"><h2>Del med elevene</h2>
      <div class="rad" style="align-items:flex-start;gap:20px">
        <div id="qr" style="background:#fff;padding:8px;border-radius:10px;border:1px solid var(--kant);min-width:150px;min-height:150px"></div>
        <div class="vekst"><p>Elevene åpner denne lenken (eller skanner QR-koden med iPaden) og logger inn med husholdning og PIN-kode.</p>
          <input value="${esc(lenke)}" readonly style="width:100%;font-size:14px" onclick="this.select()">
          <div class="rad" style="margin-top:10px"><button onclick="UI.kopier('${esc(lenke)}',this)">Kopier lenken</button>
            <a class="knapp" style="background:#fff;color:var(--tekst);border:1px solid var(--kant);box-shadow:0 3px 0 var(--kant)" href="${esc(lenke)}" target="_blank">Åpne elevsiden</a></div>
          ${Store.firebaseModus ? '' : '<p class="dempet liten" style="margin-top:8px">Lokal testmodus: lenken virker bare i denne nettleseren på denne maskinen.</p>'}</div>
      </div></div>`;
  },
  async tegnQr() {
    const el = $('#qr'); if (!el || el.dataset.ferdig) return;
    el.dataset.ferdig = '1';
    try {
      if (!window.QRCode) await new Promise((ok, feil) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = ok; s.onerror = feil; document.head.appendChild(s); });
      el.innerHTML = ''; new QRCode(el, { text: this.elevLenke(), width: 150, height: 150, correctLevel: QRCode.CorrectLevel.M });
    } catch (e) { el.innerHTML = '<span class="dempet liten">QR-koden kunne ikke lages uten internett.</span>'; }
  },
  async loggUt() {
    this.inne = false; sessionStorage.removeItem('byenvar_laerer_' + Store.byId);
    if (Store.firebaseModus) await Store.laererLoggUt();
    location.href = 'laerer.html';
  },

  /* =========================================================
     OVERSIKT
     ========================================================= */
  sideOversikt() {
    const v = this.ventende(), hh = B.kontoer('hh'), bed = B.kontoer('bedrift');
    const totalt = B.kontoer().reduce((s, k) => s + B.saldo(k.id), 0);
    const stat = (tall, etikett, side, varsel) => `<div class="stat klikk ${varsel && tall ? 'varsel' : ''}" onclick="Laerer.gaaTil('${side}')"><div class="tall">${tall}</div><div class="etikett">${etikett}</div></div>`;
    const start = !hh.length ? `<div class="kort"><h2>Kom i gang</h2>
      <div class="sjekk venter"><span class="pr">1</span><span>Sjekk startbonus, priser og byggeregler under <a href="#" onclick="Laerer.gaaTil('innstillinger');return false">Innstillinger</a>.</span></div>
      <div class="sjekk venter"><span class="pr">2</span><span>Lag tomtene i Minecraft og legg inn husholdninger med kistekoordinater under <a href="#" onclick="Laerer.gaaTil('kontoer');return false">Husholdninger</a>.</span></div>
      <div class="sjekk venter"><span class="pr">3</span><span>Del elevlenken (eller QR-koden) og PIN-lappene. Elevene logger inn, signerer avtalen og tegner huset.</span></div>
      <div class="sjekk venter"><span class="pr">4</span><span>Kjør testprogrammet i Leveringssentralen for å sjekke at alle varene virker.</span></div></div>` : '';
    return `<div class="sidetittel"><h1>Oversikt</h1></div>${start}${!hh.length || !hh.some(k => k.avtale && k.avtale.signert) ? this.delKort() : ''}
      <div class="rutenett" style="margin-bottom:18px">
        ${stat(v.soknader, 'Byggesøknader venter', 'soknader', 1)}${stat(v.bestillinger, 'Bestillinger venter', 'bestillinger', 1)}
        ${stat(v.levering, 'Klar til levering', 'levering', 1)}
        ${stat(v.jobber, 'Jobbsøknader uten svar', 'jobber', 1)}${stat(v.bystyre, 'Lovforslag klare', 'bystyre', 1)}
      </div>
      <div class="kort"><div class="rad mellom"><h2 style="margin:0">Husholdninger</h2><span class="dempet">Penger i byen: <b>${kr(totalt)}</b></span></div>
        ${hh.length ? `<div class="tabellboks"><table><tr><th>Tomt</th><th>Navn</th><th>Avtale</th><th>Byggesøknad</th><th class="tall">Saldo</th></tr>
          ${hh.map(k => { const s = Store.hent('soknader/' + k.id); return `<tr><td>${esc(k.tomt)}</td><td><b>${esc(k.navn)}</b><br><span class="dempet">${esc(B.medlemmer(k).join(', '))}</span></td>
            <td>${k.avtale && k.avtale.signert ? `✓ <span class="dempet">${k.avtale.forsikring ? 'Forsikret' : 'Uforsikret'}</span>` : '<span class="dempet">Ikke signert</span>'}</td>
            <td>${s ? (s.ferdigTid ? UI.merke('ferdig') : UI.merke(s.status)) : '<span class="dempet">–</span>'}</td><td class="tall">${kr(B.saldo(k.id))}</td></tr>`; }).join('')}
          ${bed.map(k => `<tr><td>🏪</td><td><b>${esc(k.navn)}</b><br><span class="dempet">Bedrift</span></td><td></td><td></td><td class="tall">${kr(B.saldo(k.id))}</td></tr>`).join('')}
        </table></div>` : UI.tom('Ingen husholdninger ennå.')}
      </div>`;
  },

  /* =========================================================
     BYGGESØKNADER
     ========================================================= */
  sideSoknader() {
    const I = B.innst();
    const alle = liste(Store.hent('soknader'));
    const venter = alle.filter(s => s.status === 'sendt');
    const ovrige = alle.filter(s => s.status !== 'sendt');
    const vis = s => {
      const a = B.analyser(s, I), e = a.estimat, el = s.elevEstimat || {}, mat = B.vare(s.materiale);
      return `<div class="kort"><div class="rad mellom"><h2 style="margin:0">${esc(B.kontoNavn(s.id))}</h2>${s.ferdigTid ? UI.merke('ferdig') : UI.merke(s.status)}</div>
        <div class="tegninger" style="margin:12px 0">
          ${s.etasjer.map((e2, i) => e2 && e2.some(r => /[vdwrst]/.test(r)) ? `<figure>${UI.planSvg(e2, 14)}<figcaption>${i + 1}. etasje</figcaption></figure>` : '').join('')}
        </div>
        ${UI.fasadeVelger(s, I, this.fasadeSide, 'Laerer.settFasade', 10)}
        <p style="margin:10px 0"><button class="bla sma" onclick="UI.vis3d(Store.hent('soknader/${s.id}'), B.innst(), '${esc(B.kontoNavn(s.id)).replace(/'/g, '')}')">Se huset i 3D</button></p>
        <p>Materiale: <b>${esc(mat ? mat.navn : '–')}</b> · Tak: <b>${s.tak === 'skratt' ? 'skrått' : 'flatt'}</b> · ${a.antEtg} etasje(r) · høyde ca. ${a.hoyde}</p>
        <div class="rutenett to">
          <div>${a.sjekker.map(x => `<div class="sjekk ${x.ok ? 'ja' : 'nei'}"><span class="pr">${x.ok ? '✓' : '!'}</span><span>${x.tekst}</span></div>`).join('')}</div>
          <div><table><tr><th></th><th class="tall">Elevene</th><th class="tall">Byen</th></tr>
            <tr><td>Stacks</td><td class="tall">${el.stacks ?? '–'}</td><td class="tall">${e.stacks}</td></tr>
            <tr><td>Dører</td><td class="tall">${el.dorer ?? '–'}</td><td class="tall">${e.dorer}</td></tr>
            <tr><td>Glassruter</td><td class="tall">${el.ruter ?? '–'}</td><td class="tall">${e.ruter}</td></tr>
            ${e.innertrapper ? `<tr><td>Trapper inne</td><td class="tall">${el.innertrapper ?? '–'}</td><td class="tall">${e.innertrapper}</td></tr>` : ''}
            ${s.tak === 'skratt' ? `<tr><td>Taktrapper</td><td class="tall">${el.trapper ?? '–'}</td><td class="tall">${e.taktrapper}</td></tr>` : ''}
          </table>${el.forklaring ? `<p class="dempet" style="margin-top:8px">«${esc(el.forklaring)}»</p>` : ''}</div>
        </div>
        ${s.status === 'sendt' ? `<div class="rad" style="margin-top:12px"><input id="sm_${s.id}" placeholder="Melding til elevene (valgfritt)" style="flex:1;min-width:220px">
          <button onclick="Laerer.behandleSoknad('${s.id}','godkjent')">✓ Godkjenn</button><button class="rod" onclick="Laerer.behandleSoknad('${s.id}','avvist')">✗ Ikke godkjent</button></div>`
          : s.status === 'godkjent' ? `<p class="rad" style="margin-top:10px"><button class="sma sek" onclick="Laerer.skrivUtTegning(['${s.id}'])">🖨️ Skriv ut tegning</button>
              ${s.ferdigTid ? `<span class="merke m-levert">🏠 Ferdigattest ${dato(s.ferdigTid)}</span><button class="sma sek" onclick="Laerer.skrivUtFerdigattest('${s.id}')">🖨️ Skriv ut ferdigattest</button>`
                : `<button class="sma" onclick="Laerer.giFerdigattest('${s.id}')">🏠 Gi ferdigattest</button>`}
              <button class="sek sma" onclick="Laerer.behandleSoknad('${s.id}','avvist')">Trekk tilbake godkjenningen</button></p>` : ''}
      </div>`;
    };
    const godkjente = alle.filter(s => s.status === 'godkjent');
    return `<div class="sidetittel"><div class="rad mellom"><h1>Byggesøknader</h1>${godkjente.length ? `<button class="sek" onclick="Laerer.skrivUtTegning(${esc(JSON.stringify(godkjente.map(s => s.id)))})">🖨️ Skriv ut alle godkjente (${godkjente.length})</button>` : ''}</div></div>
      ${venter.length ? venter.map(vis).join('') : `<div class="kort">${UI.tom('Ingen søknader venter.')}</div>`}
      ${ovrige.length ? `<h3>Andre søknader</h3>${ovrige.map(vis).join('')}` : ''}`;
  },
  async behandleSoknad(id, status) {
    const m = $('#sm_' + id) ? $('#sm_' + id).value.trim() : '';
    if (status === 'avvist' && !m && !confirm('Sende uten å forklare hva som må rettes?')) return;
    await Store.oppdater('soknader/' + id, { status, melding: m, godkjentTid: status === 'godkjent' ? Date.now() : null, ferdigTid: null });
    await B.post_ny(id, { type: 'brev', tittel: status === 'godkjent' ? 'Byggesøknaden er godkjent!' : 'Byggesøknaden ble ikke godkjent',
      tekst: (status === 'godkjent' ? 'Gratulerer! Dere kan nå bestille materialer og begynne å bygge. Husk å bygge slik dere har tegnet.' : 'Søknaden må rettes før den kan godkjennes.') + (m ? '\n\nMelding fra Bysjefen: ' + m : ''), fra: 'Kommunen' });
    UI.toast(status === 'godkjent' ? 'Godkjent' : 'Sendt tilbake');
  },

  async giFerdigattest(id) {
    const I = B.innst(), bonus = Number(I.ferdigBonus) || 0;
    if (!confirm(`Har du sjekket huset i Minecraft, og er det bygget slik det er tegnet?\n\n${B.kontoNavn(id)} får ferdigattest${bonus ? ` og ${kr(bonus)} i innflyttingsbonus` : ''}.`)) return;
    await Store.sett(`soknader/${id}/ferdigTid`, Date.now());
    if (bonus) await B.trans_ny(id, bonus, 'Innflyttingsbonus (ferdigattest)', 'premie');
    await B.post_ny(id, { type: 'ferdigattest', tittel: 'Gratulerer – huset har fått ferdigattest! 🏠', fra: 'Kommunen',
      tekst: `Bysjefen har kontrollert huset og ser at det er bygget slik det er tegnet. Dere har nå ferdigattest og kan flytte inn!${bonus ? `\n\nSom takk for godt arbeid får dere ${kr(bonus)} i innflyttingsbonus. Husk å føre det i regnskapet!` : ''}\n\nVil dere bygge ut senere, må dere sende ny byggesøknad.` });
    UI.toast('Ferdigattest gitt');
  },
  skrivUtFerdigattest(id) {
    const s = Store.hent('soknader/' + id), k = B.konto(id) || {}, I = B.innst();
    if (!s || !s.ferdigTid) return;
    const dag = new Date(s.ferdigTid).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
    const etg = (s.etasjer || []).filter(e => e && e.some(r => /[vdwrst]/.test(r))).length;
    const w = window.open('', '_blank');
    if (!w) return UI.toast('Nettleseren blokkerte utskriftsvinduet – tillat popup-vinduer for siden');
    w.document.write(`<!DOCTYPE html><html lang="no"><head><meta charset="utf-8"><title>Ferdigattest</title>
      <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lilita+One&display=swap" rel="stylesheet">
      <style>@page{size:A4;margin:12mm}body{font-family:'Atkinson Hyperlegible',sans-serif;margin:0;color:#222}
      .side{position:relative;width:186mm;min-height:268mm;margin:0 auto;border:10px double #4f8a2b;padding:18mm;box-sizing:border-box;text-align:center}
      .by{font-size:15px;text-transform:uppercase;letter-spacing:.12em;color:#7a5230;font-weight:700}
      h1{font-family:'Lilita One',sans-serif;font-weight:400;font-size:64px;color:#35611a;margin:10px 0 6px}
      h2{font-family:'Lilita One',sans-serif;font-weight:400;font-size:38px;margin:28px 0 4px}
      .medl{font-size:20px}.tekst{font-size:20px;line-height:1.5;max-width:140mm;margin:26px auto}
      .plan{margin:20px auto;max-width:120mm}.plan svg{width:100%;height:auto}
      .fakta{display:flex;justify-content:center;gap:26px;font-size:17px;color:#444;margin:14px 0}
      .sign{margin-top:46px;display:flex;justify-content:space-around}.sign div{border-top:1px solid #333;width:38%;padding-top:6px;font-size:16px}
      .stempel{position:absolute;right:14mm;bottom:7mm;transform:rotate(-12deg);color:#c62828;border:5px solid #c62828;outline:2px solid #c62828;outline-offset:3px;border-radius:10px;padding:6px 16px;opacity:.85}
      .stempel .s1{font-family:'Lilita One',sans-serif;font-size:30px;letter-spacing:.1em;white-space:nowrap}.stempel .s2{font-size:13px;font-weight:700}
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
      <div class="side"><div class="by">${esc(I.byNavn || 'Klassebyen')} kommune</div><h1>Ferdigattest</h1>
        <div class="tekst">Kommunen bekrefter at huset på</div>
        <h2>Tomt ${esc(k.tomt ?? '')} – ${esc(k.navn || '')}</h2><div class="medl">${esc(B.medlemmer(k).join(', '))}</div>
        <div class="fakta"><span>${etg} etasje${etg === 1 ? '' : 'r'}</span><span>Tak: ${s.tak === 'skratt' ? 'skrått' : 'flatt'}</span><span>Materiale: ${esc((B.vare(s.materiale) || {}).navn || '–')}</span></div>
        <div class="plan">${(s.etasjer || []).find(e => e && e.some(r => /[vdwrst]/.test(r))) ? UI.planSvg((s.etasjer || []).find(e => e && e.some(r => /[vdwrst]/.test(r))), 16) : ''}</div>
        <div class="tekst">er bygget i samsvar med den godkjente byggetegningen, og at huset er klart til innflytting.</div>
        <div class="sign"><div>${dag}</div><div>Bysjefen</div></div>
        <div class="stempel"><div class="s1">FERDIG</div><div class="s2">${dag}</div></div>
      </div><script>document.fonts.ready.then(()=>setTimeout(()=>print(),300))<\/script></body></html>`);
    w.document.close();
  },
  /* Byggeark for utskrift: plantegninger med nummererte ruter, fasader og godkjentstempel */
  skrivUtTegning(ids) {
    const I = B.innst();
    const F = { v: '#7a5230', d: '#c98a3d', w: '#7ec8e3', r: '#f3ead6', s: '#d9c8f0', t: '#e07a5f' };
    const harInnhold = e => e && e.some(r => /[vdwrst]/.test(r));
    // Plantegning med tall langs kantene, så elevene kan telle klosser
    const plan = (rader, under) => {
      const b = rader[0].length, d = rader.length, c = 20, m = c;
      const hver = Math.max(b, d) > 30 ? 5 : 1;
      let r = `<svg viewBox="0 0 ${b * c + m + 4} ${d * c + m + 4}" class="plan" xmlns="http://www.w3.org/2000/svg">`;
      r += `<g transform="translate(${m},${m})"><rect width="${b * c}" height="${d * c}" fill="#eef5e6"/>`;
      rader.forEach((rad, y) => [...rad].forEach((ch, x) => {
        if (ch !== '.') r += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}" fill="${F[ch] || '#ccc'}"/>`;
        if (ch === 't') r += `<text x="${x * c + c / 2}" y="${y * c + c / 2 + 4}" font-size="11" text-anchor="middle" fill="#fff" font-weight="700">${B.trappTrinn(rader, x, y)}</text>`;
      }));
      for (let i = 0; i <= b; i++) r += `<line x1="${i * c}" y1="0" x2="${i * c}" y2="${d * c}" stroke="${i % 5 ? '#0000002a' : '#00000066'}" stroke-width="${i % 5 ? 0.6 : 1.2}"/>`;
      for (let i = 0; i <= d; i++) r += `<line x1="0" y1="${i * c}" x2="${b * c}" y2="${i * c}" stroke="${i % 5 ? '#0000002a' : '#00000066'}" stroke-width="${i % 5 ? 0.6 : 1.2}"/>`;
      if (under) under.forEach((rad, y) => [...rad].forEach((ch, x) => { if (ch === 't') r += `<rect x="${x * c + 2}" y="${y * c + 2}" width="${c - 4}" height="${c - 4}" fill="#ffffffaa" stroke="#c0603f" stroke-width="2" stroke-dasharray="4 3"/>`; }));
      r += '</g>';
      for (let x = 0; x < b; x++) if ((x + 1) % hver === 0 || x === 0) r += `<text x="${m + x * c + c / 2}" y="${m - 6}" font-size="10" text-anchor="middle" fill="#555">${x + 1}</text>`;
      for (let y = 0; y < d; y++) if ((y + 1) % hver === 0 || y === 0) r += `<text x="${m - 4}" y="${m + y * c + c / 2 + 4}" font-size="10" text-anchor="end" fill="#555">${y + 1}</text>`;
      return r + '</svg>';
    };
    const fasade = (s, side) => UI.fasadeSvg(s, I, 14, side).replace(/ width="\d+" height="\d+"/, '');
    const stempel = t => `<div class="stempel"><div class="s1">GODKJENT</div><div class="s2">${new Date(t).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}</div><div class="s3">${esc(I.byNavn || 'Klassebyen')} kommune · Bysjefen</div></div>`;
    const ark = id => {
      const s = Store.hent('soknader/' + id); if (!s) return '';
      const k = B.konto(id) || {}, a = B.analyser(s, I), e = a.estimat, mat = B.vare(s.materiale);
      const etg = (s.etasjer || []).map((e2, i) => ({ e2, i })).filter(x => harInnhold(x.e2));
      const medl = B.medlemmer(k);
      return `<section class="side">
        ${stempel(s.godkjentTid || Date.now())}
        <header><div class="by">${esc(I.byNavn || 'Klassebyen')} · Byggetillatelse</div>
          <h1>${esc(k.type === 'hh' ? 'Tomt ' + k.tomt + ' – ' + k.navn : (k.navn || ''))}</h1>
          ${medl.length ? `<div class="medl">${esc(medl.join(', '))}</div>` : ''}</header>
        <div class="fakta"><span>Materiale: <b>${esc(mat ? mat.navn : '–')}</b></span><span>Tak: <b>${s.tak === 'skratt' ? 'skrått' : 'flatt'}</b></span>
          <span>Etasjer: <b>${a.antEtg}</b></span><span>Høyde: <b>ca. ${a.hoyde} klosser</b></span></div>
        <h2>Plantegning</h2>
        <div class="planer ${etg.length > 1 ? 'flere' : ''}">${etg.map((x, j) => `<figure>${plan(x.e2, j > 0 ? etg[j - 1].e2 : null)}<figcaption>${x.i + 1}. etasje</figcaption></figure>`).join('')}</div>
        <div class="forklaring"><span class="nord">↑ N</span>
          ${[['v', 'Vegg'], ['d', 'Dør'], ['w', 'Vindu'], ['r', 'Rom'], ['s', 'Soverom'], ['t', 'Trapp (tallet = trinn nr.)']].map(([c, n]) => `<span><i style="background:${F[c]}"></i>${n}</span>`).join('')}${(s.etasjer || []).some(e2 => e2 && e2.some(r => r.includes('t'))) ? '<span><i style="border:2px dashed #c0603f;background:#fff"></i>Hull i gulvet</span>' : ''}
          <span class="dempet">Tykke streker = hver 5. kloss</span></div>
        <div class="liste"><b>Materialer (byens beregning):</b> ${e.stacks} stacks ${esc(mat ? mat.navn.toLowerCase() : '')} · ${e.dorer} ${e.dorer === 1 ? 'dør' : 'dører'} · ${e.ruter} glassruter${e.innertrapper ? ` · ${e.innertrapper} trapper inne` : ''}${s.tak === 'skratt' ? ` · ${e.taktrapper} taktrapper` : ''}</div>
        ${e.innertrapper ? `<div class="liste"><b>Husk:</b> La det være hull i gulvet i etasjen over trappa, så dere kommer opp.</div>` : ''}
        ${s.melding ? `<div class="melding"><b>Melding fra Bysjefen:</b> ${esc(s.melding)}</div>` : ''}
      </section>
      <section class="side">
        <header><div class="by">${esc(I.byNavn || 'Klassebyen')} · Byggetillatelse</div><h1>Fasader – ${esc(k.navn || '')}</h1></header>
        <div class="fasader">${[['sor', 'Forfra (sør)'], ['ost', 'Høyre side (øst)'], ['nord', 'Bakfra (nord)'], ['vest', 'Venstre side (vest)']]
          .map(([sd, n]) => `<figure>${fasade(s, sd)}<figcaption>${n}</figcaption></figure>`).join('')}</div>
        <p class="tips">Bygg slik dere har tegnet. Vil dere endre noe, må dere sende ny byggesøknad.</p>
      </section>`;
    };
    const w = window.open('', '_blank');
    if (!w) return UI.toast('Nettleseren blokkerte utskriftsvinduet – tillat popup-vinduer for siden');
    w.document.write(`<!DOCTYPE html><html lang="no"><head><meta charset="utf-8"><title>Byggetegning</title>
      <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lilita+One&display=swap" rel="stylesheet">
      <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: 'Atkinson Hyperlegible', sans-serif; margin: 0; color: #222; background: #eee; }
        .side { position: relative; width: 186mm; min-height: 268mm; margin: 10mm auto; padding: 8mm; box-sizing: border-box; background: #fff; page-break-after: always; break-after: page; }
        header { border-bottom: 3px solid #7a5230; padding-bottom: 6px; margin-bottom: 10px; padding-right: 60mm; }
        .by { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #7a5230; font-weight: 700; }
        h1 { font-family: 'Lilita One', sans-serif; font-size: 32px; margin: 2px 0; font-weight: 400; }
        h2 { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 20px; margin: 12px 0 6px; }
        .medl { font-size: 15px; }
        .fakta { margin-right: 46mm; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 15px; background: #f6f1e7; padding: 8px 12px; border-radius: 8px; }
        .planer { display: grid; gap: 10px; }
        .planer.flere { grid-template-columns: 1fr 1fr; }
        figure { margin: 0; text-align: center; }
        figcaption { font-weight: 700; margin-top: 4px; }
        svg { width: 100%; height: auto; max-height: 150mm; display: block; }
        .fasade { border-radius: 6px; }
        .forklaring { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; font-size: 13px; margin: 10px 0; }
        .forklaring i { display: inline-block; width: 13px; height: 13px; border: 1px solid #0003; vertical-align: -2px; margin-right: 4px; }
        .nord { font-weight: 700; border: 2px solid #222; border-radius: 6px; padding: 0 6px; }
        .dempet { color: #777; }
        .liste, .melding { font-size: 14px; margin-top: 8px; padding: 8px 12px; border-left: 4px solid #4f8a2b; background: #f3f8ee; }
        .melding { border-color: #c62828; background: #fdf1f1; }
        .fasader { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; }
        .fasader svg { max-height: 95mm; }
        .tips { margin-top: 16px; font-size: 14px; color: #555; text-align: center; }
        .stempel { position: absolute; top: 2mm; right: 6mm; transform: rotate(-12deg); color: #c62828; border: 4px solid #c62828; outline: 2px solid #c62828; outline-offset: 3px;
          border-radius: 10px; padding: 6px 14px; text-align: center; opacity: .85; mix-blend-mode: multiply; background: #fff0; }
        .stempel .s1 { font-family: 'Lilita One', sans-serif; font-size: 30px; letter-spacing: .12em; line-height: 1; }
        .stempel .s2 { font-weight: 700; font-size: 13px; margin-top: 3px; border-top: 2px solid #c62828; padding-top: 2px; }
        .stempel .s3 { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
        @media print { body { background: none; } .side { margin: 0 auto; padding: 0; width: auto; min-height: 0; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      ${ids.map(ark).join('')}
      <script>document.fonts.ready.then(()=>setTimeout(()=>print(),300))<\/script></body></html>`);
    w.document.close();
  },

  /* =========================================================
     BESTILLINGER
     ========================================================= */
  sideBestillinger() {
    const alle = liste(Store.hent('bestillinger'));
    const venter = alle.filter(b => b.status === 'sendt').sort((a, b) => a.tid - b.tid);
    const andre = alle.filter(b => b.status !== 'sendt').sort((a, b) => b.tid - a.tid).slice(0, 40);
    return `<div class="sidetittel"><h1>Bestillinger</h1></div>
      <div class="kort"><h2>Venter på godkjenning (${venter.length})</h2>
        ${venter.length ? venter.map(b => `<div class="brev" style="box-shadow:none;border:1px solid var(--kant);border-left-width:6px">
          <div class="rad mellom"><b>${esc(B.kontoNavn(b.kontoId))}</b><span class="dempet">${datoTid(b.tid)} · riktig regnet på ${b.forsok}. forsøk${b.bestiltAv && b.bestiltAv !== b.kontoId ? ' · bestilt av ' + esc(B.kontoNavn(b.bestiltAv)) : ''}</span></div>
          <table style="margin-top:6px">${b.linjer.map(l => `<tr><td class="miniikon">${Ikon.vare(l)}</td><td>${esc(l.navn)}</td><td class="tall">${l.antall} ${l.enhet === 'stack' ? 'stack' : 'stk'}</td><td class="tall">${kr(l.antall * l.pris)}</td></tr>`).join('')}
          <tr class="sum"><td></td><td colspan="2">Totalt</td><td class="tall">${kr(B.sumBestilling(b))}</td></tr></table>
          <div class="rad" style="margin-top:8px"><input id="bm_${b.id}" placeholder="Melding (valgfritt)" style="flex:1;min-width:200px">
            <button onclick="Laerer.behandleBestilling('${b.id}','godkjent')">✓ Godkjenn</button><button class="rod" onclick="Laerer.behandleBestilling('${b.id}','avvist')">✗ Avvis</button></div></div>`).join('')
          : UI.tom('Ingen nye bestillinger.')}
        ${venter.length > 1 ? `<p><button class="sek" onclick="Laerer.godkjennAlle()">Godkjenn alle</button></p>` : ''}
      </div>
      <div class="kort"><h2>Tidligere</h2>${andre.length ? `<div class="tabellboks"><table><tr><th>Dato</th><th>Konto</th><th class="tall">Sum</th><th>Status</th></tr>
        ${andre.map(b => `<tr><td>${dato(b.tid)}</td><td>${esc(B.kontoNavn(b.kontoId))}</td><td class="tall">${kr(B.sumBestilling(b))}</td><td>${UI.merke(b.status)}</td></tr>`).join('')}</table></div>` : UI.tom('Ingen ennå.')}</div>`;
  },
  async behandleBestilling(id, status) {
    const m = $('#bm_' + id) ? $('#bm_' + id).value.trim() : '';
    const b = Store.hent('bestillinger/' + id);
    await Store.oppdater('bestillinger/' + id, { status, melding: m });
    if (status === 'avvist') await B.post_ny(b.kontoId, { type: 'brev', tittel: 'Bestillingen ble avvist', tekst: 'Bestillingen fra ' + dato(b.tid) + ' ble ikke godkjent.' + (m ? '\n\nMelding: ' + m : ''), fra: 'Byggevarehandelen' });
  },
  async godkjennAlle() {
    const venter = liste(Store.hent('bestillinger')).filter(b => b.status === 'sendt');
    const e = {}; venter.forEach(b => { e[`bestillinger/${b.id}/status`] = 'godkjent'; });
    await Store.flere(e); UI.toast(venter.length + ' bestillinger godkjent');
  },

  /* =========================================================
     LEVERINGSSENTRAL
     ========================================================= */
  leveringer() {
    const best = liste(Store.hent('bestillinger')).filter(b => b.status === 'godkjent');
    const per = {};
    best.forEach(b => { (per[b.kontoId] = per[b.kontoId] || { best: [] }).best.push(b); });
    return Object.entries(per).map(([id, g]) => {
      const konto = B.konto(id); if (!konto) return null;
      const ruter = g.best.flatMap(b => b.linjer.flatMap(l => B.ruterForLinje(l)));
      return { konto, ...g, ruter, sum: g.best.reduce((s, b) => s + B.sumBestilling(b), 0) };
    }).filter(Boolean).sort((a, b) => (Number(a.konto.tomt) || 999) - (Number(b.konto.tomt) || 999));
  },
  sideLevering() {
    const L = this.leveringer();
    const mangler = L.filter(l => !B.harKoordinater(l.konto));
    return `<div class="sidetittel"><h1>Leveringssentral</h1><p class="dempet">Godkjente bestillinger samles i ett kisteprogram.</p></div>
      <div class="kort">
        ${L.length ? `<div class="tabellboks"><table><tr><th>Konto</th><th>Kiste (x y z)</th><th class="tall">Varer</th><th class="tall">Ruter</th><th class="tall">Sum</th></tr>
          ${L.map(l => `<tr><td>${esc(B.kontoNavn(l.konto.id))}</td><td>${B.harKoordinater(l.konto) ? `${l.konto.x} ${l.konto.y} ${l.konto.z}` : '<span class="merke m-avvist">Mangler</span>'}</td>
            <td class="tall">${l.best.length} best.</td><td class="tall">${l.ruter.length}${l.ruter.length > 54 ? ` (${Math.ceil(l.ruter.length / 54)} kister)` : ''}</td><td class="tall">${kr(l.sum)}</td></tr>`).join('')}</table></div>
          ${mangler.length ? '<div class="melding feil">Noen kontoer mangler kistekoordinater. Legg dem inn under Husholdninger (eller Jobber og bedrifter for bedrifter).</div>'
            : `<div class="melding info"><b>Før du leverer:</b> Elevene bør ha tømt kistene. Hver konto får en dobbeltkiste på (x, y, z) og (x+1, y, z) – begge rutene må være ledige. Trengs mer plass, kommer neste dobbeltkiste på x+3.</div>
               <p><button onclick="Laerer.visProgram()">Lag kisteprogram</button></p>`}`
          : UI.tom('Ingenting å levere akkurat nå.')}
        <div id="programBoks"></div>
      </div>
      <div class="kort"><h2>Testprogram</h2>
        <p>Setter ut dobbeltkister med <b>én av hver vare</b> ved siden av deg, så du kan sjekke at alle varenavnene virker i din versjon av Minecraft Education. Chat-ord: <code>testkatalog</code>.</p>
        <button class="sek" onclick="Laerer.visTestprogram()">Lag testprogram</button><div id="testBoks"></div>
      </div>`;
  },
  visProgram() {
    const I = B.innst();
    const grupper = this.leveringer().map(l => ({ tittel: B.kontoNavn(l.konto.id), kister: B.kisterFor(l.konto, l.ruter) }));
    const kode = B.lagProgram(grupper, I.chatOrd || 'lever');
    $('#programBoks').innerHTML = `<h3>Kisteprogram</h3>
      <ol><li>Åpne Code Builder (C) → MakeCode → JavaScript og lim inn koden.</li><li>Trykk ▶ og skriv <code>${esc(I.chatOrd)}</code> i chatten.</li>
      <li>Sjekk kistene – og trykk så «Marker som levert». Da får elevene faktura, og pengene trekkes.</li></ol>
      <div class="rad" style="margin-bottom:8px"><button onclick="UI.kopier(document.getElementById('kode').value,this)">Kopier koden</button><button class="gul" onclick="Laerer.markerLevert()">✓ Marker som levert</button></div>
      <textarea class="kode" id="kode" readonly>${esc(kode)}</textarea>`;
  },
  visTestprogram() {
    const kat = B.katalog().filter(v => v.aktiv);
    const ruter = kat.map(v => v.mc + ' 1' + (v.data !== null ? ' ' + v.data : ''));
    let kropp = '';
    for (let i = 0, n = 0; i < ruter.length; i += 54, n++) {
      kropp += `    // ${kat.slice(i, i + 54).map(v => v.navn).join(', ')}\n    fyllKiste(${2 + n * 3}, [\n${ruter.slice(i, i + 54).map(s => `        "${s}"`).join(',\n')}\n    ])\n`;
    }
    const kode = `player.onChat("testkatalog", function () {\n${kropp}    player.say("Ferdig!")\n})\n\nfunction fyllKiste(dx: number, varer: string[]) {\n    let pos = "~" + dx + " ~ ~"\n    player.execute("setblock " + pos + " chest")\n    player.execute("setblock ~" + (dx + 1) + " ~ ~ chest")\n    for (let i = 0; i < varer.length; i++) {\n        player.execute("replaceitem block " + pos + " slot.container " + i + " " + varer[i])\n    }\n}\n`;
    $('#testBoks').innerHTML = `<p class="dempet" style="margin-top:10px">${kat.length} varer i samme rekkefølge som katalogen. En tom rute betyr at varenavnet må rettes.</p>
      <p><button onclick="UI.kopier(document.getElementById('testkode').value,this)">Kopier koden</button></p><textarea class="kode" id="testkode" readonly>${esc(kode)}</textarea>`;
  },
  async markerLevert() {
    if (!confirm('Er alle kistene fylt i Minecraft? Elevene får faktura, og pengene trekkes fra kontoene.')) return;
    const I = B.innst(), L = this.leveringer(), e = {};
    for (const l of L) {
      if (l.best.length) {
        const linjer = l.best.flatMap(b => b.linjer.map(x => ({ vareId: x.vareId, navn: x.navn, kat: x.kat, mc: x.mc, data: x.data, antall: x.antall, enhet: x.enhet, pris: x.pris })));
        const sum = linjer.reduce((s, x) => s + x.antall * x.pris, 0);
        const fordeling = {}; linjer.forEach(x => { fordeling[x.kat || 'annet'] = (fordeling[x.kat || 'annet'] || 0) + x.antall * x.pris; });
        const nr = await Store.tell('teller/faktura');
        await B.trans_ny(l.konto.id, -sum, 'Faktura nr. ' + nr + ' – byggevarehandelen', 'faktura', { fordeling });
        await B.post_ny(l.konto.id, { type: 'faktura', tittel: 'Faktura nr. ' + nr, nr, linjer, sum, fra: (I.byNavn || 'Byens') + ' byggevarehandel' });
        l.best.forEach(b => { e[`bestillinger/${b.id}/status`] = 'levert'; });
      }
    }
    await Store.flere(e);
    UI.toast('Levert! Fakturaer er sendt.');
  },

  /* =========================================================
     BANK
     ========================================================= */
  sideBank() {
    const k = this.valgtKonto ? B.konto(this.valgtKonto) : null;
    const lover = liste(Store.hent('forslag')).filter(f => f.status === 'vedtatt').map(f => 'Brudd på vedtatt lov: ' + f.tekst);
    const boter = liste(Store.hent('boter')).sort((a, b) => b.tid - a.tid);
    return `<div class="sidetittel"><h1>Bank</h1></div>
      <div class="kort"><h2>⚖️ Gi bot</h2><p class="dempet">Boten trekkes fra kontoen, og husholdningen får et brev fra Kommunen med regelen og begrunnelsen.</p>
        <div class="rad" style="align-items:flex-end">
          <div><label class="felt" for="botKonto">Hvem</label><select id="botKonto"><option value="">Velg …</option>${B.kontoer().map(k2 => `<option value="${k2.id}">${esc(B.kontoNavn(k2.id))}</option>`).join('')}</select></div>
          <div style="flex:1;min-width:240px"><label class="felt" for="botRegel">Regel som er brutt</label><select id="botRegel" style="width:100%">${[...BOTREGLER, ...lover, 'Annet'].map(r => `<option>${esc(r)}</option>`).join('')}</select></div>
          <div><label class="felt" for="botBelop">Beløp (kr)</label><input type="number" id="botBelop" min="1" value="500" style="width:110px"></div>
        </div>
        <label class="felt" for="botTekst">Begrunnelse (hva skjedde?)</label>
        <input id="botTekst" style="width:100%" placeholder="F.eks.: Det er bygget en vegg inn på tomt 4.">
        <p style="margin-top:12px"><button class="rod" onclick="Laerer.giBot()">Gi bot</button></p>
        ${boter.length ? `<h3>Bøter som er gitt</h3><div class="tabellboks"><table><tr><th>Dato</th><th>Hvem</th><th>Regel</th><th class="tall">Beløp</th><th></th></tr>
          ${boter.slice(0, 30).map(b => `<tr><td>${dato(b.tid)}</td><td>${esc(B.kontoNavn(b.kontoId))}</td><td>${esc(b.regel)}${b.tekst ? `<br><span class="dempet">${esc(b.tekst)}</span>` : ''}</td>
            <td class="tall">${kr(b.belop)}</td><td>${b.trukketTilbake ? '<span class="dempet">Trukket tilbake</span>' : `<button class="sma sek" onclick="Laerer.trekkTilbakeBot('${b.id}')">Trekk tilbake</button>`}</td></tr>`).join('')}</table></div>` : ''}
      </div>
      <div class="kort"><h2>Ny transaksjon</h2><p class="dempet">Premier, hagekonkurranse og andre beløp. Bøter gir du i boksen over.</p>
        <div class="rad"><select id="tKonto">${B.kontoer().map(k2 => `<option value="${k2.id}">${esc(B.kontoNavn(k2.id))}</option>`).join('')}</select>
          <input id="tTekst" placeholder="Tekst" style="flex:1;min-width:180px"><input type="number" id="tBelop" placeholder="+/- kr">
          <label class="liten"><input type="checkbox" id="tBrev" checked> Send brev</label>
          <button onclick="Laerer.nyTrans()">Registrer</button></div>
      </div>
      <div class="kort"><h2>Kontoutskrift</h2>
        <select onchange="Laerer.valgtKonto=this.value;Laerer.tegn()"><option value="">Velg konto …</option>${B.kontoer().map(k2 => `<option value="${k2.id}" ${k2.id === this.valgtKonto ? 'selected' : ''}>${esc(B.kontoNavn(k2.id))}</option>`).join('')}</select>
        ${k ? `<p style="margin-top:10px">Saldo: <b>${kr(B.saldo(k.id))}</b></p><div class="tabellboks"><table><tr><th>Dato</th><th>Tekst</th><th class="tall">Beløp</th></tr>
          ${B.trans(k.id).slice().reverse().map(t => `<tr><td>${dato(t.tid)}</td><td>${esc(t.tekst)}</td><td class="tall ${t.belop < 0 ? 'minus' : 'pluss'}">${kr(t.belop)}</td></tr>`).join('')}</table></div>` : ''}
      </div>`;
  },
  async giBot() {
    const kontoId = $('#botKonto').value, regel = $('#botRegel').value, belop = parseInt($('#botBelop').value), tekst = $('#botTekst').value.trim();
    if (!kontoId) { UI.toast('Velg hvem som skal få boten.', 'feil'); return; }
    if (!belop || belop < 1) { UI.toast('Skriv et beløp.', 'feil'); return; }
    if (regel === 'Annet' && !tekst) { UI.toast('Skriv en begrunnelse når du velger «Annet».', 'feil'); return; }
    if (!confirm(`Gi ${B.kontoNavn(kontoId)} en bot på ${kr(belop)}?`)) return;
    const id = await Store.leggTil('boter', { kontoId, regel, tekst, belop, tid: Date.now() });
    await B.trans_ny(kontoId, -belop, 'Bot: ' + regel, 'bot', { botId: id });
    await B.post_ny(kontoId, { type: 'bot', tittel: 'Dere har fått en bot', fra: 'Kommunen',
      tekst: `Regel som er brutt: ${regel}${tekst ? '\nHva skjedde: ' + tekst : ''}\n\nBoten er på ${kr(belop)} og er trukket fra kontoen.\n\nHusk å føre det i regnskapet! Er dere uenige, kan dere snakke med Bysjefen.` });
    UI.toast('Boten er gitt');
  },
  async trekkTilbakeBot(id) {
    const b = Store.hent('boter/' + id);
    if (!b || b.trukketTilbake || !confirm(`Trekke tilbake boten på ${kr(b.belop)}? Pengene settes inn igjen.`)) return;
    await Store.sett(`boter/${id}/trukketTilbake`, true);
    await B.trans_ny(b.kontoId, b.belop, 'Bot trukket tilbake: ' + b.regel, 'bot', { botId: id });
    await B.post_ny(b.kontoId, { type: 'brev', tittel: 'Boten er trukket tilbake', fra: 'Kommunen', tekst: `Boten for «${b.regel}» er trukket tilbake. ${kr(b.belop)} er satt inn på kontoen igjen.\n\nHusk å føre det i regnskapet!` });
    UI.toast('Boten er trukket tilbake');
  },
  async nyTrans() {
    const id = $('#tKonto').value, tekst = $('#tTekst').value.trim(), belop = parseInt($('#tBelop').value);
    if (!id || !tekst || !belop) { UI.toast('Fyll ut konto, tekst og beløp.', 'feil'); return; }
    await B.trans_ny(id, belop, tekst, belop > 0 ? 'inntekt' : 'bot');
    if ($('#tBrev').checked) await B.post_ny(id, { type: 'brev', tittel: tekst, tekst: `${belop > 0 ? 'Det er satt inn' : 'Det er trukket'} ${kr(Math.abs(belop))} ${belop > 0 ? 'på' : 'fra'} kontoen.`, fra: 'Banken' });
    UI.toast('Registrert');
  },

  /* =========================================================
     UKEOPPGJØR
     ========================================================= */
  beregnUke() {
    const I = B.innst(), hh = B.kontoer('hh');
    const lonn = [];
    hh.forEach(k => B.medlemmer(k).forEach((navn, i) => { const j = B.jobbFor(k.id, i); if (j && j.type === 'offentlig') lonn.push({ kontoId: k.id, navn, jobb: j.navn, sum: I.offentligLonn }); }));
    const totalLonn = lonn.reduce((s, l) => s + l.sum, 0);
    const prosent = I.skatteModell === 'prosent';
    const skatt = hh.length ? Math.ceil(totalLonn / hh.length) : 0;
    return {
      skatt, totalLonn, lonn, prosent,
      rader: hh.map(k => {
        const a = k.avtale || {};
        const f = a.forsikring ? I.forsikringPerUke : 0;
        const inn = lonn.filter(x => x.kontoId === k.id).reduce((s, x) => s + x.sum, 0);
        const sk = prosent ? Math.round(inn * I.skattProsent / 100) : skatt;
        return { k, forsikring: f, lonn: inn, skatt: sk, netto: inn - f - sk };
      })
    };
  },
  sideUke() {
    const u = this.beregnUke(), sist = liste(Store.hent('logg/uke')).sort((a, b) => b.tid - a.tid)[0];
    return `<div class="sidetittel"><h1>Ukeoppgjør</h1><p class="dempet">Kjøres én gang i uka: lønn fra byen, skatt og forsikring.</p></div>
      ${sist ? `<div class="melding info">Forrige ukeoppgjør: ${datoTid(sist.tid)}</div>` : ''}
      <div class="kort">
        <p>Offentlige lønninger denne uka: <b>${kr(u.totalLonn)}</b> fordelt på ${u.lonn.length} ansatte.
          ${u.prosent ? `Skatten er <b>${B.innst().skattProsent} %</b> av lønnen (lønn fra bedrifter skattlegges når du fordeler overskudd).` : `Det deles på alle husholdningene som skatt: <b>${kr(u.skatt)}</b> hver.`}</p>
        <div class="tabellboks"><table><tr><th>Husholdning</th><th class="tall">Lønn</th><th class="tall">Skatt</th><th class="tall">Forsikring</th><th class="tall">Netto</th></tr>
          ${u.rader.map(r => `<tr><td>${esc(B.kontoNavn(r.k.id))}</td><td class="tall pluss">${r.lonn ? kr(r.lonn) : ''}</td><td class="tall minus">${r.skatt ? kr(-r.skatt) : ''}</td><td class="tall minus">${r.forsikring ? kr(-r.forsikring) : ''}</td><td class="tall"><b>${kr(r.netto)}</b></td></tr>`).join('')}
        </table></div>
        <p class="dempet liten" style="margin-top:8px">Bedrifter fordeler overskuddet sitt selv under «Jobber og bedrifter».</p>
        <p style="margin-top:12px"><button class="gul" onclick="Laerer.kjorUke()">Gjennomfør ukeoppgjøret</button></p>
      </div>`;
  },
  async kjorUke() {
    const sist = liste(Store.hent('logg/uke')).sort((a, b) => b.tid - a.tid)[0];
    if (sist && Date.now() - sist.tid < 3 * 864e5 && !confirm('Det er mindre enn tre dager siden forrige ukeoppgjør. Kjøre likevel?')) return;
    if (!confirm('Gjennomføre ukeoppgjøret nå?')) return;
    const u = this.beregnUke();
    for (const l of u.lonn) {
      await B.trans_ny(l.kontoId, l.sum, `Lønn ${l.navn} (${l.jobb})`, 'lonn');
      await B.post_ny(l.kontoId, { type: 'lonnsslipp', tittel: 'Lønnsslipp – ' + l.navn, navn: l.navn, jobb: l.jobb, sum: l.sum });
    }
    for (const r of u.rader) {
      if (r.skatt) await B.trans_ny(r.k.id, -r.skatt, u.prosent ? `Skatt (${B.innst().skattProsent} % av ${kr(r.lonn)})` : 'Skatt', 'skatt');
      if (r.forsikring) await B.trans_ny(r.k.id, -r.forsikring, 'Forsikring', 'forsikring');
      const deler = [r.skatt && `Skatt: ${kr(r.skatt)}`, r.forsikring && `Forsikring: ${kr(r.forsikring)}`].filter(Boolean);
      if (deler.length) await B.post_ny(r.k.id, { type: 'brev', tittel: 'Faste utgifter denne uka', tekst: 'Følgende er trukket fra kontoen:\n' + deler.join('\n') + '\n\nHusk å føre det i regnskapet!', fra: 'Banken' });
    }
    await Store.leggTil('logg/uke', { tid: Date.now(), skatt: u.skatt, lonn: u.totalLonn });
    UI.toast('Ukeoppgjøret er gjennomført');
  },

  /* =========================================================
     POST OG TILBUD
     ========================================================= */
  sidePost() {
    const mottakere = `<select id="pTil"><option value="alle">Alle husholdninger</option>${B.kontoer().map(k => `<option value="${k.id}">${esc(B.kontoNavn(k.id))}</option>`).join('')}</select>`;
    const tilbudSvar = B.kontoer('hh').flatMap(k => B.post(k.id).filter(p => p.type === 'tilbud').map(p => ({ k, p })));
    const perTilbud = {};
    tilbudSvar.forEach(({ k, p }) => { const t = perTilbud[p.tittel] = perTilbud[p.tittel] || { ja: [], nei: [], venter: 0 }; if (p.svar === 'ja') t.ja.push(k.navn); else if (p.svar === 'nei') t.nei.push(k.navn); else t.venter++; });
    return `<div class="sidetittel"><h1>Post og tilbud</h1></div>
      <div class="rutenett to">
        <div class="kort"><h2>Send brev</h2>
          <label class="felt">Til</label>${mottakere}
          <label class="felt" for="pTittel">Overskrift</label><input id="pTittel" style="width:100%" placeholder="F.eks. Varsel om brudd på byggereglene">
          <label class="felt" for="pTekst">Tekst</label><textarea id="pTekst"></textarea>
          <div class="rad" style="margin-top:10px"><button onclick="Laerer.sendBrev()">Send</button>
            <button class="sek sma" onclick="$('#pTittel').value='Varsel om brudd på byggereglene';$('#pTekst').value='Det er oppdaget brudd på byggereglene på eiendommen deres. Dere får pålegg om å rette dette innen neste økt. Hvis pålegget ikke blir fulgt, vil det komme en bot på 5 000 kr per uke.\\n\\nMed vennlig hilsen\\nBysjefen'">Mal: byggevarsel</button></div>
        </div>
        <div class="kort"><h2>Send tilbud</h2>
          <p class="dempet">Elevene svarer ja eller nei i postkassen. Sier de ja, trekkes beløpet automatisk.</p>
          <div class="chips">${TILBUDSMALER.map((t, i) => `<button onclick="Laerer.brukMal(${i})">${esc(t.tittel)}</button>`).join('')}</div>
          <label class="felt" for="tbTittel">Tilbud</label><input id="tbTittel" style="width:100%">
          <label class="felt" for="tbTekst">Beskrivelse</label><textarea id="tbTekst"></textarea>
          <div class="rad"><div><label class="felt" for="tbPris">Ordinær pris</label><input type="number" id="tbPris" min="0"></div>
            <div><label class="felt" for="tbAvslag">Avslag i %</label><input type="number" id="tbAvslag" min="0" max="90" placeholder="0"></div></div>
          <p class="dempet liten">Med avslag må elevene selv regne ut den nye prisen før de kan kjøpe.</p>
          <p style="margin-top:10px"><button onclick="Laerer.sendTilbud()">Send til alle husholdninger</button></p>
        </div>
      </div>
      <div class="kort"><h2>Svar på tilbud</h2>${Object.keys(perTilbud).length ? `<table>${Object.entries(perTilbud).map(([t, s]) => `<tr><td><b>${esc(t)}</b></td><td>Ja: ${s.ja.length ? esc(s.ja.join(', ')) : '–'}</td><td class="dempet">${s.nei.length} nei · ${s.venter} har ikke svart</td></tr>`).join('')}</table>` : UI.tom('Ingen tilbud sendt ennå.')}</div>`;
  },
  brukMal(i) { const t = TILBUDSMALER[i]; $('#tbTittel').value = t.tittel; $('#tbTekst').value = t.tekst; $('#tbPris').value = t.pris; },
  async sendBrev() {
    const til = $('#pTil').value, tittel = $('#pTittel').value.trim(), tekst = $('#pTekst').value.trim();
    if (!tittel || !tekst) { UI.toast('Skriv overskrift og tekst.', 'feil'); return; }
    const mottakere = til === 'alle' ? B.kontoer('hh') : [B.konto(til)];
    for (const k of mottakere) await B.post_ny(k.id, { type: 'brev', tittel, tekst, fra: 'Bysjefen' });
    UI.toast(`Sendt til ${mottakere.length}`); $('#pTittel').value = ''; $('#pTekst').value = '';
  },
  async sendTilbud() {
    const tittel = $('#tbTittel').value.trim(), tekst = $('#tbTekst').value.trim(), ord = parseInt($('#tbPris').value);
    const avslag = Math.max(0, Math.min(90, parseInt($('#tbAvslag').value) || 0));
    if (!tittel || !ord) { UI.toast('Skriv tilbud og pris.', 'feil'); return; }
    const pris = Math.round(ord * (100 - avslag) / 100);
    for (const k of B.kontoer('hh')) await B.post_ny(k.id, { type: 'tilbud', tittel, tekst, pris, ordinaerPris: ord, avslag });
    UI.toast('Tilbudet er sendt');
  },

  /* =========================================================
     HENDELSER
     ========================================================= */
  sideHendelser() {
    const hh = B.kontoer('hh');
    const siste = hh.map(k => ({ k, p: B.post(k.id).find(p => p.type === 'hendelse') })).filter(x => x.p);
    return `<div class="sidetittel"><h1>Hendelser</h1><p class="dempet">Trekk et hendelseskort til hver husholdning i starten av økta. Kortene havner i postkassen.</p></div>
      <div class="kort"><button class="gul" onclick="Laerer.trekkHendelser()">🎲 Trekk hendelseskort til alle</button>
        <span class="dempet liten" style="margin-left:10px">Penger og forsikringskostnader trekkes automatisk.</span></div>
      <div class="kort"><h2>Siste hendelse per husholdning</h2>
        ${siste.length ? `<div class="tabellboks"><table><tr><th>Husholdning</th><th>Kort</th><th>Svar</th></tr>${siste.map(({ k, p }) => `<tr><td>${esc(B.kontoNavn(k.id))}<br><span class="dempet">${datoTid(p.tid)}</span></td><td>${esc(p.tekst)}${p.belop ? ` <b>(${kr(p.belop)})</b>` : ''}</td><td style="white-space:pre-wrap">${p.skriv ? (p.svar ? esc(p.svar) : '<span class="dempet">Ikke svart</span>') : ''}</td></tr>`).join('')}</table></div>` : UI.tom('Ingen hendelser trukket ennå.')}
      </div>
      <div class="kort"><h2>Kortstokken (${HENDELSESKORT.length} kort)</h2><div class="tabellboks"><table>${HENDELSESKORT.map(h => `<tr><td><b>${esc(h.tittel)}</b> ${esc(h.tekst)}</td><td class="dempet">${{ penger: 'Penger', forsikring: 'Forsikring', skriv: 'Skriveoppgave', oppdrag: 'Oppdrag i Minecraft' }[h.type]}</td></tr>`).join('')}</table></div></div>`;
  },
  async trekkHendelser() {
    const hh = B.kontoer('hh').filter(k => k.avtale && k.avtale.signert);
    if (!hh.length) { UI.toast('Ingen husholdninger har signert avtalen ennå.', 'feil'); return; }
    if (!confirm(`Trekke hendelseskort til ${hh.length} husholdninger?`)) return;
    let stokk = [];
    for (const k of hh) {
      if (!stokk.length) stokk = HENDELSESKORT.slice().sort(() => Math.random() - .5);
      const kort = stokk.pop();
      let belop = 0, tekst = kort.tekst;
      if (kort.type === 'penger') belop = kort.belop;
      if (kort.type === 'forsikring') {
        const f = k.avtale.forsikring;
        belop = -(f ? kort.medForsikring : kort.utenForsikring);
        tekst += f ? ` Dere har forsikring, så det koster bare ${kr(kort.medForsikring)}.` : ` Dere har ikke forsikring, så det koster ${kr(kort.utenForsikring)}.`;
      }
      if (belop) await B.trans_ny(k.id, belop, 'Hendelse: ' + kort.tekst.slice(0, 40), 'hendelse');
      await B.post_ny(k.id, { type: 'hendelse', tittel: kort.tittel, tekst, belop, kortId: kort.id, skriv: kort.type === 'skriv' || !!kort.skriv });
    }
    UI.toast('Hendelseskort er delt ut');
  },

  /* =========================================================
     JOBBER OG BEDRIFTER
     ========================================================= */
  sideJobber() {
    const jobber = B.jobber(), sok = liste(Store.hent('jobbsoknader')), ans = Store.hent('ansettelser') || {};
    return `<div class="sidetittel"><h1>Jobber og bedrifter</h1></div>
      <div class="kort"><div class="rad mellom"><h2 style="margin:0">Jobbene i byen</h2>
        <div class="rad">${!jobber.length ? `<button class="sek" onclick="Laerer.standardJobber()">Legg inn jobbene fra 2020</button>` : ''}<button onclick="Laerer.nyJobb()">+ Ny jobb</button></div></div>
        ${jobber.length ? `<div class="tabellboks"><table style="margin-top:10px"><tr><th>Jobb</th><th>Type</th><th class="tall">Plasser</th><th>Ansatte</th><th>Bedrift</th><th></th></tr>
          ${jobber.map(j => { const a = B.ansatte(j.id), bed = j.bedriftId ? B.konto(j.bedriftId) : null; return `<tr>
            <td><input value="${esc(j.navn)}" onchange="Laerer.endreJobb('${j.id}','navn',this.value)" style="width:170px"><br><input value="${esc(j.beskrivelse || '')}" onchange="Laerer.endreJobb('${j.id}','beskrivelse',this.value)" style="width:100%;margin-top:4px;font-size:14px" placeholder="Beskrivelse"></td>
            <td><select onchange="Laerer.endreJobb('${j.id}','type',this.value)"><option value="offentlig" ${j.type === 'offentlig' ? 'selected' : ''}>Fast lønn</option><option value="privat" ${j.type === 'privat' ? 'selected' : ''}>Salg</option></select></td>
            <td class="tall"><input type="number" min="1" value="${j.plasser || 1}" style="width:64px" onchange="Laerer.endreJobb('${j.id}','plasser',parseInt(this.value)||1)"></td>
            <td>${a.length ? esc(a.map(x => x.navn).join(', ')) : '<span class="dempet">–</span>'} <span class="dempet">(${a.length}/${j.plasser || 1})</span></td>
            <td>${j.type === 'privat' ? (bed ? `${esc(bed.navn)}<br><b>${kr(B.saldo(bed.id))}</b>` : `<button class="sma sek" onclick="Laerer.opprettBedrift('${j.id}')">Opprett bedrift</button>`) : ''}</td>
            <td><button class="sma sek ikon" onclick="Laerer.slettJobb('${j.id}')" aria-label="Slett">✕</button></td></tr>`; }).join('')}</table></div>` : UI.tom('Ingen jobber ennå.')}
      </div>
      <div class="kort"><div class="rad mellom"><h2 style="margin:0">Søknader og fordeling</h2>
        <div class="rad"><button class="sek" onclick="Laerer.foreslaFordeling()" ${sok.length ? '' : 'disabled'}>Foreslå fordeling</button><button onclick="Laerer.sendJobbsvar()" ${Object.keys(ans).length ? '' : 'disabled'}>Send jobbsvar</button></div></div>
        ${sok.length ? `<div class="tabellboks"><table style="margin-top:10px"><tr><th>Elev</th><th>Ønsker</th><th>Argumenter</th><th>Jobb</th></tr>
          ${sok.sort((a, b) => String(a.navn).localeCompare(b.navn)).map(s => `<tr><td><b>${esc(s.navn)}</b><br><span class="dempet">${esc(B.kontoNavn(s.kontoId))}</span></td>
            <td>${(s.valg || []).map((v, i) => v ? `${i + 1}. ${esc((jobber.find(j => j.id === v) || {}).navn || '?')}` : '').filter(Boolean).join('<br>')}</td>
            <td style="max-width:320px;white-space:pre-wrap;font-size:14px">${esc(s.argumenter)}</td>
            <td><select onchange="Laerer.ansett('${s.id}',this.value)"><option value="">–</option>${jobber.map(j => `<option value="${j.id}" ${ans[s.id] === j.id ? 'selected' : ''}>${esc(j.navn)}</option>`).join('')}</select></td></tr>`).join('')}</table></div>` : UI.tom('Ingen søknader ennå. Elevene søker under «Jobb».')}
      </div>
      ${B.kontoer('bedrift').length ? `<div class="kort"><h2>Bedrifter</h2><p class="dempet">Når en bedrift har solgt for noe, fordeler du overskuddet på de ansatte. Bedriftene får inntekter når kunder betaler i «Byens butikker».</p>
        <div class="tabellboks"><table><tr><th>Bedrift</th><th>Kiste (x y z)</th><th class="tall">Saldo</th><th>Fordel overskudd</th></tr>
        ${B.kontoer('bedrift').map(b => { const j = B.jobber().find(x => x.bedriftId === b.id), a = j ? B.ansatte(j.id) : []; return `<tr><td><b>${esc(b.navn)}</b><br><span class="dempet">${a.length} ansatte</span></td>
          <td><input style="width:60px" value="${esc(b.x ?? '')}" onchange="Store.sett('kontoer/${b.id}/x',this.value.trim())"> <input style="width:60px" value="${esc(b.y ?? '')}" onchange="Store.sett('kontoer/${b.id}/y',this.value.trim())"> <input style="width:60px" value="${esc(b.z ?? '')}" onchange="Store.sett('kontoer/${b.id}/z',this.value.trim())"></td>
          <td class="tall">${kr(B.saldo(b.id))}</td><td><div class="rad"><input type="number" id="ford_${b.id}" placeholder="kr" style="width:100px"><button class="sma" onclick="Laerer.fordel('${b.id}')" ${a.length ? '' : 'disabled'}>Fordel</button></div></td></tr>`; }).join('')}</table></div></div>` : ''}`;
  },
  async standardJobber() { const e = {}; Object.entries(STANDARD_JOBBER).forEach(([id, j]) => { e['jobber/' + id] = j; }); await Store.flere(e); },
  async nyJobb() { await Store.leggTil('jobber', { navn: 'Ny jobb', type: 'privat', plasser: 2, beskrivelse: '' }); },
  endreJobb(id, felt, v) { Store.sett(`jobber/${id}/${felt}`, v); },
  async slettJobb(id) {
    if (!confirm('Slette jobben? Ansatte mister jobben.')) return;
    const e = { ['jobber/' + id]: null };
    Object.entries(Store.hent('ansettelser') || {}).forEach(([n, j]) => { if (j === id) e['ansettelser/' + n] = null; });
    await Store.flere(e);
  },
  ansett(nokkel, jobbId) { Store.sett('ansettelser/' + nokkel, jobbId || null); },
  async foreslaFordeling() {
    if (Object.keys(Store.hent('ansettelser') || {}).length && !confirm('Erstatte dagens fordeling med et forslag?')) return;
    const jobber = B.jobber(), sok = liste(Store.hent('jobbsoknader')).sort(() => Math.random() - .5);
    const ledig = Object.fromEntries(jobber.map(j => [j.id, j.plasser || 1]));
    const res = {};
    for (let runde = 0; runde < 3; runde++) sok.forEach(s => { if (res[s.id]) return; const j = (s.valg || [])[runde]; if (j && ledig[j] > 0) { res[s.id] = j; ledig[j]--; } });
    sok.forEach(s => { if (res[s.id]) return; const j = Object.keys(ledig).find(x => ledig[x] > 0); if (j) { res[s.id] = j; ledig[j]--; } });
    await Store.sett('ansettelser', res);
    UI.toast('Forslag laget – juster gjerne før du sender svar.');
  },
  async sendJobbsvar() {
    const ans = Store.hent('ansettelser') || {}, I = B.innst();
    for (const [n, jid] of Object.entries(ans)) {
      const [kontoId, i] = n.split('~'), k = B.konto(kontoId), j = Store.hent('jobber/' + jid);
      if (!k || !j) continue;
      const navn = B.medlemmer(k)[i];
      await B.post_ny(kontoId, { type: 'jobb', tittel: `Gratulerer, ${navn}! Du har fått jobb i ${j.navn}`, tekst: `${j.beskrivelse || ''}\n\nLønn: ${j.type === 'offentlig' ? kr(I.offentligLonn) + ' i uken fra byen.' : 'Det dere klarer å selge for, deles på de ansatte.'}` });
    }
    UI.toast('Jobbsvar er sendt');
  },
  async opprettBedrift(jobbId) {
    const j = Store.hent('jobber/' + jobbId), I = B.innst();
    const id = await Store.leggTil('kontoer', { type: 'bedrift', navn: j.navn, jobbId, x: '', y: '', z: '' });
    await Store.sett(`jobber/${jobbId}/bedriftId`, id);
    if (I.bedriftBonus) await B.trans_ny(id, I.bedriftBonus, 'Oppstartsbonus bedrift', 'start');
    UI.toast('Bedriften er opprettet. Legg inn kistekoordinater!');
  },
  async fordel(bedriftId) {
    const sum = parseInt($('#ford_' + bedriftId).value);
    const j = B.jobber().find(x => x.bedriftId === bedriftId), a = j ? B.ansatte(j.id) : [];
    if (!sum || sum <= 0 || !a.length) return;
    if (sum > B.saldo(bedriftId)) { UI.toast('Bedriften har ikke så mye penger.', 'feil'); return; }
    const hver = Math.floor(sum / a.length);
    await B.trans_ny(bedriftId, -hver * a.length, `Lønn til ${a.length} ansatte`, 'lonn');
    const I = B.innst(), skatt = I.skatteModell === 'prosent' ? Math.round(hver * I.skattProsent / 100) : 0;
    for (const x of a) {
      await B.trans_ny(x.kontoId, hver, `Lønn ${x.navn} (${j.navn})`, 'lonn');
      if (skatt) await B.trans_ny(x.kontoId, -skatt, `Skatt (${I.skattProsent} % av ${kr(hver)})`, 'skatt');
      await B.post_ny(x.kontoId, { type: 'lonnsslipp', tittel: 'Lønnsslipp – ' + x.navn, navn: x.navn, jobb: j.navn, sum: hver, skatt });
    }
    UI.toast(`${kr(hver)} til hver av de ansatte`);
  },

  /* =========================================================
     BYENS BUTIKKER (elevbedriftene)
     ========================================================= */
  sideButikker() {
    const bed = B.kontoer('bedrift'), salg = B.kjop();
    const btab = bed.map(b => {
      const bt = B.butikk(b.id), v = B.butikkVarer(b.id), s = salg.filter(k => k.til === b.id && k.status !== 'refundert');
      return `<tr><td><b>${esc(b.navn)}</b>${bt.beskrivelse ? `<br><span class="dempet">${esc(bt.beskrivelse)}</span>` : ''}</td>
        <td>${bt.apen ? '<span class="pluss">Åpen</span>' : '<span class="dempet">Stengt</span>'}</td>
        <td>${v.length ? v.map(x => `${esc(x.navn)} <span class="dempet">${kr(x.pris)}</span>${x.aktiv === false ? ' <span class="dempet">(skjult)</span>' : ''}`).join('<br>') : '<span class="dempet">Ingen varer</span>'}</td>
        <td class="tall">${s.length}</td><td class="tall">${kr(s.reduce((n, k) => n + k.sum, 0))}</td>
        <td>${bt.apen ? `<button class="sma sek" onclick="Store.sett('butikker/${b.id}/apen',false)">Steng</button>` : ''}</td></tr>`;
    }).join('');
    return `<div class="sidetittel"><h1>Byens butikker</h1><p class="dempet">Bedriftene legger inn varer og priser selv under «Min bedrift». Kundene betaler i portalen, og pengene går rett til bedriften.</p></div>
      ${bed.length ? `<div class="kort"><h2>Bedriftene</h2><div class="tabellboks"><table><tr><th>Bedrift</th><th>Status</th><th>Varer og priser</th><th class="tall">Salg</th><th class="tall">Omsetning</th><th></th></tr>${btab}</table></div></div>`
        : `<div class="kort">${UI.tom('Ingen bedrifter ennå. Opprett dem under «Jobber og bedrifter».')}</div>`}
      <div class="kort"><h2>Alt salg</h2><p class="dempet">Har noe gått galt (feil vare, kjøpt ved et uhell), kan du refundere: pengene går tilbake til kunden og trekkes fra bedriften.</p>
        ${B.kjopTabell(salg.slice(0, 100), 'laerer', k => k.status !== 'refundert' ? `<button class="sma sek" onclick="Laerer.refunder('${k.id}')">Refunder</button>` : '')}</div>`;
  },
  async refunder(id) {
    const k = Store.hent('kjop/' + id);
    if (!k || k.status === 'refundert') return;
    if (!confirm(`Refundere ${kr(k.sum)} fra ${B.kontoNavn(k.til)} til ${B.kontoNavn(k.fra)}?`)) return;
    const tid = Date.now(), varer = (k.linjer || []).map(l => `${l.antall}× ${l.navn}`).join(', '), fordeling = {};
    (k.linjer || []).forEach(l => { const kat = l.kat || 'annet'; fordeling[kat] = (fordeling[kat] || 0) + l.antall * l.pris; });
    await Store.flere({
      [`kjop/${id}/status`]: 'refundert',
      [`trans/${k.fra}/${id}_r`]: { tid, belop: k.sum, tekst: `Refusjon fra ${B.kontoNavn(k.til)}: ${varer}`, kat: 'refusjon', fordeling, kjopId: id },
      [`trans/${k.til}/${id}_r`]: { tid, belop: -k.sum, tekst: `Refusjon til ${B.kontoNavn(k.fra)}: ${varer}`, kat: 'refusjon', kjopId: id }
    });
    await B.post_ny(k.fra, { type: 'brev', tittel: 'Pengene er betalt tilbake', tekst: `Kjøpet hos ${B.kontoNavn(k.til)} (${varer}) er refundert. ${kr(k.sum)} er satt inn på kontoen igjen.\n\nHusk å føre det i regnskapet!`, fra: 'Banken' });
    UI.toast('Refundert');
  },

  /* =========================================================
     BYSTYRET
     ========================================================= */
  sideBystyre() {
    const alle = liste(Store.hent('forslag')).sort((a, b) => a.tid - b.tid);
    const st = f => Object.keys(f.stotte || {}).length;
    const klare = alle.filter(f => f.status === 'samler' && st(f) >= 2), samler = alle.filter(f => f.status === 'samler' && st(f) < 2), ferdige = alle.filter(f => f.status === 'vedtatt' || f.status === 'forkastet');
    return `<div class="sidetittel"><h1>Bystyret</h1><p class="dempet">Forslag med støtte fra to andre husholdninger kan tas opp til avstemming.</p></div>
      <div class="kort"><h2>Klare til avstemming (${klare.length})</h2>
        ${klare.length ? `<table>${klare.map(f => `<tr><td><b>${esc(f.tekst)}</b><br><span class="dempet">Fra ${esc(B.kontoNavn(f.kontoId))}</span></td>
          <td><button class="sma sek" onclick="Laerer.visForslag('${f.id}')">Vis på tavla</button></td>
          <td class="tall"><input type="number" id="ja_${f.id}" placeholder="Ja" style="width:70px"> <input type="number" id="nei_${f.id}" placeholder="Nei" style="width:70px"> <button class="sma" onclick="Laerer.stem('${f.id}')">Registrer</button></td></tr>`).join('')}</table>` : UI.tom('Ingen forslag er klare.')}
      </div>
      <div class="kort"><h2>Samler støtte</h2>${samler.length ? `<table>${samler.map(f => `<tr><td>${esc(f.tekst)}</td><td class="tall">${st(f)}/2</td><td><button class="sma sek" onclick="Store.sett('forslag/${f.id}/status','forkastet')">Avvis</button></td></tr>`).join('')}</table>` : UI.tom('Ingen.')}</div>
      <div class="kort"><div class="rad mellom"><h2 style="margin:0">Resultater</h2><button class="sek" onclick="Laerer.nyeLover()" ${ferdige.some(f => f.status === 'vedtatt' && !f.kunngjort) ? '' : 'disabled'}>Send brev om nye lover</button></div>
        ${ferdige.length ? `<table style="margin-top:10px">${ferdige.map(f => `<tr><td>${esc(f.tekst)}</td><td class="tall">${f.ja} ja – ${f.nei} nei</td><td>${UI.merke(f.status)}</td></tr>`).join('')}</table>` : UI.tom('Ingen avstemminger ennå.')}</div>`;
  },
  visForslag(id) {
    const f = Store.hent('forslag/' + id);
    const el = document.createElement('div'); el.className = 'tavle'; el.id = 'tavle';
    el.innerHTML = `<button class="sek lukk" onclick="document.getElementById('tavle').remove()">Lukk</button><h1>Lovforslag</h1><p class="stortekst">«${esc(f.tekst)}»</p><p class="vinnere" style="margin-top:40px">Hvem stemmer for? Hvem stemmer mot?</p>`;
    document.body.appendChild(el);
  },
  async stem(id) {
    const ja = parseInt($('#ja_' + id).value) || 0, nei = parseInt($('#nei_' + id).value) || 0;
    if (!ja && !nei) return;
    await Store.oppdater('forslag/' + id, { ja, nei, status: ja > nei ? 'vedtatt' : 'forkastet' });
    UI.toast(ja > nei ? 'Vedtatt!' : 'Forkastet');
  },
  async nyeLover() {
    const nye = liste(Store.hent('forslag')).filter(f => f.status === 'vedtatt' && !f.kunngjort);
    const tekst = 'Bystyret har vedtatt følgende nye lover:\n\n' + nye.map(f => '• ' + f.tekst).join('\n') + '\n\nLovene gjelder fra i dag.\n\nMed vennlig hilsen\nBysjefen';
    for (const k of B.kontoer('hh')) await B.post_ny(k.id, { type: 'brev', tittel: 'NYE LOVER!', tekst, fra: 'Bystyret' });
    const e = {}; nye.forEach(f => { e[`forslag/${f.id}/kunngjort`] = true; }); await Store.flere(e);
    UI.toast('Brevet er sendt');
  },

  /* =========================================================
     HUSHOLDNINGER
     ========================================================= */
  sideKontoer() {
    const I = B.innst(), hh = B.kontoer('hh'), nye = Object.keys(this.nyePin).length;
    return `<div class="sidetittel"><h1>Husholdninger</h1><p class="dempet">Bruk kallenavn eller fornavn – ikke fullt navn. Kisteposisjonen finner du ved å stå på ruten der kisten skal stå med «Vis koordinater» på.</p></div>
      <div class="kort"><h2>Ny husholdning</h2>
        <div class="rad"><input id="nyTomt" placeholder="Tomt nr." style="width:90px"><input id="nyNavn" placeholder="Navn på husholdningen" style="flex:1;min-width:160px">
          <input id="nyMedl" placeholder="Medlemmer (komma mellom)" style="flex:1;min-width:200px"></div>
        <div class="rad" style="margin-top:8px"><span class="dempet">Kiste:</span><input id="nyX" placeholder="x" style="width:80px"><input id="nyY" placeholder="y" style="width:80px"><input id="nyZ" placeholder="z" style="width:80px">
          <span class="dempet">Tomt:</span><input id="nyB" type="number" value="${I.tomtBredde}" style="width:70px">×<input id="nyD" type="number" value="${I.tomtDybde}" style="width:70px">
          <button onclick="Laerer.nyKonto()">Legg til</button></div>
        <p class="dempet liten" style="margin-top:8px">En husholdning kan ha én eller flere elever – du bestemmer. Startbonusen på ${kr(I.startbonus)} settes inn automatisk, og det lages en PIN-kode.</p>
      </div>
      ${nye ? `<div class="kort" style="border:3px dashed var(--gul)"><div class="rad mellom"><h2 style="margin:0">Nye PIN-koder</h2><button class="sek" onclick="window.print()">Skriv ut</button></div>
        <p class="dempet ikke-skriv">PIN-kodene vises bare nå – skriv dem ut eller noter dem. (De lagres kryptert.)</p>
        <div class="rutenett">${Object.entries(this.nyePin).map(([id, pin]) => `<div class="kort flat" style="margin:0"><div class="tittel" style="font-size:20px">${esc(B.kontoNavn(id))}</div><div class="dempet">${esc(B.medlemmer(B.konto(id) || {}).join(', '))}</div><div style="font-size:30px;letter-spacing:6px;font-weight:700">${pin}</div></div>`).join('')}</div>
        <p class="ikke-skriv"><button class="sek sma" onclick="Laerer.nyePin={};Laerer.tegn()">Skjul</button></p></div>` : ''}
      <div class="kort ikke-skriv"><h2>Alle husholdninger</h2>
        ${hh.length ? `<div class="tabellboks"><table><tr><th>Tomt</th><th>Navn</th><th>Medlemmer</th><th>Kiste x / y / z</th><th>Tomt</th><th></th></tr>
          ${hh.map(k => `<tr>
            <td><input value="${esc(k.tomt)}" style="width:56px" onchange="Store.sett('kontoer/${k.id}/tomt',this.value.trim())"></td>
            <td><input value="${esc(k.navn)}" style="width:150px" onchange="Store.sett('kontoer/${k.id}/navn',this.value.trim())"></td>
            <td><input value="${esc(B.medlemmer(k).join(', '))}" style="width:180px" onchange="Laerer.settMedlemmer('${k.id}',this.value)"></td>
            <td><input value="${esc(k.x ?? '')}" style="width:62px" onchange="Store.sett('kontoer/${k.id}/x',this.value.trim())"> <input value="${esc(k.y ?? '')}" style="width:62px" onchange="Store.sett('kontoer/${k.id}/y',this.value.trim())"> <input value="${esc(k.z ?? '')}" style="width:62px" onchange="Store.sett('kontoer/${k.id}/z',this.value.trim())"></td>
            <td><input type="number" value="${esc(k.tomtB || I.tomtBredde)}" style="width:56px" onchange="Store.sett('kontoer/${k.id}/tomtB',parseInt(this.value)||${I.tomtBredde})">×<input type="number" value="${esc(k.tomtD || I.tomtDybde)}" style="width:56px" onchange="Store.sett('kontoer/${k.id}/tomtD',parseInt(this.value)||${I.tomtDybde})"></td>
            <td style="white-space:nowrap"><button class="sma sek" onclick="Laerer.nyPin('${k.id}')">Ny PIN</button> <button class="sma sek" onclick="Laerer.diplom('${k.id}')">Diplom</button> <button class="sma rod ikon" onclick="Laerer.slettKonto('${k.id}')" aria-label="Slett">✕</button></td></tr>`).join('')}
        </table></div><p style="margin-top:10px"><button class="sek" onclick="Laerer.nyPinAlle()">Lag nye PIN-koder til alle</button></p>` : UI.tom('Ingen husholdninger ennå.')}
      </div>`;
  },
  lagPin: () => String(Math.floor(1000 + Math.random() * 9000)),
  async nyKonto() {
    const I = B.innst(), navn = $('#nyNavn').value.trim();
    if (!navn) { UI.toast('Skriv et navn på husholdningen.', 'feil'); return; }
    const medl = $('#nyMedl').value.split(',').map(s => s.trim()).filter(Boolean);
    const tomter = B.kontoer('hh').map(k => Number(k.tomt) || 0);
    const id = Store.nyId();
    const pin = this.lagPin();
    await Store.sett('kontoer/' + id, {
      type: 'hh', navn, medlemmer: medl, tomt: $('#nyTomt').value.trim() || String((tomter.length ? Math.max(...tomter) : 0) + 1),
      x: $('#nyX').value.trim(), y: $('#nyY').value.trim(), z: $('#nyZ').value.trim(),
      tomtB: parseInt($('#nyB').value) || I.tomtBredde, tomtD: parseInt($('#nyD').value) || I.tomtDybde, pinHash: hashPin(pin, id)
    });
    await B.trans_ny(id, I.startbonus, 'Startbonus', 'start');
    await B.post_ny(id, { type: 'brev', tittel: `Velkommen til ${I.byNavn || 'byen'}!`, tekst: `Dere har fått tomt og en startbonus på ${kr(I.startbonus)} til å bygge og innrede huset. Første oppgave er å tegne huset og sende byggesøknad.\n\nLykke til!\nBysjefen`, fra: 'Bysjefen' });
    this.nyePin[id] = pin;
    this.tegn();
  },
  settMedlemmer(id, tekst) { Store.sett(`kontoer/${id}/medlemmer`, tekst.split(',').map(s => s.trim()).filter(Boolean)); },
  async nyPin(id) { const pin = this.lagPin(); await Store.sett(`kontoer/${id}/pinHash`, hashPin(pin, id)); this.nyePin[id] = pin; this.tegn(); },
  async nyPinAlle() {
    if (!confirm('Lage nye PIN-koder til alle? De gamle slutter å virke.')) return;
    const e = {};
    B.kontoer('hh').forEach(k => { const pin = this.lagPin(); e[`kontoer/${k.id}/pinHash`] = hashPin(pin, k.id); this.nyePin[k.id] = pin; });
    await Store.flere(e); this.tegn();
  },
  async slettKonto(id) {
    if (!confirm(`Slette ${B.kontoNavn(id)} med all historikk?`)) return;
    const e = { ['kontoer/' + id]: null, ['trans/' + id]: null, ['post/' + id]: null, ['soknader/' + id]: null, ['regnskap/' + id]: null, ['budsjett/' + id]: null };
    liste(Store.hent('bestillinger')).filter(b => b.kontoId === id).forEach(b => { e['bestillinger/' + b.id] = null; });
    Object.keys(Store.hent('ansettelser') || {}).filter(n => n.startsWith(id + '~')).forEach(n => { e['ansettelser/' + n] = null; });
    Object.keys(Store.hent('jobbsoknader') || {}).filter(n => n.startsWith(id + '~')).forEach(n => { e['jobbsoknader/' + n] = null; });
    await Store.flere(e);
  },
  diplom(id) {
    const k = B.konto(id), I = B.innst();
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html lang="no"><head><meta charset="utf-8"><title>Medborgerdiplom</title>
      <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lilita+One&display=swap" rel="stylesheet">
      <style>body{font-family:'Atkinson Hyperlegible',sans-serif;margin:0}.side{width:190mm;min-height:270mm;margin:10mm auto;border:10px double #7a5230;padding:18mm;box-sizing:border-box;text-align:center;page-break-after:always}
      h1{font-family:'Lilita One';font-size:56px;color:#4f8a2b;margin:0}h2{font-family:'Lilita One';font-size:40px;margin:30px 0}li{text-align:left;margin:8px 0;font-size:18px}.sign{margin-top:60px;display:flex;justify-content:space-around}.sign div{border-top:1px solid #333;width:40%;padding-top:6px}</style></head><body>
      ${(B.medlemmer(k).length ? B.medlemmer(k) : [k.navn]).map(n => `<div class="side"><h1>Medborgerdiplom</h1><p style="font-size:20px">${esc(I.byNavn || 'Byen vår')}</p><p>tildeles</p><h2>${esc(n)}</h2>
        <p>Du har gjennom prosjektet vist at du kan:</p><ul><li>Planlegge et hus og bygge etter byggetegninger</li><li>Forholde deg til et budsjett og overholde dette</li>
        <li>Føre regnskap over inntekter og utgifter</li><li>Søke og argumentere for en jobb du har lyst på</li><li>Forholde deg til lover og regler</li>
        <li>Vise hensyn og respektere de andre innbyggerne i byen</li><li>Delta i demokratiske prosesser, argumentere for dine meninger og respektere utfallet av en avstemming</li></ul>
        <div class="sign"><div>Dato</div><div>Bysjefen</div></div></div>`).join('')}
      <script>setTimeout(()=>print(),600)<\/script></body></html>`);
    w.document.close();
  },

  /* =========================================================
     LÆREPLANMÅL
     ========================================================= */
  sideLaereplan() {
    const grupper = [['kjerne', 'Kjernemål', 'Trenes direkte gjennom Klassebyen og egner seg for vurdering.'],
      ['støtte', 'Støttemål', 'Berøres naturlig i opplegget, men er ikke hovedfokus.'],
      ['utvidelse', 'Mulige utvidelser', 'Kan dekkes med et lite ekstra opplegg knyttet til byen.']];
    return `<div class="sidetittel"><div class="rad mellom"><h1>Læreplanmål</h1><button class="sek ikke-skriv" onclick="window.print()">Skriv ut</button></div>
      <p class="dempet">Kompetansemål etter 7. trinn i LK20, fra læreplanene som gjelder fra 1. august 2026. Areal og omkrets er hentet fra 6. trinn som repetisjon.</p></div>
      ${grupper.map(([r, tittel, tekst]) => `<div class="kort"><h2>${tittel}</h2><p class="dempet">${tekst}</p><div class="tabellboks"><table>
        <tr><th style="width:150px">Fag</th><th>Kompetansemål</th><th>I Klassebyen</th></tr>
        ${LAEREPLAN.filter(m => m.rolle === r).map(m => { const f = LAEREPLAN_FAG[m.fag]; return `<tr><td><b>${esc(f.navn)}</b><br><a class="dempet liten" href="${f.url}" target="_blank" rel="noopener">${f.kode}</a></td><td>${esc(m.mal)}</td><td class="dempet">${esc(m.hvor)}</td></tr>`; }).join('')}
      </table></div></div>`).join('')}
      <div class="kort flat"><p class="dempet liten" style="margin:0">Vurdert, men ikke tatt med: «bygge og eksperimentere med stabile konstruksjoner» (kunst og håndverk) krever fysiske materialer, og flere samfunnsfagsmål (historie, geografi, mangfold, menneskerettigheter, identitet) passer ikke naturlig inn i byspillet.</p></div>`;
  },

  /* =========================================================
     VAREKATALOG
     ========================================================= */
  sideKatalog() {
    const kat = B.katalog();
    return `<div class="sidetittel"><h1>Varekatalog</h1><p class="dempet">Endre priser og skru varer av og på. Gamle bestillinger beholder prisen de ble bestilt til. Vil du bruke egne bilder (f.eks. fra Higgsfield), lim inn en bildeadresse.</p></div>
      ${Object.entries(KATEGORIER).map(([id, navn]) => `<div class="kort"><h2>${navn}</h2><div class="tabellboks"><table><tr><th></th><th>I butikken</th><th>Vare</th><th>Minecraft-navn</th><th>Enhet</th><th class="tall">Pris</th><th>Eget bilde</th></tr>
        ${kat.filter(v => v.kat === id).map(v => `<tr><td class="miniikon">${Ikon.vare(v)}</td><td><input type="checkbox" ${v.aktiv ? 'checked' : ''} onchange="Laerer.endreVare('${v.id}','aktiv',this.checked)"></td>
          <td>${esc(v.navn)}</td><td><code>${esc(v.mc)}${v.data !== null ? ' ' + v.data : ''}</code></td><td>${B.enhet(v)}</td>
          <td class="tall"><input type="number" min="0" value="${v.pris}" style="width:90px" onchange="Laerer.endreVare('${v.id}','pris',Math.max(0,parseInt(this.value)||0))"></td>
          <td><input value="${esc(v.bilde || '')}" placeholder="https://… eller bilder/fil.png" style="width:190px;font-size:14px" onchange="Laerer.endreVare('${v.id}','bilde',this.value.trim()||null)"></td></tr>`).join('')}</table></div></div>`).join('')}`;
  },
  endreVare(id, felt, v) { Store.sett(`katalog/${id}/${felt}`, v); },

  /* =========================================================
     INNSTILLINGER
     ========================================================= */
  sideInnstillinger() {
    const I = B.innst();
    const tall = (felt, etikett, hjelp = '', ekstra = '') => `<tr><td><label for="i_${felt}">${etikett}</label>${hjelp ? `<div class="dempet liten">${hjelp}</div>` : ''}</td><td><input type="number" id="i_${felt}" value="${I[felt]}" ${ekstra} onchange="Laerer.settInnst('${felt}',Number(this.value))"></td></tr>`;
    return `<div class="sidetittel"><h1>Innstillinger</h1></div>
      <div class="kort"><h2>Byen</h2><table>
        <tr><td><label for="i_byNavn">Navn på byen</label></td><td><input id="i_byNavn" value="${esc(I.byNavn)}" onchange="Laerer.settInnst('byNavn',this.value.trim())"></td></tr>
        ${tall('startbonus', 'Startbonus husholdning (kr)')}${tall('bedriftBonus', 'Oppstartsbonus bedrift (kr)')}
        ${tall('offentligLonn', 'Ukelønn offentlige jobber (kr)', 'Politi, brannvesen, sykehus. Betales med skatt.')}
        <tr><td><label for="i_skm">Skatt</label><div class="dempet liten">Prosent gir øving i prosentregning (matematikk 7. trinn)</div></td>
          <td><select id="i_skm" onchange="Laerer.settInnst('skatteModell',this.value)"><option value="fordelt" ${I.skatteModell !== 'prosent' ? 'selected' : ''}>Offentlige lønninger deles likt på alle</option><option value="prosent" ${I.skatteModell === 'prosent' ? 'selected' : ''}>Prosent av lønn</option></select></td></tr>
        ${I.skatteModell === 'prosent' ? tall('skattProsent', 'Skatteprosent (%)') : ''}
        ${tall('forsikringPerUke', 'Forsikring per uke (kr)')}
        ${tall('ferdigBonus', 'Innflyttingsbonus ved ferdigattest (kr)', '0 = ingen bonus')}
      </table></div>
      <div class="kort"><h2>Byggeregler</h2><table>
        ${tall('maksHoyde', 'Maks byggehøyde (blokker)')}${tall('etasjeHoyde', 'Høyde per etasje (blokker)', 'Inkludert gulv/tak. 4 = 3 blokker vegg + 1 gulv.')}
        <tr><td><label for="i_maksAndel">Maks bebygd del av tomten (%)</label></td><td><input type="number" id="i_maksAndel" value="${Math.round(I.maksAndel * 100)}" onchange="Laerer.settInnst('maksAndel',Number(this.value)/100)"></td></tr>
        ${tall('tomtBredde', 'Standard tomtebredde (ruter)')}${tall('tomtDybde', 'Standard tomtedybde (ruter)')}
        <tr><td>Byggevarehandelen åpner først når byggesøknaden er godkjent</td><td><input type="checkbox" ${I.kreverByggesoknad ? 'checked' : ''} onchange="Laerer.settInnst('kreverByggesoknad',this.checked)"></td></tr>
      </table></div>
      <div class="kort"><h2>Butikk og levering</h2><table>
        <tr><td>Vis summer i butikken<div class="dempet liten">Av = elevene må regne ut totalen selv (anbefalt)</div></td><td><input type="checkbox" ${I.visSummer ? 'checked' : ''} onchange="Laerer.settInnst('visSummer',this.checked)"></td></tr>
        <tr><td><label for="i_chatOrd">Chat-ord for levering</label></td><td><input id="i_chatOrd" value="${esc(I.chatOrd)}" onchange="Laerer.settInnst('chatOrd',this.value.replace(/[^a-zA-Z0-9]/g,'')||'lever')"></td></tr>
        ${Store.firebaseModus ? '' : `<tr><td><label for="i_pin">Lærer-PIN</label></td><td><input id="i_pin" value="${esc(I.laererPin)}" onchange="Laerer.settInnst('laererPin',this.value.trim()||'1234')"></td></tr>`}
      </table></div>
      ${this.delKort()}
      <div class="kort"><h2>Lagring</h2>
        ${Store.firebaseModus ? `<div class="melding ok">Koblet til Firebase. Klasse-ID: <code>${esc(Store.byId)}</code></div>`
          : `<div class="melding advarsel"><b>Lokal testmodus:</b> Alt lagres bare i denne nettleseren.</div>`}
        <div class="rad"><button onclick="Laerer.eksporter()">Last ned sikkerhetskopi</button>
          <label class="knapp" style="background:#fff;color:var(--tekst);border:1px solid var(--kant);box-shadow:0 3px 0 var(--kant)">Gjenopprett fra fil<input type="file" accept=".json" class="skjult" onchange="Laerer.importer(this)"></label>
          <button class="rod" onclick="Laerer.nullstill()">Nullstill byen</button></div>
      </div>`;
  },
  settInnst(felt, v) {
    Store.sett('innstillinger/' + felt, v);
    if (felt === 'byNavn') Store.settGlobal(this.eierNokkel() + '/' + Store.byId + '/navn', v);
  },
  eksporter() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(Store.eksport(), null, 2)], { type: 'application/json' }));
    a.download = `byen-var-${Store.byId}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  },
  importer(input) {
    const f = input.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try { const d = JSON.parse(r.result); if (!confirm('Erstatte hele byen med innholdet i filen?')) return;
        if (Store.firebaseModus) d.laererUid = Store.uid;
        await Store.importer(d); UI.toast('Gjenopprettet'); }
      catch (e) { alert('Kunne ikke lese filen: ' + e.message); }
    };
    r.readAsText(f);
  },
  async nullstill() {
    if (!confirm('Slette ALT i byen – husholdninger, penger, bestillinger, post?')) return;
    if (!confirm('Helt sikker? Ta gjerne en sikkerhetskopi først.')) return;
    const behold = Store.firebaseModus ? { laererUid: Store.uid } : {};
    await Store.importer(behold); UI.toast('Byen er nullstilt');
  }
};
