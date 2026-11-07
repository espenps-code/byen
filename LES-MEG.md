# Byen vår – portal for Minecraft Education

## Sidene

| Side | For hvem |
|---|---|
| `index.html` | Forside med lenke til lærersiden |
| `laerer.html` | Læreren: «Mine klasser», opprett ny klasse, og hele lærerverktøyet for hver klasse |
| `elev.html?by=…` | Elevene. Hver klasse har sin egen lenke og QR-kode, som du finner under Oversikt og Innstillinger |

Firebase er satt opp (prosjekt `byen-var`, database i Belgia). Lærere logger inn med e-post og passord fra **Authentication → Users** i Firebase-konsollen.

## Filer

| Fil | Hva den gjør |
|---|---|
| `index.html`, `laerer.html`, `elev.html` | Sidene |
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

Opprett klasser på lærersiden. Hver klasse får en tilfeldig ID (f.eks. `galtvang-7a-k3x9`) og en egen elevlenke.

## Sikkerhet – det du bør vite

- Elevene logger inn med kallenavn og PIN. PIN-kodene lagres kryptert, men fire siffer er ingen sterk beskyttelse. Bruk kallenavn, ikke fulle navn.
- Databasereglene gjør at **bare læreren kan lage penger**. Elever kan bare skrive utgifter (negative beløp), bestillinger som venter på godkjenning, søknader, regnskap, budsjett og svar i postkassen.
- Alle innloggede kan *lese* byens data (også andre husholdningers post), fordi elevinnloggingen ikke er knyttet til en egen bruker. Ikke skriv sensitive opplysninger i brev.
- Ta sikkerhetskopi jevnlig: Lærer → Innstillinger → *Last ned sikkerhetskopi*.

## Kisteprogrammet

Hver konto får en **dobbeltkiste** på (x, y, z) og (x+1, y, z). Begge rutene må være ledige. Trengs mer enn 54 ruter, settes neste dobbeltkiste på x+3. Testprogrammet i Leveringssentralen sjekker at alle varenavnene virker i din versjon av Minecraft Education.

## Egne bilder

Under Lærer → Varekatalog kan du lime inn en bildeadresse per vare (f.eks. Higgsfield-bilder lagt i en mappe `bilder/`). Da brukes bildet i stedet for pikselikonet.
