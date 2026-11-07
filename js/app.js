/* =========================================================
   APP: oppstart. window.SIDE = 'elev' eller 'laerer' (settes i HTML-filen)
   ========================================================= */
const App = {
  tegn() {
    const by = Store.byId ? B.innst().byNavn : '';
    $('#byNavnTopp').textContent = by ? (window.SIDE === 'elev' ? 'Velkommen til ' + by + '!' : by) : '';
    if (window.SIDE === 'elev') Elev.tegn(); else Laerer.tegn();
  },
  // Tegn på nytt når data endres – men ikke mens noen skriver i et felt
  endret() {
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#rot') && !a.dataset.lov) { App.venter = true; return; }
    App.tegn();
  }
};

document.addEventListener('focusout', () => { if (App.venter) { App.venter = false; setTimeout(() => App.endret(), 50); } });

(async () => {
  $('#logoIkon').innerHTML = '<span class="blokk"></span>';
  $('#modus').textContent = Store.firebaseModus ? 'Online' : 'Lokal testmodus';
  try {
    await Store.start({ anonym: window.SIDE === 'elev' });
  } catch (e) {
    $('#rot').innerHTML = `<div class="innlogging"><div class="kort"><h2>Kunne ikke koble til</h2><p>${esc(e.message)}</p>
      <p class="dempet">Sjekk internettforbindelsen og prøv igjen.</p></div></div>`;
    return;
  }
  Store.paMeld(() => App.endret());
  App.tegn();
})();
