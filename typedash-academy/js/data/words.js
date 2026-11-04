/* TypeDash Academy — word bank: common words, everyday vocabulary and curated drill lists.
 * Every list is one space-separated string of lowercase words, most useful words first.
 * See docs/CONTENT-SPEC.md section 1. Validate with: node tools/validate-data.js --only words
 */
(function (TD) {
  'use strict';
  TD.data = TD.data || {};
  TD.data.words = {
    // ~1000 most frequent English words, roughly in frequency order.
    common:
      'the of and to a in is you that it he was for on are as with his they i at be this have from or ' +
      'one had by but not what all were we when your can said there use an each which she do how their ' +
      'if will up other about out many then them these so some her would make like him into time has ' +
      'look two more write go see number no way could people my than first water been call who its now ' +
      'find long down day did get come made may part over new sound take only little work know place ' +
      'year live me back give most very after thing our just name good man think say great where help ' +
      'through much before line right too mean old any same tell boy follow came want show also around ' +
      'form three small set put end does another well large must big even such because turn here why ' +
      'ask went men read need land different home us move try kind hand picture again change off play ' +
      'air away animal house point page letter mother answer found study still learn should world high ' +
      'every near add food between own below country plant last school father keep tree never start ' +
      'city earth eye light thought head under story saw left few while along might close something ' +
      'seem next hard open example begin life always those both paper together got group often run ' +
      'important until children side feet car mile night walk white sea began grow took river four ' +
      'carry state once book hear stop without second later miss idea enough eat face watch far really ' +
      'almost let above girl sometimes mountain cut young talk soon list song being leave family body ' +
      'music color stand sun question fish area mark dog horse birds problem complete room knew since ' +
      'ever piece told usually friends easy heard order red door sure become top ship across today ' +
      'during short better best however low hours black happened whole measure remember early reached ' +
      'listen wind rock space covered fast several hold himself toward five step morning passed true ' +
      'hundred against pattern table north slowly money map farm pulled draw voice seen cold cried plan ' +
      'notice south sing ground fall king town unit figure certain field travel wood fire upon done ' +
      'road half ten fly gave box finally wait correct oh quickly person became shown minutes strong ' +
      'stars front feel fact street decided contain course surface produce building ocean class note ' +
      'nothing rest carefully scientists inside wheels stay green known island week less machine base ' +
      'ago stood plane system behind ran round boat game force brought understand warm common bring ' +
      'explain dry though language shape deep thousands yes clear yet government filled heat full hot ' +
      'check object am rule among power cannot able six size dark ball material special heavy fine pair ' +
      'circle include built matter square perhaps bill felt suddenly test direction center farmers ' +
      'ready anything divided general energy subject moon region return believe dance members picked ' +
      'simple cells paint mind love cause rain exercise eggs train blue wish drop developed window ' +
      'difference distance heart sit sum summer wall forest probably legs sat main winter wide written ' +
      'length reason kept interest arms brother race present beautiful store job edge past sign record ' +
      'finished discovered wild happy beside gone sky glass million west lay weather root meet third ' +
      'months raised represent soft whether clothes flowers shall teacher held describe drive cross ' +
      'speak solve appear metal son either ice sleep village result jumped snow ride care floor hill ' +
      'pushed baby buy century outside everything tall already instead phrase soil bed copy free hope ' +
      'spring case laughed nation quite type themselves temperature bright lead everyone method section ' +
      'lake within hair age amount scale pounds although per broken moment tiny possible gold milk ' +
      'quiet natural lot stone act build middle speed count cat someone sail rolled bear wonder smiled ' +
      'angle bottom trip hole poor fight surprise beat exactly remain dress iron fingers row least ' +
      'catch climbed wrote shouted continued itself else gas burning design joined foot law ears grass ' +
      'grew skin valley key president brown trouble cool cloud lost sent wear bad save experiment ' +
      'engine alone drawing east pay single touch information express mouth yard equal yourself control ' +
      'practice report straight rise statement stick party seeds suppose woman coast bank period wire ' +
      'choose clean visit bit whose received garden please strange caught fell team captain direct ring ' +
      'serve child desert increase history cost maybe business separate break uncle flow lady students ' +
      'human art feeling supply corner electric insects crops tone hit sand doctor provide thus cook ' +
      'bones tail board modern compound mine fit addition belong safe guess silent trade rather compare ' +
      'crowd poem enjoy elements indicate except expect flat seven interesting sense string blow famous ' +
      'value wings movement pole exciting branches thick spot bell fun loud consider suggested thin ' +
      'position entered fruit tied rich dollars send sight chief stream planets rhythm eight science ' +
      'major observe tube necessary weight meat lifted process swim terms current park sell shoulder ' +
      'industry wash block spread cattle wife sharp company radio action capital settled yellow ' +
      'southern truck fair printed ahead chance born level triangle repeated column western church ' +
      'sister oxygen various agreed opposite wrong chart prepared pretty solution fresh shop especially ' +
      'shoes actually nose afraid sugar office huge similar score forward stretched experience rose ' +
      'allow fear workers women bought led march northern create difficult match win steel total deal ' +
      'determine evening rope cotton apple details entire corn smell tools conditions cows track ' +
      'arrived located sir seat division effect view student service program issue friend hour member ' +
      'minute kid parent others health research guy education policy market college role effort rate ' +
      'leader price decision relationship society tax director player event official couple site ' +
      'project activity court situation image phone data product patient worker news movie support ' +
      'technology computer attention film source organization evidence population training skill career ' +
      'community national public social local personal private political economic international recent ' +
      'likely available medical serious physical financial final popular traditional cultural ' +
      'significant central nice whatever nearly simply certainly clearly recently anyone myself herself ' +
      'ourselves neither continue happen spend offer reach suggest raise pass require decide pull ' +
      'develop receive agree cover lose',

    // Everyday vocabulary not in `common` (inflections included) - used to find real words for restricted key sets.
    extra:
      'absent absolute academic accident accidents accurate achieve active activities actor actual ' +
      'adult adults advance adventure adventures advice afford afternoon agent agents aim alarm alert ' +
      'alike alive alley amazing ambition ancient angel annual anybody anyway anywhere apart apology ' +
      'appeal appetite applause apply approach arch arena argue arrange arrow arrows article articles ' +
      'artist aside asleep assist attach attempt attend attic attitude audience autumn avenue average ' +
      'avoid awake award awards aware awesome awkward babies background backward backyard badge bag ' +
      'bags balance balcony ballet balloon balloons bamboo banner barn barrel basket baskets battery ' +
      'beam bean beard beast beauty bedtime beef behave belief bells belongs belt bend beneath benefit ' +
      'berry beyond bicycle billion birthday bite bitter blade blame blank blanket blast blaze blend ' +
      'bless blind blink blocks bloom blossom blush boards boast bold bolt bonus booth border borrow ' +
      'boss bother bottle bottles bounce bound brain brains brake branch brand brave bread breath ' +
      'breeze brick bride brief brilliant broad brook brothers brush bubble bubbles bucket budget ' +
      'buffalo bulb bumpy bundle bunny burst busy button buttons buzz cabin cable cafe cage calm camp ' +
      'camping campus canal candle candles canvas capable caption card cards careful careless cargo ' +
      'carpet carrot cartoon cartoons carve castle castles casual catalog ceiling celebrate cellar ' +
      'cement cent cereal chain chains chalk challenge challenges channel chapter chapters charge charm ' +
      'cheap cheek chef cherry chess chest chill chilly chimney chin chip chips choice choices chorus ' +
      'circus citizen civil claim clap classic clay cleaner clerk clever click client cliff climate ' +
      'climb clinic clip clock closet cloth clue clues coach coal coat cocoa coin coins collar collect ' +
      'colony colorful comb comfort comic comics command comment compass complex concert condition ' +
      'confirm connect contest context conversation cooking copper cord core couch cough countless ' +
      'counter courage cousin cousins cozy crack craft crash crayon cream creature credit crew crisp ' +
      'crop crown crumb crunch crystal cube cuddle culture cupboard curious curly curtain curve cushion ' +
      'custom cycle daily dairy damage damp danger dangerous daring dash daughter dawn dear debate ' +
      'decade decent decimal deck decorate deeply defend define degree delay delicious delight demand ' +
      'dense depend depth deserve desire detail detect diary diet dig dinner dinosaur dirt dirty ' +
      'disaster discount discuss disease divide document dollar dolphin dome donate double doubt ' +
      'downtown dozen draft dragon drama dream dreams drift drill drip droplet drum duck due dull dust ' +
      'duty eager eagle earn easily eastern echo elbow elder elect elegant element elevator elsewhere ' +
      'emerge emotion empty enable ending endless enemy enormous entrance envelope equipment escape ' +
      'essay estate events eventually everybody everyday everywhere exact excellent excuse exhibit ' +
      'exist exit expand expensive expert explore export extend extra extreme fabric factory fade fail ' +
      'faint fairly faith false fame familiar fancy fantastic fashion fault favor favorite feather ' +
      'feature feed fellow female fence festival fever fiction fierce firm fitness flag flame flash ' +
      'flavor fleet flight flock flood flour fluffy fluid flute focus foggy folk fond forecast foreign ' +
      'forever formal former fortune fossil fountain fragile frame freedom freezer frequent friendly ' +
      'friendship fright frost fuel fully funny furniture future gain galaxy gallery gap garage gate ' +
      'gear generous genius gentle giant gift gifts giggle glance glare glimpse globe gloomy glory ' +
      'glossy glove glow goal goals golden goodbye gorgeous gossip grab grace grade gradual grain grand ' +
      'grant grape grateful gravel gravity greatly greedy grid grin grip groan grocery growth grumpy ' +
      'guard guest guests guide guitar gulf habit habits hallway halt handle handful handsome handy ' +
      'happily harbor hardly harm harmony harvest hatch haul haven hazard headline headache heap heaven ' +
      'hedge height hello helmet helpful hero heroes hidden highway hike hint hire hobby hobbies ' +
      'holiday hollow honest honey honor hook horizon horn hospital host hotel hum humor hungry hurry ' +
      'hush icon icy ideal identify ignore imagine impact impress improve inch income indeed index ' +
      'indoor infant inform inner input insect insist inspire instance instant intend invent invention ' +
      'invest item items jacket jar jaw jeans jewel jigsaw join joke jokes journal journey joy judge ' +
      'juggle juice jungle junior keen kettle keyboard kids kindness kingdom kit kite kites knee knife ' +
      'knight knock knot label labor lace ladder lamp landed landscape lane lantern laptop largely ' +
      'laser lately laugh laundry lawn layer lazy leaf league leap leather lecture legal legend lemon ' +
      'lend lesson lever library lid lift lighter limit limited linen liquid literally litter lively ' +
      'load loaf loan lobby locate lock lodge lofty logic lonely loose lovely lower loyal luck lucky ' +
      'luggage lumber lunar lunch magic magnet magnetic mail makeup mammal manage manner mansion manual ' +
      'maple marble margin marine marvel mask massive master mate meadow meaning meantime meanwhile ' +
      'medal media medium melody memory mental mention merit merry mess message meter midnight mild ' +
      'mineral minor miracle mirror mischief mission mist mistake mixture model modest moist monitor ' +
      'monster monthly mood moral motion motor mud muddy muscle museum mushroom mystery narrow nature ' +
      'naughty navy nearby neat needle neighbor nephew nervous nest network niece noble noise noisy ' +
      'normal notebook novel nowhere nuclear numerous nurse oak obvious odd olive online opera opinion ' +
      'orbit orchard ordinary organ origin outdoor outer outline oval oven owner pace pack package ' +
      'packet paddle palace pale palm panel panic parade parcel pardon parents parking partly partner ' +
      'passage passenger patch path patience pause pave peace peaceful peak pearl pebble pedal peel ' +
      'penny perfect perform perfume permit pet phase photo pick picnic pile pillow pilot pin pine pink ' +
      'pioneer pipe pirate pitch pity plain planet plastic plate platform playful pleasant pleasure ' +
      'plenty plot plug plus pocket poet polar polish polite pond pool porch portion portrait positive ' +
      'postcard poster pottery pouch powder powerful practical praise precious prefer press pride ' +
      'prince princess print prize profit progress promise proof proper property protect proud prove ' +
      'puddle pulse punch pupil puppet pure purple purpose puzzle quarter queen query quest quick ' +
      'quietly quilt quote rabbit radar rail railway rainbow random range rapid rare rarely raw razor ' +
      'real realize rebuild receipt recipe recycle reflect refresh regular relax release reliable ' +
      'relief remark remind remote rent repair repeat replace reply reptile rescue reserve resource ' +
      'respect respond restore retire reveal reward rhyme ribbon riddle ridge rigid ripe ripple risk ' +
      'rival roast robe robin robot rocky rocket roll roof rookie rough route routine royal rubber ' +
      'rumble rural rusty saddle safety sailor salad salary sample sandy satisfy sauce saucer scarf ' +
      'scene scenery scent scheme scoop scout scrap screen script sculpture seal season secret secure ' +
      'seldom select sensible sentence series settle shade shadow shallow shame share shelter shield ' +
      'shift shiny shock shore shortly shovel shower shrink shy sick sigh signal silence silk silly ' +
      'silver sincere sink siren sketch skillful slate sled sleeve slice slight slim slogan slope ' +
      'smooth snack sneeze soap soccer softly solar soldier solid solo somebody somehow somewhat ' +
      'somewhere sorry sort soul spare spark sparkle speaker speech spice spicy spirit splendid sponge ' +
      'spoon spray sprinkle squeeze stable staff stage stair stamp standard staple statue steady steam ' +
      'steep stem sticky stiff sting stomach stool storage stove straw strawberry strength stress ' +
      'stretch strict stripe studio stuff style subtle suburb success sudden suit summit sunny super ' +
      'supper surely surround survey survive sweater sweep sweet swift swirl switch symbol tablet ' +
      'tackle talent tank tape target task taste teacup tease teen telescope temple tender tent term ' +
      'terrific thankful theater theme thirsty thorough thread threat thrill throat throne thumb ' +
      'thunder ticket tidy tiger tight timber title toast token tomorrow tongue tonight tool topic ' +
      'torch tough tourist towel tower toy trace traffic trail treasure treat tremble trend trial trick ' +
      'trio trophy tropical truly trumpet trunk trust truth tulip tunnel turkey twelve twenty twice ' +
      'twin twist typical umbrella unique unity universe unless unlike unlock unusual upper upset ' +
      'upstairs urban urge useful useless usual utmost vacation valid valuable vapor variety vast ' +
      'velvet venture version vessel victory vine vinegar vintage virtual visible vision visitor vital ' +
      'vivid volume voyage wagon waist wallet wander warmth warn wealth weekend weekly weird welcome ' +
      'whale wheat wheel whenever wherever whistle widely width wilderness willing windy wing winner ' +
      'wisdom wise witness wizard wonderful wooden worry worse worst worth wrap wreath wrist yarn yawn ' +
      'yearly yell yesterday yield youth zebra zero zone zoo animals answers areas balls banks beds ' +
      'boats bodies books boxes boys bridges buildings cakes cars cats chairs cities clocks clouds ' +
      'coats colors corners days desks dogs doors ducks edges eyes faces facts farms fields figures ' +
      'fires flags floors frogs fruits games gardens gates girls goats groups hands hats hearts hills ' +
      'holes homes horses houses ideas islands jobs keys kings lakes lamps lands leaves letters lights ' +
      'lines lists maps markets meals minds moons mountains names needs nests nights notes numbers ' +
      'oceans pages papers parks parts paths pens pictures pieces places planes plans plants points ' +
      'pools questions rains rings rivers roads rocks rooms roses rules schools seas seats shapes ' +
      'sheets shells ships shops sides signs skies songs sounds spaces stones stories streets tables ' +
      'tails teams things thoughts towns toys trees trips trucks walls waters ways weeks windows woods ' +
      'words worlds years bigger biggest smaller smallest taller tallest faster fastest slower slowest ' +
      'higher highest lowest older oldest younger youngest stronger strongest warmer warmest colder ' +
      'coldest happier happiest easier easiest harder hardest longer longest shorter shortest brighter ' +
      'brightest darker darkest louder loudest quieter quietest greater greatest nicer nicest kinder ' +
      'kindest wiser sad dad hall glad lad lag flask flasks alas ash asks dads fad fads falls gash hash ' +
      'lads lags lash lass sag sags saga sagas salads salsa salsas sash slash alfalfa gala galas gall ' +
      'halls shah sass aha haha gaff gaffs flak typewriter typewriters puppets poetry proprietor towers ' +
      'powers flower quotes quoted requires request requested equals equality squares squad squash ' +
      'squeak squid squirt equator quilts quit quits queue quests quart quarters quirk quail aqua ' +
      'aquatic sweets kitty kettles ladders listed lots rights sights flights delighted daylight ' +
      'weights heights eighty weigh weighed yogurt yoga yolk yelled yours sturdy dusty tasty hasty ' +
      'puffy hippo hoop hoops hoped hopes holds idol dial dials daisy daisies sideways waterfall ' +
      'waterproof wildlife wishful uphold upside upward upwards outfit outfits output outdoors guitars ' +
      'gutter guitarist guessed guided guides guilty glitter greet greeted digs dug egg ledge fridge ' +
      'froggy soggy jolly jelly jeep jeeps jet jets jog jogs joked judged jug jugs juicy thirty fist ' +
      'frosty forty poodle poodles pillows pilots pirates plates players potato potatoes potter pour ' +
      'poured pressed protest quiz wallets swiftly gloss shuffle shuffled jigsaws replies supplies ' +
      'applied puppy poppy sleepy sleepier treaty treats trait traits router routes detour dessert ' +
      'desserts forests dragged spider spiders tulips teapot teapots tissue tissues statues fortress ' +
      'stages goose geese ghost ghosts rooster roosters turtle turtles trophies hiker hikers forge ' +
      'forgot forget forgets ought fought sought taught ate tea bet cab cart cast feast freeze raft ' +
      'refer saved scar scare seed served steer stew swat taxes vase vest wave waved weave web wet wax ' +
      'zest brew cabbage cease cedar crab crafts crate crater created crest dare darts defeat defect ' +
      'degrees dread drew drag dwarf ear eraser exceed excess exert extract fare fax fee fewer gaze ' +
      'greed grease reader rebate recede recess regard regret reverse sacred scatter tread verse waste ' +
      'weaver wafer wager wasted watered bazaar barber bees beg brace braces bravest cadet cassette ' +
      'cascade decrease defeated extracted grabbed tweet tweezers wade starve verve craved drafts ' +
      'watercress sweaters stared starred dresses addresses scarce effects affect affects access acre ' +
      'acres cave caves crave dab dart deaf deer drafted drawer drawers fees gazed gravest rave raced ' +
      'races rafts react reacted recast redraft retreat retreats sweat swear sweetest tart taxed teas ' +
      'teased terrace vat zag zap hip hop ink inn ion jump junk kiln kin lip lion loop lump mink mom ' +
      'monk noon oil oily onion pill plum plump poll polo pop pump pumpkin union yum yummy hilly holly ' +
      'honk hull hulk hymn ill imply kilo kimono knoll lily limp link loom lollipop mill mini minimum ' +
      'minion monopoly mop nil nip nook null nylon oink ohm phony pinion pinky pip plunk ploy polio ' +
      'pony pulp pun punk puny pup uphill unpin unhook homonym lumpy milky mummy mimic ant ants bee ' +
      'bears beaver bird bison bull butterfly calf camel camels canary cheetah chick chicken chickens ' +
      'chimp clam cobra crabs crane crow cub cubs dolphins donkey dove eagles eel elephant elephants ' +
      'elk falcon ferret finch flamingo flies foal fox foxes frog gazelle gecko giraffe goat gorilla ' +
      'hamster hare hawk hedgehog hen hens heron hound hummingbird hyena iguana jaguar jellyfish ' +
      'kangaroo kitten kittens koala ladybug lamb lambs lemur leopard lions lizard llama lobster magpie ' +
      'mole monkey monkeys moose mosquito moth mouse mule octopus ostrich otter owl owls ox panda ' +
      'panther parrot peacock pelican penguin penguins pig pigs pigeon porcupine puppies rabbits ' +
      'raccoon ram raven reindeer rhino salmon seals shark sharks sheep shrimp skunk sloth snail snails ' +
      'snake snakes sparrow squirrel stork swan swans tigers toad tortoise trout walrus wasp whales ' +
      'wolf wolves worm worms yak zebras pets hamsters bunnies apples apricot avocado bacon bagel ' +
      'banana bananas beans berries biscuit broccoli brownie burger butter cake candy carrots cheese ' +
      'cherries chili chocolate cinnamon coconut cookie cookies cracker crackers cucumber cupcake curry ' +
      'donut dough fig fries garlic ginger grapes gravy jam ketchup kiwi lemons lettuce lime mango ' +
      'melon muffin mustard noodle noodles nut nuts oat oats olives omelet onions orange oranges ' +
      'pancake pancakes pasta peach peaches peanut pear pears peas pepper pickle pie pizza popcorn ' +
      'pudding raisin rice salt sandwich sausage soup spinach steak syrup taco tomato tomatoes tuna ' +
      'vanilla vegetable vegetables waffle walnut watermelon zucchini meal breakfast snacks recipes ' +
      'kitchen menu bakery bowl fork sour salty crispy crunchy frozen baked fried boiled roasted sliced ' +
      'chopped bath bathtub bedroom bench bowls broom cabinet chair cup cups desk dish dishes fan ' +
      'faucet forks glasses hammer hanger heater jars knives mat mug napkin pan pans pot pots rug ' +
      'scissors shelf shelves sofa spoons stairs towels tray basement doorbell doorway mailbox bay ' +
      'beach bush bushes canyon cliffs creek dew fog glacier pebbles petal petals roots storm storms ' +
      'swamp tide volcano waves weed weeds sunrise sunset sunshine moonlight starlight comet breezy ' +
      'cloudy drizzle freezing gust hail humid lightning misty rainy sleet snowy stormy dusk weekday ' +
      'hourly calendar schedule seasons airplane airport bike bus buses canoe ferry helicopter kayak ' +
      'motorcycle sailboat scooter subway taxi tractor trains tram van yacht tickets passport suitcase ' +
      'bridge station port runway driver passengers alphabet backpack classroom crayons diploma ' +
      'dictionary exam exams folder glue grades homework lessons locker marker pen pencil pencils ' +
      'principal reading ruler spelling semester textbook tutor puzzles riddles math geography biology ' +
      'chemistry physics grammar vocabulary sentences paragraph agenda clients colleague contract ' +
      'deadline email emails employee employer file files invoice manager meeting meetings memo printer ' +
      'stapler tasks customer customers products services offices startup app apps browser camera ' +
      'clicks code coding cursor database device devices digital disk download downloads gadget ' +
      'internet keyboards links login password pixel pixels screens scroll search server servers ' +
      'software upload user users video videos website websites wireless robots charger update updates ' +
      'athlete baseball basketball bat cricket cycling diving football golf gym hockey jogging kick ' +
      'marathon medals net racket referee relay rugby running skate skating ski skiing sport sports ' +
      'stadium surf surfing swimming tennis volleyball winners dice champion champions tournament band ' +
      'bass chord choir drums harp jazz lyric lyrics microphone musician orchestra piano singer tempo ' +
      'tune violin brushes painting paintings sketches artists apron blouse boot boots cap cardigan ' +
      'gloves gown hat hoodie mitten mittens necklace pajamas pants pockets purse sandal sandals shirt ' +
      'shirts shoe shorts skirt sleeves slipper slippers sneakers sock socks tie uniform zipper ' +
      'bracelet earrings amber beige blues bronze crimson cyan gray indigo ivory lavender lilac magenta ' +
      'maroon scarlet tan teal turquoise violet circles cone diamond hexagon rectangle sphere triangles ' +
      'angry anxious cheerful confident excited hopeful joyful kindly relaxed smart tired worried ' +
      'thoughtful humble architect astronaut author baker builder carpenter cashier chemist dancer ' +
      'dentist designer detective editor engineer firefighter fisherman gardener janitor journalist ' +
      'lawyer librarian mechanic painter pharmacist photographer plumber professor programmer reporter ' +
      'scientist secretary surgeon tailor waiter writer farmer axe bricks nail nails screw screws wool ' +
      'cardboard ankle arm cheeks finger heel knees leg lips lung lungs muscles neck shoulders skull ' +
      'spine thumbs toe toes tooth teeth wrists heads accept accepts accepted accepting adds added ' +
      'adding admire admires admired admiring agrees agreeing allows allowed allowing answered ' +
      'answering appears appeared appearing arrive arrives arriving asked asking bake bakes baking ' +
      'begins beginning begun believes believed believing belonged belonging blinks blinked blinking ' +
      'boil boils boiling borrows borrowed borrowing bounces bounced bouncing breaks broke breaking ' +
      'breathe breathes breathed breathing brings bringing brushed brushing builds burn burns burned ' +
      'buys buying calls called calling carries carried carrying catches catching changes changed ' +
      'changing chase chases chased chasing cheer cheers cheered cheering chew chews chewed chewing ' +
      'chooses chose choosing chosen claps clapped clapping cleans cleaned cleaning climbs climbing ' +
      'closes closed closing collects collected collecting colored coloring comes coming cooks cooked ' +
      'copies copied copying counts counted counting covers covering crawl crawls crawled crawling ' +
      'crosses crossed crossing cry cries crying cuts cutting dances danced dancing decides deciding ' +
      'deliver delivers delivered delivering describes described describing digging dive dives dived ' +
      'draws drawn dreamed dreaming dressed dressing drink drinks drank drinking drives drove driving ' +
      'driven drops dropped dropping dries dried drying eats eating eaten enjoys enjoyed enjoying enter ' +
      'enters entering explains explained explaining explores explored exploring falling fallen feeds ' +
      'fed feeding feels fill fills filling finds finding finish finishes finishing fix fixes fixed ' +
      'fixing float floats floated floating flew flying flown fold folds folded folding follows ' +
      'followed following forgetting forgotten forgive forgives forgave forgiving forgiven freezes ' +
      'froze gather gathers gathered gathering gives giving given glows glowed glowing goes going grabs ' +
      'grabbing greets greeting grows growing grown guesses guessing hang hangs hung hanging happens ' +
      'happening hears hearing helps helped helping hide hides hid hiding hikes hiked hiking holding ' +
      'hops hopped hopping hoping hug hugs hugged hugging hums hummed humming hurries hurried hurrying ' +
      'imagines imagined imagining invents invented inventing invite invites invited inviting joins ' +
      'joining jogged juggles juggled juggling jumps jumping keeps keeping kicks kicked kicking knit ' +
      'knits knitted knitting knocks knocked knocking knows knowing laughs laughing learns learned ' +
      'learning leaving lends lent lending lifts lifting likes liked liking listens listened listening ' +
      'lives lived living looks looked looking loses losing loves loved loving makes making marches ' +
      'marched marching melt melts melted melting mix mixes mixed mixing moves moved moving needed ' +
      'needing opens opened opening orders ordered ordering paints painted passes passing pays paid ' +
      'paying picks picking planned planning planted planting plays played playing pointed pointing ' +
      'pours pouring practices practiced practicing pulls pulling push pushes pushing reaches reaching ' +
      'reads relaxes relaxing remembers remembered remembering repeats repeating replied replying rests ' +
      'rested resting returns returned returning rides rode riding ridden rang ringing rung rises ' +
      'rising risen rolls rolling runs rush rushes rushed rushing sails sailed sailing saves saving ' +
      'says saying searches searched searching sees seeing sells sold selling sends sending shares ' +
      'shared sharing shine shines shone shining shout shouts shouting shows showed showing sings sang ' +
      'singing sung sits sitting skip skips skipped skipping sleeps slept sleeping slide slides slid ' +
      'sliding smells smelled smelling smile smiles smiling solves solved solving speaks spoke speaking ' +
      'spoken spell spells spelled spends spent spending spill spills spilled spilling splash splashes ' +
      'splashed splashing starts started starting stays stayed staying steps stepped stepping stir ' +
      'stirs stirred stirring stops stopped stopping studies studied studying swims swam swing swings ' +
      'swung swinging takes taking taken talks talked talking tastes tasted tasting teach teaches ' +
      'teaching tells telling thank thanks thanked thanking thinks thinking throw throws threw throwing ' +
      'thrown tickle tickles tickled tickling travels traveled traveling tries tried trying turns ' +
      'turned turning types typed typing understands understood understanding uses used using visits ' +
      'visited visiting waits waited waiting wake wakes woke waking walks walked walking wants wanted ' +
      'wanting washes washed washing watches watched watching waving wears wore wearing worn whisper ' +
      'whispers whispered whispering whistles whistled whistling wins won winning wink winks winked ' +
      'winking wishes wished wishing wonders wondered wondering works worked working worries worrying ' +
      'writes writing yawns yawned yawning yells yelling zip zips zipped zipping zoom zooms zoomed ' +
      'zooming creates creating designs designed designing develops developing discover discovers ' +
      'discovering edit edits edited editing improves improved improving includes included including ' +
      'measures measured measuring offers offered offering prepare prepares preparing protects ' +
      'protected protecting provides provided providing receives receiving records recorded recording ' +
      'reduce reduces reduced reducing remove removes removed removing reports reported reporting ' +
      'selects selected selecting serves serving settles settling supports supported supporting tests ' +
      'tested testing trained treated treating trusts trusted trusting updated updating wanders ' +
      'wandered wandering welcomes welcomed welcoming hi ah ad ax ha ma pa ow ok pi re mi fa la ti aw ' +
      'eh uh um cow lab lap lie log nod rub spy tag tap tin tip ton tub bin bow bud bug cob cod cot dim ' +
      'dip dot elf fin fur gem gum hut nap word late slow star text bark bone chat club cute dock mint ' +
      'ruby sack spin tour month smoke ads gag gags fathers worthy fifty sisters fishes paste torn ' +
      'visual auto maid emblem amble lens hay wig rig gut rut sub tug aid dismal quantity ornament ' +
      'authentic eighth dorm lapel civic laps naps wit ham yam pal envy endow forms fir rod bog cog ' +
      'mangle mend penal chapel visor auditor audit aisle isle idle tusk dismay cubicle ritual ' +
      'accommodate acknowledge acquaintance acquire address apparent argument bizarre category cemetery ' +
      'changeable collectible committed committee conscience conscious consensus definitely desperate ' +
      'dilemma disappear disappoint discipline embarrass environment exaggerate existence fascinate ' +
      'fluorescent guarantee hierarchy humorous hygiene ignorance immediately independent indispensable ' +
      'intelligence jewelry judgment knowledge leisure liaison license maintenance maneuver millennium ' +
      'miniature mischievous misspell noticeable occasion occasionally occur occurred occurrence ' +
      'opportunity parallel particular pastime perseverance persistent playwright possession preferred ' +
      'privilege pronunciation publicly questionnaire recommend reference referred relevant restaurant ' +
      'ridiculous sergeant siege sincerely supersede threshold twelfth tyranny vacuum vehicle withhold ' +
      'aggressive amateur annually apparently appearance arctic basically bureau camouflage curiosity ' +
      'deceive dependent dumbbell entrepreneur extraordinary fiery gauge glamorous handkerchief ' +
      'idiosyncrasy inoculate irresistible kindergarten lieutenant mathematics medieval memento ' +
      'minuscule mnemonic necessarily nuisance onomatopoeia pharaoh phenomenon pneumonia possess ' +
      'psychology quarantine quizzes rhinoceros sapphire silhouette souvenir succeed successful ' +
      'supposedly synonym tattoo technique tragedy unnecessary villain wholly xylophone conscientious ' +
      'accidentally papa plaza pajama parka pain pad pat quality quake quack opaque paw papaya prop ' +
      'adapt alpha alpaca capacity snap trap strap spa graze glaze maze haze amaze dazzle blizzard ' +
      'aquarium sap clasp grasp gasp loss swollen wow howl willow swallow toss moss floss mass kiss ' +
      'sixty toxic spool sole swap sway swell sew laws flaws slip post slot combine maximum cinema ' +
      'beacon cannon brunch bunch munch carving convince eleven vacant verb cubic numb zinc fizz ' +
      'nickname venom census concern conclusion curb cobweb vibrant nimble mumble embrace convenient ' +
      'unknown beckon birth thrive theory shell herb herd hey therefore thermal bathe soothe ' +
      'nonetheless hypothesis aesthetic sympathetic synthetic theft thesis theorem farther further ' +
      'smoother tether thousand abandon landing standing wand bandage candidate outstanding grandmother ' +
      'husband errand bland strand getting having doing linger option passion companion potion ration ' +
      'lotion notion nations pavilion legion criterion scorpion dandelion trillion collection relation ' +
      'location invitation celebration competition definition tradition nutrition intention function ' +
      'friction caution election creation protection operation production reaction generation ' +
      'imagination payment apartment department development treatment agreement entertainment ' +
      'excitement instrument management measurement improvement achievement announcement segment ' +
      'fragment monument garment mentor momentum sentiment supplement investment assessment assignment ' +
      'settlement bough trough borough drought doughnut roughly toughest coughing throughout ' +
      'breakthrough toughen roughness sunlight highlight insight freight mighty frightened brighten ' +
      'tighten nightly rightly sightseeing flashlight spotlight weightless neighboring weighs ' +
      'weightlifting sleighs eighteen neighbors neighborhood sleigh heighten weighing eighteenth ' +
      'weighty overweight lightweight heavyweight neighborly freighter strike structure struggle stroke ' +
      'stroll strategy stranger construct destroy district astronomy frustrate illustrate demonstrate ' +
      'abstract distract pastry mistrust restrict stray streak strum springy sprained sprawling sprint ' +
      'sprout spruce sprain sprang sprung sprawl springs sprinter springtime sprayed spreading ' +
      'spreadsheet offspring bedspread sprocket sprite sprig sprinkler sprints sprouts scream scratch ' +
      'scrub scrape scribble scramble scrapbook scrutiny description subscribe prescription manuscript ' +
      'scribe screech scrimmage screenplay inscribe inscription unscrew discrete discretion scrumptious ' +
      'scruffy scrawl error predict wed ended shed sped incredible wedding pledge breed freed named ' +
      'belly rely ally rally tally character cash shake publish establish accomplish whoever whom ' +
      'whiskers worthwhile overwhelm wholesale whirl whiz whimsical whisk phrases photos phones graphic ' +
      'graphics physician alphabetical graph photograph pharmacy philosophy emphasis biography ' +
      'autograph symphony triumph orphan telephone headphones catastrophe atmosphere presents pressing ' +
      'preheat prepaid presenter preference prescribe prediction preschool prevent previous presence ' +
      'preserve pressure preview premium precise prefix prehistoric pretend prevail interpret compress ' +
      'supreme prey produced promised profile prompt protein proposal approve profession promote ' +
      'pronounce propose prospect prototype proverb province procedure contact content contrast ' +
      'contribute convert conclude constant consult consume cones economy reconsider silicon commit ' +
      'compact compete compose comedy outcome overcome comma commerce composition compute cables ' +
      'stables manageable renewable fable comfortable suitable enjoyable notable unable portable ' +
      'adorable affordable favorable remarkable reasonable acceptable predictable washable breakable ' +
      'readable likable lovable disable probable durable helpless homeless hopeless harmless fearless ' +
      'restless priceless timeless painless spotless regardless nevertheless needless pointless ' +
      'thoughtless colorless tireless breathless sleepless effortless selfless blessed blessing lessen ' +
      'flawless seamless loudness neatness stillness smoothness happiness darkness sadness weakness ' +
      'illness wellness awareness goodness fairness softness sweetness brightness freshness emptiness ' +
      'loneliness readiness harness fondness greatness thickness sickness openness laziness fullness ' +
      'politeness firmness gentleness tidiness conquer earthquake banquet sequence antique stuck ' +
      'sticker ounce',

    // Words of exactly 2, 3, 4 and 5 letters.
    len2:
      'of to in it is be as at so we he by or on do if me my up an go no us am oh hi ox ah ad ax ha ma ' +
      'pa ow ok pi re mi fa la ti aw eh uh um',
    len3:
      'the and for are but not you all any can had her was one our out day get has him his how man new ' +
      'now old see two way who boy did its let put say she too use dad mom sun run fun big dog cat cup ' +
      'bed box car red top hot yes yet ago air arm art ask bag bat bus buy cow cut dry ear eat egg end ' +
      'eye far few fit fix fly fox gas hat hit ice ink jam job joy key kid lab lap law lay leg lie lip ' +
      'log lot low map mix mud net nod nut oak odd off oil own pan pay pen pet pie pig pin pop pot raw ' +
      'row rub sad sat saw sea set sir sit six sky son spy sum tag tap tea ten tie tin tip toe ton toy ' +
      'try tub van wax web wet why win zoo zip bee bin bit bow bud bug cab cap cob cod cot cub dew dig ' +
      'dim dip dot dug elf elk fan fed fig fin fog fur gap gem gum guy hen hid hop hug hum hut jar jaw ' +
      'jet jog kit lad lid mat men mop nap',
    len4:
      'that with have this will your from they know want been good much some time very when come here ' +
      'just like long make many more only over such take than them well were what also back call came ' +
      'city does down even find give hand help home keep kind last left life line look made most move ' +
      'must name need next open part play same show side tell turn used week went word work year baby ' +
      'bird blue book cold door draw easy face fact fall farm fast fill fire fish food foot form free ' +
      'game girl gold gray hair half hall hard head hear heat high hill hold hope hour idea jump king ' +
      'lake land late lead less list live love main mark meet milk mind miss moon near nice note once ' +
      'page park pass past pick plan pull push rain read real rest rich ride ring road rock room rule ' +
      'safe sail salt sand save seat seed seem sell send ship shoe shop sing size skin slow snow soft ' +
      'soil song soon sort star stay step stop sure swim tail talk tall team test text tree trip true ' +
      'unit wait walk wall warm wash wave wear west wide wild wind wing wish wood yard bake band bark ' +
      'bear bell belt bike boat bone cake calm camp card care cart cave chat chin clap club coat code ' +
      'coin cook cool corn crab cute dark deep desk dish dive dock dust duck feet film flag flat frog ' +
      'fuel gift glad glue goal goat grab grow hero hike hint jazz joke kite knee lamp leaf lion loud ' +
      'luck mail math meal mild mint mist nest oven pack pear pink pond pool quiz rose ruby sack sock ' +
      'spin swan taxi tent tiny toad tool tour town wolf yarn zero zone',
    len5:
      'about other which their there would these could first after where think three water place right ' +
      'small sound great again house point study light world large every under never start often until ' +
      'might story young night month paper money music group river south north table black white green ' +
      'power plant stand earth heavy ready alone above below thing begin piece child carry voice horse ' +
      'watch party woman early field cover class clear close dream drink faith floor fresh fruit happy ' +
      'heart hello human juice laugh learn lemon lucky magic match metal model mouse nurse ocean order ' +
      'peace phone photo pilot pizza plane plate queen quick quiet radio raise reach round scale shape ' +
      'share sharp sheep shelf shirt shoes shore short shout skill sleep smile smoke snake space speak ' +
      'speed spell spend spoon sport stone storm sugar sweet taste teach thank tiger today tooth total ' +
      'touch tower train truck trust truth uncle value video visit wheel whole worry write wrong apple ' +
      'beach bread brush candy chair chalk cloud crown dance eagle flame frost giant grape grass honey ' +
      'jelly kayak koala lunch maple melon olive otter panda peach piano pupil robin salad scarf seven ' +
      'snack solar spice squid stamp stars sunny tulip waves whale zebra',

    // Only home-row letters: a s d f g h j k l.
    homeRow:
      'a as all has had add ask sad dad fall half hall glad glass flag flash gas lad lag dash salad ' +
      'shall flask ash asks adds ads alas dads fad fads falls flags flasks gash hash lads lags lash ' +
      'lass sag sags saga sagas salads salsa salsas sash slash alfalfa gala galas gall halls gag gags ' +
      'sass shah aha ah ha haha la fa gaff gaffs flak',

    // Only home-row and top-row letters.
    homeTop:
      'the to of is it he as at that this they with his her she for if all are was were what had has ' +
      'how out our your you up use two too so do does did said see say way day get got go good great ' +
      'right light high first story history key keys kite kites little letter list lift loud lost lot ' +
      'lots look like life power tower flower water sweater pretty quiet quite quote quotes require ' +
      'request equal square squad squash liquid quilt quit query queue quest quarter type typewriter ' +
      'pottery puppet poetry property repeat report people play player playful pool proud pilot pirate ' +
      'plate polite polish pour powder praise press pride proper protest pupil pillow write writer ' +
      'wrote yellow yes yet youth yogurt yoga yolk yard year years tree trees street streets sweet ' +
      'sweets three their there these those other others father fathers worth worthy forty fifty thirty ' +
      'third thirsty dirty fist sister sisters ready already today tired tide tidy ride rides road ' +
      'roads rose roses route routes outside outdoor useful usual usually upside upward hope hoped hold ' +
      'hole holes idea ideas guide guitar guess glad glass gift gifts edge egg eggs fridge foggy jolly ' +
      'jelly jet jog joke judge dish dishes fish fishes wish wishes wise west wet waste paste taste ' +
      'tasty dust dusty rusty rest test hat hats heat seat seats eat sea tea set let pet fresh frost ' +
      'frosty fruit fruits',

    // Typed entirely with the left hand: q w e r t a s d f g z x c v b.
    leftHand:
      'we were was are as at a ate eat tea sea set get bet bed bad bag cab cat car care card cart case ' +
      'cast fast faster fact face fear feast few free freeze gate gave gear grab grade grass great ' +
      'greet read red rest rate race raft refer reward safe save saved scar scare seat secret see seed ' +
      'serve served start stars state steer stew street sweater sweet tax taxes test trade tree trees ' +
      'vase vest water wave waved weave web west wet wax zebra zest beast beat bread brew cabbage cafe ' +
      'career cease cedar crab craft crafts crate crater create created crest crew dare darts data ' +
      'debate decade defeat defect degree degrees deserve desert dessert detect draft dread drew drag ' +
      'dress dwarf eager ear eraser estate exact exceed excess extract extra fade fare fax fee feet ' +
      'fever fewer garage gas gaze greed grew grease greater reader rebate recede recess regard regret ' +
      'reserve reverse sacred scatter target taste tread verse waste wear wafer wager wasted watered ' +
      'aware award awards bazaar barber beds bees beg brace braces brave bravest cadet cassette cascade ' +
      'decrease defeated extracted grabbed tweet tweezers wade starve carve craved drafts watercress ' +
      'sweaters stared starred streets dresses addresses scarce effect effects affect affects access ' +
      'acre acres agree agreed cave caves crave dart deaf dear deer drafted drawer drawers eggs ever ' +
      'fees freezer gazed rave raced races rafts react reacted retreat retreats sad sat saw sweat seats ' +
      'terrace vast',

    // Typed entirely with the right hand: y u i o p h j k l n m.
    rightHand:
      'you up in on oh no him my hip hop hum ink inn ion joy jump junk kiln kin lip lion look loop lump ' +
      'milk mink mom monk moon noon oil oily only onion opinion pill pin pink plum plump poll polo pool ' +
      'pop pump pumpkin puppy pupil union yolk yum yummy hilly holly honk hook hoop hull hulk hymn ill ' +
      'imply jolly join kilo kimono knoll lily limp link loom lollipop mill million mini minimum minion ' +
      'monopoly mop nil nip nook null nylon oink ohm phony pinion pinky pip plunk ploy polio pony pulp ' +
      'pun punk puny pup uphill upon unpin unhook homonym hippo lumpy milky mummy',

    // Every letter switches hands.
    alternating:
      'the if is it to so go do of or an am and for she he me by sign girl problem wish fish dish rich ' +
      'make lake lane land hand half than they then when work world corn torn turn town down own owl ' +
      'bowl cow visual panel title theme eight laugh dial goal sigh auto maid paid pale both body busy ' +
      'city duty fork form firm social island element emblem formal handle angle amble height neighbor ' +
      'right fight sight bush rush lamb lend lens men pen hen key keys hay may pay lay sir sit fit bit ' +
      'kept dig big fig wig rig cut but gut rut tub rub sub cub bug rug tug dug eye aid also man pan ' +
      'shape shame spend blend blame flame chair bicycle dismal quantity ornament authentic eighty ' +
      'eighth profit turkey dorm spent rigid visit lapel civic usual pays maps laps naps dials with wit ' +
      'throw them ham jam yam pal gown fox box ox envy endow worn worm forms fir dot got rod dog fog ' +
      'bog cog mangle handy lent mend penal chapel visor auditor audit aisle isle idle risk disk dusk ' +
      'tusk dismay cubicle ritual sick',

    // Commonly misspelled or awkward words.
    difficult:
      'necessary rhythm accommodate acknowledge acquaintance acquire address apparent argument ' +
      'beginning believe bizarre business calendar category cemetery changeable collectible committed ' +
      'committee conscience conscious consensus definitely desperate dilemma disappear disappoint ' +
      'discipline embarrass environment exaggerate exceed existence experience familiar fascinate ' +
      'fluorescent foreign forty forward friend government grammar guarantee height hierarchy humorous ' +
      'hygiene ignorance immediately independent indispensable intelligence jewelry judgment knowledge ' +
      'leisure liaison library license lightning maintenance maneuver millennium miniature mischievous ' +
      'misspell neighbor noticeable occasion occasionally occur occurred occurrence opportunity ' +
      'parallel particular pastime perseverance persistent playwright possession preferred privilege ' +
      'pronunciation publicly questionnaire receipt receive recommend reference referred relevant ' +
      'restaurant rhyme ridiculous schedule separate sergeant siege similar sincerely supersede ' +
      'surprise temperature threshold tomorrow tongue truly twelfth tyranny until vacuum vehicle weird ' +
      'whether withhold yacht zucchini achieve aggressive amateur annually apparently appearance arctic ' +
      'awkward basically broccoli bureau camouflage cinnamon colleague column curiosity deceive ' +
      'dependent dumbbell eighth entrepreneur extraordinary fiery gauge glamorous handkerchief ' +
      'idiosyncrasy inoculate irresistible kindergarten lieutenant mathematics medieval memento ' +
      'minuscule mnemonic necessarily nuisance onomatopoeia pharaoh phenomenon pneumonia possess ' +
      'psychology quarantine queue quizzes rhinoceros sapphire scissors silhouette soldier souvenir ' +
      'subtle succeed success successful supposedly synonym tattoo technique thorough through tragedy ' +
      'unnecessary villain wholly writing written xylophone conscientious accidentally',

    // At least two pinky letters (q a z p) per word.
    pinky:
      'pizza quiz papa apart paper happy apple pasta panda plaza pajama parka aqua zap zipper puzzle ' +
      'banana salsa pass past part park page pain pair paint palace pan pad pal pat pay pace pack plan ' +
      'play place plant plate apply appear approach area away amazing lazy hazard zebra quality equal ' +
      'square quart quarter quake quack squeeze squad squash opaque pause paste path patch paw peak ' +
      'peace prize papaya pepper popular prepare prop puppy pump proper people adapt alpha alpaca ' +
      'capacity captain cap map nap gap lap tap wrap snap clap trap strap scrap shape grape escape ' +
      'cheap leap heap spa spray bazaar blaze graze glaze maze gaze haze amaze dazzle jazz razor wizard ' +
      'lizard blizzard quizzes aquarium aquatic sap lamp camp damp stamp clasp grasp gasp',

    // At least two ring-finger letters (w s x o l) per word.
    ring:
      'slow solo wool low loss school swollen follow allow wow box fox ox so also lost lose loose whole ' +
      'world snow show own owl bowl howl glow flow blow grow know lower flower hollow yellow fellow ' +
      'pillow willow swallow shallow toss boss moss cross gloss floss class glass grass pass mass less ' +
      'miss kiss sixty six wax oxygen toxic boxes foxes slowly local cool pool tool stool spool sole ' +
      'soul oil soil solid sold cold hold gold bold fold told old word work worse wolf woman wonder ' +
      'swim sweat swap sway sweet swell wall well will wild wise wash waste west was saw sew laws lawn ' +
      'flaws owls solve salt sleep slip slide slim smell spell still skill small sell silk sail seal ' +
      'soap soft song son soon sort stop store story sport most post cost host ghost lots slot plot ' +
      'lion loop look lock long',

    // At least two bottom-row letters (z x c v b n m) per word.
    bottomRow:
      'combine cabin vacuum number member common become welcome maximum minimum cinema mechanic machine ' +
      'bamboo banana bacon beacon cannon bench branch brunch bunch lunch munch crunch cave cover ' +
      'carving convince oven seven eleven even heaven haven raven given driven vacant verb cubic cube ' +
      'climb comb numb mix mixing exam example next box zinc zone zoom buzz fizz jazz pizza dozen ' +
      'frozen citizen bronze zebra maze amazing nickname vinegar venom movement moment mention manner ' +
      'census concern conclusion cucumber curb cabinet cobweb vibrant nimble bubble mumble humble ' +
      'embrace vacation convenient unknown noon balance bank banner barn beckon bin blank',

    // Words containing common letter sequences, most common first.
    seq: {
      th:
        'the that this with they there their them then than think thing things through other both three ' +
        'those these though thought thank thanks father mother brother either rather without together ' +
        'weather whether nothing something anything everything month health truth birth earth south north ' +
        'mouth path bath math teeth tooth thick thin throw thumb thread thrive theme theory author method ' +
        'rhythm athlete gather feather leather breathe smooth worth',
      he:
        'he the she her here help head heart heavy held hello hero when then them they there where other ' +
        'these sheep shell chef check cheese teacher weather whether rather father mother brother either ' +
        'neither together ahead wheel theme sphere cheap chest chess helmet herb herd hen hedge heel ' +
        'height hey',
      the:
        'the then them they there their these theme theory other mother father brother together weather ' +
        'whether either neither rather another bother gather feather leather therefore thermal theater ' +
        'clothes breathe bathe soothe nonetheless hypothesis aesthetic sympathetic synthetic theft thesis ' +
        'theorem panther farther further southern northern smoother tether',
      and:
        'and hand land stand band sand brand grand understand standard island thousand candle handle ' +
        'sandal candy panda random demand command expand abandon landing standing handful handy sandwich ' +
        'wander wand bandage landscape candidate outstanding grandmother husband errand bland strand',
      ing:
        'thing things being going king ring sing bring spring string morning evening nothing something ' +
        'anything everything during building feeling looking making taking coming getting having doing ' +
        'saying working playing reading writing singing running swimming walking talking thinking finding ' +
        'living using trying asking wing swing sting single finger linger',
      ion:
        'action nation motion option union onion million billion opinion region question station section ' +
        'position decision vision version mission passion fashion lion champion companion potion ration ' +
        'lotion notion nations pavilion legion criterion scorpion dandelion minion trillion cushion ion',
      tion:
        'action nation motion option station section position question attention information education ' +
        'situation condition direction collection conversation solution population emotion relation ' +
        'location vacation invitation celebration competition definition addition tradition nutrition ' +
        'intention function fiction friction caution portion ration lotion notion potion mention election ' +
        'creation protection operation production reaction generation imagination',
      ment:
        'moment comment element cement payment movement argument apartment department government ' +
        'environment development equipment statement treatment agreement entertainment excitement ' +
        'instrument document management measurement improvement achievement announcement basement segment ' +
        'fragment monument garment mental mentor mention momentum sentiment supplement experiment ' +
        'investment assessment assignment settlement',
      ough:
        'through though thought enough rough tough cough dough bough trough borough thorough brought ' +
        'bought fought sought ought drought doughnut roughly toughest coughing throughout although ' +
        'thoughtful breakthrough toughen roughness',
      ight:
        'light night right sight might fight tight bright flight eight height weight slight knight fright ' +
        'delight tonight midnight sunlight highlight insight straight freight eighty mighty lightning ' +
        'frightened brighten tighten nightly rightly sightseeing flashlight spotlight daylight moonlight ' +
        'starlight weightless',
      eigh:
        'neighboring weighs weightlifting sleighs eight eighty eighteen eighth weigh weight weights ' +
        'neighbor neighbors neighborhood sleigh freight height heighten weighed weighing weightless ' +
        'eighteenth weighty overweight lightweight heavyweight neighborly freighter',
      str:
        'string strong street strange stream strength stress stretch strike stripe structure struggle ' +
        'straw strawberry stroke stroll strict strategy straight stranger instrument construct destroy ' +
        'district industry astronaut astronomy frustrate illustrate demonstrate abstract distract pastry ' +
        'mistrust restrict orchestra strand strap stray streak strum',
      spr:
        'springy sprained sprawling spring spray spread sprint sprout sprinkle spruce sprain sprang ' +
        'sprung sprawl springs sprinter springtime sprayed spreading spreadsheet offspring bedspread ' +
        'sprocket sprite sprig sprinkler sprints sprouts',
      scr:
        'screen scream scratch script scrub scroll scrap scrape screw scribble scramble scrapbook ' +
        'scrutiny describe description subscribe prescription manuscript scribe screech scrimmage ' +
        'screenplay inscribe inscription unscrew discrete discretion scrumptious scruffy scrawl',
      er:
        'her were there here very every after other over never under water number better together person ' +
        'power paper letter answer mother father brother sister teacher later river winter summer flower ' +
        'tiger finger dinner corner center energy service interest hero merit error perfect perhaps ' +
        'period',
      re:
        'are were here there where more before red read ready real really reason return report rest ' +
        'result free tree three great green dream cream area care share fire sure pure store score fresh ' +
        'present interest agree street dress predict',
      ed:
        'red bed fed led wed need used called asked played wanted looked worked needed started decided ' +
        'ended edge education edit editor medal medium media credit speed seed feed weed shed sled sped ' +
        'bedroom incredible pedal medical wedding hedge ledge pledge breed greed freed tired named moved ' +
        'loved liked',
      ly:
        'only early really family likely simply quickly easily nearly finally usually actually slowly ' +
        'quietly clearly happily daily fly reply supply apply lily jelly belly lonely lovely friendly ' +
        'lively silly rely lyric ally rally tally',
      ch:
        'each much such which child children change check choose church teach teacher reach rich chair ' +
        'cheese chicken chocolate chance chapter character cheap chest chin catch match watch lunch beach ' +
        'peach bench branch kitchen school machine march search touch coach speech',
      sh:
        'she show shop ship shoe short should shape share sharp shell shine shirt shout shower fish dish ' +
        'wish push rush brush cash wash flash fresh finish shadow sheep shelf shield shift shy shore ' +
        'shake shall mushroom fashion cushion splash polish publish establish accomplish',
      wh:
        'whales wheels whenever wherever whoever whatever whispered whistled what when where which who ' +
        'why while white whole whom whose wheel whale wheat whisper whistle whiskers whether somewhere ' +
        'anywhere everywhere nowhere meanwhile worthwhile overwhelm wholesale whirl whiz whimsical whisk',
      ph:
        'phrases photos phones graphic graphics physician pharmacist dolphins elephants alphabetical ' +
        'phone photo phrase physical physics phase graph paragraph photograph alphabet elephant dolphin ' +
        'trophy sphere pharmacy philosophy phenomenon emphasis geography biography autograph symphony ' +
        'triumph nephew orphan microphone telephone headphones catastrophe atmosphere',
      pre:
        'prepared presents pressed pressing preheat prepaid presenter preference preferred prescribe ' +
        'prediction preschool present prepare prefer press pretty prevent previous predict presence ' +
        'preserve president pressure preview premium precious precise prefix prehistoric pretend prevail ' +
        'express impress interpret represent compress spread supreme prey',
      pro:
        'progress protected provided produced promised problem program project provide process produce ' +
        'product protect promise proud prove profile prompt proper property protein proposal approach ' +
        'improve approve profit professor profession promote pronounce propose prospect protest prototype ' +
        'proverb province procedure',
      con:
        'control consider continue contact contain content contest context contract contrast contribute ' +
        'convert convince concert concern conclude condition confident confirm connect conscious constant ' +
        'construct consult consume second icon bacon falcon cone cones economy reconsider beacon silicon',
      com:
        'come common company compare complete computer comfort comment commit community compact compass ' +
        'compete complex compose compound comedy comic combine comb become welcome income outcome ' +
        'recommend accomplish accommodate overcome comma command commerce companion competition ' +
        'composition compute',
      able:
        'tables cables stables manageable renewable able table cable stable fable capable available ' +
        'comfortable valuable suitable reliable enjoyable notable unable vegetable portable adorable ' +
        'affordable favorable remarkable reasonable acceptable predictable washable breakable readable ' +
        'likable lovable disable enable probable durable',
      less:
        'less unless lesson lessons careless useless endless helpless homeless hopeless harmless fearless ' +
        'restless priceless timeless wireless painless spotless regardless nevertheless needless ' +
        'pointless thoughtless countless colorless tireless breathless sleepless weightless effortless ' +
        'selfless blessed blessing lessen bless flawless seamless',
      ness:
        'loudness neatness stillness smoothness business happiness kindness darkness sadness weakness ' +
        'illness fitness witness wellness awareness goodness fairness softness sweetness brightness ' +
        'freshness emptiness loneliness readiness wilderness harness fondness greatness thickness ' +
        'sickness openness laziness fullness politeness firmness gentleness tidiness',
      qu:
        'quick quickly quite quiet question quality quarter queen quest quote quiz equal square squad ' +
        'squeeze request require liquid unique technique frequent conquer earthquake aquarium banquet ' +
        'squirrel squash queue quilt quit quack quake quantity sequence antique',
      ck:
        'back black check clock duck lock luck neck pack pick quick rock sick sock stick stuck truck ' +
        'track trick kick knock snack block chicken jacket pocket rocket ticket bucket packet sticker ' +
        'cracker lucky quickly backpack',
      ou:
        'you out our about would could should house mouse found sound round ground around young touch ' +
        'thought though through enough country cousin double trouble famous serious cloud loud proud ' +
        'shout south mouth hour four pour your group soup route tour mountain count amount fountain ' +
        'bounce ounce flour sour'
    }
  };
})(window.TD = window.TD || {});
