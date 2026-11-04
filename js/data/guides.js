/* TypeDash Academy — guides (reading lessons placed between episodes) and one-line typing tips */
(function (TD) {
  'use strict';
  TD.data = TD.data || {};

  TD.data.guides = [
    // ------------------------------------------------------------------ Chapter 1
    {
      id: "welcome",
      title: "Welcome to TypeDash Academy",
      icon: "🚀",
      before: "1.1",
      minutes: 3,
      summary: "How the course works: short episodes, stars, goals and a small daily habit.",
      blocks: [
        { type: "p", text: "Touch typing means typing without looking at the keys. Your eyes stay on the screen while your fingers find every key by feel. It is not a talent you are born with. It is a skill built from short, repeated practice, and this course builds it one small step at a time." },
        { type: "h", text: "How the course works" },
        { type: "list", items: [
          "**12 chapters, 76 episodes.** You start with eight home keys and finish with real-world text, numbers, code and speed milestones.",
          "**Short episodes.** Most take 3 to 7 minutes: meet a pattern, repeat it, use it in real words, then try a quick speed challenge.",
          "**Guides like this one** sit between episodes. They explain the why and the how, so your practice gets smarter, not just longer.",
          "**It adapts to you.** The course notices the keys you miss most and works them into your drills and workouts."
        ] },
        { type: "h", text: "Stars and goals" },
        { type: "list", items: [
          "★ You finished the episode and reached its pass accuracy. The next episode unlocks.",
          "★★ You also reached the episode's accuracy goal.",
          "★★★ You reached the accuracy goal *and* the speed goal."
        ] },
        { type: "tip", title: "Chase stars in the right order", text: "Accuracy first, speed second. Two calm stars beat one rushed star, because clean repetitions build clean habits. The third star comes on its own." },
        { type: "h", text: "The daily habit" },
        { type: "p", text: "Ten to fifteen focused minutes a day beats a two-hour session once a week. Your brain locks in new movements between sessions, especially while you sleep, so little and often wins every time. Your progress is saved automatically in this browser, and your streak grows with every day you practise." },
        { type: "steps", items: [
          "Read the guide when one appears. They are short.",
          "Play the next episode at a calm, comfortable pace.",
          "Replay any episode with fewer than two stars.",
          "Stop while you still feel fresh, and come back tomorrow."
        ] },
        { type: "try", text: "fj fj fj fj", caption: "Your first taste: rest your index fingers on [[F]] and [[J]], type this, and tap the space bar with a thumb." }
      ]
    },
    {
      id: "posture",
      title: "Sit Like a Pro",
      icon: "🪑",
      before: "1.1",
      minutes: 3,
      summary: "Set up your chair, screen and hands so typing feels light and easy, even in long sessions.",
      blocks: [
        { type: "p", text: "Good posture is not about looking tidy. Raised shoulders and bent wrists make your fingers slower and tire you out. A relaxed setup lets you type longer, faster and without aches." },
        { type: "steps", items: [
          "**Feet flat** on the floor or on a footrest, knees roughly level with your hips.",
          "**Sit back** in the chair with your back supported. Do not hunch toward the screen.",
          "**Elbows** hang loosely at your sides, bent at about 90 degrees.",
          "**Wrists** float straight and level, hovering just above the keyboard instead of bending up or down.",
          "**Fingers** curve gently, as if holding a small ball, with the fingertips resting on the keys.",
          "**Screen** about an arm's length away, with its top edge at or slightly below eye level."
        ] },
        { type: "compare", good: "Wrists straight and floating, fingers curved, shoulders low and loose.", bad: "Wrists resting on the desk edge and bent upward, flat fingers, shoulders creeping up toward your ears." },
        { type: "tip", title: "A light touch", text: "Press each key only as hard as it needs. Hammering the keys tires your hands quickly. A light, springy touch is faster, quieter and kinder to your fingers." },
        { type: "h", text: "On a laptop?" },
        { type: "p", text: "Laptop keyboards are perfectly fine for learning. If you can, raise the screen on a stand or a stack of books and plug in an external keyboard so your neck stays straight. If not, sit back and keep your wrists floating above the keys." },
        { type: "warn", title: "Listen to your body", text: "If your wrists, hands or neck start to ache, stop and rest. Pain is never part of the training. Every 15 to 20 minutes, shake out your hands and roll your shoulders." },
        { type: "try", text: "ff jj ff jj", caption: "Posture check: sit as described, curve your fingers and type this slowly and lightly." }
      ]
    },
    {
      id: "finger-map",
      title: "Your Finger Map",
      icon: "✋",
      before: "1.2",
      minutes: 3,
      summary: "Every key belongs to exactly one finger. Learn the zones once and use them for life.",
      blocks: [
        { type: "p", text: "In touch typing, every key has an owner. Each finger looks after one zone: a slanted column of keys running from the number row down to the bottom row. When every finger stays in its own lane, you never need to look, because your hands always know where they are." },
        { type: "fingers", caption: "Each colour is one finger. Notice how the columns slant: up and to the left, down and to the right." },
        { type: "h", text: "The eight home keys" },
        { type: "p", text: "Your fingers start on the home row. The left hand rests on [[A]] [[S]] [[D]] [[F]] and the right hand on [[J]] [[K]] [[L]] [[;]]. Your thumbs rest lightly on the space bar. Every movement starts here and comes back here." },
        { type: "keys", keys: "asdfjkl;", caption: "The home keys: pinky, ring, middle and index finger of each hand." },
        { type: "list", items: [
          "**Index fingers** do the most work and cover two columns each. Left: F G R T V B, plus 4 and 5. Right: J H U Y N M, plus 6 and 7.",
          "**Middle fingers:** D E C and 3 on the left, K I comma and 8 on the right.",
          "**Ring fingers:** S W X and 2 on the left, L O period and 9 on the right.",
          "**Pinkies:** A Q Z and 1 on the left, plus Tab, Caps Lock and the left Shift. On the right: ; P slash and 0, plus the quote, bracket, Enter, Backspace and right Shift keys.",
          "**Thumbs:** the space bar."
        ] },
        { type: "tip", title: "Stay in your lane", text: "Even when another finger feels quicker, use the correct one. Shortcuts feel faster today, but they put a ceiling on your speed later." },
        { type: "try", text: "f j f j ff jj fj fj", caption: "Left index on [[F]], right index on [[J]]. Type it without looking down." }
      ]
    },
    {
      id: "home-anchor",
      title: "Anchor Home and Stop Looking",
      icon: "⚓",
      before: "1.5",
      minutes: 3,
      summary: "Use the F and J bumps to find home by touch, and return there after every key.",
      blocks: [
        { type: "p", text: "Run a fingertip over [[F]] and [[J]]. Each one has a small raised bump or bar. These are your anchors: your index fingers can feel them without any help from your eyes, so you can always find home, even in the dark." },
        { type: "keys", keys: "fj", caption: "The two anchor keys. Your index fingers live here." },
        { type: "steps", items: [
          "Look at the screen, not the keyboard.",
          "Slide your index fingers over the keys until each one feels a bump.",
          "Let your other fingers settle naturally: A S D on the left, K L ; on the right.",
          "Rest your thumbs on the space bar. You are home."
        ] },
        { type: "h", text: "The return habit" },
        { type: "p", text: "Every reach away from home ends with a return. A finger taps its key, then springs straight back to its home key. This is what keeps you oriented when you are not looking, and it is why the early chapters spend so much time on the home row." },
        { type: "compare", good: "Lost your place? Pause, feel for the bumps, carry on.", bad: "Glancing down at the keyboard every time you are unsure." },
        { type: "warn", title: "The peeking habit", text: "Every peek teaches your brain that it needs your eyes to type. If the urge is strong, drape a light cloth or a tea towel over your hands for a few sessions. It feels hard at first and gets easy fast." },
        { type: "tip", title: "Feel, then type", text: "Each time you recover your position by touch instead of by sight, the habit gets stronger. A slow keystroke made without looking is worth more than a quick one made with a peek." },
        { type: "try", text: "asdf jkl; asdf jkl; fj dk sl a;", caption: "Type it, lift your hands off the keyboard, find the bumps again by touch, and type it once more." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 2
    {
      id: "muscle-memory",
      title: "How Muscle Memory Is Built",
      icon: "🧠",
      before: "2.1",
      minutes: 3,
      summary: "Why simple repetition works, and why slow, clean reps beat fast, messy ones.",
      blocks: [
        { type: "p", text: "Right now you probably think about every key: which finger, which row, which direction. That is completely normal. With enough clean repetitions, your brain hands each movement over from slow, conscious control to fast, automatic control. That is muscle memory, and it is what lets experts type without thinking about letters at all." },
        { type: "h", text: "The three stages of a skill" },
        { type: "steps", items: [
          "**Thinking:** you find each key on purpose. Slow, careful and effortful.",
          "**Linking:** keys join into small patterns like `fj` or `asdf`. You start to think in chunks.",
          "**Automatic:** whole words flow out by themselves, and your attention moves to the text instead of the keys."
        ] },
        { type: "p", text: "Chapter 2 repeats the same small patterns on purpose. It can feel almost too easy, but easy, clean repetitions are exactly what move a pattern from thinking to linking." },
        { type: "tip", title: "Slow is smooth, smooth is fast", text: "Type at a pace where you almost never miss. Your fingers learn exactly the movement you repeat, so one clean slow rep teaches more than three messy fast ones." },
        { type: "warn", title: "Mistakes are reps too", text: "If you rush and miss the same key again and again, you are practising the miss. Slow down until it is clean, then speed up gradually." },
        { type: "compare", good: "Steady, even keystrokes and almost no errors.", bad: "Bursts of speed followed by a scramble to recover." },
        { type: "h", text: "Let sleep do some of the work" },
        { type: "p", text: "Much of the learning happens after practice, while you rest and sleep. That is why short daily sessions work so well: practise, rest, and come back to find yesterday's hard pattern a little easier." },
        { type: "try", text: "ff jj dd kk ss ll aa ;; fj dk sl a;", caption: "Calm and even. Aim for zero mistakes, not for speed." }
      ]
    },
    {
      id: "space-thumb",
      title: "The Space Bar Thumb",
      icon: "👍",
      before: "2.2",
      minutes: 2,
      summary: "Space is the key you press most. Give it one relaxed thumb and a light, quick tap.",
      blocks: [
        { type: "p", text: "Roughly one keystroke in every five or six is a space, so a clean space bar habit pays off on every single word. The rule is simple: tap it with a thumb, lightly, without moving the rest of your hand." },
        { type: "keys", keys: "fj ", caption: "Index fingers stay anchored on F and J while a thumb taps the space bar." },
        { type: "list", items: [
          "Choose **one thumb** and use it every time. Most people use the right thumb. If the left feels more natural, that is fine too. Consistency is what matters.",
          "**Tap, do not press.** A quick bounce off the bar, like a light drum hit.",
          "Let the other thumb rest lightly near the bar, out of the way.",
          "Keep your fingers on the home row while you tap. The space bar should never pull your hands away from home."
        ] },
        { type: "compare", good: "A quick thumb tap while the fingers stay on their home keys.", bad: "Hitting space with a finger, or slapping the bar with the side of your hand." },
        { type: "tip", title: "The space belongs to the word", text: "Think of the space as the last letter of each word. *sad* plus its space is one movement, not a word, then a pause, then a space." },
        { type: "try", text: "a; a; sad sad lad lad fad fad ask ask", caption: "One thumb, light taps, and no pause before each space." }
      ]
    },
    {
      id: "accuracy-first",
      title: "Accuracy First: How Your Score Works",
      icon: "🎯",
      before: "2.4",
      minutes: 3,
      summary: "What WPM and accuracy really measure, and why accuracy is the fastest road to speed.",
      blocks: [
        { type: "p", text: "Every episode reports two numbers: your speed in words per minute (WPM) and your accuracy. Knowing how they are calculated shows you exactly what to work on." },
        { type: "h", text: "Words per minute" },
        { type: "p", text: "A word is counted as five characters, spaces included, so long and short words are scored fairly. **WPM = (correct characters / 5) per minute.** Type 150 correct characters in one minute and you are typing at 30 WPM. Only correct characters count toward your speed." },
        { type: "h", text: "Accuracy" },
        { type: "p", text: "**Accuracy = correct keystrokes / all keystrokes.** Press 100 keys with 4 wrong ones and your accuracy is 96%. A wrong key still counts even if you fix it afterwards, because the real goal is to hit the right key the first time." },
        { type: "tip", title: "The 95% rule", text: "Keep your accuracy at 95% or higher. If it drops below that, slow down. If you stay above 98% for a while, you have room to push the pace a little." },
        { type: "h", text: "Why accuracy wins" },
        { type: "list", items: [
          "**Errors cost double.** In real typing you lose time making the mistake and again fixing it.",
          "**Your fingers learn what you repeat.** Clean reps build clean habits; sloppy reps build sloppy ones.",
          "**Speed arrives on its own.** As movements become automatic, you get faster without trying. Accuracy rarely improves by itself."
        ] },
        { type: "compare", good: "25 WPM at 98% accuracy: calm, steady and improving every week.", bad: "35 WPM at 85% accuracy: fast fingers, constant fixing and the same errors every day." },
        { type: "p", text: "Through chapter 7, a wrong key does not move you forward. Just press the right key and carry on. That keeps every repetition clean while you build the basics." },
        { type: "try", text: "a sad lad asks dad; a lad falls; dad asks", caption: "Go for 100% accuracy. Speed does not matter here at all." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 3
    {
      id: "reach-up",
      title: "Reaching Up to the Top Row",
      icon: "⬆️",
      before: "3.1",
      minutes: 3,
      summary: "Reach up with one finger, tap, and spring back home. The rest of the hand stays put.",
      blocks: [
        { type: "p", text: "The top row brings ten new letters, including some of the most common in English: E, T, O, I and R. Each one is a short reach up from a home key, made by the finger that owns that column." },
        { type: "keys", keys: "qwertyuiop", caption: "The top row. Each key belongs to the finger whose home key sits just below it." },
        { type: "list", items: [
          "[[A]] reaches up to [[Q]] (left pinky)",
          "[[S]] reaches up to [[W]] (left ring)",
          "[[D]] reaches up to [[E]] (left middle)",
          "[[F]] reaches up to [[R]] and [[T]] (left index)",
          "[[J]] reaches up to [[U]] and [[Y]] (right index)",
          "[[K]] reaches up to [[I]] (right middle)",
          "[[L]] reaches up to [[O]] (right ring)",
          "[[;]] reaches up to [[P]] (right pinky)"
        ] },
        { type: "steps", items: [
          "Keep your other fingers resting lightly on their home keys.",
          "Extend just the one finger up toward the key.",
          "Tap the key with your fingertip.",
          "Spring straight back to the home key."
        ] },
        { type: "tip", title: "Move the finger, not the hand", text: "If your wrist lifts or slides, the other fingers lose home and the next key becomes a guess. Keep the movement small and let the hand stay anchored." },
        { type: "warn", title: "T and Y are stretches", text: "T and Y sit toward the middle of the keyboard, a longer diagonal reach for your index fingers. They feel awkward at first. You will meet them in episode 3.2." },
        { type: "try", text: "asdf jkl; fg jh a lad has a glass flask", caption: "A home row warm-up. Every top row reach starts and ends on these keys." }
      ]
    },
    {
      id: "top-row-patterns",
      title: "Top Row Patterns and Tricks",
      icon: "🔁",
      before: "3.4",
      minutes: 3,
      summary: "Spot the patterns: rolls like we and er, tricky same-finger jumps, and the words they unlock.",
      blocks: [
        { type: "p", text: "With the home and top rows you can already type hundreds of real words: *type*, *write*, *quiet*, *power*, *story*, *tower*. Expert typists do not see these as strings of letters. They see small patterns that repeat again and again." },
        { type: "h", text: "Rolls" },
        { type: "p", text: "A roll is two or more keys typed one after another by neighbouring fingers of the same hand, like a little drum roll: *we*, *er*, *re*, *io*, *op*. Rolls are fast because the fingers fall in sequence while the hand stays still." },
        { type: "try", text: "we we er er re re io io op op ui ui", caption: "Let the fingers fall in sequence, like drumming on a table." },
        { type: "h", text: "Same-finger jumps" },
        { type: "p", text: "The slowest moves are the ones where one finger has to hit two different keys in a row. Spot them and give them a little extra care:" },
        { type: "list", items: [
          "**de, ed** with the left middle finger",
          "**fr, rt, tr, gr** with the left index finger",
          "**ju, hu, uh, yu** with the right index finger",
          "**ki, ik** with the right middle finger",
          "**lo, ol** with the right ring finger"
        ] },
        { type: "tip", title: "See the whole word first", text: "Glance at the whole word before you type it. *power* is just two quick rolls, po and wer, instead of five separate decisions." },
        { type: "warn", title: "Watch Q and P", text: "The pinkies are your weakest fingers, and Q and P are reaches for them. Keep each reach short and come straight back to [[A]] and [[;]]." },
        { type: "try", text: "type write quiet power tower quote you your try", caption: "Real words from the top two rows. Notice which parts roll and which parts jump." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 4
    {
      id: "reach-down",
      title: "Reaching Down to the Bottom Row",
      icon: "⬇️",
      before: "4.1",
      minutes: 3,
      summary: "Curl your fingers down for Z X C V B N M while your wrists stay level and still.",
      blocks: [
        { type: "p", text: "The bottom row is the trickiest of the three letter rows, because your fingers have to curl down and back toward your palm. The secret is the same as for the top row: move one finger, keep the hand still, and return home." },
        { type: "keys", keys: "zxcvbnm", caption: "The bottom row letters. Each one is a short curl down from a home key." },
        { type: "list", items: [
          "[[A]] curls down to [[Z]] (left pinky)",
          "[[S]] curls down to [[X]] (left ring)",
          "[[D]] curls down to [[C]] (left middle)",
          "[[F]] curls down to [[V]] and stretches a little further right to [[B]] (left index)",
          "[[J]] curls down to [[M]] and down to the left for [[N]] (right index)",
          "Later, [[K]] curls down to the comma and [[L]] to the period."
        ] },
        { type: "warn", title: "B belongs to the left hand", text: "B sits near the middle of the keyboard, and many beginners grab it with the right hand. In touch typing, B is always the left index finger." },
        { type: "compare", good: "Curl the finger down from the knuckle. The wrist stays level and the other fingers keep their home keys.", bad: "Dropping the whole hand or twisting the wrist to reach Z or X." },
        { type: "tip", title: "Patience for Z and X", text: "Z and X use your two weakest fingers. Go slowly, keep the reach small, and let precision come before speed." },
        { type: "try", text: "fgf jhj ded kik sws lol aqa ;p;", caption: "Out and back: every reach returns home. The bottom row works the same way, just downward." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 5
    {
      id: "rolls-and-alternation",
      title: "Rolls and Hand Alternation",
      icon: "🥁",
      before: "5.1",
      minutes: 3,
      summary: "Two secrets of fast typists: let the hands take turns, and let the fingers roll.",
      blocks: [
        { type: "p", text: "Watch a fast typist and their hands look surprisingly calm. That is because the biggest speed tricks are about flow, not raw finger speed: alternating hands and rolling fingers." },
        { type: "h", text: "Hand alternation" },
        { type: "p", text: "When neighbouring letters fall on opposite hands, one hand can get ready for its next key while the other is still typing. Words like *the*, *sign*, *girl* and *problem* bounce left, right, left, right, and they are some of the fastest words you will ever type." },
        { type: "try", text: "the sign girl hand they work make problem", caption: "Feel the left-right bounce. Each hand prepares while the other one types." },
        { type: "h", text: "Finger rolls" },
        { type: "p", text: "When neighbouring letters are on the same hand but different fingers, they can roll: *as*, *df*, *we*, *io* in one smooth wave. Inward rolls, moving from the pinky toward the index finger, usually feel the smoothest." },
        { type: "try", text: "as df jk l; were ask oil read", caption: "Let each roll flow as one smooth wave." },
        { type: "h", text: "The slow spots" },
        { type: "p", text: "The slowest pairs are **same-finger jumps**, where one finger must hit two different keys in a row, as in *ed*, *ce*, *un*, *ny* and *br*. Spot them in a word and give them a little extra care." },
        { type: "list", items: [
          "**Alternating hands:** the fastest. Let them fly.",
          "**Rolls on one hand:** fast once they are familiar.",
          "**Same-finger jumps:** the slowest. Practise them on purpose."
        ] },
        { type: "tip", title: "Smooth out the hard pairs", text: "Fast typists are not fast on every pair. They are just never slow on any of them. Your weak-key drills target exactly those spots." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 6
    {
      id: "chunking",
      title: "Read Ahead: Type Words, Not Letters",
      icon: "👀",
      before: "6.1",
      minutes: 3,
      summary: "Stop spelling letter by letter. See whole words, read one word ahead, and let them flow.",
      blocks: [
        { type: "p", text: "Beginners read a letter, type it, then read the next one. Skilled typists read whole words, even whole phrases, and their fingers play each word as a single movement. This is called chunking, and it is the bridge between knowing the keys and typing fast." },
        { type: "steps", items: [
          "**Letters:** t, h, e. Each key is a separate decision.",
          "**Pieces:** th plus e. Common pairs start to group together.",
          "**Words:** *the* is one quick gesture, done before you have even thought about it.",
          "**Phrases:** *in the* and *of the* flow out as one."
        ] },
        { type: "h", text: "Read one word ahead" },
        { type: "p", text: "While your fingers type the current word, let your eyes move on to the next one. This hides the time it takes to read and plan, so there are no gaps between words. It feels strange for a few sessions, then it becomes natural." },
        { type: "tip", title: "Keep your eyes moving", text: "If you stare at the cursor, every word arrives as a surprise. Let your eyes run slightly ahead of your fingers, the way they do when you read aloud." },
        { type: "compare", good: "Eyes one word ahead, each word typed as a short burst, no pause at the spaces.", bad: "Eyes glued to the cursor, sounding out each letter, stopping after every word." },
        { type: "p", text: "Short, common words are the first to become automatic, which is why this chapter builds up from two-letter words to longer ones." },
        { type: "try", text: "the and you for are was with this that have from they", caption: "Twelve of the most common words in English. Type each one as a single burst." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 7
    {
      id: "letter-clusters",
      title: "Letter Clusters: Free Speed",
      icon: "🧩",
      before: "7.1",
      minutes: 3,
      summary: "A handful of groups like th, ing and tion appear everywhere. Master them once and profit forever.",
      blocks: [
        { type: "p", text: "English is full of repeating letter groups. A small set of them, such as th, he, in, er, an, ing, ion and tion, shows up in a huge share of everything you will ever type. Every cluster you turn into a single automatic movement is speed you collect in almost every sentence." },
        { type: "list", items: [
          "**th** is the most common letter pair in English: the, that, this, with, they, think.",
          "**ing** ends thousands of words: going, typing, thinking, morning.",
          "**tion** turns verbs into nouns: action, nation, question, station.",
          "**er**, **re**, **ed** and **ly** sit at the ends of countless words.",
          "**ough** and **ight** look scary but keep repeating: through, thought, night, right, light."
        ] },
        { type: "keys", keys: "th", caption: "T is the left index finger, H the right index finger. Because th alternates hands, it can be very fast." },
        { type: "h", text: "How to drill a cluster" },
        { type: "steps", items: [
          "Type the cluster on its own until it feels like one movement: th th th.",
          "Type it inside short words: the, that, with.",
          "Type it inside longer words: whether, nothing, together.",
          "Come back to it the next day. Clusters stick with spaced repetition."
        ] },
        { type: "tip", title: "Think in sounds", text: "Try to hear clusters instead of spelling them. When tion is simply the sound \"shun\", your fingers learn to fire t, i, o, n as one gesture." },
        { type: "try", text: "th the that with ing going doing tion action nation", caption: "Each cluster on its own, then inside real words." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 8
    {
      id: "shift-technique",
      title: "Capitals: The Opposite-Hand Shift",
      icon: "🔠",
      before: "8.3",
      minutes: 3,
      summary: "One hand holds Shift while the other types the letter. Faster, more accurate and easier on your pinkies.",
      blocks: [
        { type: "p", text: "To type a capital, hold [[Shift]] and press the letter. The rule the pros follow is simple: **use the Shift key on the opposite side from the letter.** The left pinky holds the left [[Shift]] for right-hand letters, and the right pinky holds the right [[Shift]] for left-hand letters." },
        { type: "keys", keys: "J", caption: "A capital J: the right index finger types J while the left pinky holds the left Shift." },
        { type: "steps", items: [
          "Reach the opposite pinky out to its [[Shift]] key and hold it down.",
          "Type the letter with its usual finger.",
          "Release [[Shift]] and bring the pinky back home."
        ] },
        { type: "list", items: [
          "**Left-hand capitals** (Q W E R T A S D F G Z X C V B): use the right [[Shift]].",
          "**Right-hand capitals** (Y U I O P H J K L N M): use the left [[Shift]].",
          "**Sentence starts:** full stop, space, then [[Shift]] and the capital, all in one smooth motion."
        ] },
        { type: "compare", good: "For a capital S, the right pinky holds the right Shift while the left ring finger types S. Both hands stay balanced.", bad: "Holding the left Shift and twisting the same hand to reach S, or switching Caps Lock on and off for one letter." },
        { type: "tip", title: "Release cleanly", text: "A common slip is holding Shift a moment too long and getting two capitals, as in THe. Let go of [[Shift]] as soon as the capital is down." },
        { type: "warn", title: "Leave Caps Lock alone", text: "[[Caps Lock]] is for long runs of capitals only. For a single capital, switching it on and off costs two extra keystrokes and is easy to get wrong." }
      ]
    },
    {
      id: "punctuation",
      title: "Punctuation Without Looking",
      icon: "✏️",
      before: "8.4",
      minutes: 3,
      summary: "Commas, full stops and friends live under your right hand. Learn the reaches and the spacing rules.",
      blocks: [
        { type: "p", text: "Most punctuation keys belong to the right hand: the middle, ring and pinky fingers. They follow the same column rules as the letters, so your fingers already know most of the movements." },
        { type: "keys", keys: ",./;'", caption: "Comma, period, slash, semicolon and quote: all right-hand keys." },
        { type: "list", items: [
          "**Comma:** right middle finger, a curl down from [[K]].",
          "**Full stop:** right ring finger, a curl down from [[L]].",
          "**Question mark:** hold the left [[Shift]] and press [[/]] with the right pinky.",
          "**Exclamation mark:** hold the right [[Shift]] and press [[1]] with the left pinky.",
          "**Apostrophe and quotes:** right pinky, one key to the right of [[;]]. Add the left [[Shift]] for double quotes."
        ] },
        { type: "h", text: "Spacing rules" },
        { type: "list", items: [
          "One space after a comma, full stop, question mark or exclamation mark.",
          "No space before punctuation: *Hi, Sam.* and never *Hi , Sam .*",
          "The end of a sentence has its own rhythm: full stop, thumb on space, Shift, capital."
        ] },
        { type: "tip", title: "Punctuation is part of the word", text: "Type *done.* or *yes,* as one unit, just like the word itself. Pausing before punctuation is one of the most common hidden slowdowns." },
        { type: "warn", title: "Comma or full stop?", text: "They sit side by side and are easy to swap. The comma is the middle finger (the K column); the full stop is the ring finger (the L column)." },
        { type: "try", text: "Sam ran home. Lisa sat down. Tom met Kim. It is late.", caption: "Capital, words, full stop, space. Feel the rhythm of a sentence ending." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 9
    {
      id: "speed-vs-accuracy",
      title: "Building Speed the Smart Way",
      icon: "⚡",
      before: "9.1",
      minutes: 3,
      summary: "How to push your speed without wrecking your accuracy: speed bursts, the 95% rule and steady trends.",
      blocks: [
        { type: "p", text: "You have built clean technique. Now it is time to go faster. Speed does not come from hitting the keys harder or moving your fingers frantically. It comes from removing hesitation: fewer pauses between keys, fewer pauses between words and fewer corrections." },
        { type: "h", text: "The 95% rule" },
        { type: "p", text: "Push your pace only while your accuracy stays at 95% or above. When it drops lower, ease off until it recovers. Speed built on top of errors does not last." },
        { type: "h", text: "Speed bursts" },
        { type: "steps", items: [
          "Type a short text about 10 to 20% faster than feels comfortable.",
          "Accept a few extra errors, but keep your form: fingers on home, light touch, eyes on the screen.",
          "Then type a similar text at your normal pace. It will suddenly feel easier.",
          "Repeat in short sets. Bursts stretch your comfort zone; normal runs make the new speed stick."
        ] },
        { type: "tip", title: "Short tests, big lessons", text: "The 15 and 30 second tests in this chapter are perfect for bursts: too short to get tired, long enough to feel a new pace." },
        { type: "compare", good: "Push the pace in short bursts, then consolidate with steady, accurate runs.", bad: "Typing flat out all the time, rushing every test and fixing errors constantly." },
        { type: "warn", title: "Do not chase every number", text: "Your WPM will bounce up and down from test to test. That is normal. Judge your progress by the trend over a week, not by a single result." },
        { type: "try", text: "The sun is up and the day is new. We can do this, one word at a time.", caption: "Type it once calmly, then once more, a little faster." }
      ]
    },
    {
      id: "rhythm",
      title: "Find Your Rhythm",
      icon: "🎵",
      before: "9.5",
      minutes: 3,
      summary: "Even, steady keystrokes beat bursts and pauses. Typing is closer to music than you think.",
      blocks: [
        { type: "p", text: "Listen to an expert type and you hear a steady patter, almost like rain. Listen to a beginner and you hear bursts and silences: quick on easy letters, long pauses before hard ones. Smoothing out that rhythm is one of the quickest ways to raise your speed." },
        { type: "list", items: [
          "**Pauses are the real speed killers.** Moving your fingers faster rarely helps. Removing the stops does.",
          "**A steady beat makes you plan ahead.** You read the next word while typing this one.",
          "**Even keystrokes are more accurate.** Rushing the easy letters is where many errors come from."
        ] },
        { type: "h", text: "Typing to a metronome" },
        { type: "steps", items: [
          "Start the beat a little slower than your normal pace.",
          "Press one key on every tick: letters, spaces and punctuation alike.",
          "Keep the beat steady through hard words. Slow down everywhere rather than stalling in one place.",
          "When the beat feels easy, raise it slightly."
        ] },
        { type: "tip", title: "Slow down the easy parts", text: "It sounds backwards, but typing easy letters slightly slower and hard letters at the same tempo makes you faster overall. The beat stays even and the stalls disappear." },
        { type: "compare", good: "tap, tap, tap, tap, tap: the same gap between every key.", bad: "taptaptap, pause, tap, taptap, long pause: fast, stop, fast." },
        { type: "try", text: "we can go to the park and then we will walk home to eat", caption: "Type with an even beat. Think a silent tick with every key." }
      ]
    },
    {
      id: "trust-your-fingers",
      title: "Trust Your Fingers",
      icon: "🙈",
      before: "9.6",
      minutes: 2,
      summary: "Typing blind: why not checking every letter builds speed and confidence.",
      blocks: [
        { type: "p", text: "The next episode takes away your safety nets: the on-screen keyboard is hidden, and your text may stay uncoloured until you finish. It sounds scary, but it is exactly how experienced typists work every day. They trust their fingers and check the result afterwards." },
        { type: "list", items: [
          "**You stop checking every letter.** Watching for red letters slows you down more than you think.",
          "**Your fingers become the source of truth.** You start to feel a mistake before you see it.",
          "**Confidence grows.** After a few blind runs, normal typing feels easy."
        ] },
        { type: "steps", items: [
          "Settle on the home row and feel for the bumps on [[F]] and [[J]].",
          "Read ahead and type at a calm, steady pace.",
          "If you feel a slip, do not panic. Keep going and keep your rhythm.",
          "Check the result at the end and notice which keys slipped."
        ] },
        { type: "tip", title: "Feel the error", text: "Most typists can sense a wrong keystroke before they see it: a finger that landed off-centre, or a key that felt different. Learn to trust that feeling." },
        { type: "try", text: "trust your hands and keep a steady pace to the end", caption: "Eyes on the text only, never on the keyboard." }
      ]
    },
    {
      id: "plateaus",
      title: "Breaking Through Plateaus",
      icon: "📈",
      before: "9.7",
      minutes: 3,
      summary: "Stuck at the same speed? Deliberate practice, weak-key drills and a daily workout get you moving again.",
      blocks: [
        { type: "p", text: "Almost every typist hits a plateau: weeks of practice and the number will not move. It does not mean you have reached your limit. It means your current practice has stopped challenging you." },
        { type: "h", text: "Deliberate practice" },
        { type: "p", text: "Typing the same comfortable text again and again keeps you exactly where you are. Improvement comes from practice that targets your weakest spots, with full attention, in short focused sets." },
        { type: "steps", items: [
          "**Find the weak spots.** Your stats show the keys and finger pairs with the most errors and the slowest times.",
          "**Drill them directly.** The weak-keys practice builds drills from exactly those keys.",
          "**Put them back in context.** Type real words and sentences that contain them.",
          "**Measure again** in a few days, not a few minutes."
        ] },
        { type: "tip", title: "The 10-minute daily workout", text: "A short daily mix works wonders: a warm-up, a weak-key drill, common words, a few sentences and one speed burst. Ten minutes, every day." },
        { type: "list", items: [
          "**Change the material.** New text forces your brain to read and plan in new ways.",
          "**Change the pace.** Alternate speed bursts with slow, perfect runs.",
          "**Rest.** Sometimes a plateau breaks after a day off, once your brain has caught up."
        ] },
        { type: "warn", title: "Avoid the grind", text: "Hours of tired, unfocused typing can lock in bad habits. Two short, sharp sessions beat one long, dull one." },
        { type: "try", text: "the quick brown fox jumps over the lazy dog", caption: "Every letter of the alphabet. Notice which ones slow you down: those are your next targets." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 10
    {
      id: "weak-fingers",
      title: "Training Weak Fingers",
      icon: "💪",
      before: "10.4",
      minutes: 3,
      summary: "Pinkies and ring fingers are slower by nature. Targeted, gentle drills make them reliable.",
      blocks: [
        { type: "p", text: "Your ring fingers and pinkies are weaker and less independent than your index and middle fingers. The ring finger even shares tendon connections with its neighbours, which is why it likes to move along with them. This is anatomy, not a lack of talent, and it improves with targeted practice." },
        { type: "keys", keys: "qazwsxp;/ol.", caption: "Pinky and ring finger keys: the usual suspects in an error list." },
        { type: "h", text: "How to strengthen them" },
        { type: "steps", items: [
          "**Isolate:** drill the pinky and ring keys on their own, slowly: aqa sws ;p; lol.",
          "**Combine:** words that lean on them: was, old, pizza, quiz, wool, zap.",
          "**Integrate:** sentences where they appear often.",
          "**Repeat daily:** small amounts, often. Weak fingers improve with frequency, not force."
        ] },
        { type: "compare", good: "Reaching for P with the right pinky, even when it feels slow at first.", bad: "Letting the ring finger help out with P, or moving the whole hand to hit Q." },
        { type: "tip", title: "Precision before power", text: "Do not stab with a weak finger or let the whole hand help it. Keep the motion small and precise. Strength and speed follow precision." },
        { type: "warn", title: "Do not overdo it", text: "Pinky drills can tire small muscles quickly. If your hand feels strained, stop and rest. A few minutes a day is plenty." },
        { type: "try", text: "aqa sws ;p; lol was old quiz pizza wool zap lap", caption: "Slow and precise. Let only the pinky or ring finger move." }
      ]
    },
    {
      id: "fixing-errors",
      title: "Fixing Errors Efficiently",
      icon: "🔧",
      before: "10.5",
      minutes: 3,
      summary: "When to correct, when to keep going, and how to use Backspace and Ctrl+Backspace like a pro.",
      blocks: [
        { type: "p", text: "Everyone makes mistakes, even the fastest typists. What sets them apart is how quickly they notice and fix them. In real writing, errors have to be corrected, so this is a skill worth practising on purpose." },
        { type: "h", text: "Notice early" },
        { type: "p", text: "The cheapest error is the one you catch immediately. If you feel a slip, fix it straight away: one tap of [[Backspace]], then the right key. Catching it three words later costs far more time." },
        { type: "h", text: "Your tools" },
        { type: "list", items: [
          "[[Backspace]] deletes one character. Use it for a slip you caught right away: a quick reach with the right pinky, then back home.",
          "[[Ctrl]] + [[Backspace]] deletes the whole previous word ([[Option]] + [[Backspace]] on a Mac). Use it when a word has gone wrong in several places. Retyping is faster than repairing.",
          "Never hold [[Backspace]] down and wait for it to repeat. You will almost always delete too much."
        ] },
        { type: "compare", good: "Feel the slip, one quick Backspace, retype, carry on without breaking rhythm.", bad: "Spotting an error at the end of a sentence and deleting half the line to reach it." },
        { type: "tip", title: "Stay calm", text: "An error is information, not failure. A calm correction keeps your rhythm. Frustration causes the next three errors." },
        { type: "p", text: "The error correction drills ahead train exactly this reflex: notice, fix, continue. Repeat it often enough and it happens without thinking." },
        { type: "try", text: "fix it fast and keep going, then fix the next one too.", caption: "A steady pace. If you slip, notice it, fix it calmly and carry on." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 11
    {
      id: "daily-routine",
      title: "Your Daily Practice Routine",
      icon: "📅",
      before: "11.1",
      minutes: 3,
      summary: "A simple 10 to 15 minute routine that keeps you improving long after the course ends.",
      blocks: [
        { type: "p", text: "You now know every letter, the main punctuation and the core speed techniques. From here on, progress comes from consistent practice. The good news is that it does not take long: a focused 10 to 15 minutes a day is enough to keep improving steadily." },
        { type: "h", text: "A 15-minute routine" },
        { type: "steps", items: [
          "**Warm-up (2 min):** home row and common words at an easy pace to wake up your fingers.",
          "**Weak spots (4 min):** a weak-key drill built from your own mistakes.",
          "**Real text (5 min):** sentences, an email or a paragraph: the kind of text you actually type.",
          "**Speed burst (2 min):** one or two short tests at full effort.",
          "**Cool-down (2 min):** a slow, perfect run at 100% accuracy."
        ] },
        { type: "tip", title: "Same time, every day", text: "Attach practice to something you already do: after breakfast, before checking messages, or at the start of a study session. When the trigger is automatic, the streak builds itself." },
        { type: "list", items: [
          "**Track trends, not single days.** Watch your weekly average speed and accuracy.",
          "**Use the typing you do anyway.** Messages, notes and emails are practice too. Keep your hands on home and your eyes off the keyboard.",
          "**Rest days are fine.** One missed day does not undo your progress."
        ] },
        { type: "warn", title: "Old habits return under pressure", text: "When you are in a hurry, it is tempting to look at the keys again. Resist it. Every time you type properly under pressure, the new habit wins." },
        { type: "try", text: "Hi Sam, thanks for the notes. I will send my part by Friday.", caption: "Real-world text: the kind of thing you type every day." }
      ]
    },
    {
      id: "number-row",
      title: "Conquering the Number Row",
      icon: "🔢",
      before: "11.5",
      minutes: 3,
      summary: "The longest reach on the keyboard. Learn which finger owns each number, and how to get there and back.",
      blocks: [
        { type: "p", text: "The number row sits two rows above home, so it is the longest reach you will make. Many people never learn it properly and hunt for numbers with one finger. With a clear map and a little practice, you can type dates, prices and codes without breaking your flow." },
        { type: "keys", keys: "1234567890", caption: "Each number sits at the top of a finger column you already know." },
        { type: "list", items: [
          "**Left pinky:** 1",
          "**Left ring:** 2",
          "**Left middle:** 3",
          "**Left index:** 4 and 5",
          "**Right index:** 6 and 7",
          "**Right middle:** 8",
          "**Right ring:** 9",
          "**Right pinky:** 0, then minus and equals"
        ] },
        { type: "tip", title: "Follow the column", text: "To find 3, think \"up the D, E, 3 column\". To find 8, think \"up K, I, 8\". The finger already knows the direction; it just travels one row further." },
        { type: "steps", items: [
          "Keep your hand anchored. Only the reaching finger leaves home.",
          "Reach up two rows with a straight, deliberate movement.",
          "Tap, then come straight back to the home row before the next key.",
          "Learn the shifted symbols the same way: ! @ # $ % share keys with 1 2 3 4 5."
        ] },
        { type: "warn", title: "Expect a dip", text: "Your speed and accuracy will drop on numbers for a while. That is normal for a two-row reach. Go slowly and the precision will come." },
        { type: "try", text: "qaz wsx edc rfv tgb yhn ujm ik, ol. p;", caption: "Column warm-up: each group is one finger moving down its column. The numbers sit at the top of these same columns." }
      ]
    },
    {
      id: "coding",
      title: "Typing Code and Symbols",
      icon: "💻",
      before: "11.6",
      minutes: 4,
      summary: "Brackets, braces, operators and indentation: how programmers type symbols quickly and accurately.",
      blocks: [
        { type: "p", text: "Code is full of symbols that rarely appear in everyday writing: brackets, braces, semicolons, equals signs and operators. Most of them live under your right pinky or need [[Shift]]. Learning their positions properly is a huge boost for anyone who programs." },
        { type: "keys", keys: "()[]{};=", caption: "The most common code symbols. Nearly all of them belong to the right pinky." },
        { type: "list", items: [
          "**( )** are [[Shift]] + [[9]] and [[Shift]] + [[0]]: right ring finger and right pinky, holding the left [[Shift]].",
          "**[ ]** sit just right of [[P]], right pinky. Add [[Shift]] for **{ }**.",
          "**;** and **:** share a key on the home row, right pinky.",
          "**=** and **+** share the key left of [[Backspace]]; **-** and **_** share the key beside it. Both are right pinky.",
          "**< >** are [[Shift]] + comma and [[Shift]] + period: right middle and right ring fingers.",
          "**' \"** share the key right of [[;]], right pinky."
        ] },
        { type: "h", text: "Habits that help" },
        { type: "list", items: [
          "**Type exactly what you see.** Many editors add closing brackets for you, but here every character counts.",
          "**Auto-indent:** when it is on, the leading spaces of a new line are filled in for you after [[Enter]], just like in a code editor. Focus on the code itself.",
          "**camelCase and snake_case:** practise [[Shift]] in the middle of a word (*userName*) and the underscore (*user_name*). Both are everywhere in code."
        ] },
        { type: "tip", title: "Slow down for symbols", text: "Symbol keys are long reaches for weak fingers, and one wrong bracket can break a whole program. Accuracy matters more than ever here." },
        { type: "compare", good: "Right pinky for ; and the brackets, with the opposite Shift for ( ) and { }.", bad: "Hunting for symbols with one finger and looking down for every bracket." },
        { type: "try", text: "userName totalCount isReady getValue maxSpeed", caption: "camelCase warm-up: a capital in the middle of each word. Use the opposite Shift every time." }
      ]
    },

    // ------------------------------------------------------------------ Chapter 12
    {
      id: "test-day",
      title: "Speed Test Strategy",
      icon: "🏁",
      before: "12.1",
      minutes: 3,
      summary: "Warm up, pace yourself and stay calm when it is time to hit a WPM milestone.",
      blocks: [
        { type: "p", text: "Chapter 12 is a ladder of WPM milestones: 30, 40, 50, 60, 80 and finally 100. Each rung unlocks only when you have earned the one below it. Here is how to give yourself the best chance on every attempt." },
        { type: "steps", items: [
          "**Warm up first.** Two or three minutes of easy typing. Cold fingers are slow and clumsy.",
          "**Check your posture.** Feet flat, wrists floating, shoulders down.",
          "**Start at your normal pace.** A rushed first line leads to early errors and a shaky rhythm.",
          "**Read ahead.** Keep your eyes one word in front of your fingers.",
          "**Keep going after an error.** Fix it quickly and calmly, then return to your rhythm.",
          "**Finish strong.** Many typists slow down near the end. Hold the beat to the last word."
        ] },
        { type: "tip", title: "Aim a little above the bar", text: "Practise at a pace a few WPM above the milestone. Test nerves usually cost a little speed, and you will still clear the bar." },
        { type: "compare", good: "Warm up, breathe, steady start, hold the rhythm, fix errors calmly.", bad: "Starting cold, sprinting the first line, then panicking after the first mistake." },
        { type: "warn", title: "Know when to stop", text: "If three attempts in a row fall short, stop for now. Practise something else or come back tomorrow. Tired fingers do not set records." },
        { type: "p", text: "Milestones are targets, not promises. Everyone's hands and history are different. Steady typing at 50 WPM with high accuracy is already faster than most people type, and every milestone you pass is real, earned skill." },
        { type: "try", text: "A calm start, a steady pace and a strong finish.", caption: "Say it to yourself, then type it." }
      ]
    },

    // ------------------------------------------------------------------ After the course
    {
      id: "beyond",
      title: "Beyond the Course",
      icon: "🌟",
      before: "end",
      minutes: 3,
      summary: "You made it. Here is how to keep improving and keep your skills sharp for life.",
      blocks: [
        { type: "p", text: "Congratulations! You have gone from finding the bumps on [[F]] and [[J]] to typing real text, numbers and code at speed without looking. That is a genuine skill, and it will save you hours every week for the rest of your life." },
        { type: "h", text: "Keep improving" },
        { type: "list", items: [
          "**Keep a short daily habit.** Five to ten minutes keeps you sharp; fifteen keeps you improving.",
          "**Practise on your own text.** Paste articles, notes or code you actually work with into a custom practice.",
          "**Race your ghost.** Beating your own best run is the most honest competition there is.",
          "**Revisit your weak keys.** Check your stats every week or two and drill whatever is slowest.",
          "**Teach someone.** Explaining the finger map and the home row to a friend locks in your own technique."
        ] },
        { type: "h", text: "What experts do differently" },
        { type: "list", items: [
          "They read ahead and type in words and phrases, not letters.",
          "They keep a steady rhythm and rarely stop.",
          "They fix errors instantly, without breaking their flow.",
          "They stay relaxed: light touch, loose shoulders, quiet hands."
        ] },
        { type: "tip", title: "Typing is a tool", text: "The real reward is not a number on a test. It is putting your thoughts on screen as fast as you can think them, without ever looking down." },
        { type: "try", text: "I can type without looking, and I am still getting faster.", caption: "One last line, typed the right way." }
      ]
    }
  ];

  // One-line tips, roughly ordered from first-day basics to advanced topics.
  TD.data.tips = [
    // Home row, technique and posture
    "Rest your index fingers on F and J. The small bumps let you find home without looking.",
    "After every reach, bring the finger back to its home key. Home is your map.",
    "Tap the space bar lightly with one thumb and let the other thumb rest nearby.",
    "Move only the finger that types. The rest of your hand stays on the home row.",
    "Curve your fingers as if holding a small ball. Flat fingers reach less precisely.",
    "Strike the keys with your fingertips, not the flat pads of your fingers.",
    "Let your wrists float just above the keyboard instead of resting them while you type.",
    "A light touch is a fast touch. Press each key only until it registers.",
    "Short nails help. Long nails change the angle of your fingers and cause slips.",
    "Do not rest your palms on the laptop. Floating hands reach every row more easily.",
    "Sit back with your feet flat. Good posture keeps your hands relaxed and accurate.",
    "Keep the top of your screen at or slightly below eye level.",
    "Elbows at your sides, bent about 90 degrees, with your forearms roughly level.",
    "Keep the keyboard flat or tilted slightly away from you. Steep angles bend your wrists.",
    "Drop your shoulders. If they creep toward your ears, take a breath and let them fall.",
    "Shake out your hands between sessions to release tension.",
    "If anything hurts, stop and rest. Pain is never part of the training.",
    "Rest your eyes every 20 minutes: look at something far away for about 20 seconds.",
    "Look at the screen, not your hands. The on-screen keyboard shows every key you need.",
    "Tempted to peek? Drape a light cloth over your hands for a few sessions.",
    "Lost your place? Feel for the bumps on F and J, then carry on. Never look down.",
    "Learning a new key? Say its finger once or twice as you type it: left ring, W.",
    "Use the correct finger even when another feels quicker. Shortcuts cap your speed later.",

    // Practice habits and mindset
    "Ten focused minutes a day beats an hour once a week. Little and often builds lasting skill.",
    "Replay episodes with fewer than two stars. Clean repetitions build muscle memory.",
    "Practise at the edge of your comfort zone: slightly faster than easy, never sloppy.",
    "End each session with one slow, perfect run. It leaves your fingers with a clean pattern.",
    "Take a short break every 20 minutes. Rested fingers learn faster than tired ones.",
    "Stop a session while you still feel fresh. You will be keen to come back tomorrow.",
    "Sleep helps you learn. A drill often feels easier the day after you practise it.",
    "Do not practise mistakes. If you keep missing the same key, slow down and get it right.",
    "Set a daily goal you can hit even on busy days. Consistency beats intensity.",
    "Keep your streak alive with even a five-minute session. Small days still count.",
    "Celebrate small wins: a new key learned, a clean run, one extra WPM.",
    "Everyone feels slow when they first stop looking at the keys. It passes sooner than you think.",
    "Patience now pays forever. The habits you build in this course last a lifetime.",

    // Accuracy and scoring
    "Accuracy counts every wrong keystroke, even ones you fix later. Aim to hit it right first time.",
    "The 95% rule: push your speed only while accuracy stays at 95% or higher.",
    "In WPM, a word is five characters including spaces, so long words never cheat the score.",
    "Speed is the result of accuracy and rhythm. Chase those two and speed follows.",
    "Errors are information. Notice which keys slip, then drill them on purpose.",
    "Compare yourself with last week, not with anyone else.",

    // Top and bottom rows
    "Q and P are pinky reaches. Keep them short and return to A and ; straight away.",
    "T and Y are index finger stretches toward the centre. Reach, tap and come straight back.",
    "B belongs to the left index finger, even though it sits near the middle of the keyboard.",
    "Z and X use your weakest fingers. Go slowly and let precision come before speed.",

    // Words and patterns
    "Type common words like the, and and you as single gestures, not separate letters.",
    "Read one word ahead. Your eyes plan the next word while your fingers finish this one.",
    "th is the most common letter pair in English. Make it one quick movement.",
    "Words ending in ing are everywhere. Practise i, n, g as a single roll.",
    "tion sounds like shun and appears in thousands of words. Learn it as one chunk.",
    "Words that alternate hands, like the, and, sign and they, are among the fastest to type.",
    "Same-finger pairs like ed, ce, un and my are slow spots. Give them a little extra care.",
    "Double letters, as in letter or apple, need a clean second tap. Do not rush the repeat.",
    "Inward rolls, from pinky toward index, are usually smoothest: as, df, we, er.",
    "Endings like er, ed, ly and ness repay practice in almost every sentence.",
    "Watch for common swaps: ie and ei, er and re, teh for the. Slow down at those spots.",
    "Words like were, sweater and stewardess use only the left hand. Keep that hand loose.",
    "Right-hand-only words like only, join and pumpkin give your left hand a short rest.",
    "The space after a word belongs to that word. Type the word and its space as one unit.",
    "Look for pieces inside long words: understanding is under, stand and ing.",
    "Before a hard word, take it in as a whole. Seeing it first prevents stumbles halfway.",
    "Silently say each word as you type it. It helps you read ahead and keep a rhythm.",

    // Capitals and punctuation
    "For capitals, hold the Shift key on the opposite side from the letter.",
    "Release Shift right after the capital. Holding it too long gives slips like THe.",
    "If everything comes out in CAPITALS, check Caps Lock first.",
    "Comma is the right middle finger, full stop the right ring finger. Keep them straight.",
    "Punctuation belongs to the word before it. Type the word and its comma or full stop without a pause.",
    "Press Enter with your right pinky without lifting your whole hand off home.",
    "Backspace belongs to your right pinky. Reach up, tap once and return to the home row.",

    // Speed
    "To go faster, remove the pauses rather than moving your fingers faster.",
    "Keep a steady beat. Even keystrokes beat bursts and stops.",
    "Short 15 and 30 second tests are perfect for speed bursts. Push a little past comfortable.",
    "Alternate speed bursts with calm, accurate runs. Bursts stretch you; calm runs lock it in.",
    "Warm up with a minute of easy home row typing before any speed test.",
    "Your WPM will vary from test to test. Watch the weekly average instead.",
    "Check your stats once a week. Trends tell you more than any single result.",
    "A plateau means your practice needs to change, not that you have hit your limit.",
    "Change your practice text often. New words keep your brain reading, not reciting.",
    "Work on one thing at a time: accuracy this week, rhythm next week, then speed.",
    "Use the weak-keys practice to drill exactly the keys you miss most.",
    "Race your ghost. Beating your own best run is the most honest challenge there is.",
    "Practise a few WPM above your target so test nerves cannot pull you below it.",
    "Start tests at your normal pace. A rushed first line causes early errors.",
    "Do not slow down at the end of a test. Hold your rhythm to the last word.",
    "If a test goes badly, shake out your hands, breathe and try once more. Then move on.",
    "Stay relaxed. Tension in your shoulders travels all the way down to your fingers.",
    "Trust your fingers. Most of the time they know where the keys are before you do.",
    "Your weakest finger sets your top speed. Give pinkies and ring fingers extra practice.",
    "Great typists are not fast on every key. They are just never slow on any of them.",

    // Fixing errors
    "When you feel a slip, fix it at once. Errors get more expensive the longer they live.",
    "Ctrl + Backspace deletes a whole word. On a Mac, use Option + Backspace.",
    "Never hold Backspace down. Tap it once per character, or delete the whole word.",
    "Mistyped a word twice in a row? Slow down for the next few words.",

    // Real-world typing
    "Everyday typing counts as practice. Keep your eyes off the keys in chats and emails too.",
    "Practise with text you really type: emails, notes, code. Skills transfer best from real tasks.",
    "Revisit early chapters now and then. Fundamentals get sharper with review.",

    // Numbers, symbols and code
    "Numbers follow the finger columns: 3 sits above E and D, so it belongs to the left middle finger.",
    "On the number row, keep the rest of your hand anchored. Only the reaching finger moves.",
    "Read dates in chunks: 12/05/2026 is 12, then 05, then 2026.",
    "For ( and ), hold the left Shift and use your right ring finger and pinky.",
    "Brackets and braces belong to the right pinky. Keep the reach short and come back to ;.",
    "camelCase needs Shift in the middle of a word. Use the opposite Shift as always.",
    "Type symbols slowly at first. One wrong bracket can break a whole line of code."
  ];
})(window.TD = window.TD || {});
