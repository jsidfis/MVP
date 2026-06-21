import { StrictMode, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  repository: {},
  createDailyRepository: vi.fn(),
  ensureDemoData: vi.fn(),
}));

vi.mock('./data/repositoryFactory', () => ({
  createDailyRepository: repositoryMocks.createDailyRepository,
}));

vi.mock('./data/demoSeed', () => ({
  ensureDemoData: repositoryMocks.ensureDemoData,
}));

vi.mock('./store/appStore', () => ({
  AppStoreProvider: ({ children }: { children: ReactNode }) => (
    <section data-testid="app-store">{children}</section>
  ),
}));

vi.mock('./views/DailyWorkspace', () => ({
  DailyWorkspace: ({
    workspaceMode,
    onChangeWorkspaceMode,
  }: {
    workspaceMode: string;
    onChangeWorkspaceMode(mode: string): void;
  }) => (
    <div>
      <p>今日工作台</p>
      <p>当前数据：{workspaceMode}</p>
      <button type="button" onClick={() => onChangeWorkspaceMode('demo')}>
        切换示例
      </button>
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    repositoryMocks.createDailyRepository.mockReset();
    repositoryMocks.createDailyRepository.mockResolvedValue(repositoryMocks.repository);
    repositoryMocks.ensureDemoData.mockReset();
  });

  it('shows the workspace mode gate before the first choice', async () => {
    const { App } = await import('./App');

    render(<App />);

    expect(screen.getByRole('button', { name: '空白开始' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '查看示例' })).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).not.toHaveBeenCalled();
  });

  it('creates the user repository after blank start is selected', async () => {
    const { App } = await import('./App');

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '空白开始' }));

    expect(await screen.findByText('今日工作台')).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).toHaveBeenCalledWith('user');
    expect(repositoryMocks.ensureDemoData).not.toHaveBeenCalled();
  });

  it('creates and seeds the demo repository after demo start is selected', async () => {
    const { App } = await import('./App');

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '查看示例' }));

    expect(await screen.findByText('今日工作台')).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).toHaveBeenCalledWith('demo');
    expect(repositoryMocks.ensureDemoData).toHaveBeenCalledWith(
      repositoryMocks.repository,
      expect.any(String),
    );
  });

  it('loads the persisted workspace mode once under StrictMode', async () => {
    localStorage.setItem('daily-plan-review.workspace-mode', 'user');
    const { App } = await import('./App');

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(await screen.findByText('今日工作台')).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).toHaveBeenCalledOnce();
  });

  it('recreates the repository when the workspace mode changes', async () => {
    localStorage.setItem('daily-plan-review.workspace-mode', 'user');
    const { App } = await import('./App');

    render(<App />);
    expect(await screen.findByText('当前数据：user')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: '切换示例' }));

    await waitFor(() => {
      expect(repositoryMocks.createDailyRepository).toHaveBeenLastCalledWith('demo');
    });
  });

  it('shows a repository loading error', async () => {
    localStorage.setItem('daily-plan-review.workspace-mode', 'user');
    repositoryMocks.createDailyRepository.mockRejectedValue(new Error('Database failed'));
    const { App } = await import('./App');

    render(<App />);

    expect(await screen.findByText('今日工作台打开失败')).toBeTruthy();
  });
});
