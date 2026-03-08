'use client';

import { useRef } from 'react';

interface CodePanelProps {
  code: string;
  target: string;
  language: string;
  isLoading: boolean;
  onCodeChange: (code: string) => void;
  onTargetChange: (target: string) => void;
  onLanguageChange: (language: string) => void;
  onMigrate: () => void;
}

const PRESETS = [
  'Redux → Zustand',
  'Class → Function Components',
  'Pages Router → App Router',
  'CommonJS → ESM',
  'Fetch → React Query',
];

const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'];

export default function CodePanel({
  code,
  target,
  language,
  isLoading,
  onCodeChange,
  onTargetChange,
  onLanguageChange,
  onMigrate,
}: CodePanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      onMigrate();
    }
    // Handle tab in textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onCodeChange(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-300">Input Code</span>
          <span className="text-xs text-zinc-600">⌘+Enter to migrate</span>
        </div>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 focus:outline-none focus:border-violet-500"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Code Textarea */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste your code here..."
          className="w-full h-full bg-transparent text-zinc-300 code-font text-sm p-4 resize-none focus:outline-none leading-6 placeholder:text-zinc-700"
          spellCheck={false}
        />
      </div>

      {/* Migration Target */}
      <div className="border-t border-zinc-800 p-4 space-y-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block font-medium uppercase tracking-wide">
            Migration Target
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="e.g. Convert to use React hooks, migrate to TypeScript..."
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 placeholder:text-zinc-600"
          />
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onTargetChange(preset)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                target === preset
                  ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Migrate Button */}
        <button
          onClick={onMigrate}
          disabled={isLoading || !code.trim() || !target.trim()}
          className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⟳</span>
              Migrating...
            </>
          ) : (
            <>
              Migrate →
            </>
          )}
        </button>
      </div>
    </div>
  );
}
