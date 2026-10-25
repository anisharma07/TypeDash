import type { Difficulty } from '../../types/socket';

interface DifficultySelectProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

/** Legacy `.dropdown`: the Easy / Medium select that is sent with 'ready status'. */
export function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  return (
    <div className="dropdown">
      <h3>Level:</h3>
      <img src="/images/alt.png" alt="difficulty-change" className="difficulty-change-bind keyss" />
      <select
        name="cars"
        id="DifficultySelect"
        value={value}
        onChange={(e) => onChange(e.target.value === 'medium' ? 'medium' : 'easy')}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
      </select>
    </div>
  );
}
