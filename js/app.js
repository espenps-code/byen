/* =========================================================
   APP: oppstart og bytte mellom elev og lærer
   ========================================================= */
const App = {
  aktivRolle: 'elev',
  rolle(r) {
    this.aktivRolle = r;
    $('#rolleElev').classList.toggle('aktiv', r === 'elev');
    $('#rolleLaerer').classList.toggle('aktiv', r === 'laerer');
    this.tegn();
  },
  tegn() {
    const by = B.innst().byNavn;
    $('#byNavnTopp').textContent = by ? 'Velkommen til ' + by + '!' : '';
    if (this.aktivRolle === 'elev') Elev.tegn(); else Laerer.tegn();
  },
  // Tegn på nytt når data endres – men ikke mens noen skriver i et felt
  endret() {
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#rot') && !a.dataset.lov) {
      App.venter = true; return;
    }
    App.tegn();
  }
};

document.addEventListener('focusout', () => { if (App.venter) { App.venter = false; setTimeout(() => App.endret(), 50); } });

(async () => {
  $('#logoIkon').innerHTML = Ikon.mc('birch_planks');
  $('#modus').textContent = Store.firebaseModus ? 'Online · ' + Store.byId : 'Lokal testmodus';
  try {
    await Store.start();
  } catch (e) {
    $('#rot').innerHTML = `<div class="innlogging"><div class="kort"><h2>Kunne ikke koble til</h2><p>${esc(e.message)}</p><p class="dempet">Sjekk oppsettet i js/oppsett.js og at Anonym pålogging er slått på i Firebase.</p></div></div>`;
    return;
  }
  Store.paMeld(() => App.endret());
  const r = new URLSearchParams(location.search).get('rolle');
  App.rolle(r === 'laerer' ? 'laerer' : 'elev');
})();
