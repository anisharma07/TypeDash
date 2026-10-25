// Public surface of the engine. Implemented by engine.ts (owned by the engine task).
export type { EngineState, LetterModel, LetterStatus, WordModel } from './types';
export { createEngine, typeChar, pressSpace, pressBackspace } from './engine';
