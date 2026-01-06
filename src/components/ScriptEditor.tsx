import { useState, useRef } from 'preact/hooks';
import { parseMatchMetadata } from '@/utils/matcher';
import type { UserScript } from '@/types/userscript';

function getMetaBlockRange(code: string): { start: number; end: number } | null {
  const startMatch = code.match(/\/\/\s*==UserScript==/);
  const endMatch = code.match(/\/\/\s*==\/UserScript==/);
  if (!startMatch || !endMatch) return null;
  const start = startMatch.index!;
  const end = endMatch.index! + endMatch[0].length;
  return { start, end };
}

const JS_KEYWORDS = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|class|extends|import|export|from|default|async|await|yield|typeof|instanceof|in|of|null|undefined|true|false)\b/g;
const JS_STRINGS = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g;
const JS_COMMENTS = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
const JS_NUMBERS = /\b(\d+\.?\d*)\b/g;

function highlightJs(code: string): string {
  // Store replacements to avoid double-processing
  const tokens: { start: number; end: number; html: string }[] = [];

  // Find comments
  let match;
  while ((match = JS_COMMENTS.exec(code)) !== null) {
    tokens.push({
      start: match.index,
      end: match.index + match[0].length,
      html: `<span class="hl-comment">${escapeHtml(match[0])}</span>`,
    });
  }

  // Find strings (skip if inside comment)
  JS_STRINGS.lastIndex = 0;
  while ((match = JS_STRINGS.exec(code)) !== null) {
    const inToken = tokens.some((t) => match!.index >= t.start && match!.index < t.end);
    if (!inToken) {
      tokens.push({
        start: match.index,
        end: match.index + match[0].length,
        html: `<span class="hl-string">${escapeHtml(match[0])}</span>`,
      });
    }
  }

  // Sort by position
  tokens.sort((a, b) => a.start - b.start);

  // Build result
  let result = '';
  let lastEnd = 0;
  for (const token of tokens) {
    if (token.start > lastEnd) {
      result += highlightKeywordsAndNumbers(escapeHtml(code.slice(lastEnd, token.start)));
    }
    result += token.html;
    lastEnd = token.end;
  }
  if (lastEnd < code.length) {
    result += highlightKeywordsAndNumbers(escapeHtml(code.slice(lastEnd)));
  }

  return result;
}

function highlightKeywordsAndNumbers(escaped: string): string {
  return escaped
    .replace(JS_KEYWORDS, '<span class="hl-keyword">$1</span>')
    .replace(JS_NUMBERS, '<span class="hl-number">$1</span>');
}

function highlightCode(code: string): string {
  const range = getMetaBlockRange(code);
  if (!range) {
    return highlightJs(code);
  }
  const before = highlightJs(code.slice(0, range.start));
  const meta = `<mark class="meta-highlight">${escapeHtml(code.slice(range.start, range.end))}</mark>`;
  const after = highlightJs(code.slice(range.end));
  return `${before}${meta}${after}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface Props {
  script: UserScript;
  onSave: (script: UserScript) => void;
  onCancel: () => void;
}

function parseRunAt(code: string): UserScript['runAt'] | null {
  const match = code.match(/\/\/\s*@run-at\s+(.+)/);
  if (match) {
    const value = match[1].trim();
    if (value === 'document-start' || value === 'document-end') {
      return value;
    }
  }
  return null;
}

function updateMetadataBlock(
  code: string,
  name: string,
  matches: string[],
  runAt: UserScript['runAt']
): string {
  const hasMetaBlock = code.includes('==UserScript==');

  if (!hasMetaBlock) {
    // Create new metadata block
    const matchLines = matches.map((m) => `// @match       ${m}`).join('\n');
    const metaBlock = `// ==UserScript==
// @name        ${name}
${matchLines}
// @run-at      ${runAt}
// ==/UserScript==

`;
    return metaBlock + code;
  }

  // Update existing metadata block
  let updatedCode = code;

  // Update @name
  if (updatedCode.match(/\/\/\s*@name\s+.+/)) {
    updatedCode = updatedCode.replace(/\/\/\s*@name\s+.+/, `// @name        ${name}`);
  } else {
    updatedCode = updatedCode.replace(/(\/\/\s*==UserScript==)/, `$1\n// @name        ${name}`);
  }

  // Update @run-at
  if (updatedCode.match(/\/\/\s*@run-at\s+.+/)) {
    updatedCode = updatedCode.replace(/\/\/\s*@run-at\s+.+/, `// @run-at      ${runAt}`);
  } else {
    updatedCode = updatedCode.replace(/(\/\/\s*==\/UserScript==)/, `// @run-at      ${runAt}\n$1`);
  }

  // Update @match - remove all existing and add new ones
  updatedCode = updatedCode.replace(/\/\/\s*@match\s+.+\n?/g, '');
  const matchLines = matches.map((m) => `// @match       ${m}`).join('\n');
  if (matchLines) {
    updatedCode = updatedCode.replace(/(\/\/\s*@name\s+.+)/, `$1\n${matchLines}`);
  }

  return updatedCode;
}

