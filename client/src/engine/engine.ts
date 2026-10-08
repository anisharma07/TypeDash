import type { EngineState } from './types';

// STUB - replaced by the engine task. Signatures are the contract.
export function createEngine(_text: string): EngineState {
  throw new Error('engine not implemented');
}
/** One printable character typed (anything except space/backspace). */
export function typeChar(_state: EngineState, _ch: string): EngineState {
  throw new Error('engine not implemented');
}
export function pressSpace(_state: EngineState): EngineState {
  throw new Error('engine not implemented');
}
export function pressBackspace(_state: EngineState): EngineState {
  throw new Error('engine not implemented');
}
