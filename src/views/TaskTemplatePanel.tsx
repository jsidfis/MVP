import { useState, type FormEvent } from 'react';
import type { TaskTemplate } from '../data/taskTemplates';
import type { Quadrant, Task } from '../domain/types';

const quadrantLabels: Record<Quadrant, string> = {
  important_urgent: '重要且紧急',
  important_not_urgent: '重要不紧急',
  not_important_urgent: '不重要但紧急',
  not_important_not_urgent: '不重要不紧急',
};

type TaskTemplatePanelProps = {
  tasks: Task[];
  templates: TaskTemplate[];
  onSaveTemplate: (input: { name: string; taskIds: string[] }) => Promise<void> | void;
  onApplyTemplate: (templateId: string) => Promise<void> | void;
};

export function TaskTemplatePanel({
  tasks,
  templates,
  onSaveTemplate,
  onApplyTemplate,
}: TaskTemplatePanelProps) {
  const [templateName, setTemplateName] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const canSave = templateName.trim().length > 0 && selectedTaskIds.length > 0 && !isSaving;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveTemplate({ name: templateName.trim(), taskIds: selectedTaskIds });
      setTemplateName('');
      setSelectedTaskIds([]);
    } finally {
      setIsSaving(false);
    }
  }

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }

  return (
    <section className="workspace-panel task-template-panel" aria-labelledby="task-template-title">
      <h2 id="task-template-title">任务模板</h2>

      <form className="task-template-panel__form" onSubmit={handleSave}>
        <label className="field">
          <span>模板名称</span>
          <input
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            placeholder="例如：晨间启动"
          />
        </label>

        <fieldset className="task-template-panel__tasks">
          <legend>选择要保存的任务</legend>
          {tasks.length === 0 ? (
            <p className="empty-state">今天还没有可保存的任务。</p>
          ) : (
            tasks.map((task) => (
              <label key={task.id} className="task-template-panel__task">
                <input
                  type="checkbox"
                  checked={selectedTaskIds.includes(task.id)}
                  onChange={() => toggleTask(task.id)}
                />
                <span>任务：{task.title}</span>
                <span className="task-template-panel__meta">{quadrantLabels[task.quadrant]}</span>
                {task.plannedDurationMinutes ? (
                  <span className="task-template-panel__meta">
                    {task.plannedDurationMinutes} 分钟
                  </span>
                ) : null}
              </label>
            ))
          )}
        </fieldset>

        <button type="submit" className="secondary-button" disabled={!canSave}>
          保存为模板
        </button>
      </form>

      <div className="task-template-panel__saved">
        <h3>已有模板</h3>
        {templates.length === 0 ? (
          <p className="empty-state">暂无模板。</p>
        ) : (
          <ul>
            {templates.map((template) => (
              <li key={template.id}>
                <span>{template.name}</span>
                <button
                  type="button"
                  className="task-action-button"
                  onClick={() => onApplyTemplate(template.id)}
                >
                  应用 {template.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