export function ScriptEditor({ script, onSave, onCancel }: Props) {
  const [name, setName] = useState(script.name);
  const [matches, setMatches] = useState<string[]>(script.matches);
  const [runAt, setRunAt] = useState(script.runAt);
  const [code, setCode] = useState(script.code);
  const [newMatch, setNewMatch] = useState('');
  const backdropRef = useRef<HTMLPreElement>(null);

  function handleScroll(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    if (backdropRef.current) {
      backdropRef.current.scrollTop = textarea.scrollTop;
      backdropRef.current.scrollLeft = textarea.scrollLeft;
    }
  }

  function handleNameChange(newName: string) {
    setName(newName);
    setCode((prevCode) => updateMetadataBlock(prevCode, newName, matches, runAt));
  }

  function handleAddMatch() {
    const trimmed = newMatch.trim();
    if (trimmed && !matches.includes(trimmed)) {
      const newMatches = [...matches, trimmed];
      setMatches(newMatches);
      setNewMatch('');
      setCode((prevCode) => updateMetadataBlock(prevCode, name, newMatches, runAt));
    }
  }

  function handleRemoveMatch(match: string) {
    const newMatches = matches.filter((m) => m !== match);
    setMatches(newMatches);
    setCode((prevCode) => updateMetadataBlock(prevCode, name, newMatches, runAt));
  }

  function handleRunAtChange(newRunAt: UserScript['runAt']) {
    setRunAt(newRunAt);
    setCode((prevCode) => updateMetadataBlock(prevCode, name, matches, newRunAt));
  }

  function handleCodeChange(e: Event) {
    const newCode = (e.target as HTMLTextAreaElement).value;
    setCode(newCode);

    // Auto-update controls from metadata if present
    const parsedMatches = parseMatchMetadata(newCode);
    if (parsedMatches.length > 0) {
      setMatches(parsedMatches);
    }

    const nameMatch = newCode.match(/\/\/\s*@name\s+(.+)/);
    if (nameMatch) {
      setName(nameMatch[1].trim());
    }

    const parsedRunAt = parseRunAt(newCode);
    if (parsedRunAt) {
      setRunAt(parsedRunAt);
    }
  }

  function handleSave() {
    const updated: UserScript = {
      ...script,
      name,
      matches,
      runAt,
      code,
      updatedAt: Date.now(),
    };
    onSave(updated);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMatch();
    }
  }

  return (
    <div class="editor">
      <header class="editor-header">
        <h2 class="editor-title">
          <img src="/icons/icon48.png" alt="BareScript" width="24" height="24" />
          Edit Script
        </h2>
        <div class="editor-actions">
          <button class="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button class="btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </header>

      <div class="form-group">
        <label class="form-label">Name</label>
        <input
          type="text"
          class="form-input"
          value={name}
          onInput={(e) => handleNameChange((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="form-group">
        <label class="form-label">Match Patterns</label>
        <div class="matches-list">
          {matches.map((match) => (
            <span class="match-tag" key={match}>
              {match}
              <span class="match-remove" onClick={() => handleRemoveMatch(match)}>
                &times;
              </span>
            </span>
          ))}
        </div>
        <div class="match-input-row">
          <input
            type="text"
            placeholder="https://example.com/*"
            value={newMatch}
            onInput={(e) => setNewMatch((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
          />
          <button class="btn-secondary" onClick={handleAddMatch}>
            Add
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Run At</label>
        <select
          class="run-at-select"
          value={runAt}
          onChange={(e) => handleRunAtChange((e.target as HTMLSelectElement).value as UserScript['runAt'])}
        >
          <option value="document-end">Document End</option>
          <option value="document-start">Document Start</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Code</label>
        <div class="code-editor">
          <pre
            ref={backdropRef}
            class="code-backdrop"
            dangerouslySetInnerHTML={{ __html: highlightCode(code) + '\n\n' }}
          />
          <textarea
            class="code-textarea"
            value={code}
            onInput={handleCodeChange}
            onScroll={handleScroll}
            spellcheck={false}
          />
        </div>
      </div>
    </div>
  );
}
