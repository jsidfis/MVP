import { useState } from 'react';

export type DataSafetyPanelProps = {
  onExportJson(): Promise<string> | string;
  onExportMarkdown(): Promise<string> | string;
  onImportJson(payload: unknown): Promise<void> | void;
  onResetDemo(): Promise<void> | void;
  canResetDemo?: boolean;
};

export function DataSafetyPanel({
  onExportJson,
  onExportMarkdown,
  onImportJson,
  onResetDemo,
  canResetDemo = true,
}: DataSafetyPanelProps) {
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function exportJson() {
    await runAction(async () => {
      const content = await onExportJson();
      downloadTextFile('daily-plan-review-backup.json', content, 'application/json');
      setMessage('JSON 备份已生成');
    });
  }

  async function exportMarkdown() {
    await runAction(async () => {
      const content = await onExportMarkdown();
      downloadTextFile('daily-plan-review-archive.md', content, 'text/markdown');
      setMessage('Markdown 档案已生成');
    });
  }

  async function importJson() {
    setMessage('');
    setError('');

    let payload: unknown;

    try {
      payload = JSON.parse(importText);
    } catch {
      setError('导入内容不是有效 JSON');
      return;
    }

    await runAction(async () => {
      await onImportJson(payload);
      setMessage('JSON 备份已导入');
      setImportText('');
    });
  }

  async function resetDemo() {
    await runAction(async () => {
      await onResetDemo();
      setMessage('示例数据已重置');
    });
  }

  async function runAction(action: () => Promise<void>) {
    setMessage('');
    setError('');

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '操作失败');
    }
  }

  return (
    <section className="data-safety-panel" aria-label="数据安全">
      <h2>数据安全</h2>

      <div className="data-paths">
        <p>
          我的数据：<code>data/user.sqlite</code>
        </p>
        <p>
          示例数据：<code>data/demo.sqlite</code>
        </p>
      </div>

      <div className="data-safety-actions">
        <button type="button" className="secondary-button" onClick={() => void exportJson()}>
          导出 JSON 备份
        </button>
        <button type="button" className="secondary-button" onClick={() => void exportMarkdown()}>
          导出 Markdown 档案
        </button>
      </div>

      <label className="field">
        粘贴 JSON 备份内容
        <textarea value={importText} onChange={(event) => setImportText(event.target.value)} />
      </label>

      <div className="data-safety-actions">
        <button type="button" className="primary-button" onClick={() => void importJson()}>
          导入 JSON 备份
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={!canResetDemo}
          onClick={() => void resetDemo()}
        >
          重置示例数据
        </button>
      </div>

      {canResetDemo ? null : <p className="hint-text">只有示例数据模式可以重置示例数据。</p>}
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p role="alert" className="error-text">{error}</p> : null}
    </section>
  );
}

function downloadTextFile(fileName: string, content: string, type: string) {
  if (typeof URL.createObjectURL !== 'function') {
    return;
  }

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
