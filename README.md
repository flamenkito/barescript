<div align="center">
  <img src="assets/bs.png" alt="BareScript Logo" width="128">
  <h1>BareScript</h1>
  <p><strong>Lightweight Userscript Manager for Chrome</strong></p>
</div>

A minimal alternative to Tampermonkey for running custom scripts on any website.

## Features

- Run custom JavaScript on any website using `@match` patterns
- Simple dashboard for managing scripts
- Per-script enable/disable toggle
- Familiar userscript metadata format

## Building

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

The built extension will be in the `dist/` directory.

## Testing in Chrome

1. Build the extension (see above)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `dist/` folder from this project
6. The extension icon should appear in your toolbar

## Creating a Userscript

Click the extension icon and open the Dashboard. Create a new script with the following format:

```javascript
// ==BareScript==
// @name        My Script
// @match       https://example.com/*
// ==/BareScript==

console.log('Hello from userscript!');
```

### Supported `@match` Patterns

- `*://*/*` - All HTTP/HTTPS URLs
- `https://example.com/*` - Specific domain
- `https://*.example.com/*` - Domain with subdomain wildcard

## Development

```bash
# Run in development mode with hot reload
npm run dev
```

## Tech Stack

- TypeScript
- Preact
- Vite
- Chrome Extension Manifest V3
