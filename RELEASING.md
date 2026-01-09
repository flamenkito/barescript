# Releasing

## Release Script

```bash
npm run release patch   # 1.0.0 → 1.0.1 (default)
npm run release minor   # 1.0.0 → 1.1.0
npm run release major   # 1.0.0 → 2.0.0
npm run release 1.2.3   # set specific version
```

This bumps the version in `package.json` and `public/manifest.json`, builds the extension, and creates a ZIP file for upload.

## Git Workflow

```bash
git add -A && git commit -m "release: v1.0.1"
git tag v1.0.1
git push && git push --tags
```

## Upload to Chrome Web Store

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select BareScript
3. Click **Package** → **Upload new package**
4. Upload the generated `barescript-v{version}.zip`
5. Submit for review

Updates typically take a few hours to a few days to be reviewed and published.
