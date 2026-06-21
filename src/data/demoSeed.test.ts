import { describe, expect, it } from 'vitest';
import { ensureDemoData } from './demoSeed';
import { MemoryDailyRepository } from './memoryDailyRepository';

const today = '2026-06-21';

describe('ensureDemoData', () => {
  it('seeds realistic demo tasks, review, and settings into an empty repository', async () => {
    const repository = new MemoryDailyRepository();

    await ensureDemoData(repository, today);

    const tasks = await repository.listTasks(today);
    const dailyFile = await repository.getDailyFile(today);
    const settings = await repository.getSettings();

    expect(tasks.length).toBeGreaterThanOrEqual(6);
    expect(new Set(tasks.map((task) => task.quadrant))).toEqual(
      new Set([
        'important_urgent',
        'important_not_urgent',
        'not_important_urgent',
        'not_important_not_urgent',
      ]),
    );
    expect(tasks.some((task) => task.status === 'completed')).toBe(true);
    expect(tasks.some((task) => task.status === 'postponed')).toBe(true);
    expect(dailyFile.goal).toContain('体验');
    expect(dailyFile.review?.completedText).toContain('完成');
    expect(settings.homeView).toBe('galaxy');
  });

  it('does not seed twice when demo tasks already exist', async () => {
    const repository = new MemoryDailyRepository();

    await ensureDemoData(repository, today);
    const firstSeed = await repository.listTasks(today);
    await ensureDemoData(repository, today);

    await expect(repository.listTasks(today)).resolves.toEqual(firstSeed);
  });
});
