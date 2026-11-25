(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.KindleWordsContent = factory(); }
}(this, function () {
  'use strict';

  function read(title, story, question, answer, other, third) {
    return { title:title, story:story, question:question, choices:[answer, other, third], answer:answer };
  }

  function spell(word, clue, picture) {
    // Authored Hindi tiles keep vowel signs and conjuncts with their letters.
    var tiles = Array.isArray(word) ? word : word.split('');
    return { word:tiles.join(''), tiles:tiles, clue:clue, picture:picture };
  }

  var banks = {
    en: {
      '3': {
        read: [
          read('The cat', 'The cat sits on the mat.', 'Where is the cat?', 'On the mat', 'On the bus', 'In the woods'),
          read('A pen', 'Pim picks up a pen. The pen is thick.', 'What does Pim pick up?', 'A pen', 'A pan', 'A ball'),
          read('The hen', 'The hen sits in the coop.', 'Where is the hen?', 'In the coop', 'On the mat', 'On the bus'),
          read('The fish', 'Sam eats a fish.', 'What does Sam eat?', 'A fish', 'A berry', 'A pear'),
          read('The woods', 'Kim runs in the woods.', 'Where is Kim?', 'In the woods', 'On the bus', 'On the mat'),
          read('The bird', 'A fox sees a bird. The bird sits on a branch.', 'What is on the branch?', 'A bird', 'A fox', 'A cat'),
          read('The jar', 'Ben puts the jar on a shelf.', 'What does Ben put on the shelf?', 'The jar', 'The pan', 'The pen'),
          read('The bus', 'The bus is full. Tom is on the bus.', 'What is full?', 'The bus', 'The jar', 'The coop')
        ],
        spell: [
          spell('cat', 'This pet says meow.', 'kat'),
          spell('fish', 'This animal swims and has fins.', 'vis'),
          spell('pen', 'Use this to write on paper with ink.', 'pen'),
          spell('bus', 'This vehicle has room for many passengers.', 'bus'),
          spell('hen', 'This bird clucks and lays eggs.', 'kip'),
          spell('pan', 'You can fry an egg in this.', 'pan'),
          spell('jar', 'This has a lid and often holds jam.', 'pot'),
          spell('sun', 'This shines in the sky and gives us daylight.', 'zon')
        ]
      },
      '4': {
        read: [
          read('Going outside', 'Mila puts on her coat. Then she goes outside. She picks up her bike by the door.', 'What does Mila do first?', 'She puts on her coat.', 'She gets her bike.', 'She goes outside.'),
          read('The seed', 'Noor puts a seed in a pot. She gives it water. A week later, she sees a green leaf.', 'What does Noor do after planting the seed?', 'She gives it water.', 'She picks the leaf.', 'She puts the pot away.'),
          read('The school bell', 'The bell rings. Finn puts away his notebook. Then he goes to the playground.', 'Where does Finn go after putting away his notebook?', 'To the playground', 'To the shop', 'To the kitchen'),
          read('Bread and cheese', 'Sam puts bread on a plate. He adds cheese. Then he puts the plate on the table.', 'What does Sam do after adding the cheese?', 'He puts the plate on the table.', 'He unwraps the cheese.', 'He puts bread on the plate.'),
          read('The red ball', 'Lina finds a red ball in the park. She sees a child looking for it. Lina gives the ball to the child.', 'Who gets the ball?', 'The child looking for it', 'A man on a bench', 'Lina’s teacher'),
          read('A tall tower', 'Amir builds a tower from blocks. His sister puts a flag on top. They clap when it is finished.', 'Who puts the flag on the tower?', 'Amir’s sister', 'Amir', 'Amir’s father'),
          read('A train trip', 'The train stops at the station. Eva gets on and looks for a seat. Then the train leaves.', 'What does Eva do after getting on?', 'She looks for a seat.', 'She drives the train.', 'She buys a ticket.'),
          read('Sharing an apple', 'Bo washes an apple. He cuts it into pieces. Then he shares the pieces with his brother.', 'What does Bo do before cutting the apple?', 'He washes it.', 'He shares the pieces.', 'He eats it.')
        ],
        spell: [
          spell('bench', 'Several people can sit on this seat in a park.'),
          spell('ring', 'This round piece of jewellery goes on a finger.'),
          spell('chair', 'This seat has a back and usually fits one person.'),
          spell('train', 'This vehicle runs on tracks and can pull carriages.'),
          spell('bread', 'The baker makes this. You can cut it into slices.'),
          spell('flower', 'A rose or a tulip is one of these.'),
          spell('clock', 'Look at this to see what time it is. It might hang on a wall.'),
          spell('snail', 'This slow animal carries a shell and leaves a shiny trail.')
        ]
      },
      '5': {
        read: [
          read('After the rain', 'It rained at night. The playground is full of puddles. Noor puts on her boots. That way, her socks stay dry.', 'Why does Noor put on her boots?', 'To keep her socks dry', 'To run faster', 'Because her coat is wet'),
          read('A feeder for the birds', 'The class makes a bird feeder. The children poke holes in the bottom. Then they add the birdseed. Rainwater can drain through the holes.', 'Why are there holes in the bottom?', 'To let rainwater out', 'To hold more birdseed', 'To help the feeder fly'),
          read('Mint in the garden', 'Mint grows in the school garden. Rub a leaf and you can smell it. You can use mint to make tea. Pick a few clean leaves first.', 'What can you make with the mint?', 'Tea', 'Folded paper', 'Window cleaner'),
          read('Two ice cubes', 'One ice cube sits on a plate in the sun. Another sits inside in the shade. The one in the sun melts first. It gets more warmth there.', 'Why does the ice in the sun melt first?', 'It gets more warmth.', 'It is on a bigger plate.', 'A tree grows beside it.'),
          read('Finding a book', 'Jesse wants to borrow a book. A card shows its title and number. He sees the same number on a shelf. Now he knows where to look.', 'What helps Jesse find the right shelf?', 'The number on the card', 'The colour of his bag', 'The name of his school'),
          read('A plan for the treehouse', 'The team wants to build a treehouse. They draw a plan and measure the boards. Then they cut the boards to size. The pieces fit together.', 'Why do they measure the boards before cutting?', 'So the pieces will fit together', 'So the boards will get heavier', 'So they can skip drawing a plan'),
          read('Waiting for the dough', 'Nina and her dad are baking biscuits. The recipe says the dough needs to rest for half an hour. They set a timer. They can carry on when it rings.', 'Why do Nina and her dad set a timer?', 'To know when the dough has rested long enough', 'To count their biscuits', 'To warm up the oven'),
          read('The yellow arrows', 'A sign by the bike path warns about roadworks. A pile of sand blocks the path. The cyclists follow yellow arrows. The arrows show a safe way around the work.', 'Why do the cyclists follow the arrows?', 'To get past the work safely', 'To play in the sand', 'To leave their bikes there')
        ],
        spell: [
          spell('football', 'In this sport, players mostly use their feet to get a ball into a goal.'),
          spell('raincoat', 'Wear this kind of coat to stay dry in a shower.'),
          spell('treehouse', 'A little house built high in the branches.'),
          spell('apple', 'This fruit has a core and can be cooked into a sauce.'),
          spell('leaves', 'The plural of leaf.'),
          spell('windows', 'The plural of window.'),
          spell('children', 'The plural of child.'),
          spell('baker', 'This person makes bread and cakes to sell.')
        ]
      }
    },
    de: {
      '3': {
        read: [
          read('Die Katze', 'Die Katze sitzt auf der Matte.', 'Wo sitzt die Katze?', 'Auf der Matte', 'Im Bus', 'Im Wald'),
          read('Ein Stift', 'Pim nimmt einen Stift. Der Stift ist dick.', 'Was nimmt Pim?', 'Einen Stift', 'Einen Ball', 'Eine Mütze'),
          read('Das Huhn', 'Das Huhn sitzt im Stall.', 'Wo sitzt das Huhn?', 'Im Stall', 'Auf der Matte', 'Im Bus'),
          read('Der Fisch', 'Sam isst einen Fisch.', 'Was isst Sam?', 'Einen Fisch', 'Eine Beere', 'Eine Birne'),
          read('Der Wald', 'Kim läuft durch den Wald.', 'Wo ist Kim?', 'Im Wald', 'Im Bus', 'Auf der Matte'),
          read('Der Vogel', 'Der Fuchs sieht einen Vogel. Der Vogel sitzt auf einem Ast.', 'Wer sitzt auf dem Ast?', 'Der Vogel', 'Der Fuchs', 'Die Katze'),
          read('Das Glas', 'Ben stellt das Glas ins Regal.', 'Was stellt Ben ins Regal?', 'Das Glas', 'Die Pfanne', 'Den Stift'),
          read('Der Bus', 'Der Bus ist voll. Tom sitzt im Bus.', 'Was ist voll?', 'Der Bus', 'Das Glas', 'Der Stall')
        ],
        spell: [
          spell('Katze', 'Dieses Haustier miaut.', 'kat'),
          spell('Fisch', 'Dieses Tier schwimmt und hat Flossen.', 'vis'),
          spell('Stift', 'Damit schreibst du auf Papier.', 'pen'),
          spell('Bus', 'In diesem Fahrzeug fahren viele Menschen mit.', 'bus'),
          spell('Huhn', 'Dieser Vogel gackert und legt Eier.', 'kip'),
          spell('Pfanne', 'Darin brätst du ein Ei.', 'pan'),
          spell('Glas', 'Darin ist oft Marmelade. Es hat einen Deckel.', 'pot'),
          spell('Sonne', 'Sie scheint am Himmel und macht es hell.', 'zon')
        ]
      },
      '4': {
        read: [
          read('Nach draußen', 'Mila zieht ihre Jacke an. Danach geht sie nach draußen. An der Tür holt sie ihr Fahrrad.', 'Was macht Mila zuerst?', 'Sie zieht ihre Jacke an.', 'Sie holt ihr Fahrrad.', 'Sie geht nach draußen.'),
          read('Ein Samenkorn', 'Noor legt ein Samenkorn in einen Topf. Sie gießt es. Nach einer Woche sieht sie ein grünes Blatt.', 'Was macht Noor nach dem Säen?', 'Sie gießt das Samenkorn.', 'Sie pflückt das Blatt.', 'Sie räumt den Topf weg.'),
          read('Die Schulglocke', 'Die Glocke läutet. Finn räumt sein Heft weg. Dann geht er auf den Schulhof.', 'Wohin geht Finn, nachdem er sein Heft weggeräumt hat?', 'Auf den Schulhof', 'In den Laden', 'In die Küche'),
          read('Brot mit Käse', 'Sam legt Brot auf einen Teller. Er legt Käse darauf. Dann stellt er den Teller auf den Tisch.', 'Was macht Sam, nachdem er den Käse aufs Brot gelegt hat?', 'Er stellt den Teller auf den Tisch.', 'Er packt den Käse aus.', 'Er legt Brot auf den Teller.'),
          read('Der rote Ball', 'Lina findet im Park einen roten Ball. Ein Kind sucht danach. Lina gibt dem Kind den Ball.', 'Wer bekommt den Ball?', 'Das Kind, das den Ball sucht', 'Ein Mann auf der Bank', 'Linas Lehrerin'),
          read('Ein hoher Turm', 'Amir baut einen Turm aus Klötzen. Seine Schwester steckt eine Fahne darauf. Als der Turm fertig ist, klatschen beide.', 'Wer steckt die Fahne auf den Turm?', 'Amirs Schwester', 'Amir', 'Amirs Vater'),
          read('Eine Zugfahrt', 'Der Zug hält am Bahnhof. Eva steigt ein und sucht einen Sitzplatz. Dann fährt der Zug los.', 'Was macht Eva nach dem Einsteigen?', 'Sie sucht einen Sitzplatz.', 'Sie fährt den Zug.', 'Sie kauft eine Fahrkarte.'),
          read('Einen Apfel teilen', 'Bo wäscht einen Apfel. Er schneidet ihn in Stücke. Dann teilt er die Stücke mit seinem Bruder.', 'Was macht Bo vor dem Schneiden?', 'Er wäscht den Apfel.', 'Er teilt die Stücke.', 'Er isst den Apfel.')
        ],
        spell: [
          spell('Bank', 'Auf diesem langen Sitz im Park haben mehrere Menschen Platz.'),
          spell('Ring', 'Dieses runde Schmuckstück trägt man am Finger.'),
          spell('Stuhl', 'Darauf sitzt eine Person. Er hat eine Rückenlehne.'),
          spell('Zug', 'Dieses Fahrzeug fährt auf Schienen und kann Wagen ziehen.'),
          spell('Brot', 'Der Bäcker backt es. Man kann es in Scheiben schneiden.'),
          spell('Blume', 'Eine Rose oder Tulpe ist ein Beispiel dafür.'),
          spell('Uhr', 'Darauf liest du ab, wie spät es ist. Sie kann an der Wand hängen.'),
          spell('Schnecke', 'Dieses langsame Tier trägt ein Haus und hinterlässt eine Spur.')
        ]
      },
      '5': {
        read: [
          read('Nach dem Regen', 'Nachts hat es geregnet. Auf dem Schulhof sind Pfützen. Deshalb zieht Noor Gummistiefel an. So bleiben ihre Socken trocken.', 'Warum zieht Noor Gummistiefel an?', 'Damit ihre Socken trocken bleiben', 'Damit sie schneller laufen kann', 'Weil ihre Jacke nass ist'),
          read('Ein Futterhaus für Vögel', 'Die Klasse baut ein Futterhaus. Die Kinder machen Löcher in den Boden. Dann füllen sie Futter hinein. Regenwasser kann durch die Löcher ablaufen.', 'Warum sind Löcher im Boden?', 'Damit Regenwasser ablaufen kann', 'Damit mehr Futter hineinpasst', 'Damit das Haus fliegen kann'),
          read('Minze im Garten', 'Im Schulgarten wächst Minze. Wenn du über ein Blatt reibst, riecht es stark. Aus der Minze kannst du Tee machen. Pflücke dazu ein paar saubere Blätter.', 'Was kannst du mit der Minze machen?', 'Tee kochen', 'Papier falten', 'Fenster putzen'),
          read('Zwei Eiswürfel', 'Ein Eiswürfel liegt auf einem Teller in der Sonne. Der andere liegt drinnen im Schatten. Der Würfel in der Sonne schmilzt zuerst. Dort bekommt er mehr Wärme.', 'Warum schmilzt der Eiswürfel in der Sonne zuerst?', 'Er bekommt mehr Wärme.', 'Der Teller ist größer.', 'Ein Baum steht daneben.'),
          read('Ein Buch finden', 'Jesse möchte ein Buch ausleihen. Auf einer Karte stehen der Titel und eine Nummer. Dieselbe Nummer findet er auf einem Regal. Jetzt weiß er, wo er suchen muss.', 'Was hilft Jesse, das richtige Regal zu finden?', 'Die Nummer auf der Karte', 'Die Farbe seiner Tasche', 'Der Name seiner Schule'),
          read('Ein Plan für das Baumhaus', 'Die Gruppe möchte ein Baumhaus bauen. Zuerst zeichnet sie einen Plan und misst die Bretter. Dann sägt sie die Bretter zurecht. Jetzt passen die Teile gut zusammen.', 'Warum misst die Gruppe die Bretter vor dem Sägen?', 'Damit die Teile gut zusammenpassen', 'Damit die Bretter schwerer werden', 'Damit kein Plan nötig ist'),
          read('Warten auf den Teig', 'Nina und ihr Vater backen Kekse. Laut Rezept muss der Teig eine halbe Stunde ruhen. Also stellen sie einen Wecker. Wenn er klingelt, können sie weitermachen.', 'Warum stellen Nina und ihr Vater einen Wecker?', 'Damit sie wissen, wann der Teig genug geruht hat', 'Damit sie die Kekse zählen können', 'Damit der Ofen wärmer wird'),
          read('Die gelben Pfeile', 'Ein Schild am Radweg warnt vor einer Baustelle. Ein Sandhaufen liegt auf dem Weg. Die Radfahrer folgen gelben Pfeilen. Diese zeigen ihnen einen sicheren Weg um die Baustelle herum.', 'Warum folgen die Radfahrer den Pfeilen?', 'Um sicher an der Baustelle vorbeizufahren', 'Um im Sand zu spielen', 'Um ihre Räder dort stehen zu lassen')
        ],
        spell: [
          spell('Fußball', 'Bei diesem Sport schießt du den Ball mit dem Fuß ins Tor.'),
          spell('Regenjacke', 'Diese Jacke hält dich bei Regen trocken.'),
          spell('Baumhaus', 'Ein kleines Haus, das in den Ästen eines Baumes gebaut ist.'),
          spell('Apfel', 'Diese Frucht hat ein Kerngehäuse. Man kann Mus daraus kochen.'),
          spell('Bäume', 'Die Mehrzahl von Baum.'),
          spell('Fenster', 'Durch diese Öffnung mit einer Scheibe kommt Licht ins Zimmer.'),
          spell('Boote', 'Die Mehrzahl von Boot.'),
          spell('Bäcker', 'Dieser Mann backt Brot, um es im Laden zu verkaufen.')
        ]
      }
    },
    hi: {
      '3': {
        read: [
          read('बिल्ली', 'बिल्ली चटाई पर बैठी है।', 'बिल्ली कहाँ बैठी है?', 'चटाई पर', 'बस में', 'जंगल में'),
          read('एक कलम', 'पिया एक कलम उठाती है। कलम मोटी है।', 'पिया क्या उठाती है?', 'एक कलम', 'एक गेंद', 'एक किताब'),
          read('मुर्गी', 'मुर्गी अपने दड़बे में बैठी है।', 'मुर्गी कहाँ बैठी है?', 'दड़बे में', 'चटाई पर', 'बस में'),
          read('मछली', 'समीर मछली खाता है।', 'समीर क्या खाता है?', 'मछली', 'केला', 'नाशपाती'),
          read('जंगल', 'किरण जंगल में दौड़ती है।', 'किरण कहाँ है?', 'जंगल में', 'बस में', 'चटाई पर'),
          read('चिड़िया', 'लोमड़ी एक चिड़िया को देखती है। चिड़िया डाल पर बैठी है।', 'डाल पर कौन बैठी है?', 'चिड़िया', 'लोमड़ी', 'बिल्ली'),
          read('डिब्बा', 'बबलू डिब्बा ताक पर रखता है।', 'बबलू ताक पर क्या रखता है?', 'डिब्बा', 'तवा', 'कलम'),
          read('बस', 'बस भरी हुई है। तनु बस में बैठी है।', 'क्या भरा हुआ है?', 'बस', 'डिब्बा', 'दड़बा')
        ],
        spell: [
          spell(['बि','ल्ली'], 'यह पालतू जानवर म्याऊँ करता है।', 'kat'),
          spell(['म','छ','ली'], 'यह पानी में तैरती है और गलफड़ों से साँस लेती है।', 'vis'),
          spell(['क','ल','म'], 'इससे काग़ज़ पर स्याही से लिखते हैं।', 'pen'),
          spell(['ब','स'], 'इस गाड़ी में बहुत से यात्री बैठते हैं।', 'bus'),
          spell(['मु','र्गी'], 'यह चिड़िया अंडे देती है और कुड़कुड़ाती है।', 'kip'),
          spell(['त','वा'], 'इस पर रोटी सेंक सकते हैं।', 'pan'),
          spell(['डि','ब्बा'], 'इसमें चीज़ें रखते हैं। इसका ढक्कन होता है।', 'pot'),
          spell(['सू','र','ज'], 'यह आसमान में चमकता है और दिन में उजाला देता है।', 'zon')
        ]
      },
      '4': {
        read: [
          read('बाहर जाना', 'मीरा जैकेट पहनती है। फिर वह बाहर जाती है। दरवाज़े के पास वह अपनी साइकिल लेती है।', 'मीरा सबसे पहले क्या करती है?', 'जैकेट पहनती है', 'साइकिल लेती है', 'बाहर जाती है'),
          read('एक बीज', 'नूर गमले में एक बीज डालती है। वह उसे पानी देती है। एक हफ़्ते बाद उसे हरा पत्ता दिखता है।', 'बीज बोने के बाद नूर क्या करती है?', 'उसे पानी देती है', 'पत्ता तोड़ती है', 'गमला हटा देती है'),
          read('स्कूल की घंटी', 'घंटी बजती है। फ़ैज़ अपनी कॉपी रख देता है। फिर वह मैदान में जाता है।', 'कॉपी रखने के बाद फ़ैज़ कहाँ जाता है?', 'मैदान में', 'दुकान में', 'रसोई में'),
          read('ब्रेड और चीज़', 'समीर प्लेट में ब्रेड रखता है। वह ब्रेड पर चीज़ रखता है। फिर वह प्लेट मेज़ पर रखता है।', 'चीज़ रखने के बाद समीर क्या करता है?', 'प्लेट मेज़ पर रखता है', 'चीज़ का पैकेट खोलता है', 'प्लेट में ब्रेड रखता है'),
          read('लाल गेंद', 'लीना को बगीचे में एक लाल गेंद मिलती है। एक बच्चा गेंद ढूँढ़ रहा है। लीना उसे गेंद दे देती है।', 'गेंद किसे मिलती है?', 'गेंद ढूँढ़ रहे बच्चे को', 'बेंच पर बैठे आदमी को', 'लीना की अध्यापिका को'),
          read('ऊँची मीनार', 'अमीर खिलौने के टुकड़ों से मीनार बनाता है। उसकी बहन ऊपर झंडा लगाती है। मीनार बन जाती है तो दोनों ताली बजाते हैं।', 'मीनार पर झंडा कौन लगाता है?', 'अमीर की बहन', 'अमीर', 'अमीर के पिता'),
          read('रेल का सफ़र', 'रेलगाड़ी स्टेशन पर रुकती है। ईवा उसमें चढ़ती है और सीट ढूँढ़ती है। फिर गाड़ी चल पड़ती है।', 'गाड़ी में चढ़ने के बाद ईवा क्या करती है?', 'सीट ढूँढ़ती है', 'गाड़ी चलाती है', 'टिकट खरीदती है'),
          read('सेब बाँटना', 'बबलू एक सेब धोता है। वह उसके टुकड़े करता है। फिर वह अपने भाई के साथ टुकड़े बाँटता है।', 'सेब काटने से पहले बबलू क्या करता है?', 'सेब धोता है', 'टुकड़े बाँटता है', 'सेब खाता है')
        ],
        spell: [
          spell(['बें','च'], 'बगीचे में इस लंबी सीट पर कई लोग बैठ सकते हैं।'),
          spell(['अं','गू','ठी'], 'यह गोल गहना उँगली में पहनते हैं।'),
          spell(['कु','र्सी'], 'इस पर एक व्यक्ति बैठता है। इसमें पीठ टिकाने की जगह होती है।'),
          spell(['रे','ल','गा','ड़ी'], 'यह पटरी पर चलती है और इसके कई डिब्बे होते हैं।'),
          spell(['ब्रे','ड'], 'सैंडविच बनाने के लिए इसके स्लाइस लेते हैं।'),
          spell(['फू','ल'], 'गुलाब और कमल इसी के उदाहरण हैं।'),
          spell(['घ','ड़ी'], 'समय देखने के लिए इसे देखते हैं। यह दीवार पर भी टँगी हो सकती है।'),
          spell(['घों','घा'], 'यह जीव धीरे चलता है और पीठ पर खोल लिए रहता है।')
        ]
      },
      '5': {
        read: [
          read('बारिश के बाद', 'रात में बारिश हुई। स्कूल के मैदान में पानी भर गया। नूर अपने रबर के जूते पहनती है। इससे उसके मोज़े सूखे रहते हैं।', 'नूर रबर के जूते क्यों पहनती है?', 'मोज़े सूखे रखने के लिए', 'तेज़ दौड़ने के लिए', 'क्योंकि उसकी जैकेट गीली है'),
          read('पक्षियों के लिए दाना', 'बच्चे पक्षियों के लिए दाने का डिब्बा बनाते हैं। वे उसके तल में छोटे छेद करते हैं। फिर वे उसमें दाना डालते हैं। बारिश का पानी छेदों से निकल सकता है।', 'डिब्बे के तल में छेद क्यों हैं?', 'बारिश का पानी निकालने के लिए', 'ज़्यादा दाना रखने के लिए', 'डिब्बे को उड़ाने के लिए'),
          read('बगीचे में पुदीना', 'स्कूल के बगीचे में पुदीना उगता है। पत्ता रगड़ने पर खुशबू आती है। पुदीने से चाय बना सकते हैं। इसके लिए कुछ साफ़ पत्ते तोड़ लो।', 'पुदीने से क्या बना सकते हैं?', 'चाय', 'काग़ज़ की नाव', 'काँच साफ़ करने का कपड़ा'),
          read('बर्फ़ के दो टुकड़े', 'एक बर्फ़ का टुकड़ा धूप में प्लेट पर है। दूसरा घर के अंदर छाँव में है। धूप वाला टुकड़ा पहले पिघलता है। उसे ज़्यादा गर्मी मिलती है।', 'धूप वाला टुकड़ा पहले क्यों पिघलता है?', 'उसे ज़्यादा गर्मी मिलती है।', 'उसकी प्लेट बड़ी है।', 'उसके पास एक पेड़ है।'),
          read('किताब की तलाश', 'जय एक किताब उधार लेना चाहता है। एक कार्ड पर किताब का नाम और नंबर है। उसे वही नंबर एक अलमारी पर दिखता है। अब उसे पता है कि कहाँ ढूँढ़ना है।', 'जय को सही अलमारी ढूँढ़ने में क्या मदद करता है?', 'कार्ड पर लिखा नंबर', 'उसके बस्ते का रंग', 'उसके स्कूल का नाम'),
          read('पेड़ पर छोटा घर', 'बच्चे पेड़ पर एक छोटा घर बनाना चाहते हैं। वे पहले नक्शा बनाते हैं और तख़्ते नापते हैं। फिर वे तख़्ते काटते हैं। सारे टुकड़े एक साथ ठीक से जुड़ जाते हैं।', 'बच्चे काटने से पहले तख़्ते क्यों नापते हैं?', 'ताकि टुकड़े ठीक से जुड़ जाएँ', 'ताकि तख़्ते भारी हो जाएँ', 'ताकि नक्शा न बनाना पड़े'),
          read('आधे घंटे का इंतज़ार', 'नीना और उसके पापा बिस्कुट बना रहे हैं। विधि में लिखा है कि गुँथे आटे को आधे घंटे के लिए रखना है। वे टाइमर लगाते हैं। उसके बजने पर वे अगला काम शुरू कर सकते हैं।', 'नीना और उसके पापा टाइमर क्यों लगाते हैं?', 'यह जानने के लिए कि आधा घंटा हो गया है', 'बिस्कुट गिनने के लिए', 'ओवन गरम करने के लिए'),
          read('पीले तीर', 'साइकिल के रास्ते पर मरम्मत का बोर्ड लगा है। आगे रेत का ढेर है। साइकिल सवार पीले तीरों के निशान देखते हैं। तीर उन्हें सुरक्षित रास्ता दिखाते हैं।', 'साइकिल सवार तीरों का पीछा क्यों करते हैं?', 'मरम्मत वाली जगह से सुरक्षित निकलने के लिए', 'रेत में खेलने के लिए', 'साइकिलें वहीं छोड़ने के लिए')
        ],
        spell: [
          spell(['फु','ट','बॉ','ल'], 'इस खेल में खिलाड़ी पैर से गेंद को गोल में भेजते हैं।'),
          spell(['ब','र','सा','ती'], 'बारिश में सूखे रहने के लिए पहना जाने वाला कोट।'),
          spell(['पु','स्त','का','ल','य'], 'वह जगह जहाँ से पढ़ने के लिए किताबें उधार ले सकते हैं।'),
          spell(['अ','ना','ना','स'], 'इस फल के ऊपर पत्तों का मुकुट होता है और इसका गूदा पीला होता है।'),
          spell(['अ','ध्या','प','क'], 'पुरुष शिक्षक के लिए एक और शब्द।'),
          spell(['खि','ड़','कि','याँ'], 'एक खिड़की, कई क्या?'),
          spell(['ना','वें'], 'एक नाव, कई क्या?'),
          spell(['ह','ल','वा','ई'], 'यह व्यक्ति लड्डू और दूसरी मिठाइयाँ बनाता है।')
        ]
      }
    },
    'zh-Hans': {
      '3': {
        read: [
          read('小猫', '小猫坐在地垫上。', '小猫坐在哪里？', '在地垫上', '在公交车上', '在树林里'),
          read('一支笔', '小平拿起一支笔。那支笔很粗。', '小平拿起了什么？', '一支笔', '一个球', '一本书'),
          read('母鸡', '母鸡蹲在鸡窝里。', '母鸡在哪里？', '在鸡窝里', '在地垫上', '在公交车上'),
          read('吃鱼', '小安在吃鱼。', '小安在吃什么？', '鱼', '草莓', '梨'),
          read('树林', '小林在树林里跑。', '小林在哪里？', '在树林里', '在公交车上', '在地垫上'),
          read('树上的小鸟', '狐狸看到一只小鸟。小鸟停在树枝上。', '谁在树枝上？', '小鸟', '狐狸', '小猫'),
          read('玻璃罐', '小乐把玻璃罐放到架子上。', '小乐把什么放到架子上？', '玻璃罐', '平底锅', '一支笔'),
          read('公交车', '公交车上挤满了人。小东也在车上。', '哪里挤满了人？', '公交车上', '玻璃罐里', '鸡窝里')
        ],
        spell: [
          spell('小猫', '这只小动物会喵喵叫。', 'kat'),
          spell('小鱼', '它在水里游，有鱼鳍。', 'vis'),
          spell('铅笔', '用它写字，写错了可以用橡皮擦掉。', 'pen'),
          spell('公交车', '很多人坐它出门，它会在站点停靠。', 'bus'),
          spell('母鸡', '这种鸡会下蛋。', 'kip'),
          spell('平底锅', '这种锅的底是平的，可以用来煎鸡蛋。', 'pan'),
          spell('玻璃罐', '它是透明的，有盖子，常常用来装果酱。', 'pot'),
          spell('太阳', '它在天空发光，有了它白天才明亮。', 'zon')
        ]
      },
      '4': {
        read: [
          read('出门', '小美穿上外套。然后她走出门。她在门口取了自行车。', '小美先做了什么？', '穿上外套', '取自行车', '走出门'),
          read('种子', '小宁把种子种进花盆。她给种子浇水。过了一周，她看见一片绿叶。', '种下种子后，小宁做了什么？', '给种子浇水', '摘下绿叶', '收起花盆'),
          read('铃声响了', '铃声响了。小方把本子收起来。然后他去了操场。', '收好本子后，小方去了哪里？', '操场', '商店', '厨房'),
          read('芝士面包', '小山把面包放在盘子上。他在面包上放了芝士。然后他把盘子放到桌上。', '放好芝士后，小山做了什么？', '把盘子放到桌上', '拆开芝士包装', '把面包放在盘子上'),
          read('红色的球', '小丽在公园捡到一个红色的球。她看见一个孩子在找球。小丽就把球交给了这个孩子。', '谁拿到了球？', '找球的孩子', '坐在长椅上的叔叔', '小丽的老师'),
          read('高高的塔', '小明用积木搭了一座塔。姐姐在塔顶插上一面小旗。塔搭好后，两人一起拍手。', '谁在塔顶插了小旗？', '小明的姐姐', '小明', '小明的爸爸'),
          read('坐火车', '火车停在车站。小雨上车找座位。然后火车开走了。', '小雨上车后做了什么？', '找座位', '开火车', '买车票'),
          read('分苹果', '小宝洗了一个苹果。他把苹果切成小块。然后他和哥哥一起吃。', '切苹果之前，小宝做了什么？', '洗苹果', '分苹果', '吃苹果')
        ],
        spell: [
          spell('长椅', '公园里常见的一种座位，好几个人可以一起坐。'),
          spell('戒指', '戴在手指上的环形饰品。'),
          spell('椅子', '它有靠背，通常只坐一个人。'),
          spell('火车', '它在铁轨上行驶，能带着许多节车厢。'),
          spell('面包', '这种食物用面团烤成，切片后可以做三明治。'),
          spell('花朵', '玫瑰和郁金香开出的这一部分很好看。'),
          spell('挂钟', '它挂在墙上，可以用来看时间。'),
          spell('蜗牛', '这种动物爬得很慢，背上有壳。')
        ]
      },
      '5': {
        read: [
          read('雨后', '夜里下了雨。操场上有不少水坑。小宁于是穿上雨靴。这样她的袜子就不会湿了。', '小宁为什么穿雨靴？', '为了让袜子保持干燥', '为了跑得更快', '因为外套湿了'),
          read('给小鸟的食盒', '同学们做了一个给小鸟喂食的盒子。他们先在盒底打了几个小孔。然后他们倒入鸟食。雨水可以从小孔流走。', '盒底为什么有小孔？', '为了让雨水流出去', '为了多装一些鸟食', '为了让盒子飞起来'),
          read('花园里的薄荷', '学校的花园里种着薄荷。揉一揉叶子，就能闻到香味。薄荷可以用来泡茶。泡茶前先摘几片干净的叶子。', '薄荷能用来做什么？', '泡茶', '折纸', '擦窗户'),
          read('两块冰', '一块冰放在阳光下的盘子里。另一块冰放在室内阴凉处。阳光下的冰先化了。那里比较暖和。', '阳光下的冰为什么先化？', '那里比较暖和。', '盘子比较大。', '旁边有一棵树。'),
          read('找一本书', '小杰想借一本书。他在一张卡片上找到了书名和编号。接着他在书架上看到了相同的编号。这样他就知道去哪里找了。', '什么帮小杰找到了正确的书架？', '卡片上的编号', '书包的颜色', '学校的名字'),
          read('盖一座树屋', '几个孩子想盖一座树屋。他们先画图，再量木板的长度。之后他们按尺寸锯木板。木板就能拼得很合适。', '他们为什么先量木板，再锯木板？', '为了让木板能拼合', '为了让木板变重', '为了不用画图'),
          read('等面团', '小妮和爸爸一起烤饼干。食谱上说面团要静置半小时。他们定了时间。铃声响起就可以继续做。', '他们为什么定时间？', '为了知道面团什么时候静置够了', '为了数饼干', '为了让烤箱变热'),
          read('黄色箭头', '自行车道旁的牌子提醒人们前面在修路。路上有一堆沙子。骑车的人沿着黄色箭头走。箭头指向一条绕开工地的安全路线。', '骑车的人为什么沿着箭头走？', '为了安全绕开工地', '为了在沙堆里玩', '为了把车留在那里')
        ],
        spell: [
          spell('足球', '这项运动主要用脚把球踢进球门。'),
          spell('雨衣', '下雨时穿上它，衣服就不容易淋湿。'),
          spell('树屋', '搭在树枝之间的小房子。'),
          spell('图书馆', '人们可以在这里读书，也可以借书。'),
          spell('红苹果', '一种常见的水果，切开能看见果核。这里问的是红色的那种。'),
          spell('玻璃窗', '它让光照进屋里，中间装着透明的玻璃。'),
          spell('划船', '坐在船里用桨使船前进，这个动作叫什么？'),
          spell('面包师', '这个人会把发好的面团放进烤箱，也会做法棍。')
        ]
      }
    }
  };

  var copy = {
    nl: {
      reading:'Lezen', spelling:'Spellen', clue:'Welk woord zoeken we?', order:'Tik de letters in de goede volgorde.',
      undo:'Terug', check:'Controleer', reset:'Opnieuw', tiles:'Letters', empty:'leeg', word:'Jouw woord: {value}',
      tile:'Letter {value}', slot:'Letter {number}: {value}', stars:'{number} van {total} sterren',
      readProgress:'Vraag {number} van {total}', spellProgress:'Woord {number} van {total}',
      readRetry:'Nog niet. Probeer een ander antwoord.', spellRetry:'Kijk nog eens naar de letters. Je kunt terug.',
      result:'Hoera!', resultCopy:'Vijf sterren. Goed gedaan!'
    },
    en: {
      reading:'Reading', spelling:'Spelling', clue:'What’s the word?', order:'Tap the letters in the right order.',
      undo:'Undo', check:'Check', reset:'Reset', tiles:'Letters', empty:'empty', word:'Your word: {value}',
      tile:'Letter {value}', slot:'Letter {number}: {value}', stars:'{number} of {total} stars',
      readProgress:'Question {number} of {total}', spellProgress:'Word {number} of {total}',
      readRetry:'Try another answer.', spellRetry:'Check the order of the letters. You can undo a letter.',
      result:'Hooray!', resultCopy:'Five stars. Well done!'
    },
    de: {
      reading:'Lesen', spelling:'Buchstabieren', clue:'Welches Wort suchen wir?', order:'Tippe die Buchstaben in der richtigen Reihenfolge an.',
      undo:'Zurück', check:'Prüfen', reset:'Neu starten', tiles:'Buchstaben', empty:'leer', word:'Dein Wort: {value}',
      tile:'Buchstabe {value}', slot:'Buchstabe {number}: {value}', stars:'{number} von {total} Sternen',
      readProgress:'Frage {number} von {total}', spellProgress:'Wort {number} von {total}',
      readRetry:'Versuche eine andere Antwort.', spellRetry:'Schau dir die Reihenfolge an. Du kannst Buchstaben zurücknehmen.',
      result:'Hurra!', resultCopy:'Fünf Sterne. Gut gemacht!'
    },
    hi: {
      reading:'पढ़ना', spelling:'वर्तनी', clue:'शब्द पहचानो', order:'अक्षरों को सही क्रम में चुनो।',
      undo:'पीछे', check:'जाँचो', reset:'फिर शुरू करें', tiles:'अक्षर', empty:'खाली', word:'तुम्हारा शब्द: {value}',
      tile:'अक्षर {value}', slot:'अक्षर {number}: {value}', stars:'{total} में से {number} सितारे',
      readProgress:'सवाल {number} / {total}', spellProgress:'शब्द {number} / {total}',
      readRetry:'कोई दूसरा जवाब चुनो।', spellRetry:'अक्षरों का क्रम फिर से देखो। तुम पिछला अक्षर हटा सकते हो।',
      result:'वाह!', resultCopy:'पाँच सितारे। बहुत बढ़िया!'
    },
    'zh-Hans': {
      reading:'阅读', spelling:'组词', clue:'猜猜这个词', order:'按正确顺序点选汉字。',
      undo:'撤销', check:'检查', reset:'重来', tiles:'汉字', empty:'空白', word:'你的词语：{value}',
      tile:'汉字 {value}', slot:'第 {number} 个字：{value}', stars:'获得 {number} 颗星，共 {total} 颗',
      readProgress:'第 {number} 题，共 {total} 题', spellProgress:'第 {number} 个词，共 {total} 个',
      readRetry:'再选一个答案试试。', spellRetry:'再看看汉字的顺序。可以撤销重试。',
      result:'太棒了！', resultCopy:'你获得了五颗星！'
    }
  };

  return { banks:banks, copy:copy };
}));
