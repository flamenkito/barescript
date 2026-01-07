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

  function handleNewScript() {
    const newScript: UserScript = {
      id: generateId(),
      name: 'New Script',
      enabled: true,
      type: 'script',
      matches: ['*://*/*'],
      runAt: 'document-end',
      code: `// ==BareScript==
// @name        New Script
// @type        script
// @match       *://*/*
// @run-at      document-end
// ==/BareScript==

console.log('Hello from BareScript!');
`,
      updatedAt: Date.now(),
    };
    setEditingScript(newScript);
  }

  function handleNewLibrary() {
    const newLibrary: UserScript = {
      id: generateId(),
      name: 'my-library',
      enabled: true,
      type: 'library',
      matches: [],
      runAt: 'document-end',
      code: `// ==BareScript==
// @name        my-library
// @type        library
// ==/BareScript==

// Usage: import MyLib from 'my-library';
export default {
  greet(name) {
    return 'Hello, ' + name + '!';
  }
};
`,
      updatedAt: Date.now(),
    };
    setEditingScript(newLibrary);
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
          <img src="/icons/icon48.png" alt="BareScript" width="32" height="32" />
          BareScript
        </div>
      </header>

      <div class="scripts-header">
        <h2 class="scripts-title">Scripts & Libraries</h2>
        <div class="header-actions">
          <button class="btn-primary" onClick={handleNewScript}>
            + New Script
          </button>
          <button class="btn-secondary" onClick={handleNewLibrary}>
            + New Library
          </button>
        </div>
      </div>

      {scripts.length === 0 ? (
        <div class="empty-state">
          <p>No scripts yet</p>
          <button class="btn-primary" onClick={handleNewScript}>
            Create your first script
          </button>
        </div>
      ) : (
        scripts.map((script) => (
          <div class="script-card" key={script.id}>
            <div class="script-info">
              <div class="script-card-name">
                {script.name}
                <span class={`type-badge ${script.type === 'library' ? 'type-library' : 'type-script'}`}>
                  {script.type === 'library' ? 'Library' : 'Script'}
                </span>
              </div>
              <div class="script-card-matches">
                {script.type === 'library'
                  ? `import ${script.name.replace(/-/g, '')} from '${script.name}';`
                  : script.matches.join(', ')}
              </div>
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
