import { getAllScripts, isExtensionEnabled } from '@/utils/storage';
import { urlMatchesAnyPattern } from '@/utils/matcher';
import type { UserScript } from '@/types/userscript';

// Inject scripts when tab is updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only run when page has loaded
  if (changeInfo.status !== 'complete') {
    return;
  }

  // Check if extension is enabled
  const enabled = await isExtensionEnabled();
  if (!enabled) {
    return;
  }

  const url = tab.url;
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return;
  }

  await injectMatchingScripts(tabId, url);
});

async function injectMatchingScripts(tabId: number, url: string): Promise<void> {
  const scripts = await getAllScripts();
  const matchingScripts = scripts.filter(
    (script) => script.enabled && urlMatchesAnyPattern(url, script.matches)
  );

  for (const script of matchingScripts) {
    await injectScript(tabId, script);
  }
}

async function injectScript(tabId: number, script: UserScript): Promise<void> {
  try {
    const wrappedCode = `
      (async function() {
        function waitForIdleDOM({ quietMs = 300, timeout = 10000 } = {}) {
          return new Promise((resolve, reject) => {
            let timer = null;
            const done = () => { cleanup(); resolve(); };
            const fail = () => { cleanup(); reject(new Error("Timeout waiting for DOM idle")); };
            const obs = new MutationObserver(() => {
              clearTimeout(timer);
              timer = setTimeout(done, quietMs);
            });
            const cleanup = () => {
              obs.disconnect();
              clearTimeout(timer);
              clearTimeout(deadline);
            };
            obs.observe(document, { childList: true, subtree: true, attributes: true });
            timer = setTimeout(done, quietMs);
            const deadline = setTimeout(fail, timeout);
          });
        }

        // Wait for DOM idle
        try {
          await waitForIdleDOM();
        } catch (e) {
          console.warn('[userscript:${script.name}] DOM idle timeout');
        }

        // Remove blur applied by content script
        const blurStyle = document.getElementById('barescript-blur');
        if (blurStyle) blurStyle.remove();

        console.log('[userscript:${script.name}] loaded');
        ${script.code}
      })();
    `;

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (code: string) => {
        const scriptEl = document.createElement('script');
        scriptEl.textContent = code;
        (document.head || document.documentElement).appendChild(scriptEl);
        scriptEl.remove();
      },
      args: [wrappedCode],
      world: 'MAIN',
    });
  } catch (error) {
    console.error(`[userscript:${script.name}] injection failed:`, error);
  }
}

// Get scripts matching current tab URL
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_MATCHING_SCRIPTS') {
    handleGetMatchingScripts(message.url).then(sendResponse);
    return true;
  }
  if (message.type === 'CHECK_HAS_SCRIPTS') {
    handleCheckHasScripts(message.url).then(sendResponse);
    return true;
  }
});

async function handleCheckHasScripts(url: string): Promise<{ hasScripts: boolean }> {
  const enabled = await isExtensionEnabled();
  if (!enabled) return { hasScripts: false };

  const scripts = await getAllScripts();
  const hasScripts = scripts.some(
    (script) => script.enabled && urlMatchesAnyPattern(url, script.matches)
  );
  return { hasScripts };
}

async function handleGetMatchingScripts(url: string): Promise<UserScript[]> {
  const scripts = await getAllScripts();
  return scripts.filter((script) => urlMatchesAnyPattern(url, script.matches));
}

console.log('[barescript] background service worker started');
