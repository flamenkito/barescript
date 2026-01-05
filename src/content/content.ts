// Content script - runs at document_start
// Apply blur immediately, background will remove it after scripts run

(async () => {
  // Check if we have matching scripts for this URL
  const response = await chrome.runtime.sendMessage({
    type: 'CHECK_HAS_SCRIPTS',
    url: location.href,
  });

  if (response?.hasScripts) {
    // Apply blur immediately via style element (works before body exists)
    const style = document.createElement('style');
    style.id = 'barescript-blur';
    style.textContent = 'html { filter: blur(5px) !important; transition: filter 0.2s; }';
    (document.head || document.documentElement).appendChild(style);
  }
})();
