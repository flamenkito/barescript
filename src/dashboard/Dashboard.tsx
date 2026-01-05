import { useState, useEffect } from 'preact/hooks';
import { getAllScripts, deleteScript, saveScript, generateId } from '@/utils/storage';
import { ScriptEditor } from '@/components/ScriptEditor';
import type { UserScript } from '@/types/userscript';

export function Dashboard() {
  const [scripts, setScripts] = useState<UserScript[]>([]);
  const [editingScript, setEditingScript] = useState<UserScript | null>(null);

  useEffect(() => {
    loadScripts();
  }, []);

  async function loadScripts() {
    const all = await getAllScripts();
    setScripts(all.sort((a, b) => b.updatedAt - a.updatedAt));
  }

  function handleNew() {
    const newScript: UserScript = {
      id: generateId(),
      name: 'New Script',
      enabled: true,
      matches: ['*://*/*'],
      runAt: 'document-end',
      code: `// ==UserScript==
// @name        New Script
// @match       *://*/*
// ==/UserScript==

console.log('Hello from userscript!');
`,
      updatedAt: Date.now(),
    };
    setEditingScript(newScript);
  }

  async function handleSave(script: UserScript) {
    await saveScript(script);
    setEditingScript(null);
    await loadScripts();
  }

  function handleCancel() {
    setEditingScript(null);
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this script?')) {
      await deleteScript(id);
      await loadScripts();
    }
  }

  async function handleToggle(script: UserScript) {
    const updated = { ...script, enabled: !script.enabled, updatedAt: Date.now() };
    await saveScript(updated);
    await loadScripts();
  }

  if (editingScript) {
    return (
      <div class="dashboard">
        <ScriptEditor script={editingScript} onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div class="dashboard">
      <header class="dashboard-header">
        <div class="dashboard-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          BareScript
        </div>
      </header>

      <div class="scripts-header">
        <h2 class="scripts-title">Scripts</h2>
        <button class="btn-primary" onClick={handleNew}>
          + New Script
        </button>
      </div>

      {scripts.length === 0 ? (
        <div class="empty-state">
          <p>No scripts yet</p>
          <button class="btn-primary" onClick={handleNew}>
            Create your first script
          </button>
        </div>
      ) : (
        scripts.map((script) => (
          <div class="script-card" key={script.id}>
            <div class="script-info">
              <div class="script-card-name">{script.name}</div>
              <div class="script-card-matches">{script.matches.join(', ')}</div>
            </div>
            <div class="script-actions">
              <div
                class={`toggle ${script.enabled ? 'active' : ''}`}
                onClick={() => handleToggle(script)}
                role="switch"
                aria-checked={script.enabled}
              />
              <button class="btn-secondary" onClick={() => setEditingScript(script)}>
                Edit
              </button>
              <button class="btn-danger" onClick={() => handleDelete(script.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
