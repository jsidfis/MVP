import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { Task } from '../domain/types';
import { AppStoreProvider, useAppStore } from './appStore';

const today = '2026-06-18';

describe('AppStoreProvider search', () => {
  it('searches local repository tasks through store actions', async () => {
    const repository = new MemoryDailyRepository();
    await repository.saveTask(task('task-1', 'Write plan'));
    await repository.saveTask(task('task-2', 'Archive inbox'));

    render(
      <AppStoreProvider repository={repository} today={today}>
        <SearchProbe />
      </AppStoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loaded'));
    await userEvent.click(screen.getByRole('button', { name: 'search' }));

    await waitFor(() => expect(screen.getByTestId('results').textContent).toBe('Write plan'));
    expect(screen.getByTestId('results').textContent).not.toContain('Archive inbox');
  });
});

function SearchProbe() {
  const store = useAppStore();
  const [resultText, setResultText] = useState('');

  return (
    <div>
      <span data-testid="loading">{store.isLoading ? 'loading' : 'loaded'}</span>
      <button
        type="button"
        onClick={() =>
          void store.searchTasks({ keyword: 'plan' }).then((tasks) => {
            setResultText(tasks.map((task) => task.title).join(', '));
          })
        }
      >
        search
      </button>
      <span data-testid="results">{resultText}</span>
    </div>
  );
}

function task(id: string, title: string): Task {
  return {
    id,
    date: today,
    title,
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: false,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  };
}
