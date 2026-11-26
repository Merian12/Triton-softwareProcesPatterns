'use client';

import Link from 'next/link';
import { LanguageSwitcher, useLanguage } from './LanguageProvider';
import { button, portalContainer } from './portalStyles';

type Topic = 'faq' | 'about' | 'contact' | 'help';
const content = {
  da: {
    faq: { title: 'Ofte stillede spørgsmål', intro: 'Godt at vide, før du bliver en del af fællesskabet.', sections: [
      ['Hvornår skal jeg ringe 112?', 'Ring 112 til alarmcentralen i Danmark, hvis du har akut brug for politi, ambulance eller brandvæsen, fx ved alvorlige ulykker, brand eller fare for liv.'],
      ['Hvornår skal jeg ringe 114 til politiet?', 'Ring 114 til politiets landsdækkende servicenummer ved henvendelser, der ikke kræver akut udrykning, fx anmeldelse af et tyveri, hvor gerningspersonen har forladt stedet, eller generelle spørgsmål til politiet. Ved akut fare skal du ringe 112.'],
      ['Hvad skal jeg oplyse, når jeg ringer 112?', 'Fortæl, hvad der er sket, hvor og hvornår det er sket, den præcise adresse, og hvor mange der er kommet til skade. Ved et event skal du beskrive placeringen på området så præcist som muligt. Følg alarmoperatørens anvisninger.'],
      ['Hvem skal jeg kontakte ved en hændelse under et event?', 'Ved akut fare skal du ringe 112 med det samme. Orientér derefter eventets arrangør, koordinator eller sikkerhedspersonale, så de kan hjælpe redningspersonalet med at finde frem. Ved mindre, ikke-akutte hændelser kan du kontakte den ansvarlige via kontaktoplysningerne ved eventet.'],
      ['Kan børn under 15 år få en frivilligkonto?', 'Børn under 15 år skal registreres af en forælder. Forælderen skal give tilladelse til, at barnet får en frivilligkonto (volunteer account), og give barnet rettigheder til selv at tilmelde sig events.'],
      ['Hvordan tilmelder jeg mig et event?', 'Opret en konto som frivillig, og log ind. Under Find arrangementer kan du vælge et event og se vagterne. Vælg en ledig vagt, læs opgavebeskrivelsen, og bekræft din tilmelding.'],
      ['Hvor finder jeg mine vagter?', 'Dine tilmeldinger vises under Mine vagter. I kalenderen kan du se dine vagter og skrive personlige noter.'],
      ['Hvordan ændrer eller afmelder jeg en vagt?', 'Kontakt eventets arrangør eller koordinator. Brug kontaktoplysningerne ved eventet, eller send en besked via Beskeder, hvis du kender deres registrerede e-mailadresse.'],
      ['Hvordan fungerer beskeder?', 'Under Beskeder kan du skrive til andre registrerede brugere ved at indtaste deres e-mailadresse. Beskederne vises på hjemmesiden og sendes ikke til en ekstern e-mailindbakke.'],
    ] },
    about: { title: 'Om Volunteerportal', intro: 'Frivillige kræfter. Store sportsoplevelser.', sections: [
      ['Et projekt skabt af studerende', 'Vi er en gruppe studerende, der har udviklet Volunteerportal som en hjemmeside til tilmelding til frivilligt arbejde ved større sportsevents i Danmark.'],
      ['Et fælles sted for frivillige og arrangører', 'Vi ønsker at gøre det nemmere at finde frivillige opgaver og skabe overblik over vagter og tilmeldinger. Frivillige kan finde events, og arrangører kan planlægge opgaver og holde kontakt med deltagerne.'],
      ['Fællesskab omkring sporten', 'Store sportsevents bliver til med hjælp fra mennesker, der giver deres tid og engagement. Med Volunteerportal vil vi gøre det lettere at være en del af fællesskabet.'],
    ] },
    contact: { title: 'Kontakt', intro: 'Find den rette person til dit spørgsmål.', sections: [
      ['Spørgsmål om et event eller en vagt?', 'Kontakt arrangøren eller koordinatoren for det pågældende event. Se kontaktpersonen under eventets oplysninger. De kan hjælpe med opgaver, mødetider og ændringer i din tilmelding.'],
      ['Skriv via Beskeder', 'Er du logget ind og kender modtagerens registrerede e-mailadresse? Åbn Beskeder, vælg Ny besked, og skriv din besked. Modtageren kan læse og svare på hjemmesiden.'],
      ['Brug for hjælp til hjemmesiden?', 'Se vores FAQ og vejledning. Hvis du stadig har brug for hjælp, kan du kontakte din eventkoordinator. Volunteerportal er et studieprojekt, og der er endnu ikke en særskilt supportmail.'],
    ] },
    help: { title: 'Hjælp og vejledning', intro: 'Kom godt i gang med Volunteerportal.', sections: [
      ['1. Opret din konto', 'Vælg Opret konto på loginsiden. Indtast brugernavn, e-mail og adgangskode, og vælg rollen Frivillig eller Arrangør. Børn under 15 år skal registreres af en forælder med tilladelse til kontoen og rettigheder til at tilmelde sig events.'],
      ['2. Find et event som frivillig', 'Log ind, og gå til Find arrangementer. Se de ledige vagter, vælg en opgave, og bekræft, at du har læst beskrivelsen og kan deltage i hele vagten.'],
      ['3. Hold overblik', 'Se tilmeldinger under Mine vagter, brug kalenderen til planlægning, og skriv til andre registrerede brugere under Beskeder.'],
      ['For arrangører', 'Vælg Opret event i dit overblik. Udfyld eventoplysningerne, planlæg vagter, og gennemgå eventet før offentliggørelse. Du kan også gemme en kladde og vende tilbage senere.'],
      ['Skift sprog', 'Vælg Dansk eller English øverst på siden. Siden åbner på engelsk, når du besøger den igen eller genindlæser den.'],
    ] },
  },
  en: {
    faq: { title: 'Frequently asked questions', intro: 'Good to know before you join the community.', sections: [
      ['When should I call 112?', 'Call 112 for emergency services in Denmark if you urgently need the police, an ambulance or the fire brigade, for example after a serious accident, in a fire or when someone’s life is in danger.'],
      ['When should I call the police on 114?', 'Call 114, the nationwide Danish police service number, for matters that do not require an emergency response, such as reporting a theft after the offender has left or asking general police questions. In immediate danger, call 112.'],
      ['What information should I give when calling 112?', 'Explain what happened, where and when it happened, the exact address and how many people are injured. At an event, describe the location within the venue as precisely as possible. Follow the emergency operator’s instructions.'],
      ['Who should I contact about an incident during an event?', 'In immediate danger, call 112 straight away. Then inform the event organiser, coordinator or security staff so they can help emergency responders find the location. For minor, non-emergency incidents, contact the person responsible using the contact details provided for the event.'],
      ['Can children under 15 have a volunteer account?', 'Children under 15 must be registered by a parent. The parent must give permission for the child to have a volunteer account and grant the child permission to sign up for events.'],
      ['How do I sign up for an event?', 'Create a volunteer account and sign in. Go to Find events, choose an event and view its shifts. Choose an available shift, read the task description and confirm your registration.'],
      ['Where can I find my shifts?', 'Your registrations appear under My shifts. Use the calendar to view your shifts and add personal notes.'],
      ['How do I change or cancel a shift?', 'Contact the event organiser or coordinator. Use the contact details provided for the event, or send a message through Messages if you know their registered email address.'],
      ['How do messages work?', 'Use Messages to contact other registered users by entering their email address. Messages appear on the website and are not sent to an external email inbox.'],
    ] },
    about: { title: 'About Volunteerportal', intro: 'Volunteer spirit. Great sporting experiences.', sections: [
      ['Created by students', 'We are a group of students who developed Volunteerportal as a website for signing up for volunteer work at major sporting events in Denmark.'],
      ['A shared space for volunteers and organisers', 'We want to make it easier to find volunteer opportunities and keep track of shifts and registrations. Volunteers can discover events, while organisers can plan tasks and stay in touch with participants.'],
      ['Community through sport', 'Great sporting events rely on people who contribute their time and enthusiasm. With Volunteerportal, we want to make it easier to become part of that community.'],
    ] },
    contact: { title: 'Contact', intro: 'Find the right person for your question.', sections: [
      ['Questions about an event or shift?', 'Contact the organiser or coordinator for that event. Look for the contact person in the event details. They can help with tasks, arrival times and changes to your registration.'],
      ['Get in touch through Messages', 'Signed in and know the recipient’s registered email address? Open Messages, select New message and write your message. The recipient can read it and reply on the website.'],
      ['Need help using the website?', 'Read our FAQ and guidance. If you still need help, contact your event coordinator. Volunteerportal is a student project and does not yet have a dedicated support email address.'],
    ] },
    help: { title: 'Help and guidance', intro: 'Get started with Volunteerportal.', sections: [
      ['1. Create your account', 'Select Sign Up on the login page. Enter a username, email and password, then choose Volunteer or Organizer. Children under 15 must be registered by a parent who permits the account and grants permission to sign up for events.'],
      ['2. Find an event as a volunteer', 'Sign in and open Find events. Browse the available shifts, choose a task and confirm that you have read the description and can attend the whole shift.'],
      ['3. Stay organised', 'View registrations under My shifts, plan with the calendar and contact other registered users through Messages.'],
      ['For organisers', 'Select Create event in your overview. Enter the event details, plan shifts and review before publishing. You can also save a draft and return to it later.'],
      ['Change language', 'Select Dansk or English at the top of the page. The site opens in English on a new visit or after a reload.'],
    ] },
  },
};

