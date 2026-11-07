# Byen vår – portal for Minecraft Education

Åpne `index.html` i nettleseren. Uten Firebase kjører portalen i **lokal testmodus**: alt lagres bare i nettleseren på den maskinen du bruker. Det holder til å teste hele opplegget selv. Elever kan ikke logge inn fra egne nettbrett før Firebase er satt opp.

## Filer

| Fil | Hva den gjør |
|---|---|
| `index.html` | Selve portalen |
| `css/stil.css` | Utseendet |
| `js/oppsett.js` | **Her limer du inn Firebase-oppsettet** (eneste fil du må endre) |
| `js/data.js` | Varekatalog, jobber, hendelseskort og tilbud – kan redigeres |
| `js/store.js` | Lagring (lokal eller Firebase) |
| `js/ikoner.js` | De selvtegnede pikselikonene |
| `js/felles.js` | Beregninger: saldo, regelsjekk, kloss-estimat, kisteprogram |
| `js/elev.js` / `js/laerer.js` | Elevsiden og lærersiden |
| `database.rules.json` | Sikkerhetsregler som limes inn i Firebase |

## Sette opp Firebase (ca. 10 minutter)

1. Gå til <https://console.firebase.google.com> og lag et nytt prosjekt, f.eks. `byen-var`. Google Analytics kan slås av. Gratisplanen (Spark) holder.
2. **Realtime Database** → *Create database* → velg **europe-west1 (Belgia)**, så dataene ligger i EU → start i *locked mode*.
3. Fanen **Rules**: slett alt og lim inn innholdet i `database.rules.json` → *Publish*.
4. **Authentication** → *Get started* → *Sign-in method*: slå på **Anonymous** og **Email/Password**.
5. Fanen **Users** → *Add user*: lag lærerkontoen din (e-post og passord).
6. **Prosjektinnstillinger** (tannhjulet) → *Your apps* → web-ikonet `</>` → registrer appen → kopier `firebaseConfig`.
7. Åpne `js/oppsett.js` og lim inn konfigurasjonen der det står `firebase: null` (eksempel står i filen). Sjekk at `databaseURL` er med.
8. Legg mappen ut på nettet, for eksempel GitHub Pages slik som Myntland. Legg til domenet under **Authentication → Settings → Authorized domains** hvis det ikke står der.
9. Åpne portalen, trykk **Lærer** og logg inn med lærerkontoen. Første lærer som logger inn, blir eier av byen.

Elevlenke: `https://ditt-domene/byen-var/?by=min-by`. Bytt `min-by` med `byId` i `oppsett.js`. Med `?by=7a-2027` kan du ha flere byer (klasser) i samme database.

## Sikkerhet – det du bør vite

- Elevene logger inn med kallenavn og PIN. PIN-kodene lagres kryptert, men fire siffer er ingen sterk beskyttelse. Bruk kallenavn, ikke fulle navn.
- Databasereglene gjør at **bare læreren kan lage penger**. Elever kan bare skrive utgifter (negative beløp), bestillinger som venter på godkjenning, søknader, regnskap, budsjett og svar i postkassen.
- Alle innloggede kan *lese* byens data (også andre husholdningers post), fordi elevinnloggingen ikke er knyttet til en egen bruker. Ikke skriv sensitive opplysninger i brev.
- Ta sikkerhetskopi jevnlig: Lærer → Innstillinger → *Last ned sikkerhetskopi*.

## Kisteprogrammet

Hver konto får en **dobbeltkiste** på (x, y, z) og (x+1, y, z). Begge rutene må være ledige. Trengs mer enn 54 ruter, settes neste dobbeltkiste på x+3. Testprogrammet i Leveringssentralen sjekker at alle varenavnene virker i din versjon av Minecraft Education.

## Egne bilder

Under Lærer → Varekatalog kan du lime inn en bildeadresse per vare (f.eks. Higgsfield-bilder lagt i en mappe `bilder/`). Da brukes bildet i stedet for pikselikonet.
