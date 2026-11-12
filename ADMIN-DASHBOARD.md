# Administratorforside

Åbn `/login`, og log ind med en eksisterende Supabase-bruger, hvis række i `profiles` har rollen `organizer`. Login sender brugeren til `/organizer-dashboard`. Adgangskontrol og logout er de eksisterende Supabase-funktioner. Der er ingen genvej uden login.

Start med `npm install` og `npm run dev`. Åbn http://localhost:3000.

## Afprøvning

- Overblik viser kommende offentliggjorte arrangementer. Arrangementer viser også kladder og tidligere arrangementer.
- Se vagter åbner vagtoversigten nedenunder. Filtrér ledige vagter, og åbn Se tilmeldte.
- Opret arrangement har tre trin. Tilbage bevarer værdier. Gem kladde accepterer ufuldstændige grundoplysninger; navn og gyldige udfyldte datoer/vagter kræves stadig.
- Offentliggørelse kræver alle grundoplysninger og mindst én gyldig vagt.
- Redigér CPH Marathon for at teste eksisterende tilmeldinger: kapacitet under antallet af tilmeldte afvises; vagter med tilmeldinger kan ikke fjernes. Ændringer i vagtens opgave, tid eller sted kræver en bekræftelse på, at administratoren selv informerer de frivillige.
- Ændr et felt og vælg Luk formular, navigation eller logout: kassering kræver bekræftelse. Browserens genindlæsning/lukning bruger dens egen advarsel.

## Data og arkitektur

UI → EventService → IEventRepository følger samme opdeling som login. DemoEventRepository indeholder fiktive arrangementer, vagter og personer. Den gemmer kun i hukommelsen på den åbne administratorside. Genindlæsning, logout eller ny åbning nulstiller ændringer. Ingen arrangementsdata sendes til Supabase eller frivilligsiden. Frivilligsidens egen demo er uændret.

Oversigtstallene bruger offentliggjorte arrangementer med startdato fra dags dato i Europe/Copenhagen. Kapacitet og tilmeldinger summeres pr. vagt, så samme person kan besætte flere vagtpladser. Kladder indgår aldrig i tallene. En arrangementsperiode omfatter hele start- og slutdatoen. Vagter skal slutte samme dag og ligge i perioden; vagter over midnat opdeles. Tilmeldingsfristen er en dato, senest startdatoen.

## Senere Supabase-tilkobling

Der er ingen arrangementsmigrationer eller repositories for arrangementer i projektet. Den faktiske eksterne databasestruktur er ikke inspiceret. Før tilkobling skal dens schema afklares.

Der skal bruges tabeller til arrangementer, vagter og tilmeldinger med stabile ID'er og fremmednøgler. Tilmeldinger skal forbinde en profil med en vagt og have en unik kombination af profil og vagt. Opret et Supabase-repository til kontrakten; den nuværende synkrone kontrakt skal gøres asynkron, og UI skal have loading- og netværksfejltilstande.

Brug databasepolitikker (RLS), så kun organizer kan skrive arrangementer og vagter/læse alle tilmeldte, og frivillige kun kan læse offentliggjorte arrangementer og egne tilmeldinger. Kladder må ikke kunne læses af frivillige. En frontend-rollebeskyttelse alene beskytter ikke databasen. Gemning af arrangement og vagter bør ske samlet i en transaktion/RPC. Kapacitetskontrol og bevarelse af tilmeldinger skal også håndhæves i databasen, så samtidige ændringer ikke overskriver tilmeldinger. Nuværende miljøvariabler genbruges; tilføj ikke en service role-nøgle i browseren.

## Checks

`npm run lint`, `npm run test:run`, `npm run build`.

Nye tests dækker optælling, kladder, datoer/tider/kapacitet, bevarelse af tilmeldinger, formulartrin, filtrering og kassering. Build henter de eksisterende Geist-skrifttyper fra Google og kræver adgang dertil.
