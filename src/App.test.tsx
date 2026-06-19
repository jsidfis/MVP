import { StrictMode, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  createDailyRepository: vi.fn(),
}));

vi.mock('./data/repositoryFactory', () => ({
  createDailyRepository: repositoryMocks.createDailyRepository,
}));

vi.mock('./store/appStore', () => ({
  AppStoreProvider: ({ children }: { children: ReactNode }) => (
    <section data-testid="app-store">{children}</section>
  ),
}));

vi.mock('./views/DailyWorkspace', () => ({
  DailyWorkspace: () => <div>今日工作台</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.resetModules();
    repositoryMocks.createDailyRepository.mockReset();
  });

  it('loads the daily repository once under StrictMode', async () => {
    repositoryMocks.createDailyRepository.mockResolvedValue({});
    const { App } = await import('./App');

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(await screen.findByText('今日工作台')).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).toHaveBeenCalledOnce();
  });
});
