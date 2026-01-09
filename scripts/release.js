#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const packageJsonPath = join(rootDir, 'package.json');
const manifestPath = join(rootDir, 'public/manifest.json');
const distDir = join(rootDir, 'dist');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: return type; // assume it's a specific version
  }
}

async function createZip(sourceDir, outPath) {
  const archiver = await import('archiver').catch(() => null);

  if (!archiver) {
    // Fallback to system zip command
    execSync(`cd "${sourceDir}" && zip -r "${outPath}" .`, { stdio: 'inherit' });
    return;
  }

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outPath);
    const archive = archiver.default('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function main() {
  const bumpType = process.argv[2] || 'patch';

  // Read current versions
  const pkg = readJson(packageJsonPath);
  const manifest = readJson(manifestPath);

  const currentVersion = pkg.version;
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`Bumping version: ${currentVersion} → ${newVersion}\n`);

  // Update versions
  pkg.version = newVersion;
  manifest.version = newVersion;

  writeJson(packageJsonPath, pkg);
  writeJson(manifestPath, manifest);

  console.log('Updated package.json and manifest.json');

  // Build
  console.log('\nBuilding extension...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // Create ZIP
  const zipName = `barescript-v${newVersion}.zip`;
  const zipPath = join(rootDir, zipName);

  console.log(`\nCreating ${zipName}...`);
  await createZip(distDir, zipPath);

  console.log(`\n✓ Release ready: ${zipName}`);
  console.log('\nNext steps:');
  console.log('1. git add -A && git commit -m "release: v' + newVersion + '"');
  console.log('2. git tag v' + newVersion);
  console.log('3. Upload ' + zipName + ' to Chrome Web Store');
}

main().catch(err => {
  console.error('Release failed:', err.message);
  process.exit(1);
});
