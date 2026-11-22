(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KindleWords = factory();
  }
}(this, function () {
  'use strict';

  // Original practice material; these groupings do not cover a full curriculum.
  var banks = {
    '3': {
      read: [
        { id: '3-read-mat', title: 'De kat', story: 'De kat zit op de mat.', question: 'Waar zit de kat?', choices: ['Op de mat', 'In de bus', 'In het bos'], answer: 'Op de mat' },
        { id: '3-read-pen', title: 'Een pen', story: 'Pim pakt een pen. De pen is dik.', question: 'Wat pakt Pim?', choices: ['Een pen', 'Een pan', 'Een bal'], answer: 'Een pen' },
        { id: '3-read-hok', title: 'De kip', story: 'De kip zit in het hok.', question: 'Waar zit de kip?', choices: ['In het hok', 'Op de mat', 'In de bus'], answer: 'In het hok' },
        { id: '3-read-vis', title: 'De vis', story: 'Sam eet een vis.', question: 'Wat eet Sam?', choices: ['Een vis', 'Een bes', 'Een peer'], answer: 'Een vis' },
        { id: '3-read-bos', title: 'Het bos', story: 'Kim rent in het bos.', question: 'Waar is Kim?', choices: ['In het bos', 'In de bus', 'Op de mat'], answer: 'In het bos' },
        { id: '3-read-mus', title: 'De mus', story: 'De vos ziet een mus. De mus zit op een tak.', question: 'Wat zit op de tak?', choices: ['Een mus', 'Een vos', 'Een kat'], answer: 'Een mus' },
        { id: '3-read-pot', title: 'De pot', story: 'Bas zet de pot op de kast.', question: 'Wat zet Bas op de kast?', choices: ['De pot', 'De pan', 'De pen'], answer: 'De pot' },
        { id: '3-read-bus', title: 'De bus', story: 'De bus is vol. Tom zit in de bus.', question: 'Wat is vol?', choices: ['De bus', 'De pot', 'Het hok'], answer: 'De bus' }
      ],
      spell: [
        { id: '3-spell-kat', clue: 'Dit dier zegt miauw.', word: 'kat' },
        { id: '3-spell-vis', clue: 'Dit dier zwemt en heeft vinnen.', word: 'vis' },
        { id: '3-spell-pen', clue: 'Hiermee schrijf je op papier.', word: 'pen' },
        { id: '3-spell-bus', clue: 'Hierin rijden veel mensen mee.', word: 'bus' },
        { id: '3-spell-kip', clue: 'Dit dier zegt tok en legt een ei.', word: 'kip' },
        { id: '3-spell-pan', clue: 'Hierin bak je een ei.', word: 'pan' },
        { id: '3-spell-pot', clue: 'Hier zit jam in. Er zit een deksel op.', word: 'pot' },
        { id: '3-spell-zon', clue: 'Die schijnt aan de lucht.', word: 'zon' }
      ]
    },
    '4': {
      read: [
        { id: '4-read-jas', title: 'Naar buiten', story: 'Mila doet haar jas aan. Daarna loopt ze naar buiten. Bij de deur pakt ze haar fiets.', question: 'Wat doet Mila eerst?', choices: ['Haar jas aandoen', 'Haar fiets pakken', 'Naar buiten lopen'], answer: 'Haar jas aandoen' },
        { id: '4-read-zaad', title: 'Het zaadje', story: 'Noor stopt een zaadje in een pot. Ze geeft het water. Na een week ziet ze een groen blaadje.', question: 'Wat doet Noor nadat ze het zaadje in de pot stopt?', choices: ['Ze geeft het water.', 'Ze plukt het blaadje.', 'Ze zet de pot weg.'], answer: 'Ze geeft het water.' },
        { id: '4-read-bel', title: 'De bel gaat', story: 'De bel gaat. Finn ruimt zijn schrift op. Daarna loopt hij naar het plein.', question: 'Waar gaat Finn heen als zijn schrift is opgeruimd?', choices: ['Naar het plein', 'Naar de winkel', 'Naar de keuken'], answer: 'Naar het plein' },
        { id: '4-read-brood', title: 'Brood met kaas', story: 'Sem legt brood op een bord. Hij legt er kaas op. Dan zet hij het bord op tafel.', question: 'Wat doet Sem nadat hij de kaas op het brood legt?', choices: ['Het bord op tafel zetten', 'De kaas uitpakken', 'Het brood op het bord leggen'], answer: 'Het bord op tafel zetten' },
        { id: '4-read-bal', title: 'De rode bal', story: 'Lina vindt een rode bal in het park. Ze ziet een kind zoeken. Lina geeft de bal aan het kind.', question: 'Wie krijgt de bal van Lina?', choices: ['Het zoekende kind', 'Een man op de bank', 'Haar juf'], answer: 'Het zoekende kind' },
        { id: '4-read-toren', title: 'Een hoge toren', story: 'Amir bouwt een toren van blokken. Zijn zus zet er een vlag op. Samen klappen ze als de toren klaar is.', question: 'Wie zet de vlag op de toren?', choices: ['De zus van Amir', 'Amir', 'De vader van Amir'], answer: 'De zus van Amir' },
        { id: '4-read-trein', title: 'Op reis', story: 'De trein stopt op het station. Eva stapt in en zoekt een plek. Daarna rijdt de trein weg.', question: 'Wat doet Eva nadat ze instapt?', choices: ['Een plek zoeken', 'De trein besturen', 'Een kaartje kopen'], answer: 'Een plek zoeken' },
        { id: '4-read-appel', title: 'Een appel delen', story: 'Bo wast een appel. Hij snijdt de appel in stukjes. Dan deelt hij de stukjes met zijn broer.', question: 'Wat doet Bo voordat hij de appel snijdt?', choices: ['De appel wassen', 'De stukjes delen', 'De appel opeten'], answer: 'De appel wassen' }
      ],
      spell: [
        { id: '4-spell-bank', clue: 'Hierop zit je in het park, vaak met meer mensen naast elkaar.', word: 'bank' },
        { id: '4-spell-ring', clue: 'Dit ronde sieraad draag je om je vinger.', word: 'ring' },
        { id: '4-spell-stoel', clue: 'Hierop zit één persoon. Er zit een rugleuning aan.', word: 'stoel' },
        { id: '4-spell-trein', clue: 'Dit voertuig rijdt op rails en heeft wagons.', word: 'trein' },
        { id: '4-spell-brood', clue: 'De bakker snijdt dit in sneetjes voor je boterham.', word: 'brood' },
        { id: '4-spell-bloem', clue: 'Dit groeit aan een plant. Een roos of een tulp is er één.', word: 'bloem' },
        { id: '4-spell-klok', clue: 'Hierop zie je hoe laat het is. Hij hangt aan de muur.', word: 'klok' },
        { id: '4-spell-slak', clue: 'Dit langzame dier heeft een huisje op zijn rug en laat een slijmspoor achter.', word: 'slak' }
      ]
    },
    '5': {
      read: [
        { id: '5-read-laarzen', title: 'Na de regen', story: 'In de nacht heeft het geregend. Op het schoolplein liggen plassen. Noor trekt daarom haar laarzen aan. Zo blijven haar sokken droog.', question: 'Waarom trekt Noor haar laarzen aan?', choices: ['Om haar sokken droog te houden.', 'Om sneller te kunnen rennen.', 'Omdat haar jas nat is.'], answer: 'Om haar sokken droog te houden.' },
        { id: '5-read-voer', title: 'Een bakje voor de vogels', story: 'De klas maakt een vogelvoerbakje. Eerst prikken de kinderen gaatjes in de bodem. Daarna doen ze er voer in. Regenwater kan door de gaatjes weglopen.', question: 'Waarom zitten er gaatjes in de bodem?', choices: ['Zodat regenwater kan weglopen.', 'Zodat er meer voer in past.', 'Zodat het bakje gaat vliegen.'], answer: 'Zodat regenwater kan weglopen.' },
        { id: '5-read-munt', title: 'Munt in de tuin', story: 'In de schooltuin groeit munt. Als je over een blaadje wrijft, ruik je het sterk. Je kunt munt gebruiken om thee te maken. Daarvoor pluk je een paar schone blaadjes.', question: 'Waarvoor kun je de munt uit de schooltuin gebruiken?', choices: ['Om thee te maken', 'Om papier te vouwen', 'Om ramen te wassen'], answer: 'Om thee te maken' },
        { id: '5-read-ijs', title: 'Twee ijsblokjes', story: 'Een ijsblokje ligt op een bord in de zon. Een ander ijsblokje staat binnen in de schaduw. Het ijsblokje in de zon smelt het eerst. Daar krijgt het meer warmte.', question: 'Waardoor smelt het ijsblokje in de zon het eerst?', choices: ['Het krijgt meer warmte.', 'Het bord is groter.', 'Er staat een boom naast.'], answer: 'Het krijgt meer warmte.' },
        { id: '5-read-boek', title: 'Een boek zoeken', story: 'Jesse wil een boek lenen. Op een kaartje vindt hij de titel en een nummer. Daarna vindt hij hetzelfde nummer op een boekenkast. Zo weet hij waar hij moet zoeken.', question: 'Wat helpt Jesse om de juiste boekenkast te vinden?', choices: ['Het nummer op het kaartje', 'De kleur van zijn tas', 'De naam van zijn school'], answer: 'Het nummer op het kaartje' },
        { id: '5-read-hut', title: 'Een plan voor de boomhut', story: 'Het team wil een boomhut bouwen. Ze tekenen eerst een plan en meten de planken. Pas daarna zagen ze de planken op maat. Dankzij het meten passen de stukken goed bij elkaar.', question: 'Waarom meten ze de planken voordat ze gaan zagen?', choices: ['Zodat de stukken goed bij elkaar passen.', 'Zodat de planken zwaarder worden.', 'Zodat ze geen plan nodig hebben.'], answer: 'Zodat de stukken goed bij elkaar passen.' },
        { id: '5-read-koekjes', title: 'Even wachten', story: 'Nina bakt koekjes met haar vader. Op het recept staat dat het deeg een half uur moet rusten. Ze zetten daarom een kookwekker. Als die afgaat, kunnen ze verder met het recept.', question: 'Waarom zetten Nina en haar vader een kookwekker?', choices: ['Om te weten wanneer het deeg lang genoeg heeft gerust.', 'Om te tellen hoeveel koekjes er zijn.', 'Om de oven warmer te maken.'], answer: 'Om te weten wanneer het deeg lang genoeg heeft gerust.' },
        { id: '5-read-pijlen', title: 'De gele pijlen', story: 'Langs het fietspad staat een bord over werk aan de weg. Verderop ligt een hoop zand op het pad. De fietsers volgen daarom de gele pijlen. Die wijzen een veilige route om het werk heen.', question: 'Waarom volgen de fietsers de gele pijlen?', choices: ['Om veilig langs het werk te fietsen.', 'Om in het zand te kunnen spelen.', 'Om hun fiets daar achter te laten.'], answer: 'Om veilig langs het werk te fietsen.' }
      ],
      spell: [
        { id: '5-spell-voetbal', clue: 'Bij deze sport probeer je de bal met je voet in het doel te schieten.', word: 'voetbal' },
        { id: '5-spell-regenjas', clue: 'Deze jas houdt je droog als het buiten regent.', word: 'regenjas' },
        { id: '5-spell-boomhut', clue: 'Een klein huisje dat je hoog tussen de takken bouwt.', word: 'boomhut' },
        { id: '5-spell-appel', clue: 'Deze ronde vrucht heeft een klokhuis. Je kunt er moes van maken.', word: 'appel' },
        { id: '5-spell-bomen', clue: 'Het meervoud van boom.', word: 'bomen' },
        { id: '5-spell-ramen', clue: 'Het meervoud van raam.', word: 'ramen' },
        { id: '5-spell-boten', clue: 'Het meervoud van boot.', word: 'boten' },
        { id: '5-spell-bakker', clue: 'Deze persoon bakt brood om in de winkel te verkopen.', word: 'bakker' }
      ]
    }
  };

  function random(rng) {
    var value;
    try { value = rng(); } catch (error) { return 0; }
    return typeof value === 'number' && isFinite(value) && value >= 0 && value < 1 ? value : 0;
  }

  function shuffle(list, rng) {
    var copy = list.slice();
    var i;
    var j;
    var item;
    for (i = copy.length - 1; i > 0; i -= 1) {
      j = Math.floor(random(rng) * (i + 1));
      item = copy[i];
      copy[i] = copy[j];
      copy[j] = item;
    }
    return copy;
  }

  function createRound(group, activity, rng) {
    var selectedGroup = group === '4' || group === '5' ? group : '3';
    var selectedActivity = activity === 'spell' ? 'spell' : 'read';
    var source;
    var items;
    var questions = [];
    var i;
    var item;
    rng = typeof rng === 'function' ? rng : Math.random;
    source = banks[selectedGroup][selectedActivity];
    items = shuffle(source, rng).slice(0, 5);
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (selectedActivity === 'read') {
        questions.push({ id: item.id, title: item.title, story: item.story, question: item.question, choices: shuffle(item.choices, rng), answer: item.answer });
      } else {
        questions.push({ id: item.id, clue: item.clue, word: item.word, letters: shuffle(item.word.split(''), rng) });
      }
    }
    return { group: selectedGroup, activity: selectedActivity, index: 0, total: 5, questions: questions, complete: false };
  }

  function question(state) {
    if (!state || state.complete || !state.questions || typeof state.index !== 'number' || state.index % 1 !== 0 || state.index < 0 || state.index >= state.questions.length) { return null; }
    return state.questions[state.index];
  }

  function answer(state, value) {
    var current = question(state);
    var normalized;
    var correct;
    if (!current || typeof value !== 'string') {
      return { accepted: false, correct: false, complete: Boolean(state && state.complete) };
    }
    if (state.activity === 'spell') {
      normalized = value.replace(/^\s+|\s+$/g, '').toLowerCase();
      if (!normalized) { return { accepted: false, correct: false, complete: false }; }
      correct = normalized === current.word;
    } else {
      if (current.choices.indexOf(value) === -1) { return { accepted: false, correct: false, complete: false }; }
      correct = value === current.answer;
    }
    if (correct) {
      state.index += 1;
      state.complete = state.index >= state.total;
    }
    return { accepted: true, correct: correct, complete: state.complete };
  }

  return { createRound: createRound, question: question, answer: answer };
}));
