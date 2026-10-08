import type { Dict } from "./en";

const es: Dict = {
  meta: {
    title: "Ledge: gestor de capturas de pantalla gratis para Mac",
    description:
      "Ledge es una app gratuita de la barra de menús de Mac que guarda tus últimas capturas en un estante arriba. Arrastra, copia, anota y difumina datos sensibles.",
    keywords: [
      "gestor de capturas de pantalla mac",
      "organizar capturas de pantalla mac",
      "estante de capturas",
      "arrastrar y soltar capturas",
      "anotar capturas de pantalla mac",
      "difuminar información sensible en captura",
      "pixelar captura de pantalla mac",
      "app de barra de menús para mac",
      "herramienta de capturas gratis para mac",
      "mover capturas fuera del escritorio",
    ],
    ogAlt: "Ledge, un estante de capturas en la parte superior de la pantalla de un Mac",
  },
  nav: { main: "Principal", privacy: "Privacidad", support: "Soporte", blog: "Blog", github: "GitHub", download: "Descargar" },
  theme: { group: "Tema de color", light: "Tema claro", system: "Tema del sistema", dark: "Tema oscuro" },
  hero: {
    eyebrow: "Ledge",
    title: "Un estante para tus capturas.",
    sub: "Tus capturas más recientes esperan en el borde superior de la pantalla, fuera de tu camino hasta que las necesitas.",
    cta: "Descargar para Mac",
    film: "Ver el vídeo",
    note: "Gratis. macOS en Apple silicon. Versión de la Mac App Store en revisión.",
    shelfAlt: "Un estante de cristal esmerilado en la parte superior de la pantalla con seis miniaturas de capturas.",
  },
  intro: {
    line1: "Siempre a mano.",
    line2: "Nunca estorba.",
    body: "Apoya el puntero en el borde superior y el estante se desliza hacia abajo. Aléjate y se recoge solo. Sin ventanas que gestionar ni carpetas que revisar.",
  },
  bento: {
    title: "Todo al alcance.",
    a: { big: "Un solo gesto.", h: "Llega al borde superior. O pulsa una tecla.", p: "El estante aparece en la pantalla donde esté tu puntero y se recoge cuando terminas." },
    b: { h: "Arrastra a cualquier sitio.", p: "Suelta una captura en Mensajes, Mail, Slack o un documento. O cópiala con un clic." },
    c: { h: "Pensado para el teclado.", p: "Tab para elegir, Intro para editar, C para copiar, Esc para recoger." },
    d: { h: "Orden discreto.", p: "Vive en la barra de menús. Sin icono en el Dock. Si quieres, saca las capturas nuevas del Escritorio." },
    e: { h: "Se asoma cuando importa.", p: "Un breve vistazo te avisa de que ha llegado una captura nueva y vuelve a apartarse." },
    f: { big: "Privado por diseño.", p: "Todo se queda en tu Mac. Sin cuenta, sin conexiones de red, sin analíticas." },
  },
  editor: {
    line1: "Anótala.",
    line2: "Y envíala.",
    body: "Haz clic en cualquier captura para abrir el editor. Anota con flechas y texto, pixela contraseñas y claves, ajusta la luz, recorta y gira. Deshaz lo que quieras.",
    alt: "El editor de Ledge con barra de herramientas, una captura anotada con claves pixeladas y paneles de estilo y ajustes.",
  },
  video: { title: "Míralo en 40 segundos." },
  faq: {
    title: "Preguntas frecuentes.",
    items: [
      { q: "¿Ledge es gratis?", a: "Sí. Ledge se descarga gratis. No tiene anuncios, suscripciones ni cuentas." },
      {
        q: "¿Ledge recopila mis capturas o mis datos?",
        a: "No. Ledge solo lee imágenes de la carpeta de capturas que eliges. Todo se queda en tu Mac y Ledge no hace conexiones de red.",
      },
      {
        q: "¿Cómo muestro el estante?",
        a: "Apoya el puntero en el borde superior de la pantalla o pulsa Cmd+Opción+L. Aléjate o pulsa Esc para recogerlo.",
      },
    ],
  },
  get: {
    title: "Consigue Ledge.",
    body: "Gratis para Mac. La versión de la Mac App Store está en revisión. Hasta que esté disponible, descárgala desde GitHub Releases.",
    cta: "Descargar para Mac",
  },
  footer: {
    rights: "© 2026 Himanshu. Ledge es gratis y mantiene todo en tu Mac.",
    privacy: "Política de privacidad",
    support: "Soporte",
    source: "Código",
    blog: "Blog",
    languages: "Idioma",
  },
  privacy: {
    title: "Política de privacidad de Ledge",
    metaTitle: "Política de privacidad",
    desc: "Ledge no recopila, almacena ni transmite datos personales. Tus capturas y ajustes se quedan en tu Mac.",
    lead: "Ledge no recopila, almacena ni transmite ningún dato personal.",
    items: [
      "Ledge solo lee imágenes de la carpeta de capturas que eliges.",
      "Las capturas y los ajustes de Ledge se quedan en tu Mac. No se envía nada a ningún servidor.",
      "Ledge no tiene cuentas, analíticas, publicidad ni SDK de terceros.",
    ],
    questions: "Preguntas: abre una incidencia en",
  },
  support: {
    title: "Soporte",
    metaTitle: "Soporte",
    desc: "Ayuda con Ledge: configuración inicial, cómo mostrar el estante y cómo informar de un error o proponer una mejora.",
    reportPre: "¿Has encontrado un error o tienes una idea?",
    reportLink: "Abre una incidencia en GitHub",
    startTitle: "Primeros pasos",
    steps: [
      "En el primer arranque, elige la carpeta donde se guardan tus capturas (por defecto, el Escritorio).",
      "Haz una captura con Cmd Mayús 3.",
      "Lleva el puntero al borde superior de la pantalla, o pulsa Cmd Opción L, para mostrar el estante.",
    ],
    emptyTitle: "No aparece nada en el estante",
    emptyBody: "Comprueba que la carpeta elegida es la que macOS usa para guardar las capturas. Ledge solo mira esa carpeta.",
  },
  blog: {
    title: "Blog",
    metaTitle: "Blog: consejos de capturas en Mac",
    desc: "Consejos prácticos para hacer, organizar, anotar y compartir capturas de pantalla con seguridad en Mac.",
    lead: "Consejos prácticos sobre capturas en Mac.",
    englishOnly: "Por ahora los artículos solo están en inglés.",
    read: "Leer artículo",
    minRead: "min de lectura",
    back: "Todos los artículos",
    home: "Inicio",
  },
};

export default es;
