/* =========================================================
   LÆREPLANMÅL (LK20) – kompetansemål etter 7. trinn
   Gjeldende læreplaner fra 1.8.2026 (hentet fra udir.no 7.11.2026).
   rolle: 'kjerne'  = trenes direkte i Klassebyen og egner seg for vurdering
          'støtte'  = berøres naturlig, men er ikke hovedfokus
          'utvidelse' = kan dekkes med et ekstra opplegg (beskrevet i «hvor»)
   ========================================================= */
const LAEREPLAN_FAG = {
  MAT: { navn: 'Matematikk', kode: 'MAT01-06', url: 'https://www.udir.no/lk20/mat01-06/kompetansemaal-og-vurdering/kv1026' },
  MAT6: { navn: 'Matematikk (6. trinn – repetisjon)', kode: 'MAT01-06', url: 'https://www.udir.no/lk20/mat01-06/kompetansemaal-og-vurdering/kv1025' },
  SAF: { navn: 'Samfunnsfag', kode: 'SAF01-05', url: 'https://www.udir.no/lk20/saf01-05/kompetansemaal-og-vurdering/kv1150' },
  NOR: { navn: 'Norsk', kode: 'NOR01-08', url: 'https://www.udir.no/lk20/nor01-08/kompetansemaal-og-vurdering/kv1109' },
  ENG: { navn: 'Engelsk', kode: 'ENG01-06', url: 'https://www.udir.no/lk20/eng01-06/kompetansemaal-og-vurdering/kv1032' },
  KHV: { navn: 'Kunst og håndverk', kode: 'KHV01-03', url: 'https://www.udir.no/lk20/khv01-03/kompetansemaal-og-vurdering/kv1044' }
};

