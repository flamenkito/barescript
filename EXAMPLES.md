# BareScript Examples

## Library: DOM Utilities

Create a reusable library with common DOM helpers.

```javascript
// ==BareScript==
// @name        bs
// @type        library
// ==/BareScript==

const parent = (level, callback) => {
  return (el) => {
    let n = level | 0;
    if (n < 0) n = 0;

    while (n-- > 0 && el) el = el.parentElement;
    callback(el);
  };
};

const style = (value) => {
  return (el) => {
    if (el) Object.assign(el.style, value);
  };
};

const hide = style({ display: 'none' });
const blur = style({ filter: 'blur(5px)' });
const unblur = style({ filter: 'none' });

const run = (callback) => {
  let i = 0;

  const handler = setInterval(() => {
    const res = callback();

    i += 1;
    if (i >= 100 || res === true) clearInterval(handler);
  }, 100);

  return () => clearInterval(handler); // optional manual cancel
};

const waitIdle = ({ quietMs = 300, timeout = 10000 } = {}) => {
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
};

export default { parent, style, hide, run, waitIdle, blur, unblur };
```

## Habr - Clean Reader Mode

Removes sidebar, banners, and expands content to full width. Uses the `bs` library.

```javascript
// ==BareScript==
// @name        Habr
// @type        script
// @match       https://habr.com/*
// @run-at      document-start
// ==/BareScript==

import { parent, style, hide, run, waitIdle, blur, unblur } from 'bs';

console.log('Hello from userscript!');

blur(document.body);
waitIdle().finally(() => unblur(document.body));

console.log(`[ run ]`);
run(() => {
  document.querySelectorAll('.header-banner-wrapper').forEach(hide);
  document.querySelectorAll('.tm-page__sidebar').forEach(hide);
  document.querySelectorAll('.lead > .cover').forEach(hide);
  document.querySelectorAll('.tm-article-feed-blocks').forEach(hide);
  document.querySelectorAll('.banner-slider').forEach(hide);
  document.querySelectorAll('.tm-page__main').forEach(style({ 'max-width': 'none' }));

  // story
  document.querySelectorAll('.tm-page__header').forEach(hide);
  document.querySelectorAll('.tm-stories').forEach(parent(3, hide));
  document.querySelectorAll('.tm-article-presenter').forEach(style({ 'max-width': 'none' }));
  document.querySelectorAll('.tm-header__feature').forEach(hide);
  document.querySelectorAll('.digest-subscription').forEach(hide);
  document.querySelectorAll('.sponsor-block').forEach(hide);
  document.querySelectorAll('.tm-promo-block__content-wrapper').forEach(parent(3, hide));
  document.querySelectorAll('.tm-project-block--vacancies').forEach(hide);
  document.querySelectorAll('.tm-project-block--courses').forEach(hide);
});
```
