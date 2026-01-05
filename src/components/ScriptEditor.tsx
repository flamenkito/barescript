import { useState } from 'preact/hooks';
import { parseMatchMetadata } from '@/utils/matcher';
import type { UserScript } from '@/types/userscript';

interface Props {
  script: UserScript;
  onSave: (script: UserScript) => void;
  onCancel: () => void;
}

export function ScriptEditor({ script, onSave, onCancel }: Props) {
  const [name, setName] = useState(script.name);
  const [matches, setMatches] = useState<string[]>(script.matches);
  const [runAt, setRunAt] = useState(script.runAt);
  const [code, setCode] = useState(script.code);
  const [newMatch, setNewMatch] = useState('');

  function handleAddMatch() {
    const trimmed = newMatch.trim();
    if (trimmed && !matches.includes(trimmed)) {
      setMatches([...matches, trimmed]);
      setNewMatch('');
    }
  }

  function handleRemoveMatch(match: string) {
    setMatches(matches.filter((m) => m !== match));
  }

  function handleCodeChange(e: Event) {
    const newCode = (e.target as HTMLTextAreaElement).value;
    setCode(newCode);

    // Auto-update matches from metadata if present
    const parsedMatches = parseMatchMetadata(newCode);
    if (parsedMatches.length > 0) {
      setMatches(parsedMatches);
    }

    // Auto-update name from metadata
    const nameMatch = newCode.match(/\/\/\s*@name\s+(.+)/);
    if (nameMatch) {
      setName(nameMatch[1].trim());
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
        <h2 class="editor-title">Edit Script</h2>
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
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
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
          onChange={(e) => setRunAt((e.target as HTMLSelectElement).value as UserScript['runAt'])}
        >
          <option value="document-end">Document End</option>
          <option value="document-start">Document Start</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Code</label>
        <textarea class="form-textarea" value={code} onInput={handleCodeChange} spellcheck={false} />
      </div>
    </div>
  );
}
