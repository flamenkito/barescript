// Content script - runs at document_start
// Notifies background when body is available for script injection

(async () => {
  const url = location.href;
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

  function notifyBackground() {
    chrome.runtime.sendMessage({ type: 'BODY_READY', url });
  }

  if (document.body) {
    notifyBackground();
  } else {
    new MutationObserver((_, obs) => {
      if (document.body) {
        obs.disconnect();
        notifyBackground();
      }
    }).observe(document.documentElement, { childList: true });
  }
})();
