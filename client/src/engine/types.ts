/**
 * Pure typing engine contract. The implementation (engine.ts) is a faithful,
 * DOM-free port of the typing logic in legacy/public/js/multiplayer.js
 * (initTyping / spacePressed / backspacePressed). Counters keep the legacy
 * names and semantics so the race-progress maths stay identical.
 */
export type LetterStatus = 'pending' | 'correct' | 'incorrect' | 'missed';

export interface LetterModel {
  char: string;
  status: LetterStatus;
  /** typed beyond the end of the word (legacy `.extra`) */
  extra?: boolean;
}

export interface WordModel {
  letters: LetterModel[];
}

export interface EngineState {
  words: WordModel[];
  /** index of the current word (legacy `.word.current`) */
  wordIndex: number;
  /** index of the current letter inside the current word; === letters.length when past the end (legacy: no `.letter.current`) */
  letterIndex: number;
  /** legacy `counter`: correctly typed characters (+ spaces) used for WPM */
  counter: number;
  /** legacy `progress`: advancement units used for the race-track percentage */
  progress: number;
  /** legacy `mistakes` */
  mistakes: number;
  /** legacy `quoteLength`: letters excluding spaces */
  totalChars: number;
  /** legacy `noOfWords` */
  wordCount: number;
  /** true once the legacy code would have called endGame() because the text was completed */
  finished: boolean;
}
