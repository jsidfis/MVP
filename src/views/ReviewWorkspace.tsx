import type { HomeView, Task } from '../domain/types';
import { FolderView } from './FolderView';
import { GalaxyView } from './GalaxyView';
import { ReviewPanel, type ReviewSubmitInput } from './ReviewPanel';

export function ReviewWorkspace({
  currentView,
  tasks,
  onSubmit,
}: {
  currentView: HomeView;
  tasks: Task[];
  onSubmit(input: ReviewSubmitInput): void;
}) {
  return (
    <section className="stage-workspace review-workspace" aria-label="复盘工作区">
      <div className="review-workspace__background" aria-label="复盘背景">
        {currentView === 'galaxy' ? <GalaxyView tasks={tasks} /> : <FolderView tasks={tasks} />}
      </div>
      <aside className="review-workspace__drawer" aria-label="复盘抽屉">
        <ReviewPanel tasks={tasks} onSubmit={onSubmit} />
      </aside>
    </section>
  );
}
