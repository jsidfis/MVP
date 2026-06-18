import type { HomeView } from '../domain/types';

const viewLabels: Record<HomeView, string> = {
  folder: '文件夹视图',
  galaxy: '星系视图',
};

const views: HomeView[] = ['folder', 'galaxy'];

export function ViewSwitch({
  currentView,
  onChange,
}: {
  currentView: HomeView;
  onChange: (view: HomeView) => void;
}) {
  return (
    <div className="segmented-control" aria-label="视图">
      {views.map((view) => (
        <button
          key={view}
          type="button"
          className="segmented-control__button"
          aria-pressed={currentView === view}
          onClick={() => onChange(view)}
        >
          {viewLabels[view]}
        </button>
      ))}
    </div>
  );
}
