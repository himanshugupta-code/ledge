import type { Dict } from "./en";

const de: Dict = {
  meta: {
    title: "Ledge: Kostenloser Screenshot-Manager für den Mac",
    description:
      "Ledge ist eine kostenlose Mac-Menüleisten-App mit Regal für deine neuesten Screenshots. Ziehen, kopieren, kommentieren, sensible Daten verpixeln.",
    keywords: [
      "screenshot manager mac",
      "screenshots organisieren mac",
      "screenshot ablage",
      "screenshots per drag and drop",
      "screenshots kommentieren mac",
      "sensible daten im screenshot unkenntlich machen",
      "screenshot verpixeln mac",
      "menüleisten app mac",
      "kostenloses screenshot tool mac",
      "screenshots vom schreibtisch verschieben",
    ],
    ogAlt: "Ledge, ein Regal mit Screenshots am oberen Rand eines Mac-Bildschirms",
  },
  nav: { main: "Hauptmenü", privacy: "Datenschutz", support: "Support", blog: "Blog", github: "GitHub", download: "Laden" },
  theme: { group: "Farbschema", light: "Helles Design", system: "Systemdesign", dark: "Dunkles Design" },
  hero: {
    eyebrow: "Ledge",
    title: "Ein Regal für deine Screenshots.",
    sub: "Deine neuesten Screenshots warten am oberen Bildschirmrand, bis du sie brauchst. Bis dahin stören sie nicht.",
    cta: "Für Mac laden",
    film: "Video ansehen",
    note: "Kostenlos. macOS auf Apple Silicon. Mac-App-Store-Version in Prüfung.",
    shelfAlt: "Ein Regal aus Milchglas am oberen Bildschirmrand mit sechs Screenshot-Vorschaubildern.",
  },
  intro: {
    line1: "Immer da.",
    line2: "Nie im Weg.",
    body: "Bewege den Zeiger an den oberen Rand und das Regal fährt herunter. Geh weg und es klappt sich von selbst wieder ein. Kein Fenster zu verwalten, kein Ordner zum Durchsuchen.",
  },
  bento: {
    title: "Alles in Reichweite.",
    a: { big: "Eine Geste.", h: "Zum oberen Rand. Oder eine Taste drücken.", p: "Das Regal erscheint auf dem Bildschirm, auf dem dein Zeiger ist, und verschwindet, wenn du fertig bist." },
    b: { h: "Überallhin ziehen.", p: "Lege einen Screenshot in Nachrichten, Mail, Slack oder ein Dokument. Oder kopiere ihn mit einem Klick." },
    c: { h: "Tastaturfreundlich.", p: "Tab zum Auswählen, Eingabe zum Bearbeiten, C zum Kopieren, Esc zum Einklappen." },
    d: { h: "Leise aufgeräumt.", p: "Lebt in der Menüleiste. Kein Dock-Symbol. Auf Wunsch verschiebt es neue Screenshots vom Schreibtisch." },
    e: { h: "Zeigt sich, wenn es zählt.", p: "Ein kurzer Blick verrät dir, dass ein neuer Screenshot da ist. Dann macht es wieder Platz." },
    f: { big: "Privat von Grund auf.", p: "Alles bleibt auf deinem Mac. Kein Konto, keine Netzwerkzugriffe, keine Analyse." },
  },
  editor: {
    line1: "Kommentieren.",
    line2: "Dann senden.",
    body: "Klicke auf einen Screenshot, um den Editor zu öffnen. Kommentiere mit Pfeilen und Text, verpixele Passwörter und Schlüssel, passe das Licht an, schneide zu und drehe. Alles lässt sich rückgängig machen.",
    alt: "Der Ledge-Editor mit Werkzeugleiste, einem kommentierten Screenshot mit verpixelten Schlüsseln sowie Stil- und Anpassungsbereichen.",
  },
  video: { title: "In 40 Sekunden erklärt." },
  faq: {
    title: "Häufige Fragen.",
    items: [
      { q: "Ist Ledge kostenlos?", a: "Ja. Ledge kannst du kostenlos laden. Es gibt keine Werbung, keine Abos und keine Konten." },
      {
        q: "Sammelt Ledge meine Screenshots oder Daten?",
        a: "Nein. Ledge liest nur Bilddateien aus dem Screenshot-Ordner, den du wählst. Alles bleibt auf deinem Mac und Ledge macht keine Netzwerkzugriffe.",
      },
      {
        q: "Wie zeige ich das Regal an?",
        a: "Bewege den Zeiger an den oberen Bildschirmrand oder drücke Cmd+Option+L. Geh weg oder drücke Esc, um es einzuklappen.",
      },
    ],
  },
  get: {
    title: "Hol dir Ledge.",
    body: "Kostenlos für den Mac. Die Mac-App-Store-Version ist in Prüfung. Bis sie verfügbar ist, lade sie von GitHub Releases.",
    cta: "Für Mac laden",
  },
  footer: {
    rights: "© 2026 Himanshu. Ledge ist kostenlos und lässt alles auf deinem Mac.",
    privacy: "Datenschutzerklärung",
    support: "Support",
    source: "Quellcode",
    blog: "Blog",
    languages: "Sprache",
  },
  privacy: {
    title: "Datenschutzerklärung von Ledge",
    metaTitle: "Datenschutzerklärung",
    desc: "Ledge erhebt, speichert und überträgt keine personenbezogenen Daten. Deine Screenshots und Einstellungen bleiben auf deinem Mac.",
    lead: "Ledge erhebt, speichert und überträgt keine personenbezogenen Daten.",
    items: [
      "Ledge liest Bilddateien nur aus dem Screenshot-Ordner, den du wählst.",
      "Screenshots und Einstellungen von Ledge bleiben auf deinem Mac. Es wird nichts an einen Server gesendet.",
      "Ledge hat keine Konten, keine Analyse, keine Werbung und keine SDKs von Drittanbietern.",
    ],
    questions: "Fragen? Eröffne ein Issue unter",
  },
  support: {
    title: "Support",
    metaTitle: "Support",
    desc: "Hilfe zu Ledge: Einrichtung beim ersten Start, das Regal anzeigen sowie Fehler melden oder Funktionen vorschlagen.",
    reportPre: "Fehler gefunden oder eine Idee?",
    reportLink: "Eröffne ein Issue auf GitHub",
    startTitle: "Erste Schritte",
    steps: [
      "Wähle beim ersten Start den Ordner, in dem deine Screenshots gespeichert werden (standardmäßig der Schreibtisch).",
      "Mache einen Screenshot mit Cmd Umschalt 3.",
      "Bewege den Zeiger an den oberen Bildschirmrand oder drücke Cmd Option L, um das Regal anzuzeigen.",
    ],
    emptyTitle: "Im Regal erscheint nichts",
    emptyBody: "Prüfe, ob der gewählte Ordner derjenige ist, in dem macOS Screenshots speichert. Ledge schaut nur in diesen Ordner.",
  },
  blog: {
    title: "Blog",
    metaTitle: "Blog: Screenshot-Tipps für den Mac",
    desc: "Praktische Tipps zum Aufnehmen, Organisieren, Kommentieren und sicheren Teilen von Screenshots auf dem Mac.",
    lead: "Praktische Tipps für Screenshots auf dem Mac.",
    englishOnly: "Die Artikel sind derzeit auf Englisch verfügbar.",
    read: "Artikel lesen",
    minRead: "Min. Lesezeit",
    back: "Alle Artikel",
    home: "Startseite",
  },
};

export default de;
