/* Animal Mail Route: every word in the game, per language, and the animal friends.
   Shared by the game (index.html) and the volunteer recording page (volunteer.html), so the lines a
   volunteer records are always the lines the game says. Loaded before the game's script; it sets
   window.AMR and nothing else. */
(function(){
'use strict';

/* Animal friends (data driven: add an entry and its art in ART). A friend teaches one letter, and a
   letter can have several friends, who take turns between rounds. English friends are the art's
   own ids. The first five keep their letter as their id, so saved stickers, avatars and practice
   scores from 0.5 stay valid. Another language's friend names its picture with art: (an ART id),
   and takes that picture's colours. */
var EN_FRIENDS = [
  {id:'S',  letter:'S', name:'Sammy the Skunk',    animal:'skunk',    color:'var(--c-S)',  roof:'#6f5fd0'},
  {id:'B',  letter:'B', name:'Billy the Beaver',   animal:'beaver',   color:'var(--c-B)',  roof:'#b9692f'},
  {id:'K',  letter:'K', name:'Kelly the Kangaroo', animal:'kangaroo', color:'var(--c-K)',  roof:'#c9962a'},
  {id:'C',  letter:'C', name:'Cody the Crane',     animal:'crane',    color:'var(--c-C)',  roof:'#2f9f8c'},
  {id:'P',  letter:'P', name:'Pete the Penguin',   animal:'penguin',  color:'var(--c-P)',  roof:'#3f86cf'},
  {id:'S2', letter:'S', name:'Sally the Seal',     animal:'seal',     color:'var(--c-S2)', roof:'#2f7f9c'},
  // Phase 3: a first friend for every letter but X (it has no starting sound a preschooler hears)
  {id:'A',  letter:'A', name:'Annie the Alligator',     animal:'alligator',     color:'var(--c-A)',   roof:'#4f9a3c'},
  {id:'D',  letter:'D', name:'Dina the Duck',           animal:'duck',          color:'var(--c-D)',   roof:'#c9a11f'},
  {id:'E',  letter:'E', name:'Eddie the Elephant',      animal:'elephant',      color:'var(--c-E)',   roof:'#5a6f99'},
  {id:'F',  letter:'F', name:'Freddy the Frog',         animal:'frog',          color:'var(--c-F)',   roof:'#3f9a52'},
  {id:'G',  letter:'G', name:'Gus the Goat',            animal:'goat',          color:'var(--c-G)',   roof:'#8d7a5a'},
  {id:'H',  letter:'H', name:'Hattie the Hippo',        animal:'hippo',         color:'var(--c-H)',   roof:'#7d5bb5'},
  {id:'I',  letter:'I', name:'Iggy the Iguana',         animal:'iguana',        color:'var(--c-I)',   roof:'#6aa62c'},
  {id:'J',  letter:'J', name:'Jojo the Jellyfish',      animal:'jellyfish',     color:'var(--c-J)',   roof:'#b54aa0'},
  {id:'L',  letter:'L', name:'Lulu the Lion',           animal:'lion',          color:'var(--c-L)',   roof:'#c58a1e'},
  {id:'M',  letter:'M', name:'Millie the Monkey',       animal:'monkey',        color:'var(--c-M)',   roof:'#8e5a2e'},
  {id:'N',  letter:'N', name:'Ned the Narwhal',         animal:'narwhal',       color:'var(--c-N)',   roof:'#3d6db5'},
  {id:'O',  letter:'O', name:'Ollie the Octopus',       animal:'octopus',       color:'var(--c-O)',   roof:'#c24a66'},
  {id:'Q',  letter:'Q', name:'Quinn the Quail',         animal:'quail',         color:'var(--c-Q)',   roof:'#8c6c44'},
  {id:'R',  letter:'R', name:'Rosie the Rabbit',        animal:'rabbit',        color:'var(--c-R)',   roof:'#b8587a'},
  {id:'T',  letter:'T', name:'Toby the Turtle',         animal:'turtle',        color:'var(--c-T)',   roof:'#4c8a4a'},
  {id:'U',  letter:'U', name:'Upton the Umbrellabird',  animal:'umbrellabird',  color:'var(--c-U)',   roof:'#4a58b0'},
  {id:'V',  letter:'V', name:'Vera the Vole',           animal:'vole',          color:'var(--c-V)',   roof:'#9a6e44'},
  {id:'W',  letter:'W', name:'Wally the Walrus',        animal:'walrus',        color:'var(--c-W)',   roof:'#7a5a40'},
  {id:'Y',  letter:'Y', name:'Yara the Yak',            animal:'yak',           color:'var(--c-Y)',   roof:'#7f5aa0'},
  {id:'Z',  letter:'Z', name:'Zoe the Zebra',           animal:'zebra',         color:'var(--c-Z)',   roof:'#555a66'},
  // and second friends, who take turns with the first
  {id:'A2', letter:'A', name:'Abby the Ant',            animal:'ant',           color:'var(--c-A2)',  roof:'#c4553f'},
  {id:'B2', letter:'B', name:'Bella the Bear',          animal:'bear',          color:'var(--c-B2)',  roof:'#8a5a35'},
  {id:'C2', letter:'C', name:'Cora the Cow',            animal:'cow',           color:'var(--c-C2)',  roof:'#c2588b'},
  {id:'D2', letter:'D', name:'Dex the Dog',             animal:'dog',           color:'var(--c-D2)',  roof:'#a36b3a'},
  {id:'E2', letter:'E', name:'Emmett the Elk',          animal:'elk',           color:'var(--c-E2)',  roof:'#94683a'},
  {id:'F2', letter:'F', name:'Fern the Fox',            animal:'fox',           color:'var(--c-F2)',  roof:'#d06a2a'},
  {id:'G2', letter:'G', name:'Gabby the Goose',         animal:'goose',         color:'var(--c-G2)',  roof:'#4f8fbf'},
  {id:'H2', letter:'H', name:'Hank the Horse',          animal:'horse',         color:'var(--c-H2)',  roof:'#9c5a2c'},
  {id:'I2', letter:'I', name:'Izzy the Inchworm',       animal:'inchworm',      color:'var(--c-I2)',  roof:'#9aa82c'},
  {id:'J2', letter:'J', name:'Jasper the Jaguar',       animal:'jaguar',        color:'var(--c-J2)',  roof:'#b98a22'},
  {id:'K2', letter:'K', name:'Kit the Koala',           animal:'koala',         color:'var(--c-K2)',  roof:'#627385'},
  {id:'L2', letter:'L', name:'Lenny the Llama',         animal:'llama',         color:'var(--c-L2)',  roof:'#a8875a'},
  {id:'M2', letter:'M', name:'Moe the Moose',           animal:'moose',         color:'var(--c-M2)',  roof:'#6e4a2e'},
  {id:'N2', letter:'N', name:'Nell the Newt',           animal:'newt',          color:'var(--c-N2)',  roof:'#d4772a'},
  {id:'O2', letter:'O', name:'Otto the Ox',             animal:'ox',            color:'var(--c-O2)',  roof:'#7e6142'},
  {id:'P2', letter:'P', name:'Polly the Pig',           animal:'pig',           color:'var(--c-P2)',  roof:'#d9668a'},
  {id:'R2', letter:'R', name:'Rex the Raccoon',         animal:'raccoon',       color:'var(--c-R2)',  roof:'#5b6070'},
  {id:'T2', letter:'T', name:'Tess the Tiger',          animal:'tiger',         color:'var(--c-T2)',  roof:'#d0701e'},
  {id:'W2', letter:'W', name:'Wendy the Whale',         animal:'whale',         color:'var(--c-W2)',  roof:'#2f64a8'},
  {id:'Z2', letter:'Z', name:'Ziggy the Zebra',         animal:'zebra',         color:'var(--c-Z2)',  roof:'#c47a2a'}
];
var ES_FRIENDS = [
  // The first five (M, P, L, S, T): the letters Spanish reading usually starts with after the vowels
  {id:'M',  letter:'M', name:'Memo el Mono',        animal:'mono',       art:'M'},
  {id:'P',  letter:'P', name:'Paco el Pingüino',    animal:'pingüino',   art:'P'},
  {id:'L',  letter:'L', name:'Leo el León',         animal:'león',       art:'L'},
  {id:'S',  letter:'S', name:'Sofi la Salamandra',  animal:'salamandra', art:'N2'},
  {id:'T',  letter:'T', name:'Tita la Tortuga',     animal:'tortuga',    art:'T'},
  // a first friend for every letter but U, W and X (no good animal for a preschooler; off, like X in English)
  {id:'A',  letter:'A', name:'Álex el Alce',        animal:'alce',       art:'M2'},
  {id:'B',  letter:'B', name:'Bety la Ballena',     animal:'ballena',    art:'W2'},
  {id:'C',  letter:'C', name:'Coco el Canguro',     animal:'canguro',    art:'K'},
  {id:'D',  letter:'D', name:'Dani el Delfín',      animal:'delfín',     art:'dolphin', color:'#cfe0ee', roof:'#5f7f9c'},
  {id:'E',  letter:'E', name:'Eli el Elefante',     animal:'elefante',   art:'E'},
  {id:'F',  letter:'F', name:'Fina la Foca',        animal:'foca',       art:'S2'},
  {id:'G',  letter:'G', name:'Gloria la Grulla',    animal:'grulla',     art:'C'},
  {id:'H',  letter:'H', name:'Hugo el Hipopótamo',  animal:'hipopótamo', art:'H'},
  {id:'I',  letter:'I', name:'Isa la Iguana',       animal:'iguana',     art:'I'},
  {id:'J',  letter:'J', name:'Javi el Jaguar',      animal:'jaguar',     art:'J2'},
  {id:'K',  letter:'K', name:'Kiko el Koala',       animal:'koala',      art:'K2'},
  {id:'N',  letter:'N', name:'Nico el Narval',      animal:'narval',     art:'N'},
  {id:'Ñ',  letter:'Ñ', name:'Ñico el Ñandú',       animal:'ñandú',      art:'rhea',    color:'#ece2d2', roof:'#8e8478'},
  {id:'O',  letter:'O', name:'Óscar el Oso',        animal:'oso',        art:'B2'},
  {id:'Q',  letter:'Q', name:'Quique el Quetzal',   animal:'quetzal',    art:'quetzal', color:'#d2f0d6', roof:'#2f9e5a'},
  {id:'R',  letter:'R', name:'Rita la Rana',        animal:'rana',       art:'F'},
  {id:'V',  letter:'V', name:'Vale la Vaca',        animal:'vaca',       art:'C2'},
  {id:'Y',  letter:'Y', name:'Yuri el Yak',         animal:'yak',        art:'Y'},
  {id:'Z',  letter:'Z', name:'Zac el Zorro',        animal:'zorro',      art:'F2'},
  // second friends, who take turns with the first
  {id:'M2', letter:'M', name:'Mateo el Mapache',    animal:'mapache',    art:'R2'},
  {id:'P2', letter:'P', name:'Pepe el Pato',        animal:'pato',       art:'D'},
  {id:'T2', letter:'T', name:'Toño el Tigre',       animal:'tigre',      art:'T2'},
  {id:'B2', letter:'B', name:'Beto el Buey',        animal:'buey',       art:'O2'},
  {id:'C2', letter:'C', name:'Clara la Coneja',     animal:'coneja',     art:'R'},
  {id:'G2', letter:'G', name:'Gus el Ganso',        animal:'ganso',      art:'G2'},
  {id:'H2', letter:'H', name:'Hilda la Hormiga',    animal:'hormiga',    art:'A2'},
  {id:'O2', letter:'O', name:'Olga la Oruga',       animal:'oruga',      art:'I2'},
  {id:'R2', letter:'R', name:'Raúl el Ratón',       animal:'ratón',      art:'V'},
  {id:'V2', letter:'V', name:'Víctor el Venado',    animal:'venado',     art:'E2'},
  {id:'Y2', letter:'Y', name:'Yola la Yegua',       animal:'yegua',      art:'H2'},
  {id:'Z2', letter:'Z', name:'Zenón el Zorrillo',   animal:'zorrillo',   art:'S'}
];

/* Words. {x} is filled in by t(key, {x:...}). Keys with a 1 and an N are the singular and plural.
   clips: the fixed spoken lines (see CLIPS). sounds: what each letter says after its name. */
var LANGS = {
  en: {name:'English', speech:'en-US', ready:true, friends:EN_FRIENDS, starters:['S','B','K','C','P'],
    alphabet:'ABCDEFGHIJKLMNOPQRSTUVWXYZ', audio:'audio/en/', nums:['one','two','three','four','five'],
    sounds:{S:'sss', B:'buh', K:'kuh', C:'kuh', P:'puh', A:'aa', D:'duh', E:'eh', F:'fff', G:'guh', H:'huh',
      I:'ih', J:'juh', L:'lll', M:'mmm', N:'nnn', O:'ah', Q:'kwuh', R:'rrr', T:'tuh', U:'uh', V:'vvv', W:'wuh', Y:'yuh', Z:'zzz'},
    clips:{
      'who-gets-the':'Who gets the',
      'mail-for':'This mail is for',
      'try-again':'Oops! Try another house.',
      'hint':'Try the wiggling house!',
      'locked':'Keep delivering to open this route!',
      'route-done':'You finished the route! Great job! You got a sticker!',
      'deliver-to':'Deliver to number',
      'count-prompt':'Count the stars! Which number?',
      'whos-playing':"Who's playing?"
    },
    t:{
      title:'Animal Mail Route', play:'Play', book:'Sticker book', switchTo:'Play in English',
      gear:'Parent corner. Press and hold to open.', gearTip:'Press and hold the gear to open the parent corner.',
      toStart:'Back to the start', toMap:'Back to the map', who:"Who's playing?", again:'Hear it again',
      stickers:'Stickers', sticker1:'1 sticker', stickerN:'{n} stickers', hear:'Hear {name}',
      winAria:'Route complete', winHead:'Route complete!', winText:'You delivered all the mail and earned a sticker.',
      map:'Map', playAgain:'Play again', nextRoute:'Next route',
      routeAria:'Route {n}, {name}', lockedAria:', locked', nextAria:', play next',
      trackLetters:'Letters', trackNumbers:'Numbers', levels:['Letters', 'Animals', 'Letters and animals', 'Numbers'],
      playing:'Playing: {name}. Tap to change player.',
      houseLetter:'House with the letter {l}, home of {name}', houseNumber:'House number {n}, home of {name}',
      capLetter:'Who gets the {l}?', capNumber:'Deliver to number {n}!', capCount:'Count the stars. Which number?', capPicture:'This mail is for {name}!',
      mailLetter:'Mail with the letter {l}', mailNumber:'Mail with the number {n}', mailCount:'Mail with {n} stars', mailPicture:'Mail with a picture of {name}',
      mailHow:'. Drag it to the matching house, or tap it and then tap a house.',
      bannerLetter:'{l} for {name}!', bannerNumber:'{n} is {name}!', sayLetter:'{l}! {l} for {name}!', sayNumber:'{n}! {name}!', reward:'{l} for {name}!',
      parent:'Parent corner', language:'Language / Idioma', on:'On', off:'Off',
      voice:'Voice prompts', sfx:'Sound effects', unlock:'Unlock all routes', share:'Share play counts', clips:'Recorded voice clips', clipCount:'{n} of {m}',
      players:'Players', playersHint:'Tap a player to see their progress. Names are optional and stay on this device.', addPlayer:'Add player',
      namePh:'Player {n} name (optional)', nameAria:'Player {n} name', aniAria:'Player {n} animal', erase:'Erase', tapErase:'Tap again to erase', more:'More', fewer:'Fewer',
      progHead:'Progress', progHeadFor:'Progress: {name}',
      progHint:'A star per round; 2 stars open the next route. Replays add houses and switch animals on purpose. Their animal on the map marks what to play next.',
      route:'Route {n}, {name}: ', lockedLine:'locked', openLine:'open', unlockOn:' (Unlock all is on)', round1:'1 round', roundN:'{n} rounds',
      more1:', so 1 more opens Route {r}', moreN:', so {n} more open Route {r}', stickersLine:'Stickers: {n}', lettersLine:'Letters: {list}',
      practice:'Needs practice', noneYet:'None yet', ready:'Ready for new letters',
      letters:'Letters', letHeadFor:'Letters: {name}', lettersHint:"The letters this player's rounds use. Keep at least 2. Changing them keeps rounds and stickers.",
      noFriend:'{l}, no animal friend yet', keepTwo:'{l}, on (keep at least 2)', first5:'First five', all:'All', same:'Use for all players',
      paper:'Paper copy', print:'Print summary', papers:'Paper copies', printAll:'Print all players', everyone:'Everyone', reset:'Erase everything', done:'Done',
      note:"Prototype {v}. Voice prompts use your device's built-in speech until recorded voices are added.",
      shareNote:'"Share play counts" sends only anonymous totals, such as rounds played per route, and is off unless you turn it on.', privacy:'Privacy', privacyPage:'privacy.html',
      summary:'Progress summary', printOne:'Print', sumTitle:'Animal Mail Route: progress', sumPlayer:'Player: {name}', sumMade:'Made {date}, game version {v}',
      sumRoutes:'Routes and stickers', sumReady:"Ready for new letters: none of this player's letters needs practice after 3 or more rounds.",
      sumFoot:'A route opens after 2 finished rounds (2 stars) of the route before it. Replaying a route adds houses, rotates the animals and repeats the letters that need practice. "Letters" are the letters this player\'s rounds use, chosen in the parent corner. Each round is 5 deliveries and earns a sticker. "Needs practice" lists the letters this player has missed most often lately; it clears as they get them right. Made on this device; nothing was sent anywhere.',
      docTitle:'Animal Mail Route progress, {name}', allPlayers:'all players',
      voiceSet:'Recorded voice', female:'Female', male:'Male', deviceVoice:'Device voice',
      help:'Help improve the game',
      helpHint:"Each button opens an email to the game's maker, ready for you to read, change and send yourself. It adds only the game version, language and screen size, never anything about your child. Nothing is sent unless you send it.",
      fbWord:'A wrong word or translation', fbProblem:'Report a problem', fbIdea:'Suggest an idea',
      fbWordSubj:'Animal Mail Route: a wrong word', fbProblemSubj:'Animal Mail Route: a problem', fbIdeaSubj:'Animal Mail Route: an idea',
      fbWordBody:'Which word or line is wrong, and where did you see or hear it?\n\n\nWhat should it say?\n\n\n',
      fbProblemBody:'What happened?\n\n\nWhat were you doing just before?\n\n\n',
      fbIdeaBody:'Your idea:\n\n\n',
      fbInfo:"Please don't add your child's name or other personal details.\n\nGame version: {v}\nLanguage: {lang}\nScreen: {w} x {h}"
    }
  },
  /* Mexican Spanish (most Spanish speakers in Michigan have Mexican roots). Offered since 1.4 without a
     native speaker's review (the owner's call): t.draft tells parents so and asks for corrections. */
  es: {name:'Español', speech:'es-MX', ready:true, friends:ES_FRIENDS, starters:['M','P','L','S','T'],
    manifest:'es/manifest.webmanifest',
    alphabet:'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ', audio:'audio/es/', nums:['uno','dos','tres','cuatro','cinco'],
    // syllables for the sounds a voice can't say alone; H is silent, so it says only its name
    sounds:{M:'mmm', P:'pa', L:'lll', S:'sss', T:'ta', A:'a', B:'ba', C:'ca', D:'da', Ñ:'ña', Q:'que', E:'e', F:'fff', G:'ga', H:'',
      I:'i', J:'ja', K:'ka', N:'nnn', O:'o', R:'rrr', V:'va', Y:'ya', Z:'sss'},
    clips:{
      'who-gets-the':'¿Quién recibe la',
      'mail-for':'Esta carta es para',
      'try-again':'¡Uy! Prueba otra casa.',
      'hint':'¡Prueba la casa que se mueve!',
      'locked':'¡Sigue entregando cartas para abrir esta ruta!',
      'route-done':'¡Terminaste la ruta! ¡Muy bien! ¡Ganaste una estampa!',
      'deliver-to':'Lleva la carta al número',
      'count-prompt':'¡Cuenta las estrellas! ¿Qué número es?',
      'whos-playing':'¿Quién va a jugar?'
    },
    t:{
      title:'El Correo de los Animales', play:'Jugar', book:'Álbum de estampas', switchTo:'Jugar en español',
      gear:'Rincón de papás. Mantén presionado para abrir.', gearTip:'Mantén presionado el engrane para abrir el rincón de papás.',
      toStart:'Volver al inicio', toMap:'Volver al mapa', who:'¿Quién va a jugar?', again:'Escuchar otra vez',
      stickers:'Estampas', sticker1:'1 estampa', stickerN:'{n} estampas', hear:'Escuchar a {name}',
      winAria:'Ruta terminada', winHead:'¡Ruta terminada!', winText:'Entregaste todas las cartas y ganaste una estampa.',
      map:'Mapa', playAgain:'Jugar otra vez', nextRoute:'Siguiente ruta',
      routeAria:'Ruta {n}, {name}', lockedAria:', cerrada', nextAria:', sigue esta',
      trackLetters:'Letras', trackNumbers:'Números', levels:['Letras', 'Animales', 'Letras y animales', 'Números'],
      playing:'Juega: {name}. Toca para cambiar de jugador.',
      houseLetter:'Casa con la letra {l}, de {name}', houseNumber:'Casa número {n}, de {name}',
      capLetter:'¿Quién recibe la {l}?', capNumber:'¡Lleva la carta al número {n}!', capCount:'Cuenta las estrellas. ¿Qué número es?', capPicture:'¡Esta carta es para {name}!',
      mailLetter:'Carta con la letra {l}', mailNumber:'Carta con el número {n}', mailCount:'Carta con {n} estrellas', mailPicture:'Carta con un dibujo de {name}',
      mailHow:'. Arrástrala a la casa correcta, o tócala y luego toca una casa.',
      bannerLetter:'¡{l} de {name}!', bannerNumber:'¡El {n} es de {name}!', sayLetter:'¡{l}! ¡{l} de {name}!', sayNumber:'¡{n}! ¡{name}!', reward:'¡{l} de {name}!',
      parent:'Rincón de papás', language:'Idioma / Language', on:'Sí', off:'No',
      voice:'Instrucciones habladas', sfx:'Efectos de sonido', unlock:'Abrir todas las rutas', share:'Compartir conteos de juego', clips:'Grabaciones de voz', clipCount:'{n} de {m}',
      players:'Jugadores', playersHint:'Toca un jugador para ver su progreso. Los nombres son opcionales y se quedan en este dispositivo.', addPlayer:'Agregar jugador',
      namePh:'Nombre (opcional)', nameAria:'Nombre del jugador {n}', aniAria:'Animal del jugador {n}', erase:'Borrar', tapErase:'Toca otra vez para borrar', more:'Más', fewer:'Menos',
      progHead:'Progreso', progHeadFor:'Progreso: {name}',
      progHint:'Una estrella por ronda; 2 estrellas abren la siguiente ruta. Al repetir una ruta se agregan casas y cambian los animales a propósito. Su animal en el mapa marca qué jugar después.',
      route:'Ruta {n}, {name}: ', lockedLine:'cerrada', openLine:'abierta', unlockOn:' (Abrir todas las rutas está activado)', round1:'1 ronda', roundN:'{n} rondas',
      more1:', falta 1 para abrir la Ruta {r}', moreN:', faltan {n} para abrir la Ruta {r}', stickersLine:'Estampas: {n}', lettersLine:'Letras: {list}',
      practice:'Necesita práctica', noneYet:'Ninguna todavía', ready:'Listo para letras nuevas',
      letters:'Letras', letHeadFor:'Letras: {name}', lettersHint:'Las letras que usan las rondas de este jugador. Deja al menos 2. Cambiarlas conserva las rondas y las estampas.',
      noFriend:'{l}, todavía sin amigo animal', keepTwo:'{l}, activada (deja al menos 2)', first5:'Primeras cinco', all:'Todas', same:'Usar para todos los jugadores',
      paper:'Copia en papel', print:'Imprimir resumen', papers:'Copias en papel', printAll:'Imprimir todos', everyone:'Todos', reset:'Borrar todo', done:'Listo',
      note:'Prototipo {v}. Las instrucciones habladas usan la voz de tu dispositivo hasta que se agreguen voces grabadas.',
      shareNote:'"Compartir conteos de juego" envía solo totales anónimos, como las rondas jugadas por ruta, y está apagado a menos que lo actives.', privacy:'Privacidad', privacyPage:'privacy-es.html',
      summary:'Resumen de progreso', printOne:'Imprimir', sumTitle:'El Correo de los Animales: progreso', sumPlayer:'Jugador: {name}', sumMade:'Hecho el {date}, versión del juego {v}',
      sumRoutes:'Rutas y estampas', sumReady:'Listo para letras nuevas: ninguna de las letras de este jugador necesita práctica después de 3 rondas o más.',
      sumFoot:'Una ruta se abre después de 2 rondas terminadas (2 estrellas) de la ruta anterior. Repetir una ruta agrega casas, cambia los animales y repite las letras que necesitan práctica. "Letras" son las letras que usan las rondas de este jugador, elegidas en el rincón de papás. Cada ronda tiene 5 entregas y gana una estampa. "Necesita práctica" muestra las letras que este jugador ha fallado más últimamente; se quita cuando las acierta. Hecho en este dispositivo; no se envió nada.',
      docTitle:'Progreso en El Correo de los Animales, {name}', allPlayers:'todos los jugadores',
      voiceSet:'Voz grabada', female:'Mujer', male:'Hombre', deviceVoice:'Voz del dispositivo',
      help:'Ayuda a mejorar el juego',
      helpHint:'Cada botón abre un correo para quien hace el juego, listo para que lo leas, lo cambies y lo envíes tú. Solo agrega la versión del juego, el idioma y el tamaño de la pantalla, nunca nada sobre tu niño. No se envía nada a menos que tú lo envíes.',
      fbWord:'Una palabra o traducción equivocada', fbProblem:'Reportar un problema', fbIdea:'Sugerir una idea',
      fbWordSubj:'El Correo de los Animales: una palabra equivocada', fbProblemSubj:'El Correo de los Animales: un problema', fbIdeaSubj:'El Correo de los Animales: una idea',
      fbWordBody:'¿Qué palabra o frase está mal, y dónde la viste o la escuchaste?\n\n\n¿Cómo debe decir?\n\n\n',
      fbProblemBody:'¿Qué pasó?\n\n\n¿Qué estabas haciendo justo antes?\n\n\n',
      fbIdeaBody:'Tu idea:\n\n\n',
      fbInfo:'Por favor no agregues el nombre de tu niño ni otros datos personales.\n\nVersión del juego: {v}\nIdioma: {lang}\nPantalla: {w} x {h}',
      // only in a language whose words haven't been reviewed yet: shown at the top of the parent corner
      draft:'Esta traducción al español es un borrador: todavía no la ha revisado un hablante nativo. Si ves o escuchas algo que no suena bien, avísanos con «Una palabra o traducción equivocada», más abajo en «Ayuda a mejorar el juego». ¡Gracias!'
    }
  }
};

/* Every spoken line in a language, keyed by clip name: the fixed prompts, a number word per
   starter's house (num-1 to num-5), letter- and sound- per letter with a friend (no sound- for a
   letter with no sound of its own, like Spanish H), and name- and reward- per friend. The text is
   what the built-in voice says when a recording is missing, and what a volunteer reads. */
function clipsFor(code){
  var L = LANGS[code], c = {}, k, seen = {};
  var reward = L.t.reward || LANGS.en.t.reward;
  for(k in L.clips) c[k] = L.clips[k];
  L.starters.forEach(function(l, i){ c['num-' + (i + 1)] = L.nums[i]; });
  L.friends.forEach(function(f){
    if(seen[f.letter]) return;
    seen[f.letter] = true;
    c['letter-' + f.letter] = f.letter;
    if(L.sounds[f.letter]) c['sound-' + f.letter] = L.sounds[f.letter];
  });
  L.friends.forEach(function(f){
    c['name-' + f.id] = f.name;
    c['reward-' + f.id] = reward.replace('{l}', f.letter).replace('{name}', f.name);
  });
  return c;
}
/* Recorded voices: each language has a female and a male set, audio/<language>/<set>/, each with
   its own clips.json listing the recordings it has. */
var VOICE_SETS = ['female', 'male'];

window.AMR = {EN_FRIENDS:EN_FRIENDS, ES_FRIENDS:ES_FRIENDS, LANGS:LANGS, clipsFor:clipsFor, VOICE_SETS:VOICE_SETS};
})();
