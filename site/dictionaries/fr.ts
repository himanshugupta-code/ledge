import type { Dict } from "./en";

const fr: Dict = {
  meta: {
    title: "Ledge : gestionnaire de captures d'écran gratuit pour Mac",
    description:
      "Ledge est une app Mac gratuite qui garde vos dernières captures sur une étagère en haut de l'écran. Glissez, copiez, annotez, floutez les infos sensibles.",
    keywords: [
      "gestionnaire de captures d'écran mac",
      "organiser ses captures d'écran mac",
      "étagère de captures",
      "glisser-déposer captures d'écran",
      "annoter une capture d'écran mac",
      "flouter des informations sensibles capture",
      "pixelliser une capture d'écran mac",
      "app barre des menus mac",
      "outil de capture gratuit mac",
      "sortir les captures du bureau",
    ],
    ogAlt: "Ledge, une étagère de captures d'écran en haut de l'écran d'un Mac",
  },
  nav: { main: "Principal", privacy: "Confidentialité", support: "Assistance", blog: "Blog", github: "GitHub", download: "Télécharger" },
  theme: { group: "Thème de couleur", light: "Thème clair", system: "Thème du système", dark: "Thème sombre" },
  hero: {
    eyebrow: "Ledge",
    title: "Une étagère pour vos captures d'écran.",
    sub: "Vos captures les plus récentes attendent en haut de l'écran, discrètes jusqu'à ce que vous en ayez besoin.",
    cta: "Télécharger pour Mac",
    film: "Voir la vidéo",
    note: "Gratuit. macOS sur Apple silicon. Version Mac App Store en cours de validation.",
    shelfAlt: "Une étagère en verre dépoli en haut de l'écran avec six miniatures de captures.",
  },
  intro: {
    line1: "Toujours là.",
    line2: "Jamais gênant.",
    body: "Posez le pointeur sur le bord supérieur et l'étagère descend. Éloignez-vous et elle se range toute seule. Pas de fenêtre à gérer, pas de dossier à fouiller.",
  },
  bento: {
    title: "Tout à portée de main.",
    a: { big: "Un seul geste.", h: "Atteignez le bord supérieur. Ou appuyez sur une touche.", p: "L'étagère apparaît sur l'écran où se trouve votre pointeur et se range quand vous avez fini." },
    b: { h: "Glissez où vous voulez.", p: "Déposez une capture dans Messages, Mail, Slack ou un document. Ou copiez-la en un clic." },
    c: { h: "Pensé pour le clavier.", p: "Tab pour choisir, Entrée pour modifier, C pour copier, Échap pour ranger." },
    d: { h: "Rangé en douceur.", p: "Vit dans la barre des menus. Pas d'icône dans le Dock. Peut sortir les nouvelles captures du Bureau." },
    e: { h: "Se montre quand il faut.", p: "Un bref aperçu vous signale qu'une nouvelle capture vient d'arriver, puis l'étagère se retire." },
    f: { big: "Privé par conception.", p: "Tout reste sur votre Mac. Pas de compte, pas de requêtes réseau, pas d'analyses." },
  },
  editor: {
    line1: "Annotez.",
    line2: "Puis envoyez.",
    body: "Cliquez sur une capture pour ouvrir l'éditeur. Annotez avec des flèches et du texte, pixellisez mots de passe et clés, réglez la lumière, recadrez et pivotez. Annulez tout.",
    alt: "L'éditeur de Ledge avec sa barre d'outils, une capture annotée aux clés pixellisées et les panneaux de style et de réglages.",
  },
  video: { title: "Découvrez-le en 40 secondes." },
  faq: {
    title: "Vos questions.",
    items: [
      { q: "Ledge est-il gratuit ?", a: "Oui. Ledge se télécharge gratuitement. Pas de publicité, d'abonnement ni de compte." },
      {
        q: "Ledge collecte-t-il mes captures ou mes données ?",
        a: "Non. Ledge lit uniquement les images du dossier de captures que vous choisissez. Tout reste sur votre Mac et Ledge n'effectue aucune requête réseau.",
      },
      {
        q: "Comment afficher l'étagère ?",
        a: "Posez le pointeur sur le bord supérieur de l'écran ou appuyez sur Cmd+Option+L. Éloignez-vous ou appuyez sur Échap pour la ranger.",
      },
    ],
  },
  get: {
    title: "Obtenez Ledge.",
    body: "Gratuit pour Mac. La version Mac App Store est en cours de validation. En attendant, téléchargez-la depuis GitHub Releases.",
    cta: "Télécharger pour Mac",
  },
  footer: {
    rights: "© 2026 Himanshu. Ledge est gratuit et garde tout sur votre Mac.",
    privacy: "Politique de confidentialité",
    support: "Assistance",
    source: "Code source",
    blog: "Blog",
    languages: "Langue",
  },
  privacy: {
    title: "Politique de confidentialité de Ledge",
    metaTitle: "Politique de confidentialité",
    desc: "Ledge ne collecte, ne stocke et ne transmet aucune donnée personnelle. Vos captures et réglages restent sur votre Mac.",
    lead: "Ledge ne collecte, ne stocke et ne transmet aucune donnée personnelle.",
    items: [
      "Ledge lit uniquement les images du dossier de captures que vous choisissez.",
      "Les captures et les réglages de Ledge restent sur votre Mac. Rien n'est envoyé à un serveur.",
      "Ledge n'a ni compte, ni analyse, ni publicité, ni SDK tiers.",
    ],
    questions: "Questions : ouvrez un ticket sur",
  },
  support: {
    title: "Assistance",
    metaTitle: "Assistance",
    desc: "De l'aide pour Ledge : configuration au premier lancement, affichage de l'étagère, signalement d'un bug ou demande de fonctionnalité.",
    reportPre: "Un bug ou une idée ?",
    reportLink: "Ouvrez un ticket sur GitHub",
    startTitle: "Premiers pas",
    steps: [
      "Au premier lancement, choisissez le dossier où vos captures sont enregistrées (par défaut, le Bureau).",
      "Faites une capture avec Cmd Maj 3.",
      "Amenez le pointeur sur le bord supérieur de l'écran, ou appuyez sur Cmd Option L, pour afficher l'étagère.",
    ],
    emptyTitle: "Rien n'apparaît sur l'étagère",
    emptyBody: "Vérifiez que le dossier choisi est bien celui où macOS enregistre les captures. Ledge ne regarde que ce dossier.",
  },
  blog: {
    title: "Blog",
    metaTitle: "Blog : astuces de captures d'écran sur Mac",
    desc: "Des conseils pratiques pour prendre, organiser, annoter et partager sans risque des captures d'écran sur Mac.",
    lead: "Des conseils pratiques pour les captures d'écran sur Mac.",
    englishOnly: "Les articles sont pour l'instant disponibles en anglais.",
    read: "Lire l'article",
    minRead: "min de lecture",
    back: "Tous les articles",
    home: "Accueil",
  },
};

export default fr;
