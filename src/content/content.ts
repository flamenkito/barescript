// Content script - runs at document_start
// Notifies background when body is available

(async () => {
  if (!location.href.startsWith('http://') && !location.href.startsWith('https://')) return;

  function notifyBodyReady() {
    chrome.runtime.sendMessage({ type: 'BODY_READY', url: location.href });
  }

  // Initial page load
  if (document.body) {
    notifyBodyReady();
  } else {
    new MutationObserver((_, obs) => {
      if (document.body) {
        obs.disconnect();
        notifyBodyReady();
      }
    }).observe(document.documentElement, { childList: true });
  }

  // Back/forward navigation (bfcache)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      chrome.runtime.sendMessage({ type: 'PAGE_RESTORED', url: location.href });
    }
  });
})();
