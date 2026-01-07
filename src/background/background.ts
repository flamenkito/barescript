import { getAllScripts, isExtensionEnabled, getLibraries } from '@/utils/storage';
import { urlMatchesAnyPattern } from '@/utils/matcher';
import type { UserScript } from '@/types/userscript';

// Register document-start scripts on startup
registerDocumentStartScripts();

// Listen for storage changes to re-register scripts
chrome.storage.onChanged.addListener((changes) => {
  if (changes.scripts) {
    registerDocumentStartScripts();
  }
});

// Inject document-end scripts when tab is fully loaded
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  const enabled = await isExtensionEnabled();
  if (!enabled) return;

  const url = tab.url;
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return;
  }

  await injectMatchingScripts(tabId, url, 'document-end');
});

async function registerDocumentStartScripts(): Promise<void> {
  try {
    // Unregister all existing barescript content scripts
    const existing = await chrome.scripting.getRegisteredContentScripts();
    const bareScriptIds = existing
      .filter((s) => s.id.startsWith('barescript-'))
      .map((s) => s.id);

    if (bareScriptIds.length > 0) {
      await chrome.scripting.unregisterContentScripts({ ids: bareScriptIds });
    }

    const enabled = await isExtensionEnabled();
    if (!enabled) return;

    const allScripts = await getAllScripts();
    const libraries = await getLibraries();

    // Build library map for inlining
    const libraryMap = new Map<string, UserScript>();
    for (const lib of libraries) {
      if (lib.enabled) {
        libraryMap.set(lib.name, lib);
      }
    }

    // Get document-start scripts
    const startScripts = allScripts.filter(
      (s) => s.type !== 'library' && s.enabled && s.runAt === 'document-start' && s.matches.length > 0
    );

    // Store pre-processed scripts for webNavigation injection
    await chrome.storage.local.set({
      _documentStartScripts: startScripts.map(s => ({
        id: s.id,
        name: s.name,
        matches: s.matches,
        code: transformLibraryImports(s.code, libraryMap)
      }))
    });

    console.log(`[barescript] registered ${startScripts.length} document-start scripts`);
  } catch (error) {
    console.error('[barescript] failed to register document-start scripts:', error);
  }
}

async function injectMatchingScripts(
  tabId: number,
  url: string,
  runAt: 'document-start' | 'document-end'
): Promise<void> {
  const allScripts = await getAllScripts();
  const libraries = await getLibraries();

  // Filter scripts by type, enabled, URL match, and runAt timing
  const matchingScripts = allScripts.filter(
    (script) =>
      script.type !== 'library' &&
      script.enabled &&
      (script.runAt || 'document-end') === runAt &&
      urlMatchesAnyPattern(url, script.matches)
  );

  // Create a map of library name -> library for quick lookup
  const libraryMap = new Map<string, UserScript>();
  for (const lib of libraries) {
    if (lib.enabled) {
      libraryMap.set(lib.name, lib);
    }
  }

  // Inject scripts (libraries are inlined via import transformation)
  for (const script of matchingScripts) {
    await injectScript(tabId, script, libraryMap);
  }
}

function transformLibraryImports(
  code: string,
  libraryMap: Map<string, UserScript>
): string {
  // Transform imports into inlined library code
  // Supports: import Lib from 'lib' and import { a, b } from 'lib'

  const inlineLibrary = (libName: string): string | null => {
    const library = libraryMap.get(libName);
    if (!library) {
      console.warn(`[barescript] Library not found: ${libName}`);
      return null;
    }
    const libCode = library.code.replace(/export\s+default\s+/, 'return ');
    return `(function() {\n${libCode}\n})()`;
  };

  let result = code;

  // Handle: import { a, b } from 'lib'
  result = result.replace(
    /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/g,
    (_match, names, libName) => {
      const inlined = inlineLibrary(libName);
      if (!inlined) return `/* Library not found: ${libName} */`;
      return `const {${names}} = ${inlined};`;
    }
  );

  // Handle: import Lib from 'lib'
  result = result.replace(
    /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g,
    (_match, varName, libName) => {
      const inlined = inlineLibrary(libName);
      if (!inlined) return `/* Library not found: ${libName} */`;
      return `const ${varName} = ${inlined};`;
    }
  );

  return result;
}

async function injectScript(
  tabId: number,
  script: UserScript,
  libraryMap: Map<string, UserScript>
): Promise<void> {
  try {
    // Transform library imports into inlined library code
    const cleanCode = transformLibraryImports(script.code, libraryMap);
    const wrappedCode = `
      (function() {
        console.log('[userscript:${script.name}] loaded');
        ${cleanCode}
      })();
    `;

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (code: string) => new Function(code)(),
      args: [wrappedCode],
      world: 'MAIN',
    });
  } catch (error) {
    console.error(`[userscript:${script.name}] injection failed:`, error);
  }
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_MATCHING_SCRIPTS') {
    handleGetMatchingScripts(message.url).then(sendResponse);
    return true;
  }
  if (message.type === 'BODY_READY' && sender.tab?.id) {
    injectDocumentStartScripts(sender.tab.id, message.url);
  }
});

async function injectDocumentStartScripts(tabId: number, url: string): Promise<void> {
  const enabled = await isExtensionEnabled();
  if (!enabled) return;

  const { _documentStartScripts: scripts } = await chrome.storage.local.get('_documentStartScripts');
  if (!scripts || scripts.length === 0) return;

  for (const script of scripts) {
    if (urlMatchesAnyPattern(url, script.matches)) {
      const wrappedCode = `(function() {
        console.log('[userscript:${script.name}] loaded');
        ${script.code}
      })();`;

      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (code: string) => new Function(code)(),
          args: [wrappedCode],
          world: 'MAIN',
        });
      } catch (e) {
        console.error(`[userscript:${script.name}] injection failed:`, e);
      }
    }
  }
}

async function handleGetMatchingScripts(url: string): Promise<UserScript[]> {
  const scripts = await getAllScripts();
  return scripts.filter(
    (script) => script.type !== 'library' && urlMatchesAnyPattern(url, script.matches)
  );
}

console.log('[barescript] background service worker started');
