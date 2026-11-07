/* =========================================================
   OPPSETT FOR BYEN VÅR
   ---------------------------------------------------------
   firebase: null  -> alt lagres lokalt i nettleseren (testmodus)
   firebase: {...} -> data lagres i Firebase (prosjekt «byen-var», EU/Belgia)
   Klassene opprettes på laerer.html. Elevlenken er elev.html?by=<klasse-id>.
   Merk: apiKey for Firebase på nettsider er ikke hemmelig – sikkerheten
   ligger i databasereglene (database.rules.json).
   ========================================================= */
window.BYEN_VAR_OPPSETT = {
  firebase: {
    apiKey: "AIzaSyCqqS-PaU-Ek3qyRVoIOKkvSFOjwbSs-Ps",
    authDomain: "byen-var.firebaseapp.com",
    databaseURL: "https://byen-var-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "byen-var",
    storageBucket: "byen-var.firebasestorage.app",
    messagingSenderId: "27164020021",
    appId: "1:27164020021:web:1655e8f39fd1d4f40c507c"
  }
};
