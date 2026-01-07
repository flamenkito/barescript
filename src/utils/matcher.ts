// URL matching utility for @match patterns.
// Supports patterns like: *://*/*, https://example.com/*, https://*.example.com/*

export function matchPatternToRegex(pattern: string): RegExp | null {
  try {
    // Handle special case: match all URLs
    if (pattern === '<all_urls>') {
      return /^https?:\/\/.*/;
    }

    // Parse the pattern: scheme://host/path
    const match = pattern.match(/^(\*|https?):\/\/(\*|(?:\*\.)?[^/]+)(\/.*)?$/);
    if (!match) {
      return null;
    }

    const [, scheme, host, path = '/*'] = match;

    // Build regex parts
    let regexStr = '^';

    // Scheme
    if (scheme === '*') {
      regexStr += 'https?';
    } else {
      regexStr += escapeRegex(scheme);
    }
    regexStr += ':\\/\\/';

    // Host
    if (host === '*') {
      regexStr += '[^/]+';
    } else if (host.startsWith('*.')) {
      // Subdomain wildcard: *.example.com matches foo.example.com but also example.com
      const baseDomain = escapeRegex(host.slice(2));
      regexStr += `(?:[^/]+\\.)?${baseDomain}`;
    } else {
      regexStr += escapeRegex(host);
    }

    // Path
    const pathRegex = escapeRegex(path).replace(/\\\*/g, '.*');
    regexStr += pathRegex;

    regexStr += '$';

    return new RegExp(regexStr);
  } catch {
    return null;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function urlMatchesPattern(url: string, pattern: string): boolean {
  const regex = matchPatternToRegex(pattern);
  if (!regex) {
    return false;
  }
  return regex.test(url);
}

export function urlMatchesAnyPattern(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => urlMatchesPattern(url, pattern));
}

export interface LibraryImport {
  varName: string;
  libName: string;
  fullMatch: string;
}

/**
 * Parse import statements for library dependencies.
 * Supports: import Lib from 'library-name';
 * Returns an array of library imports with variable names.
 */
export function parseLibraryImports(code: string): LibraryImport[] {
  const imports: LibraryImport[] = [];
  // Match: import VarName from 'lib-name'; or import VarName from "lib-name";
  const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const varName = match[1];
    const libName = match[2].trim();
    // Skip relative imports and node-style imports
    if (!libName.startsWith('.') && !libName.startsWith('/')) {
      imports.push({ varName, libName, fullMatch: match[0] });
    }
  }

  return imports;
}

/**
 * Get unique library names from imports.
 */
export function getLibraryNames(imports: LibraryImport[]): string[] {
  return [...new Set(imports.map((i) => i.libName))];
}

/**
 * Parse @match metadata from script code.
 * Returns an array of match patterns.
 */
export function parseMatchMetadata(code: string): string[] {
  const matches: string[] = [];
  const lines = code.split('\n');

  let inMetaBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes('==BareScript==')) {
      inMetaBlock = true;
      continue;
    }

    if (trimmed.includes('==/BareScript==')) {
      break;
    }

    if (inMetaBlock) {
      const matchResult = trimmed.match(/\/\/\s*@match\s+(.+)/);
      if (matchResult) {
        matches.push(matchResult[1].trim());
      }
    }
  }

  return matches;
}
