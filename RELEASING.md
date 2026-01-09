# Releasing

## 1. Update Changelog

Move items from `[Unreleased]` to a new version heading in `CHANGELOG.md`.

## 2. Run Release Script

```bash
npm run release patch   # 1.0.0 → 1.0.1 (default)
npm run release minor   # 1.0.0 → 1.1.0
npm run release major   # 1.0.0 → 2.0.0
```

This bumps version in `package.json` and `public/manifest.json`, builds, and creates `barescript-v{version}.zip`.

## 3. Commit and Tag

```bash
git add -A && git commit -m "release: v1.0.1"
git tag v1.0.1
```

## 4. Merge and Push

```bash
git checkout master
git merge develop
git push && git push --tags
git checkout develop
```

## 5. Upload to Chrome Web Store

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select BareScript → **Package** → **Upload new package**
3. Upload the generated ZIP
4. Submit for review
