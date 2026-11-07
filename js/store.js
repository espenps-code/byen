/* =========================================================
   LAGRING
   Samme API for lokal lagring og Firebase Realtime Database:
     Store.tre            – hele byen som ett objekt (kun lesing)
     Store.hent(sti)      – les en verdi, f.eks. 'kontoer/abc'
     Store.sett(sti, v)   – skriv (null = slett)
     Store.oppdater(sti, obj)
     Store.leggTil(sti, v) -> ny id
     Store.tell(sti)      – øker en teller trygt og gir ny verdi
     Store.paMeld(fn)     – kalles hver gang data endres
   ========================================================= */
const Store = (() => {
  const oppsett = window.BYEN_VAR_OPPSETT || {};
  const url = new URLSearchParams(location.search);
  const byId = (url.get('by') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const firebaseModus = !!(oppsett.firebase && window.firebase);
  const lytt = [];
  let tre = {};
  let db = null, auth = null, klar = false;
  const nokkel = 'byenvar2_' + byId;

  const deler = sti => String(sti).split('/').filter(Boolean);
  function hentFra(obj, sti) {
    let o = obj;
    for (const d of deler(sti)) { if (o == null) return undefined; o = o[d]; }
    return o;
  }
  function settI(obj, sti, verdi) {
    const ds = deler(sti);
    let o = obj;
    for (let i = 0; i < ds.length - 1; i++) {
      if (o[ds[i]] == null || typeof o[ds[i]] !== 'object') o[ds[i]] = {};
      o = o[ds[i]];
    }
    const siste = ds[ds.length - 1];
    if (verdi === null || verdi === undefined) delete o[siste];
    else o[siste] = JSON.parse(JSON.stringify(verdi));
  }
  const nyId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function varsle() { lytt.forEach(fn => { try { fn(tre); } catch (e) { console.error(e); } }); }

  /* ---------- Lokal ---------- */
  function lagreLokalt() {
    try { localStorage.setItem(nokkel, JSON.stringify(tre)); }
    catch (e) { alert('Kunne ikke lagre: ' + e.message); }
  }
  function startLokal() {
    try { tre = JSON.parse(localStorage.getItem(nokkel)) || {}; } catch (e) { tre = {}; }
    window.addEventListener('storage', e => {
      if (e.key === nokkel) { try { tre = JSON.parse(e.newValue) || {}; } catch (_) {} varsle(); }
    });
    klar = true;
    return Promise.resolve();
  }

  /* ---------- Firebase ---------- */
  const rot = sti => 'byer/' + byId + (sti ? '/' + deler(sti).join('/') : '');
  let tilkoblet = false;
  function kobleTil() {
    if (!firebaseModus || !byId || tilkoblet) return Promise.resolve();
    tilkoblet = true;
    return new Promise((ok, feil) => {
      let forste = true;
      db.ref(rot('')).on('value', snap => {
        tre = snap.val() || {};
        if (forste) { forste = false; ok(); }
        varsle();
      }, e => { tilkoblet = false; feil(e); });
    });
  }
  // anonym = true: elever logges inn anonymt. Lærere logger inn med e-post.
  function startFirebase(anonym) {
    firebase.initializeApp(oppsett.firebase);
    db = firebase.database();
    auth = firebase.auth();
    return new Promise((ok, feil) => {
      let ferdig = false;
      auth.onAuthStateChanged(async bruker => {
        if (ferdig) return;
        if (!bruker && anonym) { auth.signInAnonymously().catch(feil); return; }
        ferdig = true;
        try { if (bruker) await kobleTil(); klar = true; ok(); } catch (e) { feil(e); }
      });
    });
  }

  return {
    byId, firebaseModus,
    get tre() { return tre; },
    get klar() { return klar; },
    start(opts = {}) { return firebaseModus ? startFirebase(!!opts.anonym) : startLokal(); },
    kobleTil,
    get erLaerer() { return !!(auth && auth.currentUser && !auth.currentUser.isAnonymous); },
    // Data utenfor byen (lærerens klasseliste)
    async hentGlobal(sti) {
      if (firebaseModus) return (await db.ref(deler(sti).join('/')).once('value')).val();
      try { return hentFra(JSON.parse(localStorage.getItem('byenvar2__global')) || {}, sti); } catch (e) { return undefined; }
    },
    async settGlobal(sti, verdi) {
      if (firebaseModus) return db.ref(deler(sti).join('/')).set(verdi ?? null);
      let g = {}; try { g = JSON.parse(localStorage.getItem('byenvar2__global')) || {}; } catch (e) {}
      settI(g, sti, verdi); localStorage.setItem('byenvar2__global', JSON.stringify(g));
    },
    // Skriver direkte til en annen by (brukes når læreren oppretter en ny klasse)
    async settIBy(id, sti, verdi) {
      if (firebaseModus) return db.ref('byer/' + id + '/' + deler(sti).join('/')).set(verdi ?? null);
      let t = {}; try { t = JSON.parse(localStorage.getItem('byenvar2_' + id)) || {}; } catch (e) {}
      settI(t, sti, verdi); localStorage.setItem('byenvar2_' + id, JSON.stringify(t));
    },
    hent: sti => hentFra(tre, sti),
    paMeld(fn) { lytt.push(fn); },
    nyId,
    async sett(sti, verdi) {
      if (firebaseModus) return db.ref(rot(sti)).set(verdi ?? null);
      settI(tre, sti, verdi); lagreLokalt(); varsle();
    },
    async oppdater(sti, obj) {
      if (firebaseModus) {
        const flat = {};
        Object.entries(obj).forEach(([k, v]) => { flat[k] = v ?? null; });
        return db.ref(rot(sti)).update(flat);
      }
      Object.entries(obj).forEach(([k, v]) => settI(tre, deler(sti).concat(deler(k)).join('/'), v));
      lagreLokalt(); varsle();
    },
    // Flere skrivinger samtidig: { 'sti/a': v, 'sti/b': v }
    async flere(endringer) {
      if (firebaseModus) {
        const flat = {};
        Object.entries(endringer).forEach(([k, v]) => { flat[deler(k).join('/')] = v ?? null; });
        return db.ref(rot('')).update(flat);
      }
      Object.entries(endringer).forEach(([k, v]) => settI(tre, k, v));
      lagreLokalt(); varsle();
    },
    async leggTil(sti, verdi) {
      const id = firebaseModus ? db.ref(rot(sti)).push().key : nyId();
      await this.sett(deler(sti).concat(id).join('/'), verdi);
      return id;
    },
    async tell(sti) {
      if (firebaseModus) {
        const r = await db.ref(rot(sti)).transaction(n => (n || 0) + 1);
        return r.snapshot.val();
      }
      const n = (hentFra(tre, sti) || 0) + 1;
      settI(tre, sti, n); lagreLokalt(); varsle();
      return n;
    },
    // Lærerinnlogging i Firebase-modus (e-post + passord i Firebase Authentication)
    async laererLoggInn(epost, passord) {
      const r = await auth.signInWithEmailAndPassword(epost, passord);
      return r.user.uid;
    },
    async laererLoggUt() { if (auth) { await auth.signOut(); } },
    get uid() { return auth && auth.currentUser ? auth.currentUser.uid : null; },
    // Hele byen som fil (sikkerhetskopi)
    eksport: () => JSON.parse(JSON.stringify(tre)),
    async importer(nyttTre) {
      if (firebaseModus) return db.ref(rot('')).set(nyttTre);
      tre = JSON.parse(JSON.stringify(nyttTre)); lagreLokalt(); varsle();
    }
  };
})();
