/* TypeDash Academy — the course: 12 chapters, 76 episodes (see docs/CONTENT-SPEC.md, section 4) */
(function (TD) {
  'use strict';
  TD.data = TD.data || {};

  // ------------------------------------------------------------------ key sets
  // Each episode's `keys` lists the characters it may use (space is always allowed).
  var LETTERS = 'abcdefghijklmnopqrstuvwxyz';
  var CAPS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var HOME8 = 'asdfjkl;';                 // 1.5 - 2.5
  var HOME = 'asdfghjkl;';                // 2.6 adds g h
  var TOP1 = HOME + 'qweruiop';           // 3.1
  var TOP = HOME + 'qwertyuiop';          // 3.2 adds t y
  var BOT1 = TOP + 'zxcvnm';              // 4.1
  var ALL = LETTERS + ';';                // 4.2 adds b: the full alphabet

  var TOP_LETTERS = 'asdfghjklqwertyuiop';
  var NO_B = 'acdefghijklmnopqrstuvwxyz';

  // Shared word lists used by more than one step.
  var INDEX_WORDS = ['fruit', 'jury', 'turn', 'burn', 'hunt', 'hurry', 'numb', 'gum', 'bug', 'tub', 'guy', 'buy',
    'fry', 'try', 'rug', 'jump', 'judge', 'thumb', 'truth', 'hymn', 'bunny', 'funny', 'tummy', 'grunt', 'human',
    'tribe', 'brave', 'graph', 'run', 'fun', 'hut', 'nut', 'tug', 'hug', 'jug', 'mug', 'bunk', 'trunk', 'fury'];
  var PING_PONG = ['problem', 'visual', 'eight', 'social', 'island', 'handle', 'formal', 'blame', 'right', 'height',
    'turkey', 'antique', 'authentic', 'emblem', 'dismal', 'chairman', 'ornament', 'shamrock', 'enamel', 'bicycle',
    'quantity', 'giant', 'panel', 'profit', 'theory', 'element', 'mantle', 'laugh'];

  function milestone(id, wpm, unlockAt, title, intro, tip) {
    return {
      id: id,
      title: title,
      summary: 'Hold ' + wpm + ' WPM for 60 seconds at 90% accuracy.',
      minutes: 3,
      keys: '*',
      newKeys: '',
      goals: { wpm: wpm, accuracy: 95 },
      pass: { wpm: wpm, accuracy: 90 },
      unlock: { bestWpm: unlockAt },
      tip: tip,
      intro: intro,
      steps: [
        { type: 'type', title: 'Warm-up', text: 'Unscored. Loosen up your fingers.', source: { kind: 'common', top: 100, count: 20 } },
        { type: 'timed', title: wpm + ' WPM test', text: '60 seconds. Reach ' + wpm + ' WPM at 90% accuracy or better.', seconds: 60, source: { kind: 'common', top: 200, count: 120 }, options: { record: 'test60' }, scored: true }
      ]
    };
  }

  TD.data.curriculum = {
    chapters: [
      // ================================================================ 1
      {
        id: 1,
        title: 'Keyboard Familiarization',
        level: 'beginner',
        goal: 'Understand finger positioning',
        summary: 'Home row, finger positioning, keyboard layout',
        episodes: [
          {
            id: '1.1',
            title: 'Meet the Keyboard',
            summary: 'Tour the letter rows and find every key.',
            minutes: 4,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 5, accuracy: 85 },
            tip: 'Letters are not in alphabetical order. You will learn them by finger, not by name.',
            intro: 'Before you type, learn the map. Letters live on three rows: the top row (Q W E R T Y), the home row (A S D F) where your fingers rest, and the bottom row (Z X C V). Find each glowing key and press it.',
            steps: [
              { type: 'learn', title: 'The three letter rows', text: 'The home row (A to L) is where your fingers live. The top row sits above it, the bottom row below it, and the long space bar is pressed with a thumb.', keys: 'asdfghjkl' },
              { type: 'keys', title: 'Top row tour', text: 'Press each glowing key, left to right.', keys: 'qwertyuiop', count: 10, order: 'sequence' },
              { type: 'keys', title: 'Home row tour', text: 'Now the home row, left to right.', keys: 'asdfghjkl', count: 9, order: 'sequence' },
              { type: 'keys', title: 'Bottom row tour', text: 'And the bottom row.', keys: 'zxcvbnm', count: 7, order: 'sequence' },
              { type: 'keys', title: 'Find any letter', text: 'Letters appear in random order. Find each one as fast as you can.', keys: LETTERS, count: 26, order: 'random' }
            ]
          },
          {
            id: '1.2',
            title: 'Left Hand Home: A S D F',
            summary: 'Place your left hand on its four home keys.',
            minutes: 4,
            keys: 'asdf',
            newKeys: 'asdf',
            goals: { wpm: 5, accuracy: 85 },
            tip: 'Tap with your fingertips and let each finger spring back to its home key.',
            intro: 'Your left hand rests on four home keys: pinky on A, ring finger on S, middle finger on D and index finger on F. Keep your fingers gently curved, as if holding a small ball.',
            steps: [
              { type: 'learn', title: 'Left hand on home', text: 'Pinky on A, ring finger on S, middle finger on D, index finger on F. Your thumb rests lightly on the space bar.', keys: 'asdf' },
              { type: 'keys', title: 'Find the left home keys', text: 'Press each key with the finger shown.', keys: 'asdf', count: 8, order: 'sequence' },
              { type: 'type', title: 'One finger at a time', text: 'Press each key twice, then tap space with your thumb.', source: { kind: 'drill', items: ['ff', 'dd', 'ss', 'aa'], each: 3 } },
              { type: 'type', title: 'Sweep and return', text: 'Roll from pinky to index, then back again.', source: { kind: 'drill', items: ['asdf', 'fdsa'], each: 3 } },
              { type: 'keys', title: 'Quick reactions', text: 'Random order now. Keep every finger on its home key.', keys: 'asdf', count: 16 },
              { type: 'type', title: 'Mini mixes', text: 'Short groups of left-hand keys.', source: { kind: 'combos', keys: 'asdf', count: 12, min: 2, max: 4 } }
            ]
          },
          {
            id: '1.3',
            title: 'Right Hand Home: J K L ;',
            summary: 'Place your right hand on its four home keys.',
            minutes: 4,
            keys: 'jkl;',
            newKeys: 'jkl;',
            goals: { wpm: 5, accuracy: 85 },
            tip: 'The semicolon (;) is a home key too. Your right pinky rests there.',
            intro: 'Your right hand mirrors the left: index finger on J, middle finger on K, ring finger on L and pinky on the semicolon (;). Both thumbs float over the space bar.',
            steps: [
              { type: 'learn', title: 'Right hand on home', text: 'Index finger on J, middle finger on K, ring finger on L, pinky on ;. Keep your wrists relaxed and lifted off the desk.', keys: 'jkl;' },
              { type: 'keys', title: 'Find the right home keys', text: 'Press each key with the finger shown.', keys: 'jkl;', count: 8, order: 'sequence' },
              { type: 'type', title: 'One finger at a time', text: 'Press each key twice, then tap space with your thumb.', source: { kind: 'drill', items: ['jj', 'kk', 'll', ';;'], each: 3 } },
              { type: 'type', title: 'Sweep and return', text: 'Roll from index to pinky, then back again.', source: { kind: 'drill', items: ['jkl;', ';lkj'], each: 3 } },
              { type: 'keys', title: 'Quick reactions', text: 'Random order now. Keep every finger on its home key.', keys: 'jkl;', count: 16 },
              { type: 'type', title: 'Mini mixes', text: 'Short groups of right-hand keys.', source: { kind: 'combos', keys: 'jkl;', count: 12, min: 2, max: 4 } }
            ]
          },
          {
            id: '1.4',
            title: 'Find the F and J Bumps',
            summary: 'Use the bumps to find home without looking.',
            minutes: 3,
            keys: 'fj',
            newKeys: 'fj',
            goals: { wpm: 6, accuracy: 85 },
            tip: 'Lost your place? Touch the bumps on F and J and you are home again.',
            intro: 'Run your index fingers over F and J: each has a small raised bump. Your left index finger lives on F and your right index finger on J, and the bumps let you find them by touch so your eyes can stay on the screen.',
            steps: [
              { type: 'learn', title: 'Feel the bumps', text: 'Close your eyes and find the bumps with both index fingers. Let the other fingers fall onto A S D and K L ;. Open your eyes: that is home position.', keys: 'fj' },
              { type: 'type', title: 'Index fingers only', text: 'Left index on F, right index on J. Alternate.', source: { kind: 'repeat', pattern: 'fj', times: 8 } },
              { type: 'type', title: 'Doubles and triples', text: 'Count the taps in your head.', source: { kind: 'text', text: 'ff jj fff jjj ff jj fff jjj ffjj jjff' } },
              { type: 'keys', title: 'Bump reflex', text: 'F or J? React without looking down.', keys: 'fj', count: 14 },
              { type: 'type', title: 'Back to the bumps', text: 'Random groups of F and J.', source: { kind: 'combos', keys: 'fj', count: 10, min: 2, max: 4 } }
            ]
          },
          {
            id: '1.5',
            title: 'Home Position Without Looking',
            summary: 'Type the home row with the keyboard hidden.',
            minutes: 4,
            keys: HOME8,
            newKeys: '',
            goals: { wpm: 6, accuracy: 85 },
            tip: 'If you feel lost, pause, find the bumps, and continue. Never peek at your hands.',
            intro: 'The on-screen keyboard disappears for most of this episode. Trust your fingers: index fingers on the bumps, eyes on the text. Accuracy matters far more than speed here.',
            steps: [
              { type: 'learn', title: 'Eyes up', text: 'Put all eight fingers on home: A S D F and J K L ;. From now on, look at the screen, never at your hands.', keys: HOME8 },
              { type: 'type', title: 'Left hand, eyes up', text: 'The keyboard is hidden. Feel for the F bump.', source: { kind: 'repeat', pattern: 'asdf', times: 5 }, options: { hideKeyboard: true } },
              { type: 'type', title: 'Right hand, eyes up', text: 'Feel for the J bump.', source: { kind: 'repeat', pattern: 'jkl;', times: 5 }, options: { hideKeyboard: true } },
              { type: 'keys', title: 'Blind key hunt', text: 'Find each key by feel alone.', keys: HOME8, count: 16, options: { hideKeyboard: true } },
              { type: 'type', title: 'Both hands, eyes up', text: 'Mirror pairs in any order.', source: { kind: 'shuffle', items: ['fj', 'dk', 'sl', 'a;'], count: 12 }, options: { hideKeyboard: true } }
            ]
          },
          {
            id: '1.6',
            title: 'Both Hands Together',
            summary: 'All eight fingers working as a team.',
            minutes: 5,
            keys: HOME8,
            newKeys: '',
            goals: { wpm: 7, accuracy: 85 },
            tip: 'Press the space bar with whichever thumb feels natural, and always use that same thumb.',
            intro: 'Matching fingers on each hand form mirror pairs: F and J (index), D and K (middle), S and L (ring), A and ; (pinky). Using both hands together is the heart of touch typing.',
            steps: [
              { type: 'type', title: 'Mirror pairs', text: 'Same finger, left hand then right.', source: { kind: 'drill', items: ['fj', 'dk', 'sl', 'a;'], each: 3 } },
              { type: 'type', title: 'The full home row', text: 'Left hand, space, right hand.', source: { kind: 'repeat', pattern: 'asdf jkl;', times: 4 } },
              { type: 'type', title: 'Your first words', text: 'Real words made only from home keys.', source: { kind: 'words', list: ['as', 'ad', 'add', 'all', 'ask', 'dad', 'fad', 'fall', 'lad', 'sad', 'flask', 'salad'], count: 12 } },
              { type: 'timed', title: 'Speed challenge', text: 'Type as many correct characters as you can in 30 seconds.', seconds: 30, source: { kind: 'letters', keys: 'asdfjkl', count: 40, min: 2, max: 5 } }
            ]
          }
        ]
      },

      // ================================================================ 2
      {
        id: 2,
        title: 'Home Row Mastery',
        level: 'beginner',
        goal: 'Build initial muscle memory',
        summary: 'ASDF JKL; repetition and muscle memory',
        episodes: [
          {
            id: '2.1',
            title: 'Anchor Keys: F J D K',
            summary: 'ffff jjjj dddd kkkk',
            minutes: 4,
            keys: HOME8,
            newKeys: '',
            goals: { wpm: 8, accuracy: 90 },
            tip: 'Keep a steady beat. Even, unhurried taps build muscle memory fastest.',
            intro: 'Your index and middle fingers do most of the work in typing. Repeat F and J (index fingers) and D and K (middle fingers) until they feel automatic.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Type the pattern slowly. Watch which finger lights up.', source: { kind: 'text', text: 'ffff jjjj dddd kkkk' } },
              { type: 'type', title: 'Repetition', text: 'The same pattern three times. Keep the rhythm even.', source: { kind: 'repeat', pattern: 'ffff jjjj dddd kkkk', times: 3 } },
              { type: 'type', title: 'Finger pairs', text: 'Index and middle fingers take turns.', source: { kind: 'drill', items: ['fjfj', 'dkdk', 'fdfd', 'jkjk'], each: 2 } },
              { type: 'type', title: 'Word practice', text: 'Words built on the anchor keys.', source: { kind: 'words', list: ['dad', 'fad', 'add', 'ask', 'flask', 'fall', 'lad', 'sad', 'adds', 'dads', 'asks', 'flak'], count: 12 } },
              { type: 'timed', title: 'Speed challenge', text: '30 seconds of anchor-key groups.', seconds: 30, source: { kind: 'combos', keys: 'fjdk', count: 40, min: 2, max: 4 } }
            ]
          },
          {
            id: '2.2',
            title: 'Home Row Sweep',
            summary: 'asdf jkl; in one smooth sweep.',
            minutes: 4,
            keys: HOME8,
            newKeys: '',
            goals: { wpm: 8, accuracy: 90 },
            tip: 'Say each letter quietly in your head as you type it. It links sound, sight and touch.',
            intro: 'Sweep across the whole home row: left pinky to left index, then right index to right pinky. Every finger presses only its own key.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Learn the position of each finger.', source: { kind: 'text', text: 'asdf jkl;' } },
              { type: 'type', title: 'Repetition', text: 'Repeat it five times.', source: { kind: 'repeat', pattern: 'asdf jkl;', times: 5 } },
              { type: 'type', title: 'Reverse sweep', text: 'Now roll the other way.', source: { kind: 'drill', items: ['fdsa', ';lkj'], each: 3 } },
              { type: 'type', title: 'Word practice', text: 'sad, ask, fall, flask and friends.', source: { kind: 'words', list: ['sad', 'ask', 'fall', 'flask', 'lad', 'dad', 'all', 'add', 'alas', 'salad'], count: 14 } },
              { type: 'timed', title: 'Speed challenge', text: 'Type as many correct characters as possible in 30 seconds.', seconds: 30, source: { kind: 'letters', keys: 'asdfjkl', count: 40, min: 2, max: 5 } }
            ]
          },
          {
            id: '2.3',
            title: 'Mirror Pairs',
            summary: 'fj fj dk dk sl sl',
            minutes: 4,
            keys: HOME8,
            newKeys: '',
            goals: { wpm: 9, accuracy: 90 },
            tip: 'Mirror pairs use the same finger on each hand. Let both hands feel equally busy.',
            intro: 'Mirror pairs train both hands to work in balance: F and J (index), D and K (middle), S and L (ring), A and ; (pinky).',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Same finger, left hand then right.', source: { kind: 'text', text: 'fj fj dk dk sl sl' } },
              { type: 'type', title: 'Repetition', text: 'All four pairs, four times each.', source: { kind: 'drill', items: ['fj', 'dk', 'sl', 'a;'], each: 4 } },
              { type: 'type', title: 'Pairs in any order', text: 'Pairs in random order, both directions.', source: { kind: 'shuffle', items: ['fj', 'dk', 'sl', 'a;', 'jf', 'kd', 'ls', ';a'], count: 16 } },
              { type: 'type', title: 'Word practice', text: 'Home-row words.', source: { kind: 'words', list: ['lad', 'sad', 'ask', 'dad', 'fall', 'all', 'flask', 'add', 'salad', 'lass', 'falls', 'asks'], count: 14 } },
              { type: 'timed', title: 'Speed challenge', text: 'Mirror pairs against the clock.', seconds: 30, source: { kind: 'shuffle', items: ['fj', 'dk', 'sl', 'a;', 'jf', 'kd', 'ls', ';a'], count: 40 } }
            ]
          },
          {
            id: '2.4',
            title: 'First Words',
            summary: 'fad sad lad ask',
            minutes: 4,
            keys: HOME8,
            newKeys: '',
            goals: { wpm: 9, accuracy: 90 },
            tip: 'Read the whole word before you type it. Your fingers will start to move as one unit.',
            intro: 'Letters become words. These short words use only home-row keys, so your fingers never leave home.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Four short words. Tap space with your thumb between them.', source: { kind: 'text', text: 'fad sad lad ask' } },
              { type: 'type', title: 'Repetition', text: 'Three more times, a little smoother each time.', source: { kind: 'repeat', pattern: 'fad sad lad ask', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'Mix them up.', source: { kind: 'words', list: ['fad', 'sad', 'lad', 'ask', 'dad', 'add', 'all', 'as', 'ad', 'asks', 'lads', 'fads', 'dads', 'adds', 'falls'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Home-row words for 30 seconds.', seconds: 30, source: { kind: 'letters', keys: 'asdfjkl', count: 40, min: 2, max: 5 } }
            ]
          },
          {
            id: '2.5',
            title: 'Longer Home Row Words',
            summary: 'fall ask flask salad',
            minutes: 5,
            keys: HOME8,
            newKeys: '',
            goals: { wpm: 10, accuracy: 90 },
            tip: 'Double letters like ll and ss are one finger tapping twice. Keep the taps light.',
            intro: 'Longer words test your stamina and your double letters. Keep your fingers relaxed and let the words flow.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Watch the double letters in fall and the a-l-a-d of salad.', source: { kind: 'text', text: 'fall ask flask salad' } },
              { type: 'type', title: 'Repetition', text: 'Three times through.', source: { kind: 'repeat', pattern: 'fall ask flask salad', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'Longer home-row words.', source: { kind: 'words', list: ['fall', 'falls', 'flask', 'flasks', 'salad', 'salads', 'alas', 'lass', 'asks', 'dads', 'adds', 'alfalfa'], count: 14 } },
              { type: 'type', title: 'Phrase practice', text: 'Your first phrases, semicolons included.', source: { kind: 'text', text: 'dad asks a lad; a lad asks dad; all salads fall' } },
              { type: 'timed', title: 'Speed challenge', text: 'Longer words now.', seconds: 30, source: { kind: 'letters', keys: 'asdfjkl', count: 40, min: 3, max: 6 } }
            ]
          },
          {
            id: '2.6',
            title: 'Home Row Remix: G and H',
            summary: 'Index stretches to G and H, then random home-row mixes.',
            minutes: 6,
            keys: HOME,
            newKeys: 'gh',
            goals: { wpm: 10, accuracy: 90 },
            tip: 'Reach for G and H with the index finger only. The other fingers stay anchored on home.',
            intro: 'G and H sit in the middle of the home row. Your left index finger stretches one key right, from F to G; your right index finger stretches one key left, from J to H. Reach, tap, and snap back home.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Index finger out to G or H and straight back.', source: { kind: 'text', text: 'fgf jhj fgf jhj' } },
              { type: 'type', title: 'Repetition', text: 'Stretch and return.', source: { kind: 'drill', items: ['fg', 'jh', 'gf', 'hj'], each: 3 } },
              { type: 'type', title: 'Word practice', text: 'G and H unlock many new words.', source: { kind: 'words', list: ['has', 'had', 'half', 'hall', 'flag', 'glad', 'glass', 'gas', 'dash', 'lash', 'hash', 'shall', 'gash', 'gala', 'saga', 'sash', 'flash', 'slash', 'ash', 'aha'], count: 16 } },
              { type: 'type', title: 'Random combinations', text: 'Any home-row key can come next.', source: { kind: 'combos', keys: 'asdfghjkl', count: 14, min: 2, max: 5 } },
              { type: 'timed', title: 'Speed challenge', text: 'The whole home row for 30 seconds.', seconds: 30, source: { kind: 'letters', keys: 'asdfghjkl', count: 40, min: 2, max: 6 } },
              { type: 'type', title: 'Smart revision', text: 'A drill built from the keys you missed most.', source: { kind: 'weak', count: 24, keys: 'asdfghjkl' } }
            ]
          }
        ]
      },

      // ================================================================ 3
      {
        id: 3,
        title: 'Top Row Training',
        level: 'beginner',
        goal: 'Reach the top row and return home',
        summary: 'QWERTYUIOP and combinations',
        episodes: [
          {
            id: '3.1',
            title: 'Reach Up: Q W E R and U I O P',
            summary: 'qwer uiop',
            minutes: 6,
            keys: TOP1,
            newKeys: 'qweruiop',
            goals: { wpm: 10, accuracy: 90 },
            tip: 'Reach with one finger and bring it home before the next key.',
            intro: 'Each finger reaches straight up and a little to the left of its home key. Left hand: A to Q (pinky), S to W (ring), D to E (middle), F to R (index). Right hand: J to U (index), K to I (middle), L to O (ring) and ; to P (pinky).',
            steps: [
              { type: 'learn', title: 'Up and slightly left', text: 'Left hand: pinky A to Q, ring S to W, middle D to E, index F to R. Right hand: index J to U, middle K to I, ring L to O, pinky ; to P. Always come back home.', keys: 'qweruiop' },
              { type: 'type', title: 'Pattern introduction', text: 'Type the new keys slowly.', source: { kind: 'text', text: 'qwer uiop' } },
              { type: 'type', title: 'Up and back', text: 'Home key, then the key above it.', source: { kind: 'drill', items: ['aq', 'sw', 'de', 'fr', 'ju', 'ki', 'lo', ';p'], each: 2 } },
              { type: 'type', title: 'Repetition', text: 'Repeat the pattern five times.', source: { kind: 'repeat', pattern: 'qwer uiop', times: 5 } },
              { type: 'type', title: 'Word practice', text: 'The vowels E, I, O and U open up hundreds of words.', source: { kind: 'words', list: ['we', 'were', 'wire', 'fire', 'sure', 'rule', 'pure', 'our', 'four', 'pour', 'row', 'slow', 'flow', 'work', 'word', 'like', 'lake', 'ride', 'side', 'wide', 'idea', 'paper', 'super', 'pole', 'role', 'pool', 'look', 'food', 'good', 'door', 'hope', 'ripe', 'life', 'wife'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Home and top-row words for 30 seconds.', seconds: 30, source: { kind: 'letters', keys: 'asdfghjklqweruiop', count: 40, min: 2, max: 6, focus: 'qweruiop' } }
            ]
          },
          {
            id: '3.2',
            title: 'The Full Top Row: T and Y',
            summary: 'qwert yuiop',
            minutes: 5,
            keys: TOP,
            newKeys: 'ty',
            goals: { wpm: 11, accuracy: 90 },
            tip: 'T and Y are long reaches. Move the finger, not the whole hand.',
            intro: 'T and Y complete the top row. Your left index finger reaches up and to the right from F to T; your right index finger reaches up and to the left from J to Y. These are the longest reaches so far.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'The full top row, left then right.', source: { kind: 'text', text: 'qwert yuiop' } },
              { type: 'type', title: 'Index stretch', text: 'F to T and J to Y, then back.', source: { kind: 'drill', items: ['ft', 'jy', 'tf', 'yj'], each: 3 } },
              { type: 'type', title: 'Repetition', text: 'Four smooth passes.', source: { kind: 'repeat', pattern: 'qwert yuiop', times: 4 } },
              { type: 'type', title: 'Word practice', text: 'T and Y appear in the most common words of all.', source: { kind: 'words', list: ['the', 'they', 'that', 'try', 'type', 'yet', 'yes', 'your', 'you', 'today', 'tree', 'street', 'pretty', 'party', 'tower', 'quite', 'write', 'truth', 'true', 'toy', 'story', 'history', 'eight', 'way', 'day', 'year', 'great', 'water', 'after', 'other'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Every word includes T or Y.', seconds: 30, source: { kind: 'letters', keys: TOP_LETTERS, count: 40, min: 2, max: 6, focus: 'ty' } }
            ]
          },
          {
            id: '3.3',
            title: 'Finger Rolls: WE ER RE',
            summary: 'we ew er re',
            minutes: 5,
            keys: TOP,
            newKeys: '',
            goals: { wpm: 11, accuracy: 90 },
            tip: 'Neighbouring fingers can roll across keys like drumming on a table.',
            intro: 'A roll is two neighbouring fingers pressing keys one after the other in a single motion. W-E and E-R are left-hand rolls you will type thousands of times; I-O and U-I are their right-hand cousins.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Roll between neighbouring fingers.', source: { kind: 'text', text: 'we ew er re' } },
              { type: 'type', title: 'Repetition', text: 'Four times, smooth and even.', source: { kind: 'repeat', pattern: 'we ew er re', times: 4 } },
              { type: 'type', title: 'More rolls', text: 'Right-hand and index-finger rolls.', source: { kind: 'drill', items: ['io', 'oi', 'ui', 'iu', 'rt', 'tr', 'yu', 'uy'], each: 2 } },
              { type: 'type', title: 'Word practice', text: 'Rolls inside real words.', source: { kind: 'words', list: ['were', 'where', 'here', 'there', 'free', 'tree', 'three', 'fewer', 'power', 'tower', 'water', 'after', 'error', 'ready', 'dear', 'wear', 'tear', 'year', 'your', 'four', 'ruler', 'lower', 'other', 'flower', 'tour', 'route'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Words with E and R rolls for 30 seconds.', seconds: 30, source: { kind: 'letters', keys: TOP_LETTERS, count: 40, min: 3, max: 6, focus: 'er' } }
            ]
          },
          {
            id: '3.4',
            title: 'Top Row Words',
            summary: 'type write quiet',
            minutes: 5,
            keys: TOP,
            newKeys: '',
            goals: { wpm: 11, accuracy: 90 },
            tip: 'Q is almost always followed by U. Let your fingers learn the pair as one move.',
            intro: 'Some words live almost entirely on the top row. They keep your fingers reaching up and coming back, which builds accurate reach memory.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Three top-row words.', source: { kind: 'text', text: 'type write quiet' } },
              { type: 'type', title: 'Repetition', text: 'Three passes.', source: { kind: 'repeat', pattern: 'type write quiet', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'Words that live on the top row.', source: { kind: 'words', list: ['type', 'write', 'quiet', 'quite', 'query', 'require', 'request', 'proper', 'property', 'pottery', 'typewriter', 'territory', 'puppet', 'pepper', 'teeth', 'route', 'output', 'tutor', 'yogurt', 'duty', 'truly', 'paper', 'pretty', 'pirate', 'repeat', 'report', 'equity', 'poetry'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Home and top-row words for 30 seconds.', seconds: 30, source: { kind: 'letters', keys: TOP_LETTERS, count: 40, min: 4, max: 7 } }
            ]
          },
          {
            id: '3.5',
            title: 'Power Words',
            summary: 'power tower quote',
            minutes: 5,
            keys: TOP,
            newKeys: '',
            goals: { wpm: 12, accuracy: 90 },
            tip: 'Type in syllables: pow-er, tow-er. Chunks are faster than single letters.',
            intro: 'Power, tower and quote combine top-row reaches with rolls. Typing them in syllables helps your fingers group the motions.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Three power words.', source: { kind: 'text', text: 'power tower quote' } },
              { type: 'type', title: 'Repetition', text: 'Three passes, keeping a steady beat.', source: { kind: 'repeat', pattern: 'power tower quote', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'More words with OW, ER and QU.', source: { kind: 'words', list: ['power', 'tower', 'quote', 'flower', 'lower', 'powder', 'shower', 'slower', 'quoted', 'quotes', 'quiet', 'outer', 'router', 'poetry', 'prouder', 'quilt', 'squad', 'squire', 'equator', 'fourth', 'worth', 'sport', 'support'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Longer top-row words for 30 seconds.', seconds: 30, source: { kind: 'letters', keys: TOP_LETTERS, count: 40, min: 4, max: 8 } }
            ]
          },
          {
            id: '3.6',
            title: 'Home and Top Row Mix',
            summary: 'Phrases, words and random mixes on two rows.',
            minutes: 6,
            keys: TOP,
            newKeys: '',
            goals: { wpm: 12, accuracy: 90 },
            tip: 'After every top-row reach, feel your finger land back on its home key.',
            intro: 'Combine everything on the home and top rows: real phrases, words and random mixes. You finish with a smart revision drill built from your own mistakes.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'A phrase that uses only two rows.', source: { kind: 'text', text: 'a quiet tower; a red kite' } },
              { type: 'type', title: 'Phrase repetition', text: 'Two passes.', source: { kind: 'repeat', pattern: 'they are ready for the trip', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'Words from the home and top rows.', source: { kind: 'words', list: 'homeTop', count: 20 } },
              { type: 'type', title: 'Random combinations', text: 'Any key from either row.', source: { kind: 'combos', keys: TOP_LETTERS, count: 14, min: 3, max: 5 } },
              { type: 'timed', title: 'Speed challenge', text: 'Two rows, 30 seconds.', seconds: 30, source: { kind: 'letters', keys: TOP_LETTERS, count: 40, min: 3, max: 7 } },
              { type: 'type', title: 'Smart revision', text: 'A drill built from the keys you missed most.', source: { kind: 'weak', count: 24, keys: TOP_LETTERS } }
            ]
          }
        ]
      },

      // ================================================================ 4
      {
        id: 4,
        title: 'Bottom Row Training',
        level: 'beginner',
        goal: 'Reach the bottom row and return home',
        summary: 'ZXCVBNM and combinations',
        episodes: [
          {
            id: '4.1',
            title: 'Reach Down: Z X C V and N M',
            summary: 'zxcv nm',
            minutes: 6,
            keys: BOT1,
            newKeys: 'zxcvnm',
            goals: { wpm: 12, accuracy: 90 },
            tip: 'Curl your fingers down to the bottom row. Do not drop your whole hand.',
            intro: 'Bottom-row keys sit down and slightly to the right of home. Left hand: pinky A to Z, ring S to X, middle D to C, index F to V. Right hand: your index finger reaches from J down-right to M and down-left to N.',
            steps: [
              { type: 'learn', title: 'Down and slightly right', text: 'Pinky A to Z, ring S to X, middle D to C, index F to V. Right index finger: J to M (down-right) and J to N (down-left). Curl the finger, tap, return home.', keys: 'zxcvnm' },
              { type: 'type', title: 'Pattern introduction', text: 'Type the new keys slowly.', source: { kind: 'text', text: 'zxcv nm' } },
              { type: 'type', title: 'Down and back', text: 'Home key, then the key below it.', source: { kind: 'drill', items: ['az', 'sx', 'dc', 'fv', 'jm', 'jn'], each: 2 } },
              { type: 'type', title: 'Repetition', text: 'Five passes.', source: { kind: 'repeat', pattern: 'zxcv nm', times: 5 } },
              { type: 'type', title: 'Word practice', text: 'The bottom row unlocks many common words.', source: { kind: 'words', list: ['zone', 'zoo', 'zero', 'size', 'prize', 'mix', 'fix', 'six', 'van', 'can', 'man', 'men', 'come', 'move', 'cave', 'voice', 'nice', 'mice', 'never', 'seven', 'cover', 'crazy', 'exact', 'extra', 'next', 'text', 'maze', 'calm', 'clean', 'name', 'nine', 'mean'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Every word has a bottom-row key.', seconds: 30, source: { kind: 'letters', keys: NO_B, count: 40, min: 2, max: 6, focus: 'zxcvnm' } }
            ]
          },
          {
            id: '4.2',
            title: 'The Full Bottom Row: B',
            summary: 'zxcvb nm',
            minutes: 5,
            keys: ALL,
            newKeys: 'b',
            goals: { wpm: 12, accuracy: 90 },
            tip: 'B belongs to the left index finger, even though it sits near the middle of the keyboard.',
            intro: 'B completes the alphabet. It is the longest reach for your left index finger: down and to the right from F, one key past V. Keep your left pinky anchored near A while you stretch.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'The full bottom row.', source: { kind: 'text', text: 'zxcvb nm' } },
              { type: 'type', title: 'Index stretch', text: 'F to V, F to B, and back.', source: { kind: 'drill', items: ['fv', 'fb', 'bf', 'vb'], each: 3 } },
              { type: 'type', title: 'Repetition', text: 'Five passes.', source: { kind: 'repeat', pattern: 'zxcvb nm', times: 5 } },
              { type: 'type', title: 'Word practice', text: 'Words with B.', source: { kind: 'words', list: ['box', 'back', 'bank', 'cab', 'cabin', 'bring', 'number', 'member', 'combine', 'verb', 'above', 'both', 'but', 'by', 'be', 'been', 'big', 'best', 'book', 'black', 'blue', 'body', 'baby', 'job', 'web', 'lab', 'bubble', 'brave'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'All 26 letters are yours now.', seconds: 30, source: { kind: 'letters', keys: LETTERS, count: 40, min: 2, max: 6, focus: 'bvn' } }
            ]
          },
          {
            id: '4.3',
            title: 'Inner Reaches: C V B N',
            summary: 'cv cv bn bn',
            minutes: 5,
            keys: ALL,
            newKeys: '',
            goals: { wpm: 13, accuracy: 90 },
            tip: 'B and N sit side by side but belong to different hands. Never type both with one finger.',
            intro: 'C, V, B and N crowd the middle of the bottom row. C is the left middle finger, V and B the left index, N and M the right index. Clean finger choice here prevents bad habits for years.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Feel the hand switch between B and N.', source: { kind: 'text', text: 'cv cv bn bn' } },
              { type: 'type', title: 'Repetition', text: 'Four passes.', source: { kind: 'repeat', pattern: 'cv cv bn bn', times: 4 } },
              { type: 'type', title: 'Neighbour drill', text: 'Neighbouring bottom-row keys.', source: { kind: 'drill', items: ['cv', 'vb', 'bn', 'nm', 'mn', 'nb'], each: 3 } },
              { type: 'type', title: 'Word practice', text: 'Words full of inner reaches.', source: { kind: 'words', list: ['cave', 'civic', 'clever', 'cover', 'vacant', 'novice', 'bench', 'combine', 'cabin', 'bacon', 'ribbon', 'numb', 'common', 'vibe', 'cubic', 'convince', 'canvas', 'banner', 'cannon', 'nimble'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Every word has C, V, B, N or M.', seconds: 30, source: { kind: 'letters', keys: LETTERS, count: 40, min: 3, max: 6, focus: 'cvbnm' } }
            ]
          },
          {
            id: '4.4',
            title: 'Bottom Row Words',
            summary: 'van can man box',
            minutes: 5,
            keys: ALL,
            newKeys: '',
            goals: { wpm: 13, accuracy: 90 },
            tip: 'Keep your wrists hovering. Resting them on the desk makes bottom-row reaches harder.',
            intro: 'These words lean on the bottom row. Short words like van, can and man repeat the same reaches until they become automatic.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Four short bottom-row words.', source: { kind: 'text', text: 'van can man box' } },
              { type: 'type', title: 'Repetition', text: 'Three passes.', source: { kind: 'repeat', pattern: 'van can man box', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'Words with two or more bottom-row letters.', source: { kind: 'words', list: 'bottomRow', count: 18 } },
              { type: 'timed', title: 'Speed challenge', text: 'Bottom-row words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'bottomRow', count: 40 } }
            ]
          },
          {
            id: '4.5',
            title: 'Mixed Row Words',
            summary: 'move zone mix cave',
            minutes: 5,
            keys: ALL,
            newKeys: '',
            goals: { wpm: 14, accuracy: 90 },
            tip: 'Z and X are pinky and ring reaches. Slow them down slightly rather than missing them.',
            intro: 'Now words jump between all three rows. Move, zone, mix and cave each use top, home and bottom keys, so your fingers travel in every direction.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Words that use all three rows.', source: { kind: 'text', text: 'move zone mix cave' } },
              { type: 'type', title: 'Repetition', text: 'Three passes.', source: { kind: 'repeat', pattern: 'move zone mix cave', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'The tricky letters: Z, X, Q, J and V.', source: { kind: 'words', list: ['move', 'zone', 'mix', 'cave', 'maze', 'fox', 'zebra', 'cozy', 'buzz', 'fizz', 'jazz', 'next', 'zinc', 'quiz', 'wax', 'exam', 'oxygen', 'vex', 'jump', 'joke', 'quick', 'zigzag', 'lazy', 'box', 'vivid'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'All three rows, 30 seconds.', seconds: 30, source: { kind: 'letters', keys: LETTERS, count: 40, min: 3, max: 6 } }
            ]
          },
          {
            id: '4.6',
            title: 'All Three Rows Together',
            summary: 'Every letter, every row.',
            minutes: 6,
            keys: ALL,
            newKeys: '',
            goals: { wpm: 14, accuracy: 90 },
            tip: 'A pangram uses every letter. Typing one cleanly is a full-keyboard workout.',
            intro: 'You know all 26 letters. Prove it with pangrams (sentences that use every letter), common words and random mixes, then finish with a drill built from your weakest keys.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'A famous sentence that uses every letter.', source: { kind: 'text', text: 'the quick brown fox jumps over the lazy dog' } },
              { type: 'type', title: 'Repetition', text: 'Another pangram, twice.', source: { kind: 'repeat', pattern: 'the five boxing wizards jump quickly', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'The most common English words.', source: { kind: 'common', top: 200, count: 20 } },
              { type: 'type', title: 'Random combinations', text: 'Any letter can come next.', source: { kind: 'combos', keys: LETTERS, count: 14, min: 3, max: 5 } },
              { type: 'timed', title: 'Speed challenge', text: 'The whole keyboard, 30 seconds.', seconds: 30, source: { kind: 'letters', keys: LETTERS, count: 40, min: 3, max: 7 } },
              { type: 'type', title: 'Smart revision', text: 'A drill built from the keys you missed most.', source: { kind: 'weak', count: 30, keys: LETTERS } }
            ]
          }
        ]
      },

      // ================================================================ 5
      {
        id: 5,
        title: 'Key Combinations',
        level: 'intermediate',
        goal: 'Develop smooth finger transitions',
        summary: 'Common two-key and three-key patterns',
        episodes: [
          {
            id: '5.1',
            title: 'Alternating Hands',
            summary: 'the girl and the dog',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 14, accuracy: 92 },
            tip: 'While one hand types, the other is already moving to its next key. That overlap is free speed.',
            intro: 'In words like the, girl and problem, every letter switches hands. While one hand presses a key the other gets ready, which makes these some of the fastest words to type.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Every letter switches hands.', source: { kind: 'text', text: 'the girl and the dog' } },
              { type: 'type', title: 'Repetition', text: 'Three passes. Feel the left-right rhythm.', source: { kind: 'repeat', pattern: 'the girl and the dog', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'Hand-alternating words.', source: { kind: 'words', list: 'alternating', count: 20 } },
              { type: 'type', title: 'Ping-pong words', text: 'Longer words that still alternate on every letter.', source: { kind: 'words', list: PING_PONG, count: 14 } },
              { type: 'timed', title: 'Speed challenge', text: 'Alternating words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'alternating', count: 40 } }
            ]
          },
          {
            id: '5.2',
            title: 'Index Finger Reaches',
            summary: 'fr fr ju ju',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 15, accuracy: 92 },
            tip: 'Each index finger owns six keys: R T F G V B on the left, Y U H J N M on the right.',
            intro: 'Your index fingers are the busiest on the keyboard, covering two columns each. Left index: R T F G V B. Right index: Y U H J N M. This drill moves them up and down their columns from home.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Index fingers reach up from home.', source: { kind: 'text', text: 'fr fr ju ju' } },
              { type: 'type', title: 'Repetition', text: 'Three passes.', source: { kind: 'repeat', pattern: 'fr fr ju ju', times: 3 } },
              { type: 'type', title: 'Full index columns', text: 'Every key your index fingers own.', source: { kind: 'drill', items: ['fr', 'ju', 'ft', 'jy', 'fv', 'jm', 'fg', 'jh', 'fb', 'jn'], each: 2 } },
              { type: 'type', title: 'Word practice', text: 'Index-heavy words.', source: { kind: 'words', list: INDEX_WORDS, count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Index-heavy words for 30 seconds.', seconds: 30, source: { kind: 'words', list: INDEX_WORDS, count: 40 } }
            ]
          },
          {
            id: '5.3',
            title: 'Every Finger Reaches',
            summary: 'de ki sa lo',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 15, accuracy: 92 },
            tip: 'Weaker fingers improve fastest with slow, deliberate repetitions. Accuracy first.',
            intro: 'Middle, ring and pinky fingers have their own columns too. D to E and K to I are middle-finger reaches, L to O belongs to the right ring finger, and S-A crosses from ring to pinky on the home row.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Middle, ring and pinky moves.', source: { kind: 'text', text: 'de ki sa lo' } },
              { type: 'type', title: 'Repetition', text: 'Four passes.', source: { kind: 'repeat', pattern: 'de ki sa lo', times: 4 } },
              { type: 'type', title: 'Column drill', text: 'Up and down each finger column.', source: { kind: 'drill', items: ['de', 'dc', 'ki', 'sw', 'sx', 'lo', 'aq', 'az'], each: 2 } },
              { type: 'type', title: 'Word practice', text: 'Words that work the outer fingers.', source: { kind: 'words', list: ['desk', 'kid', 'side', 'lose', 'load', 'slow', 'idea', 'deal', 'lock', 'dock', 'cold', 'sold', 'solid', 'slide', 'aside', 'skill', 'oil', 'soil', 'dial', 'ideal', 'ladder', 'saddle', 'kiosk', 'sweat', 'wax', 'quiz'], count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Every word uses D, K, L or S.', seconds: 30, source: { kind: 'letters', keys: LETTERS, count: 40, min: 3, max: 6, focus: 'dkls' } }
            ]
          },
          {
            id: '5.4',
            title: 'The Big Four: THE SHE HE HER',
            summary: 'the she he her',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 16, accuracy: 92 },
            tip: '"the" is the most common English word. Make it one quick roll: t-h-e.',
            intro: 'H and E appear together constantly: the, she, he, her, there, where. Mastering this tiny family gives an instant speed boost.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Four tiny, super-common words.', source: { kind: 'text', text: 'the she he her' } },
              { type: 'type', title: 'Repetition', text: 'Four passes.', source: { kind: 'repeat', pattern: 'the she he her', times: 4 } },
              { type: 'type', title: 'Word practice', text: 'Words containing HE.', source: { kind: 'words', list: 'seq.he', count: 18 } },
              { type: 'type', title: 'Phrase practice', text: 'The whole family in one sentence.', source: { kind: 'text', text: 'she said the hero was here and then he left with her other brother' } },
              { type: 'timed', title: 'Speed challenge', text: 'HE words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'seq.he', count: 40 } }
            ]
          },
          {
            id: '5.5',
            title: 'Endings: ING ION TION',
            summary: 'ing ion tion',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 16, accuracy: 92 },
            tip: 'Type common endings as a single burst: -ing, -ion, -tion.',
            intro: 'Thousands of words end in -ing, -ion or -tion. Once your fingers know these endings as single moves, long words stop feeling long.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Three endings.', source: { kind: 'text', text: 'ing ion tion' } },
              { type: 'type', title: 'Repetition', text: 'Four passes.', source: { kind: 'repeat', pattern: 'ing ion tion', times: 4 } },
              { type: 'type', title: 'Word practice', text: 'Words with the same endings.', source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.ing', count: 8 }, { kind: 'words', list: 'seq.tion', count: 8 }], shuffle: true } },
              { type: 'timed', title: 'Speed challenge', text: '-ing and -ion words for 30 seconds.', seconds: 30, source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.ing', count: 20 }, { kind: 'words', list: 'seq.ion', count: 20 }], shuffle: true } }
            ]
          },
          {
            id: '5.6',
            title: 'Random Letter Sequences',
            summary: 'Random groups of three to five letters.',
            minutes: 6,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 14, accuracy: 92 },
            tip: 'Random letters stop you from guessing words. Read each group, then type it.',
            intro: 'Random letter groups have no familiar shape, so every key has to come from true finger memory. Expect to slow down: that is the point.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'No words, just keys.', source: { kind: 'text', text: 'rkv ozm tqe bly' } },
              { type: 'type', title: 'Three-letter groups', text: 'Short random groups.', source: { kind: 'combos', keys: LETTERS, count: 14, min: 3, max: 3 } },
              { type: 'type', title: 'Four and five letters', text: 'Longer random groups.', source: { kind: 'combos', keys: LETTERS, count: 12, min: 4, max: 5 } },
              { type: 'timed', title: 'Speed challenge', text: 'Random groups for 30 seconds.', seconds: 30, source: { kind: 'combos', keys: LETTERS, count: 40, min: 3, max: 5 } },
              { type: 'type', title: 'Smart revision', text: 'A drill built from the keys you missed most.', source: { kind: 'weak', count: 30, keys: LETTERS } }
            ]
          }
        ]
      },

      // ================================================================ 6
      {
        id: 6,
        title: 'Word Building',
        level: 'intermediate',
        goal: 'Type whole words instead of single letters',
        summary: 'Common English words and patterns',
        episodes: [
          {
            id: '6.1',
            title: 'Two-Letter Words',
            summary: 'is it in on at to',
            minutes: 4,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 16, accuracy: 92 },
            tip: 'Short words are where speed is won. Type each one, plus its space, as a single snap.',
            intro: 'Two-letter words like is, it, to and of make up a huge share of everyday text. Learn to type each one as a single quick motion, space included.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Six tiny words.', source: { kind: 'text', text: 'is it in on at to' } },
              { type: 'type', title: 'Repetition', text: 'Three passes.', source: { kind: 'repeat', pattern: 'is it in on at to', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'Common two-letter words.', source: { kind: 'words', list: 'len2', count: 24 } },
              { type: 'timed', title: 'Speed challenge', text: 'Two-letter words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'len2', count: 60 } }
            ]
          },
          {
            id: '6.2',
            title: 'Three-Letter Words',
            summary: 'the and you for are was',
            minutes: 4,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 17, accuracy: 92 },
            tip: 'Look one word ahead while you type the current one.',
            intro: 'Three-letter words such as the, and and you are the backbone of English. Aim for a smooth, even rhythm across each word.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'The most common three-letter words.', source: { kind: 'text', text: 'the and you for are was' } },
              { type: 'type', title: 'Repetition', text: 'Two passes.', source: { kind: 'repeat', pattern: 'the and you for are was', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'Three-letter words.', source: { kind: 'words', list: 'len3', count: 20 } },
              { type: 'timed', title: 'Speed challenge', text: 'Three-letter words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'len3', count: 50 } }
            ]
          },
          {
            id: '6.3',
            title: 'Four-Letter Words',
            summary: 'with this that have from',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 18, accuracy: 92 },
            tip: 'Made a mistake? Keep your rhythm. Do not rush the next word to make up for it.',
            intro: 'Four-letter words like with, this and have mix rolls and reaches. They are short enough to see as one shape and long enough to need real finger memory.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Five everyday four-letter words.', source: { kind: 'text', text: 'with this that have from' } },
              { type: 'type', title: 'Repetition', text: 'Two passes.', source: { kind: 'repeat', pattern: 'with this that have from', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'Four-letter words.', source: { kind: 'words', list: 'len4', count: 18 } },
              { type: 'timed', title: 'Speed challenge', text: 'Four-letter words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'len4', count: 50 } }
            ]
          },
          {
            id: '6.4',
            title: 'Five-Letter Words',
            summary: 'about their which would there',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 18, accuracy: 92 },
            tip: 'Split five-letter words into two chunks: ab-out, wh-ich. Find the rolls inside them.',
            intro: 'Five-letter words like about, their and which hold rolls, reaches and hand switches all at once. Type them as two quick chunks rather than five separate taps.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Five common five-letter words.', source: { kind: 'text', text: 'about their which would there' } },
              { type: 'type', title: 'Repetition', text: 'Two passes.', source: { kind: 'repeat', pattern: 'about their which would there', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'Five-letter words.', source: { kind: 'words', list: 'len5', count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'Five-letter words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'len5', count: 40 } }
            ]
          },
          {
            id: '6.5',
            title: 'Common English Words',
            summary: 'the and you for are was with this that have',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 20, accuracy: 92 },
            tip: 'The top 100 words make up about half of everything you will ever type.',
            intro: 'About 100 words make up roughly half of all written English. Drill them until they are pure reflex and your speed rises everywhere.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Ten words you type every day.', source: { kind: 'text', text: 'the and you for are was with this that have' } },
              { type: 'type', title: 'Top 50', text: 'The fifty most common words.', source: { kind: 'common', top: 50, count: 20 } },
              { type: 'type', title: 'Top 100', text: 'Widen the circle.', source: { kind: 'common', top: 100, count: 24 } },
              { type: 'timed', title: 'Speed challenge', text: 'The top 200 words for 30 seconds.', seconds: 30, source: { kind: 'common', top: 200, count: 60 } }
            ]
          },
          {
            id: '6.6',
            title: 'Difficult Spellings',
            summary: 'necessary rhythm accommodate',
            minutes: 6,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 16, accuracy: 92 },
            tip: 'Spell tricky words in chunks: ac-com-mo-date. Your fingers learn the chunks.',
            intro: 'Some words trip up even fast typists: double letters, silent letters and odd vowel pairs. Slow down, break them into syllables and let accuracy lead.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Three famous troublemakers.', source: { kind: 'text', text: 'necessary rhythm accommodate' } },
              { type: 'type', title: 'Repetition', text: 'Two careful passes.', source: { kind: 'repeat', pattern: 'necessary rhythm accommodate', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'Commonly misspelled words.', source: { kind: 'words', list: 'difficult', count: 14 } },
              { type: 'timed', title: 'Speed challenge', text: 'Difficult words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'difficult', count: 40 } },
              { type: 'type', title: 'Smart revision', text: 'A drill built from the keys you missed most.', source: { kind: 'weak', count: 30, keys: LETTERS } }
            ]
          }
        ]
      },

      // ================================================================ 7
      {
        id: 7,
        title: 'Common Letter Sequences',
        level: 'intermediate',
        goal: 'Turn common letter clusters into single moves',
        summary: 'TH, ING, TION, ED, ER and more',
        episodes: [
          {
            id: '7.1',
            title: 'The TH Sequence',
            summary: 'th th th',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 18, accuracy: 93 },
            tip: 'T (left index) and H (right index) switch hands. Let them fire almost together.',
            intro: 'TH is the most common letter pair in English: the, that, this, with, think. Your left index finger reaches up to T and your right index finger stretches left to H; train them to fire as one motion.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'The most common pair in English.', source: { kind: 'text', text: 'th th th' } },
              { type: 'type', title: 'Repetition', text: 'From the pair to whole words.', source: { kind: 'repeat', pattern: 'th the that this with', times: 3 } },
              { type: 'type', title: 'Word practice', text: 'Words with TH.', source: { kind: 'words', list: 'seq.th', count: 18 } },
              { type: 'timed', title: 'Speed challenge', text: 'TH words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'seq.th', count: 40 } }
            ]
          },
          {
            id: '7.2',
            title: 'The ING Ending',
            summary: 'ing ing ing',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 20, accuracy: 93 },
            tip: 'In -ing the right hand plays I then N, and the left index adds G. Practise it as one roll.',
            intro: 'The -ing ending appears in thousands of words: going, being, thinking. I and N belong to your right hand (middle and index) and G to your left index, so it can flow as one quick roll.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'One ending, three keys.', source: { kind: 'text', text: 'ing ing ing' } },
              { type: 'type', title: 'Repetition', text: 'The ending inside short words.', source: { kind: 'repeat', pattern: 'ing sing ring king thing', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'Words with ING.', source: { kind: 'words', list: 'seq.ing', count: 18 } },
              { type: 'timed', title: 'Speed challenge', text: 'ING words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'seq.ing', count: 40 } }
            ]
          },
          {
            id: '7.3',
            title: 'The TION Ending',
            summary: 'tion tion tion',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 19, accuracy: 93 },
            tip: 'In -tion the left index taps T, then the right hand rolls I, O, N.',
            intro: 'The -tion ending turns verbs into nouns: act becomes action, inform becomes information. Your left index finger taps T, then your right hand rolls through I, O and N.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Four letters, one motion.', source: { kind: 'text', text: 'tion tion tion' } },
              { type: 'type', title: 'Repetition', text: 'The ending inside real words.', source: { kind: 'repeat', pattern: 'tion nation action motion', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'Words with TION.', source: { kind: 'words', list: 'seq.tion', count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'TION words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'seq.tion', count: 40 } }
            ]
          },
          {
            id: '7.4',
            title: 'The MENT Ending',
            summary: 'ment ment ment',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 20, accuracy: 93 },
            tip: 'MENT switches hands on every letter. Let your hands take turns like a drum roll.',
            intro: 'MENT alternates hands on every letter: M (right index), E (left middle), N (right index), T (left index). It ends words like moment, payment and statement.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'A perfectly alternating ending.', source: { kind: 'text', text: 'ment ment ment' } },
              { type: 'type', title: 'Repetition', text: 'The ending inside real words.', source: { kind: 'repeat', pattern: 'ment moment comment payment', times: 2 } },
              { type: 'type', title: 'Word practice', text: 'Words with MENT.', source: { kind: 'words', list: 'seq.ment', count: 16 } },
              { type: 'timed', title: 'Speed challenge', text: 'MENT words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'seq.ment', count: 40 } }
            ]
          },
          {
            id: '7.5',
            title: 'OUGH, IGHT and EIGH',
            summary: 'ough ight eigh',
            minutes: 6,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 18, accuracy: 93 },
            tip: 'Silent letters still need typing. Learn these clusters by touch, not by sound.',
            intro: 'These clusters are spelled very differently from how they sound: though, night, eight. Drilling them as fixed finger patterns removes the guesswork.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Three tricky clusters.', source: { kind: 'text', text: 'ough ight eigh' } },
              { type: 'type', title: 'Repetition', text: 'Each cluster four times.', source: { kind: 'drill', items: ['ough', 'ight', 'eigh'], each: 4 } },
              { type: 'type', title: 'Word practice', text: 'Words built on the clusters.', source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.ough', count: 6 }, { kind: 'words', list: 'seq.ight', count: 6 }, { kind: 'words', list: 'seq.eigh', count: 6 }], shuffle: true } },
              { type: 'timed', title: 'Speed challenge', text: 'Cluster words for 30 seconds.', seconds: 30, source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.ough', count: 14 }, { kind: 'words', list: 'seq.ight', count: 14 }, { kind: 'words', list: 'seq.eigh', count: 12 }], shuffle: true } }
            ]
          },
          {
            id: '7.6',
            title: 'STR, SPR and SCR',
            summary: 'str spr scr',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 19, accuracy: 93 },
            tip: 'In STR your left index presses both T and R. Slide it between them without lifting your hand.',
            intro: 'STR, SPR and SCR begin many strong words: street, spring, screen. Three consonants in a row make them perfect finger-coordination drills.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Three consonant clusters.', source: { kind: 'text', text: 'str spr scr' } },
              { type: 'type', title: 'Repetition', text: 'Each cluster four times.', source: { kind: 'drill', items: ['str', 'spr', 'scr'], each: 4 } },
              { type: 'type', title: 'Word practice', text: 'Words that start strong.', source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.str', count: 6 }, { kind: 'words', list: 'seq.spr', count: 5 }, { kind: 'words', list: 'seq.scr', count: 5 }], shuffle: true } },
              { type: 'timed', title: 'Speed challenge', text: 'Cluster words for 30 seconds.', seconds: 30, source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.str', count: 14 }, { kind: 'words', list: 'seq.spr', count: 13 }, { kind: 'words', list: 'seq.scr', count: 13 }], shuffle: true } }
            ]
          },
          {
            id: '7.7',
            title: 'Mixed Sequence Drills',
            summary: 'er re ed ly ch sh wh ph, plus prefixes and suffixes',
            minutes: 7,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 21, accuracy: 93 },
            tip: 'Prefixes and suffixes repeat across thousands of words. Learn them once, use them forever.',
            intro: 'Now combine the most useful clusters: endings like er, ed and ly, pairs like ch, sh, wh and ph, prefixes like pre, pro, con and com, and suffixes like able, less and ness.',
            steps: [
              { type: 'type', title: 'Pattern introduction', text: 'Eight common pairs.', source: { kind: 'text', text: 'er re ed ly ch sh wh ph' } },
              { type: 'type', title: 'Prefix repetition', text: 'Common word beginnings.', source: { kind: 'drill', items: ['pre', 'pro', 'con', 'com'], each: 3 } },
              { type: 'type', title: 'Suffix repetition', text: 'Common word endings.', source: { kind: 'drill', items: ['able', 'less', 'ness', 'ment'], each: 3 } },
              { type: 'type', title: 'Word practice', text: 'Words with common pairs.', source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.er', count: 3 }, { kind: 'words', list: 'seq.ed', count: 3 }, { kind: 'words', list: 'seq.ly', count: 3 }, { kind: 'words', list: 'seq.ch', count: 3 }, { kind: 'words', list: 'seq.sh', count: 3 }, { kind: 'words', list: 'seq.wh', count: 2 }, { kind: 'words', list: 'seq.ph', count: 2 }], shuffle: true } },
              { type: 'type', title: 'Prefixes and suffixes', text: 'Words that start or end with a cluster.', source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.pre', count: 2 }, { kind: 'words', list: 'seq.pro', count: 2 }, { kind: 'words', list: 'seq.con', count: 2 }, { kind: 'words', list: 'seq.com', count: 2 }, { kind: 'words', list: 'seq.able', count: 2 }, { kind: 'words', list: 'seq.less', count: 2 }, { kind: 'words', list: 'seq.ness', count: 2 }], shuffle: true } },
              { type: 'timed', title: 'Speed challenge', text: 'Every cluster at once, 30 seconds.', seconds: 30, source: { kind: 'mix', parts: [{ kind: 'words', list: 'seq.er', count: 6 }, { kind: 'words', list: 'seq.re', count: 5 }, { kind: 'words', list: 'seq.ed', count: 6 }, { kind: 'words', list: 'seq.ly', count: 5 }, { kind: 'words', list: 'seq.ch', count: 5 }, { kind: 'words', list: 'seq.sh', count: 5 }, { kind: 'words', list: 'seq.and', count: 4 }, { kind: 'words', list: 'seq.qu', count: 4 }], shuffle: true } },
              { type: 'type', title: 'Smart revision', text: 'A drill built from your weakest keys and transitions.', source: { kind: 'weak', count: 30, keys: LETTERS } }
            ]
          }
        ]
      },

      // ================================================================ 8
      {
        id: 8,
        title: 'Sentence Practice',
        level: 'intermediate',
        goal: 'Type real sentences with capitals and punctuation',
        summary: 'Capitalization, spaces, punctuation',
        episodes: [
          {
            id: '8.1',
            title: 'Short Sentences',
            summary: 'Four to seven words, no punctuation yet.',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 22, accuracy: 93 },
            tip: 'From now on a wrong key does not stop you. Keep going, or fix it with Backspace.',
            intro: 'Real sentences at last. From this chapter on, a mistake no longer blocks you: the cursor moves on and you can fix errors with Backspace, just like everyday typing.',
            steps: [
              { type: 'type', title: 'Warm-up', text: 'One short sentence to start.', source: { kind: 'corpus', name: 'sentencesShort', count: 1 } },
              { type: 'type', title: 'Sentence practice', text: 'Read a word or two ahead as you type.', source: { kind: 'corpus', name: 'sentencesShort', count: 4 } },
              { type: 'timed', title: 'Speed challenge', text: 'Short sentences for 30 seconds.', seconds: 30, source: { kind: 'corpus', name: 'sentencesShort', count: 10 } }
            ]
          },
          {
            id: '8.2',
            title: 'Medium Sentences',
            summary: 'Eight to fourteen words per sentence.',
            minutes: 5,
            keys: LETTERS,
            newKeys: '',
            goals: { wpm: 23, accuracy: 93 },
            tip: 'Read three or four words ahead. Your fingers type what your eyes saw a moment ago.',
            intro: 'Longer sentences reward reading ahead. Let your eyes stay a few words in front of your fingers so you never have to stop and read.',
            steps: [
              { type: 'type', title: 'Warm-up', text: 'One sentence to settle in.', source: { kind: 'corpus', name: 'sentencesMedium', count: 1 } },
              { type: 'type', title: 'Sentence practice', text: 'Keep your eyes ahead of your fingers.', source: { kind: 'corpus', name: 'sentencesMedium', count: 3 } },
              { type: 'timed', title: 'Speed challenge', text: 'Medium sentences for 45 seconds.', seconds: 45, source: { kind: 'corpus', name: 'sentencesMedium', count: 8 } }
            ]
          },
          {
            id: '8.3',
            title: 'Capital Letters',
            summary: 'Shift with the opposite pinky.',
            minutes: 6,
            keys: LETTERS + CAPS + '.',
            newKeys: '.',
            goals: { wpm: 20, accuracy: 93 },
            tip: 'Capital on the left hand? Right Shift. Capital on the right hand? Left Shift.',
            intro: 'To type a capital, hold Shift with the pinky of the opposite hand: right Shift for left-hand letters like A or T, left Shift for right-hand letters like J or M. Sentences end with a full stop, pressed by your right ring finger just below and to the right of L.',
            steps: [
              { type: 'learn', title: 'Opposite-hand Shift', text: 'For A, hold right Shift with your right pinky. For J, hold left Shift with your left pinky. One hand holds Shift while the other types the letter.', keys: 'AJ' },
              { type: 'type', title: 'Capital drill', text: 'Names. Use the opposite Shift every time.', source: { kind: 'text', text: 'Asha Jon Dara Kim Sam Lee Fred Jill Tom Nia' } },
              { type: 'type', title: 'Days and months', text: 'Capitals plus the full stop.', source: { kind: 'text', text: 'Monday. Tuesday. Friday. June. July. April. October.' } },
              { type: 'type', title: 'Capitalised sentences', text: 'Names, places, days and months.', source: { kind: 'corpus', name: 'capitals', count: 2 } },
              { type: 'timed', title: 'Speed challenge', text: 'Capitals for 30 seconds.', seconds: 30, source: { kind: 'corpus', name: 'capitals', count: 8 } }
            ]
          },
          {
            id: '8.4',
            title: 'Full Stops and Commas',
            summary: 'Comma, full stop, one space after.',
            minutes: 6,
            keys: LETTERS + CAPS + '.,',
            newKeys: ',',
            goals: { wpm: 21, accuracy: 93 },
            tip: 'Punctuation is followed by one space. Let your thumb add it automatically.',
            intro: 'The comma sits just below and to the right of K and belongs to your right middle finger; the full stop sits below L and belongs to your right ring finger. Both are followed by a single space.',
            steps: [
              { type: 'learn', title: 'Comma and full stop', text: 'Right middle finger reaches down from K to the comma. Right ring finger reaches down from L to the full stop. Then tap space.', keys: ',.' },
              { type: 'type', title: 'Punctuation drill', text: 'Short lists and full stops.', source: { kind: 'text', text: 'yes, no, maybe. one, two, three. red, blue, green. Go on, then.' } },
              { type: 'type', title: 'Sentence practice', text: 'Sentences with commas.', source: { kind: 'corpus', name: 'commas', count: 3 } },
              { type: 'timed', title: 'Speed challenge', text: 'Punctuated sentences for 30 seconds.', seconds: 30, source: { kind: 'corpus', name: 'commas', count: 8 } }
            ]
          },
          {
            id: '8.5',
            title: 'Questions and Exclamations',
            summary: 'Shift + / for ?, Shift + 1 for !',
            minutes: 6,
            keys: LETTERS + CAPS + '.,?!',
            newKeys: '?!',
            goals: { wpm: 21, accuracy: 93 },
            tip: 'The question mark is Shift plus slash: left pinky holds Shift, right pinky taps slash.',
            intro: 'The question mark is Shift plus the slash key, right of the full stop: your right pinky taps it while your left pinky holds Shift. The exclamation mark is Shift plus 1 on the number row: your left pinky reaches up while your right pinky holds Shift.',
            steps: [
              { type: 'learn', title: 'Two new marks', text: '? is left Shift plus / (right pinky, below and right of ;). ! is right Shift plus 1 (left pinky, two rows above A).', keys: '?!' },
              { type: 'type', title: 'Punctuation drill', text: 'Short questions and shouts.', source: { kind: 'text', text: 'Why? How? Who? What? Yes! Wow! Go! Ready? Now!' } },
              { type: 'type', title: 'Sentence practice', text: 'Questions and exclamations.', source: { kind: 'corpus', name: 'questions', count: 3 } },
              { type: 'timed', title: 'Speed challenge', text: 'Mixed punctuation for 30 seconds.', seconds: 30, source: { kind: 'corpus', name: 'questions', count: 8 } }
            ]
          },
          {
            id: '8.6',
            title: 'Paragraph Typing',
            summary: 'Full paragraphs with mixed punctuation.',
            minutes: 7,
            keys: '*',
            newKeys: '',
            goals: { wpm: 24, accuracy: 93 },
            tip: 'In long text, steady beats fast. Find a pace you can hold for the whole paragraph.',
            intro: 'A paragraph combines everything: capitals, commas, full stops, questions and the occasional apostrophe or quote. Settle into a pace you can hold from the first word to the last.',
            steps: [
              { type: 'type', title: 'Paragraph', text: 'Type the whole paragraph at a steady pace.', source: { kind: 'corpus', name: 'paragraphs', count: 1 } },
              { type: 'timed', title: 'Speed challenge', text: 'Paragraph typing for 60 seconds.', seconds: 60, source: { kind: 'corpus', name: 'paragraphs', count: 3 } }
            ]
          }
        ]
      },

      // ================================================================ 9
      {
        id: 9,
        title: 'Speed Building',
        level: 'advanced',
        goal: 'Push your speed with rhythm and consistency',
        summary: 'Rhythm, consistency, timed challenges',
        episodes: [
          {
            id: '9.1',
            title: '15-Second Sprint',
            summary: 'Short, all-out speed bursts.',
            minutes: 3,
            keys: '*',
            newKeys: '',
            goals: { wpm: 32, accuracy: 92 },
            tip: 'In a sprint, look one word ahead and never stop to fix small errors.',
            intro: 'A sprint shows your top speed. Fifteen seconds is short enough to stay completely focused, so push a little faster than feels comfortable.',
            steps: [
              { type: 'type', title: 'Warm-up', text: 'Loosen up with common words.', source: { kind: 'common', top: 100, count: 15 } },
              { type: 'timed', title: 'Sprint 1', text: 'Go! 15 seconds.', seconds: 15, source: { kind: 'common', top: 200, count: 40 }, options: { record: 'test15' }, scored: true },
              { type: 'timed', title: 'Sprint 2', text: 'Beat your first sprint.', seconds: 15, source: { kind: 'common', top: 200, count: 40 }, options: { record: 'test15' }, scored: true }
            ]
          },
          {
            id: '9.2',
            title: '30-Second Test',
            summary: 'Your official 30-second speed.',
            minutes: 3,
            keys: '*',
            newKeys: '',
            goals: { wpm: 30, accuracy: 92 },
            tip: 'Start at a pace you can hold. A strong finish beats a fast start.',
            intro: 'Thirty seconds is long enough that pacing matters. Start at a speed you can hold, then lift it slightly in the second half.',
            steps: [
              { type: 'type', title: 'Warm-up', text: 'Common words to get going.', source: { kind: 'common', top: 100, count: 15 } },
              { type: 'timed', title: '30-second test', text: 'Your official 30-second result.', seconds: 30, source: { kind: 'common', top: 200, count: 60 }, options: { record: 'test30' }, scored: true }
            ]
          },
          {
            id: '9.3',
            title: '60-Second Test',
            summary: 'The standard one-minute typing test.',
            minutes: 4,
            keys: '*',
            newKeys: '',
            goals: { wpm: 28, accuracy: 92 },
            tip: 'One minute is the standard test. Breathe normally and keep your shoulders loose.',
            intro: 'The one-minute test is the standard way to measure typing speed: real sentences with capitals and punctuation, one minute, your official score.',
            steps: [
              { type: 'type', title: 'Warm-up', text: 'Common words to get going.', source: { kind: 'common', top: 100, count: 15 } },
              { type: 'timed', title: '60-second test', text: 'Your official one-minute result.', seconds: 60, source: { kind: 'corpus', name: 'speed', count: 3 }, options: { record: 'test60' }, scored: true }
            ]
          },
          {
            id: '9.4',
            title: '2-Minute Test',
            summary: 'Two minutes of sustained speed.',
            minutes: 5,
            keys: '*',
            newKeys: '',
            goals: { wpm: 26, accuracy: 92 },
            tip: 'Over two minutes, consistency wins. Do not sprint the opening lines.',
            intro: 'Two minutes tests stamina as well as speed. Many typists fade in the second minute; your goal is to finish as strongly as you start.',
            steps: [
              { type: 'type', title: 'Warm-up', text: 'Common words to get going.', source: { kind: 'common', top: 100, count: 15 } },
              { type: 'timed', title: '2-minute test', text: 'Your official two-minute result.', seconds: 120, source: { kind: 'corpus', name: 'speed', count: 5 }, options: { record: 'test120' }, scored: true }
            ]
          },
          {
            id: '9.5',
            title: 'Steady Rhythm',
            summary: 'Type to the beat of a metronome.',
            minutes: 5,
            keys: '*',
            newKeys: '',
            goals: { wpm: 25, accuracy: 93 },
            tip: 'Even keystrokes beat fast bursts. Slow down on hard words so the beat never breaks.',
            intro: 'Fast typists are not frantic: they type to a steady beat. A soft metronome ticks at your usual pace. Match one keystroke to each tick and keep it even, even on the hard letters.',
            steps: [
              { type: 'learn', title: 'Find the beat', text: 'Listen to the tick and type one character per beat. If a word is hard, keep the beat and let your fingers catch up.' },
              { type: 'type', title: 'Rhythm practice', text: 'Match the metronome.', source: { kind: 'corpus', name: 'rhythm', count: 1 }, options: { metronome: 'auto' } },
              { type: 'timed', title: 'Rhythm test', text: '60 seconds on the beat.', seconds: 60, source: { kind: 'corpus', name: 'rhythm', count: 3 }, options: { metronome: 'auto' }, scored: true }
            ]
          },
          {
            id: '9.6',
            title: 'Speed Without Looking',
            summary: 'No keyboard, no colours: pure touch typing.',
            minutes: 4,
            keys: '*',
            newKeys: '',
            goals: { wpm: 26, accuracy: 90 },
            tip: 'Feel lost in blind mode? Find the F and J bumps and keep going.',
            intro: 'The on-screen keyboard is gone, and in blind mode your letters are not marked right or wrong until the end. You have to trust your fingers completely.',
            steps: [
              { type: 'type', title: 'No-look warm-up', text: 'Keyboard hidden. Eyes on the text.', source: { kind: 'common', top: 100, count: 20 }, options: { hideKeyboard: true } },
              { type: 'timed', title: 'Blind sprint', text: 'No colours until the end. Trust your fingers.', seconds: 30, source: { kind: 'common', top: 200, count: 60 }, options: { hideKeyboard: true, blind: true }, scored: true },
              { type: 'timed', title: 'Blind sentences', text: 'Real sentences, still blind.', seconds: 30, source: { kind: 'corpus', name: 'speed', count: 2 }, options: { hideKeyboard: true, blind: true }, scored: true }
            ]
          },
          {
            id: '9.7',
            title: 'Beat Your Personal Record',
            summary: 'Race the ghost of your best 60-second test.',
            minutes: 4,
            keys: '*',
            newKeys: '',
            goals: { wpm: 30, accuracy: 92 },
            tip: 'Do not chase the ghost in the first seconds. Start steady and pass it in the second half.',
            intro: 'A ghost cursor replays your best 60-second test, keystroke by keystroke. Stay ahead of it to set a new personal record.',
            steps: [
              { type: 'learn', title: 'Meet your ghost', text: 'The faint cursor is your personal best. No record yet? Then this run becomes the ghost you race next time.' },
              { type: 'type', title: 'Warm-up', text: 'Get your fingers moving.', source: { kind: 'common', top: 100, count: 20 } },
              { type: 'timed', title: 'Ghost race', text: 'Race your personal best for 60 seconds.', seconds: 60, source: { kind: 'common', top: 200, count: 120 }, options: { ghost: 'test60', record: 'test60' }, scored: true }
            ]
          }
        ]
      },

      // ================================================================ 10
      {
        id: 10,
        title: 'Accuracy Training',
        level: 'advanced',
        goal: 'Type cleanly, even under pressure',
        summary: 'Error correction and difficult patterns',
        episodes: [
          {
            id: '10.1',
            title: 'The 95% Accuracy Challenge',
            summary: 'Finish with 95% accuracy or better.',
            minutes: 5,
            keys: '*',
            newKeys: '',
            goals: { wpm: 22, accuracy: 96 },
            pass: { accuracy: 95 },
            tip: 'Slowing down by 10% often cuts your errors in half. Speed returns once accuracy is solid.',
            intro: 'This episode only counts as complete at 95% accuracy or higher. Slow down slightly, read ahead and type each word cleanly.',
            steps: [
              { type: 'learn', title: 'Precision first', text: 'Every wrong keystroke counts against you, even if you fix it. Aim for clean first attempts rather than quick corrections.' },
              { type: 'type', title: 'Precision paragraph', text: 'Clean, steady typing.', source: { kind: 'corpus', name: 'paragraphs', count: 1 }, scored: true },
              { type: 'timed', title: 'Precision test', text: '60 seconds at 95% or better.', seconds: 60, source: { kind: 'common', top: 300, count: 120 }, scored: true }
            ]
          },
          {
            id: '10.2',
            title: 'Zero-Backspace Challenge',
            summary: 'Backspace is disabled. Get it right the first time.',
            minutes: 5,
            keys: '*',
            newKeys: '',
            goals: { wpm: 24, accuracy: 96 },
            tip: 'Without Backspace, a short pause is cheaper than an error. Hesitate if you are unsure.',
            intro: 'Backspace is switched off. Every mistake stays on the page, so the only way to score well is to get each key right the first time.',
            steps: [
              { type: 'type', title: 'No-backspace sentences', text: 'Backspace is off. Type carefully.', source: { kind: 'corpus', name: 'sentencesMedium', count: 3 }, options: { noBackspace: true }, scored: true },
              { type: 'timed', title: 'No-backspace test', text: '30 seconds, no corrections.', seconds: 30, source: { kind: 'common', top: 200, count: 60 }, options: { noBackspace: true }, scored: true }
            ]
          },
          {
            id: '10.3',
            title: 'Difficult Letter Combinations',
            summary: 'Same-finger jumps, look-alikes and hard spellings.',
            minutes: 6,
            keys: '*',
            newKeys: '',
            goals: { wpm: 22, accuracy: 95 },
            tip: 'Watch for look-alike words such as their, there and they\'re. Read the word before you type it.',
            intro: 'Some combinations are awkward on QWERTY: same-finger jumps like ce, my or br, and look-alike words that trick your eyes. Drill them slowly and precisely.',
            steps: [
              { type: 'type', title: 'Same-finger jumps', text: 'One finger, two keys in a row. Move smoothly.', source: { kind: 'drill', items: ['ce', 'ed', 'de', 'my', 'un', 'nu', 'br', 'gr', 'ny', 'lo'], each: 2 } },
              { type: 'type', title: 'Word practice', text: 'Hard-to-spell words.', source: { kind: 'words', list: 'difficult', count: 14 } },
              { type: 'type', title: 'Tricky text', text: 'Look-alikes and mixed case.', source: { kind: 'corpus', name: 'accuracy', count: 1 } },
              { type: 'timed', title: 'Precision challenge', text: 'Difficult words for 30 seconds.', seconds: 30, source: { kind: 'words', list: 'difficult', count: 40 } }
            ]
          },
          {
            id: '10.4',
            title: 'Weak Finger Training',
            summary: 'Strengthen your pinky and ring fingers.',
            minutes: 6,
            keys: '*',
            newKeys: '',
            goals: { wpm: 22, accuracy: 95 },
            tip: 'Pinky and ring fingers tire first. Keep them curved and relaxed, never stiff.',
            intro: 'Pinky and ring fingers are naturally weaker and cause most errors. These drills load them on purpose: Q A Z P for the pinkies, W S X O L for the ring fingers. You finish with a drill aimed at your own weakest keys.',
            steps: [
              { type: 'type', title: 'Pinky drill', text: 'Left pinky: Q A Z. Right pinky: P and ;.', source: { kind: 'drill', items: ['aq', 'az', 'qa', 'za', ';p', 'p;'], each: 2 } },
              { type: 'type', title: 'Pinky words', text: 'Words full of Q, A, Z and P.', source: { kind: 'words', list: 'pinky', count: 16 } },
              { type: 'type', title: 'Ring finger words', text: 'Words full of W, S, X, O and L.', source: { kind: 'words', list: 'ring', count: 16 } },
              { type: 'type', title: 'Smart revision', text: 'A drill aimed at your weakest keys.', source: { kind: 'weak', count: 30 } },
              { type: 'timed', title: 'Weak finger challenge', text: 'Pinky and ring words for 30 seconds.', seconds: 30, source: { kind: 'mix', parts: [{ kind: 'words', list: 'pinky', count: 20 }, { kind: 'words', list: 'ring', count: 20 }], shuffle: true } }
            ]
          },
          {
            id: '10.5',
            title: 'Error Correction Drills',
            summary: 'Spot a mistake, Backspace, retype.',
            minutes: 6,
            keys: '*',
            newKeys: '',
            errorMode: 'correct',
            goals: { wpm: 24, accuracy: 95 },
            tip: 'Notice the error, press Backspace once, retype, move on. No sighing, no pausing.',
            intro: 'In this episode a wrong key turns red and you must press Backspace before you can continue. Train the reflex: notice, Backspace, retype, move on.',
            steps: [
              { type: 'learn', title: 'Correction mode', text: 'When a letter turns red, press Backspace once and type the right key. You cannot continue until the error is fixed.' },
              { type: 'type', title: 'Tricky text', text: 'Fix each error the moment it happens.', source: { kind: 'corpus', name: 'accuracy', count: 1 } },
              { type: 'type', title: 'Punctuated sentences', text: 'Commas and full stops count too.', source: { kind: 'corpus', name: 'commas', count: 3 } },
              { type: 'timed', title: 'Correction test', text: '60 seconds. Fix every error.', seconds: 60, source: { kind: 'common', top: 300, count: 120 } }
            ]
          },
          {
            id: '10.6',
            title: 'High Accuracy Under Pressure',
            summary: 'Five lives. Every error costs one.',
            minutes: 5,
            keys: '*',
            newKeys: '',
            goals: { wpm: 28, accuracy: 97 },
            tip: 'Under pressure, breathe out and drop your shoulders. Tension causes errors.',
            intro: 'Sudden death: you have five lives and every error costs one. Lose them all and the round ends. Type fast enough to score, but cleanly enough to survive.',
            steps: [
              { type: 'type', title: 'Warm-up', text: 'Settle your hands.', source: { kind: 'common', top: 100, count: 20 } },
              { type: 'timed', title: 'Survival round 1', text: 'Five lives, 60 seconds.', seconds: 60, source: { kind: 'common', top: 300, count: 120 }, options: { lives: 5 }, scored: true },
              { type: 'timed', title: 'Survival round 2', text: 'Real sentences, five lives.', seconds: 60, source: { kind: 'corpus', name: 'speed', count: 3 }, options: { lives: 5 }, scored: true }
            ]
          }
        ]
      },

      // ================================================================ 11
      {
        id: 11,
        title: 'Real-World Typing',
        level: 'advanced',
        goal: 'Handle everyday text: chats, emails, numbers and code',
        summary: 'Emails, paragraphs, coding, conversations',
        episodes: [
          {
            id: '11.1',
            title: 'Chat Conversations',
            summary: 'Quick, casual messages with Enter between them.',
            minutes: 5,
            keys: '*',
            newKeys: '',
            goals: { wpm: 28, accuracy: 93 },
            tip: 'Enter belongs to your right pinky. Reach right from ; and come straight back.',
            intro: 'Chat is fast and casual: short messages, contractions and the odd emoticon. Each message ends with Enter, pressed by your right pinky two keys to the right of ;.',
            steps: [
              { type: 'learn', title: 'Enter and apostrophes', text: 'Press Enter with your right pinky at the end of each message. The apostrophe in words like I\'m and don\'t sits just right of ; and is also a right-pinky key.', keys: '\'' },
              { type: 'type', title: 'Conversation 1', text: 'Type the chat. Press Enter after each message.', source: { kind: 'corpus', name: 'chat', count: 1 } },
              { type: 'type', title: 'Conversation 2', text: 'Another chat, a little faster.', source: { kind: 'corpus', name: 'chat', count: 1 } }
            ]
          },
          {
            id: '11.2',
            title: 'Email Writing',
            summary: 'Greeting, body and sign-off.',
            minutes: 6,
            keys: '*',
            newKeys: '',
            goals: { wpm: 28, accuracy: 93 },
            tip: 'A blank line between paragraphs is just Enter pressed twice.',
            intro: 'Emails have structure: a greeting, a few short paragraphs and a sign-off, each on its own line. Press Enter at every line break, and twice for a blank line.',
            steps: [
              { type: 'type', title: 'Email 1', text: 'Type the email. Enter starts a new line.', source: { kind: 'corpus', name: 'emails', count: 1 } },
              { type: 'type', title: 'Email 2', text: 'One more, a little smoother.', source: { kind: 'corpus', name: 'emails', count: 1 } }
            ]
          },
          {
            id: '11.3',
            title: 'News Articles',
            summary: 'Fact-packed paragraphs with names and numbers.',
            minutes: 6,
            keys: '*',
            newKeys: '',
            goals: { wpm: 30, accuracy: 93 },
            tip: 'Names and numbers are where errors hide. Slow down just for them, then resume your pace.',
            intro: 'News-style writing is dense: names, places, quotes and numbers packed into tight sentences. Keep your pace even and give the tricky details a little extra care.',
            steps: [
              { type: 'type', title: 'News story', text: 'Type the full article.', source: { kind: 'corpus', name: 'news', count: 1 } },
              { type: 'timed', title: 'News test', text: '60 seconds of news.', seconds: 60, source: { kind: 'corpus', name: 'news', count: 2 } }
            ]
          },
          {
            id: '11.4',
            title: 'Technical Paragraphs',
            summary: 'Precise explanations full of technical terms.',
            minutes: 6,
            keys: '*',
            newKeys: '',
            goals: { wpm: 28, accuracy: 93 },
            tip: 'Long technical words are chains of familiar clusters: con-fig-ur-a-tion.',
            intro: 'Technical writing uses long, exact words like configuration and protocol, where one wrong letter changes the meaning. Break long words into familiar chunks and keep accuracy high.',
            steps: [
              { type: 'type', title: 'Technical paragraph', text: 'Type the full explanation.', source: { kind: 'corpus', name: 'technical', count: 1 } },
              { type: 'timed', title: 'Technical test', text: '60 seconds of technical text.', seconds: 60, source: { kind: 'corpus', name: 'technical', count: 2 } }
            ]
          },
          {
            id: '11.5',
            title: 'Numbers and Dates',
            summary: 'The number row, dates, times and prices.',
            minutes: 8,
            keys: '*',
            newKeys: '1234567890',
            goals: { wpm: 25, accuracy: 93 },
            tip: 'Reach two rows up: the finger that types Q also types 1, the one that types W types 2.',
            intro: 'Each number key belongs to the finger below it: 1 left pinky, 2 left ring, 3 left middle, 4 and 5 left index, 6 and 7 right index, 8 right middle, 9 right ring, 0 right pinky. Reach up two rows and return home every time.',
            steps: [
              { type: 'learn', title: 'The number row', text: 'Left hand: pinky 1, ring 2, middle 3, index 4 and 5. Right hand: index 6 and 7, middle 8, ring 9, pinky 0. Reach up, tap, return.', keys: '1234567890' },
              { type: 'keys', title: 'Number tour', text: 'Find each number, left to right.', keys: '1234567890', count: 10, order: 'sequence' },
              { type: 'keys', title: 'Number hunt', text: 'Random numbers. Keep your hands on home.', keys: '1234567890', count: 20 },
              { type: 'type', title: 'Home to number', text: 'From each home key up to its number.', source: { kind: 'drill', items: ['a1', 's2', 'd3', 'f4', 'f5', 'j6', 'j7', 'k8', 'l9', ';0'], each: 2 } },
              { type: 'type', title: 'Number drills', text: 'Digits only.', source: { kind: 'numbers', count: 16, style: 'digits' } },
              { type: 'type', title: 'Dates and times', text: 'Slashes, colons and dashes.', source: { kind: 'numbers', count: 10, style: 'dates' } },
              { type: 'type', title: 'Numbers in sentences', text: 'Prices, dates and measurements.', source: { kind: 'corpus', name: 'numbers', count: 3 } },
              { type: 'timed', title: 'Speed challenge', text: 'Mixed numbers for 30 seconds.', seconds: 30, source: { kind: 'numbers', count: 30, style: 'mixed' } }
            ]
          },
          {
            id: '11.6',
            title: 'Programming Syntax',
            summary: 'Brackets, braces, operators and real code.',
            minutes: 9,
            keys: '*',
            newKeys: '()[]{}<>=+-*/_',
            goals: { wpm: 25, accuracy: 93 },
            tip: 'Most coding symbols belong to the right pinky. Keep it curved and let it travel.',
            intro: 'Code is full of symbols, and most belong to your right pinky: [ and ] right of P, - and = right of 0, quotes right of ;. Parentheses are Shift plus 9 and 0. After Enter, indentation is filled in for you.',
            steps: [
              { type: 'learn', title: 'Symbol map', text: '[ ] sit right of P and { } are Shift plus [ ]. ( ) are Shift plus 9 and 0. - and = sit right of 0; _ and + are their Shift versions. < and > are Shift plus comma and full stop.', keys: '()[]{}<>=+-_' },
              { type: 'type', title: 'Symbol drills', text: 'Symbols mixed with short names.', source: { kind: 'corpus', name: 'symbols', count: 3 } },
              { type: 'type', title: 'Code snippet 1', text: 'Type the code. Indentation is added after Enter.', source: { kind: 'corpus', name: 'code', count: 1 }, options: { autoIndent: true } },
              { type: 'type', title: 'Code snippet 2', text: 'Another snippet, another language.', source: { kind: 'corpus', name: 'code', count: 1 }, options: { autoIndent: true } }
            ]
          },
          {
            id: '11.7',
            title: 'Long-Form Typing',
            summary: 'A full essay or story, start to finish.',
            minutes: 12,
            keys: '*',
            newKeys: '',
            goals: { wpm: 32, accuracy: 93 },
            tip: 'Relax your shoulders at every paragraph break. Endurance comes from staying loose.',
            intro: 'Long-form typing builds endurance: hundreds of words with paragraphs, punctuation and the odd tricky word. Find a sustainable pace and hold it to the end.',
            steps: [
              { type: 'learn', title: 'Pace yourself', text: 'Aim for a speed you could keep up for ten minutes. A blank line between paragraphs is Enter pressed twice.' },
              { type: 'type', title: 'Long-form piece', text: 'Type the whole piece at a steady pace.', source: { kind: 'corpus', name: 'longform', count: 1, join: '\n\n' } }
            ]
          }
        ]
      },

      // ================================================================ 12
      {
        id: 12,
        title: 'Ultimate Speed Challenges',
        level: 'expert',
        goal: 'Hit WPM milestones and prove your mastery',
        summary: 'WPM milestones and final mastery tests',
        episodes: [
          milestone('12.1', 30, 25, '30 WPM Challenge',
            'Your first milestone: 30 words per minute for a full minute at 90% accuracy or better. Pass it to unlock the 40 WPM challenge.',
            'Milestones are earned, not rushed. If you miss, practise your weak keys and come back.'),
          milestone('12.2', 40, 35, '40 WPM Challenge',
            '40 WPM is a strong everyday speed for school and work. Hold it for 60 seconds with at least 90% accuracy.',
            'Read the next word while your fingers finish the current one.'),
          milestone('12.3', 50, 45, '50 WPM Challenge',
            'At 50 WPM your typing stops slowing your thinking down. Keep the rhythm even and your accuracy at 90% or better.',
            'Keep your fingers hovering just above the keys. Less travel means more speed.'),
          milestone('12.4', 60, 55, '60 WPM Challenge',
            '60 WPM is professional territory. Relaxed hands and reading ahead matter more than raw finger speed.',
            'Errors cost more time than they save. At this level, smooth beats fast.'),
          milestone('12.5', 80, 70, '80 WPM Challenge',
            '80 WPM is elite. Every wasted motion counts: light taps, fingers close to the keys, eyes always ahead.',
            'Light keystrokes are faster keystrokes. Press only as hard as the key needs.'),
          milestone('12.6', 100, 90, '100 WPM Challenge',
            'The century: 100 words per minute for a full minute. Only consistent, relaxed and accurate typing gets here.',
            'At 100 WPM you press about eight keys a second. Stay relaxed: tension is the real speed limit.'),
          {
            id: '12.7',
            title: 'Personal Best Championship',
            summary: 'Three rounds against your own best.',
            minutes: 6,
            keys: '*',
            newKeys: '',
            goals: { wpm: 45, accuracy: 95 },
            pass: { accuracy: 90 },
            // Not gated by the 100 WPM milestone: opens once the course (11.7) is complete.
            unlock: { after: '11.7' },
            tip: 'Treat round one as a warm-up for your nerves. Your best round usually comes later.',
            intro: 'The final event: three 60-second rounds. In rounds two and three a ghost of your best 60-second test races you. Your result across the three rounds is your championship score.',
            steps: [
              { type: 'type', title: 'Warm-up', text: 'Unscored. Get ready.', source: { kind: 'common', top: 100, count: 20 } },
              { type: 'timed', title: 'Round 1', text: '60 seconds. Set the pace.', seconds: 60, source: { kind: 'common', top: 200, count: 120 }, options: { record: 'test60' }, scored: true },
              { type: 'timed', title: 'Round 2', text: 'Race your personal best.', seconds: 60, source: { kind: 'corpus', name: 'speed', count: 3 }, options: { record: 'test60', ghost: 'test60' }, scored: true },
              { type: 'timed', title: 'Round 3', text: 'Final round. Leave nothing behind.', seconds: 60, source: { kind: 'common', top: 300, count: 120 }, options: { record: 'test60', ghost: 'test60' }, scored: true }
            ]
          }
        ]
      }
    ]
  };
})(window.TD = window.TD || {});
