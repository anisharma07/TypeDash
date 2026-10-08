import type { LightState } from '../hooks/useRound';

/** Legacy `.circles`: the red / yellow / green start lights. */
export function TrafficLight({ light }: { light: LightState }) {
  return (
    <div className="circles">
      <div className="red-circle" style={light.red}></div>
      <div className="yellow-circle" style={light.yellow}></div>
      <div className="green-circle" style={light.green}></div>
    </div>
  );
}
