import type { Difficulty } from '../../types/socket';

interface DifficultySelectProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

/** The Easy / Medium select that is sent with 'ready status'. */
export function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  return (
    <div className="dropdown">
      <label htmlFor="DifficultySelect">Level</label>
      <select
        name="cars"
        id="DifficultySelect"
        value={value}
        onChange={(e) => onChange(e.target.value === 'medium' ? 'medium' : 'easy')}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
      </select>
      <kbd title="Switch level">Alt</kbd>
    </div>
  );
}
