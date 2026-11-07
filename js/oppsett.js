/* =========================================================
   OPPSETT FOR BYEN VÅR
   ---------------------------------------------------------
   firebase: null  -> alt lagres lokalt i nettleseren (bra for testing)
   firebase: {...} -> lim inn firebaseConfig fra Firebase-konsollen
   byId: navnet på byen i databasen (bare små bokstaver, tall og bindestrek).
         Kan overstyres i lenken: index.html?by=7a-2027
   ========================================================= */
window.BYEN_VAR_OPPSETT = {
  firebase: null,
  /* Eksempel:
  firebase: {
    apiKey: "AIza...",
    authDomain: "byen-var.firebaseapp.com",
    databaseURL: "https://byen-var-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "byen-var",
    appId: "1:123:web:abc"
  },
  */
  byId: 'min-by'
};
