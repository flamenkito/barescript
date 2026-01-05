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

    if (trimmed.includes('==UserScript==')) {
      inMetaBlock = true;
      continue;
    }

    if (trimmed.includes('==/UserScript==')) {
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
