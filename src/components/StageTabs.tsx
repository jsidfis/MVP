import type { Stage } from '../domain/types';

const stageLabels: Record<Stage, string> = {
  plan: '计划',
  execute: '执行中',
  review: '复盘',
};

const stages: Stage[] = ['plan', 'execute', 'review'];

export function StageTabs({
  currentStage,
  onChange,
}: {
  currentStage: Stage;
  onChange: (stage: Stage) => void;
}) {
  return (
    <div className="segmented-control" aria-label="阶段">
      {stages.map((stage) => (
        <button
          key={stage}
          type="button"
          className="segmented-control__button"
          aria-pressed={currentStage === stage}
          onClick={() => onChange(stage)}
        >
          {stageLabels[stage]}
        </button>
      ))}
    </div>
  );
}
