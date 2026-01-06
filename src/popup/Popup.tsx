import { useState, useEffect } from 'preact/hooks';
import { isExtensionEnabled, setExtensionEnabled, saveScript } from '@/utils/storage';
import type { UserScript } from '@/types/userscript';

export function Popup() {
  const [enabled, setEnabled] = useState(true);
  const [scripts, setScripts] = useState<UserScript[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const ext = await isExtensionEnabled();
    setEnabled(ext);

    // Get current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      setCurrentUrl(tab.url);

      // Get matching scripts from background
      const matchingScripts = await chrome.runtime.sendMessage({
        type: 'GET_MATCHING_SCRIPTS',
        url: tab.url,
      });
      setScripts(matchingScripts || []);
    }
  }

  async function handleToggleExtension() {
    const newState = !enabled;
    await setExtensionEnabled(newState);
    setEnabled(newState);
  }

  async function handleToggleScript(script: UserScript) {
    const updated = { ...script, enabled: !script.enabled, updatedAt: Date.now() };
    await saveScript(updated);
    setScripts(scripts.map((s) => (s.id === script.id ? updated : s)));
  }

  function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/dashboard.html') });
  }

  const hostname = currentUrl ? new URL(currentUrl).hostname : '';

  return (
    <div class="popup">
      <header class="popup-header">
        <div class="popup-title">
          <img src="/icons/icon48.png" alt="BareScript" width="24" height="24" />
          BareScript
        </div>
        <div
          class={`toggle ${enabled ? 'active' : ''}`}
          onClick={handleToggleExtension}
          role="switch"
          aria-checked={enabled}
        />
      </header>

      {scripts.length > 0 ? (
        <div class="script-list">
          <div class="script-list-title">{hostname || 'Scripts'}</div>
          {scripts.map((script) => (
            <div class="script-item" key={script.id}>
              <span class="script-name">{script.name}</span>
              <div
                class={`toggle ${script.enabled ? 'active' : ''}`}
                onClick={() => handleToggleScript(script)}
                role="switch"
                aria-checked={script.enabled}
              />
            </div>
          ))}
        </div>
      ) : (
        <div class="no-scripts">
          <svg class="no-scripts-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          No scripts for this page
        </div>
      )}

      <footer class="popup-footer">
        <a class="dashboard-link" onClick={openDashboard}>
          Dashboard
        </a>
      </footer>
    </div>
  );
}
