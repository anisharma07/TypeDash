import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { LeaderboardModal } from './LeaderboardModal';
import type { LeaderboardModalProps } from '../types';
import type { LeaderboardPlayer } from '../../types/socket';

const row = (joinId: number, eM: number, eL: number, mM: number, mL: number, username: string): LeaderboardPlayer => ({
  joinId,
  username,
  userAvatar: 'avatar2',
  highScore: { Easy: { Mobile: eM, Laptop: eL }, Medium: { Mobile: mM, Laptop: mL } },
});

const XSS = '<img src=x onerror="window.__pwned=1">';
const DATA = [row(101, 0, 80, 0, 0, XSS), row(102, 60, 0, 90, 0, 'bob')];

const ok = (data: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(() => ok(DATA));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup(over: Partial<LeaderboardModalProps> = {}) {
  const props: LeaderboardModalProps = {
    open: true,
    onClose: vi.fn(),
    level: 'easy',
    onLevelChange: vi.fn(),
    onRefresh: vi.fn(),
    joinId: 102,
    refreshToken: 0,
    ...over,
  };
  const utils = render(<LeaderboardModal {...props} />);
  return { props, ...utils };
}

describe('LeaderboardModal', () => {
  it('renders names as inert text and marks my card', async () => {
    const { container } = setup();
    const names = await waitFor(() => {
      const n = container.querySelectorAll('.player-rankings-easy .rank-player-name');
      expect(n).toHaveLength(2);
      return n;
    });
    expect(names[0].textContent).toBe(`${XSS}#101`);
    expect(names[0].querySelector('img')).toBeNull();
    expect(names[0].querySelector('.player-user-id')?.textContent).toBe('#101');
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
    const cards = container.querySelectorAll('.player-rankings-easy .rank-card');
    expect(cards[0]).not.toHaveClass('me-rank-card');
    expect(cards[1]).toHaveClass('me-rank-card');
    expect(cards[0].querySelector('.rank-player-wpm')?.textContent).toBe('80 wpm');
    expect(cards[0].querySelector('.device-icon')).toHaveAttribute('src', '/images/computer.png');
    expect(cards[1].querySelector('.device-icon')).toHaveAttribute('src', '/images/iphone.png');
  });

  it('hides when closed and calls onClose', async () => {
    const { container, props, rerender } = setup({ open: false });
    expect(container.querySelector('.leader-board-menu')).toHaveClass('hidden');
    rerender(<LeaderboardModal {...props} open />);
    expect(container.querySelector('.leader-board-menu')).not.toHaveClass('hidden');
    await userEvent.click(screen.getByRole('button'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('switches levels via props and clicks', async () => {
    const { container, props, rerender } = setup();
    expect(container.querySelector('.easy')).toHaveClass('leaderboard-level-chosen');
    expect(container.querySelector('.player-rankings-medium')).toHaveClass('hidden');
    expect(container.querySelector('.player-rankings-easy')).not.toHaveClass('hidden');
    await userEvent.click(container.querySelector('.medium') as Element);
    expect(props.onLevelChange).toHaveBeenCalledWith('medium');
    await userEvent.click(container.querySelector('.easy') as Element);
    expect(props.onLevelChange).toHaveBeenCalledWith('easy');
    rerender(<LeaderboardModal {...props} level="medium" />);
    expect(container.querySelector('.medium')).toHaveClass('leaderboard-level-chosen');
    expect(container.querySelector('.easy')).not.toHaveClass('leaderboard-level-chosen');
    expect(container.querySelector('.player-rankings-easy')).toHaveClass('hidden');
    await waitFor(() =>
      expect(container.querySelectorAll('.player-rankings-medium .rank-card')).toHaveLength(1),
    );
  });

  it('filter icon calls onRefresh', async () => {
    const { container, props } = setup();
    await userEvent.click(container.querySelector('.filter-logo') as Element);
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('refetches when refreshToken changes', async () => {
    const { props, rerender, container } = setup();
    await waitFor(() => expect(container.querySelectorAll('.rank-card')).toHaveLength(3));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockImplementation(() => ok([row(5, 10, 0, 0, 0, 'zed')]));
    rerender(<LeaderboardModal {...props} refreshToken={1} />);
    await waitFor(() => expect(screen.getByText('zed')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('bob')).toBeNull();
  });

  it('ignores stale responses', async () => {
    let resolveFirst: (v: Response) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise<Response>((r) => (resolveFirst = r)));
    const { props, rerender } = setup();
    fetchMock.mockImplementationOnce(() => ok([row(5, 10, 0, 0, 0, 'fresh')]));
    rerender(<LeaderboardModal {...props} refreshToken={1} />);
    await screen.findByText('fresh');
    resolveFirst({ ok: true, json: () => Promise.resolve(DATA) } as Response);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByText('fresh')).toBeInTheDocument();
    expect(screen.queryByText('bob')).toBeNull();
  });

  it('keeps previous lists when a refetch fails', async () => {
    const { props, rerender } = setup();
    await screen.findAllByText('bob');
    fetchMock.mockImplementation(() => Promise.reject(new Error('offline')));
    rerender(<LeaderboardModal {...props} refreshToken={1} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getAllByText('bob').length).toBeGreaterThan(0);
  });

  it('does not crash on initial failure or HTTP error', async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false, status: 500 } as Response));
    const { container } = setup();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.querySelectorAll('.rank-card')).toHaveLength(0);
    expect(container.querySelector('.leader-board-menu')).toBeInTheDocument();
  });

  it('works under StrictMode', async () => {
    const props: LeaderboardModalProps = {
      open: true, onClose: vi.fn(), level: 'easy', onLevelChange: vi.fn(), onRefresh: vi.fn(), joinId: null, refreshToken: 0,
    };
    const { container } = render(<StrictMode><LeaderboardModal {...props} /></StrictMode>);
    await waitFor(() => expect(container.querySelectorAll('.player-rankings-easy .rank-card')).toHaveLength(2));
    expect(container.querySelector('.me-rank-card')).toBeNull();
  });
});
