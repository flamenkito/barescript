# BareScript Privacy Policy

Last updated: January 6, 2026

## Overview

BareScript is a browser extension that allows you to create and run custom JavaScript scripts on websites. Your privacy is important to us. This policy explains what data BareScript accesses and how it's handled.

## Data Collection

**BareScript does not collect any data.**

- No personal information is collected
- No usage analytics or telemetry
- No crash reports sent externally
- No cookies or tracking mechanisms

## Data Storage

All data is stored locally on your device using Chrome's built-in storage API:

- **User scripts** - The JavaScript code you write
- **Script settings** - Name, match patterns, enabled/disabled state
- **Extension settings** - Global enabled/disabled toggle

This data never leaves your browser. There are no external servers, no cloud sync, and no remote backups.

## Permissions Explained

BareScript requires certain browser permissions to function. Here's why each is needed:

### Storage Permission
**Purpose:** Save your scripts and settings locally in your browser.

### Scripting Permission
**Purpose:** Inject your custom scripts into web pages when they match your specified URL patterns.

### Tabs Permission
**Purpose:** Read the current tab's URL to determine which of your scripts should run on that page.

### Web Navigation Permission
**Purpose:** Detect when single-page applications (SPAs) navigate using the History API (pushState/replaceState). This allows your scripts to re-run when SPAs change pages without a full reload.

### Host Permissions (All URLs)
**Purpose:** Allow your scripts to run on any website you choose.

**Important:** While BareScript requests access to all URLs, your scripts only execute on pages that match the `@match` patterns you explicitly define. The extension does not run any code on websites unless you create a script targeting that site.

## Remote Code

BareScript does not load or execute any remote code. All functionality is contained within the extension package. The only JavaScript that runs is:

1. The extension's own code (popup, dashboard, background worker)
2. Scripts you create and save locally

## Third-Party Services

BareScript does not use any third-party services:

- No analytics (Google Analytics, Mixpanel, etc.)
- No error tracking (Sentry, Bugsnag, etc.)
- No advertising networks
- No external APIs

## Data Sharing

BareScript does not share any data because it does not collect any data. Your scripts and settings remain entirely on your device.

## Data Export

Your script data can be accessed through Chrome's developer tools or extension APIs if you need to back up or transfer your scripts manually.

## Children's Privacy

BareScript does not knowingly collect any information from anyone, including children under 13 years of age.

## Changes to This Policy

If this privacy policy changes, the updated version will be published with a new "Last updated" date. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Open Source

BareScript is open source. You can review the complete source code to verify these privacy claims.

## Contact

For questions about this privacy policy or the extension:

- GitHub Issues: https://github.com/flamenkito/barescript/issues

---

*This extension is not affiliated with or endorsed by Google, Tampermonkey, or any other userscript manager.*