export default function InformationPage({ topic }: { topic: Topic }) {
  const { language } = useLanguage();
  const page = content[language][topic];
  return <div className={`${portalContainer} w-full flex-1 py-10 sm:py-14`}>
    <div className="flex items-center justify-between gap-4">
      <Link href="/home" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted underline-offset-4 hover:underline"><span aria-hidden="true">←</span>{language === 'da' ? 'Til forsiden' : 'Back to home'}</Link>
      <LanguageSwitcher />
    </div>
    <main id="information-main" className="mt-7 max-w-3xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand">Volunteerportal</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.title}</h1>
      <p className="mt-4 text-lg leading-8 text-muted">{page.intro}</p>
      {topic === 'faq' && <p className="mt-4 text-sm leading-7 text-muted">
        {language === 'da' ? 'Officielle oplysninger: ' : 'Official information: '}
        <a className="text-brand underline underline-offset-4" href="https://politi.dk/kontakt-politiet/alarm-112">{language === 'da' ? 'Alarm 112' : 'Emergency 112'}</a>
        {' · '}
        <a className="text-brand underline underline-offset-4" href="https://politi.dk/om-politiet/kontakt-politiet/service-114">{language === 'da' ? 'Politiets service 114' : 'Police service 114'}</a>
      </p>}
      <div className="mt-9 divide-y divide-border-subtle border-y border-border-subtle">
        {page.sections.map(([heading, body], index) => topic === 'faq' ? <details key={index} className="group py-1">
          <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-5 rounded-sm py-4 font-semibold focus-visible:outline-2 focus-visible:outline-brand">{heading}<span aria-hidden="true" className="text-xl text-brand group-open:rotate-45">+</span></summary>
          <p className="max-w-2xl pb-6 text-sm leading-7 text-muted">{body}</p>
        </details> : <section key={index} className="py-7"><h2 className="text-lg font-semibold">{heading}</h2><p className="mt-3 text-sm leading-7 text-muted">{body}</p></section>)}
      </div>
      {topic !== 'faq' && <div className="mt-8"><Link className={button} href="/faq">{language === 'da' ? 'Ofte stillede spørgsmål' : 'FAQ'}</Link></div>}
    </main>
  </div>;
}