const LAEREPLAN = [
  // ---------- Kjerne ----------
  { fag: 'MAT', rolle: 'kjerne', mal: 'estimere, gjøre overslag, forklare tenkemåter og vurdere kritisk egne og andres modeller og løsninger knyttet til praktiske situasjoner i arbeid med økonomi',
    hvor: 'Kloss-estimatet i byggesøknaden (elevene regner selv og sammenligner med byens estimat), overslag før bestilling, budsjett mot faktisk forbruk.' },
  { fag: 'MAT', rolle: 'kjerne', mal: 'bruke regler for regnerekkefølge i problemløsing og til å lage og løse sammensatte regneuttrykk',
    hvor: 'Totalen i butikken (antall × pris for hver vare, lagt sammen), fakturaer og ukeoppgjør. Be elevene skrive regneuttrykket i regnskapet.' },
  { fag: 'MAT', rolle: 'kjerne', mal: 'bruke tall, tekst, tabeller, tegning og konkreter for å representere prosenter og kunne oversette mellom brøk, desimaltall og prosent',
    hvor: 'Byggeregelen om maks andel av tomten, skatt i prosent av lønn og tilbud med prosent avslag.' },
  { fag: 'MAT6', rolle: 'kjerne', mal: 'bruke og utforske strategier for å måle og regne ut areal og omkrets',
    hvor: 'Byggesøknaden: bebygd areal, veggens omkrets (= antall veggblokker per lag) og tomtens areal.' },
  { fag: 'SAF', rolle: 'kjerne', mal: 'gi eksempler på hva lover, regler og normer er, og hvilken funksjon de har i samfunnet, og reflektere over konsekvenser av å bryte dem',
    hvor: 'Byggereglene, bøter for regelbrudd (med begrunnelse i brev), avtalen elevene signerer, og samtaler om hvorfor reglene finnes.' },
  { fag: 'SAF', rolle: 'kjerne', mal: 'beskrive sentrale hendelser som har ført til det demokratiet vi har i Norge i dag, og sammenligne hvordan enkeltmennesker har mulighet til å påvirke i ulike styresett',
    hvor: 'Bystyret: lovforslag, støtteunderskrifter og avstemming. Sammenlign gjerne med en periode der «borgermesteren bestemmer alt». Historiedelen må dekkes utenfor portalen.' },
  { fag: 'SAF', rolle: 'kjerne', mal: 'reflektere over hvordan kommersiell påvirkning kan virke inn på forbruk, personlig økonomi og selvbilde',
    hvor: 'Fristende tilbud (leksefri uke, gulltime), pyntevarer i butikken og budsjettet. Ta en refleksjonssamtale etter hvert tilbud.' },
  { fag: 'NOR', rolle: 'kjerne', mal: 'beskrive, fortelle, argumentere og reflektere i ulike muntlige og skriftlige sjangre og for ulike formål',
    hvor: 'Jobbsøknad med tre argumenter, lovforslag, takketale, «hvordan regnet dere?» i byggesøknaden.' },
  { fag: 'NOR', rolle: 'kjerne', mal: 'lytte til og videreutvikle innspill fra andre og begrunne egne standpunkter i samtaler',
    hvor: 'Bystyremøtet med taletid-lapper, og samarbeidet i husholdningen.' },
  // ---------- Støtte ----------
  { fag: 'MAT', rolle: 'støtte', mal: 'logge, sortere, lese av og presentere data i tabeller og diagrammer og forklare valget av framstilling',
    hvor: 'Regnskapet og budsjettstolpene. Kan utvides med en «byens statistikk»-oppgave (f.eks. hva byen har brukt penger på).' },
  { fag: 'MAT', rolle: 'støtte', mal: 'bruke og utforske negative tall både praktisk og teoretisk',
    hvor: 'Utgifter som minusposter i regnskapet og saldo som synker. Kan forsterkes hvis kontoen får lov å gå i minus.' },
  { fag: 'NOR', rolle: 'støtte', mal: 'presentere faglige emner muntlig med og uten digitale ressurser',
    hvor: 'Presentere lovforslag for bystyret eller bedriften sin for klassen.' },
  { fag: 'NOR', rolle: 'støtte', mal: 'skrive tekster med tydelig struktur og mestre sentrale regler for rettskriving, ordbøying og tegnsetting',
    hvor: 'Jobbsøknaden og lovforslag kan vurderes på struktur og rettskriving.' },
  { fag: 'ENG', rolle: 'støtte', mal: 'skrive sammenhengende tekster, inkludert sammensatte, som gjenforteller, forteller, spør og uttrykker meninger og interesser, tilpasset mottaker',
    hvor: 'Hendelseskortet «Brev til grandonkelen i Amerika».' },
  { fag: 'KHV', rolle: 'støtte', mal: 'bruke digitale verktøy til å planlegge og presentere prosesser og produkter',
    hvor: 'Tegneprogrammet, fasadene, 3D-visningen og byggingen i Minecraft.' },
  { fag: 'KHV', rolle: 'støtte', mal: 'tegne form, flate og rom ved hjelp av virkemidler som kontraster, skygge, proporsjoner og perspektiv',
    hvor: 'Plan- og fasadetegning gir proporsjoner og rom. Perspektiv krever en ekstra oppgave: tegn huset ditt i perspektiv for hånd.' },
  { fag: 'SAF', rolle: 'støtte', mal: 'reflektere over hvorfor konflikter oppstår, og drøfte hvordan den enkelte og samfunnet kan håndtere konflikter',
    hvor: 'Politiet, nabokonflikter og hendelseskort. Bruk situasjoner som oppstår i byen som samtalestarter.' },
  // ---------- Utvidelse ----------
  { fag: 'MAT', rolle: 'utvidelse', mal: 'regne sentralmål i egne og andres datasett og velge hensiktsmessig sentralmål',
    hvor: 'Beregn gjennomsnitt, median og typetall av saldoene, lønningene eller husstørrelsene i byen. Hva sier mest om «vanlig» økonomi?' },
  { fag: 'MAT', rolle: 'utvidelse', mal: 'bruke programmering til å utforske data i tabeller og datasett',
    hvor: 'Vis elevene kisteprogrammet: lister med varer og løkker. La dem endre listen og se hva som skjer i Minecraft.' },
  { fag: 'SAF', rolle: 'utvidelse', mal: 'gjennomføre en samfunnsfaglig undersøkelse og presentere resultatene ved hjelp av egnede digitale verktøy',
    hvor: 'Spørreundersøkelse blant innbyggerne (f.eks. om en ny lov eller hva byen mangler), presentert med diagrammer.' }
];

/* Mål som er vurdert, men ikke tatt med:
   - KHV «bygge og eksperimentere med stabile konstruksjoner»: krever fysiske materialer, ikke Minecraft.
   - SAF-målene om historie, geografi, mangfold, menneskerettigheter, samer og nasjonale minoriteter,
     identitet og seksualitet: passer ikke naturlig inn i byspillet.
   - MAT ligninger og ulikheter: kan brukes i enkeltoppgaver («hvor mange stacks har vi råd til?»), men er ikke en del av flyten. */
