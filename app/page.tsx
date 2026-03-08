'use client';

import { useState, useCallback } from 'react';
import CodePanel from '@/components/CodePanel';
import DiffView from '@/components/DiffView';
import ExamplesSection from '@/components/ExamplesSection';

export default function Home() {
  const [code, setCode] = useState('');
  const [target, setTarget] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [migratedCode, setMigratedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleMigrate = useCallback(async () => {
    if (!code.trim() || !target.trim() || isLoading) return;

    setIsLoading(true);
    setMigratedCode('');
    setExplanation('');
    setError('');

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, target, language }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Migration failed');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                // Parse migrated code and explanation from accumulated text
                const migratedMatch = fullText.match(/<migrated>([\s\S]*?)(?:<\/migrated>|$)/);
                const explanationMatch = fullText.match(/<explanation>([\s\S]*?)(?:<\/explanation>|$)/);

                if (migratedMatch) {
                  setMigratedCode(migratedMatch[1].trim());
                }
                if (explanationMatch) {
                  setExplanation(explanationMatch[1].trim());
                }
              }
            } catch {
              // Skip
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [code, target, language, isLoading]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(migratedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [migratedCode]);

  const handleExampleSelect = useCallback((example: { code: string; target: string; language: string }) => {
    setCode(example.code);
    setTarget(example.target);
    setLanguage(example.language);
    setMigratedCode('');
    setExplanation('');
    setError('');
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
            ⟳
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100">AI Code Migrator</h1>
            <p className="text-xs text-zinc-500">Paste legacy code → get a migration with explanations</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          Powered by Claude
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Input */}
        <div className="w-full lg:w-1/2 border-r border-zinc-800 flex flex-col" style={{ minHeight: '70vh' }}>
          <CodePanel
            code={code}
            target={target}
            language={language}
            isLoading={isLoading}
            onCodeChange={setCode}
            onTargetChange={setTarget}
            onLanguageChange={setLanguage}
            onMigrate={handleMigrate}
          />
        </div>

        {/* Right Panel - Output */}
        <div className="w-full lg:w-1/2 flex flex-col" style={{ minHeight: '70vh' }}>
          {/* Migrated Code Section */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-semibold text-zinc-300">Migrated Code (Diff View)</span>
            {migratedCode && (
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1 rounded-md border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
              >
                {copied ? '✓ Copied!' : '⎘ Copy'}
              </button>
            )}
          </div>

          {error && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-hidden" style={{ minHeight: '300px' }}>
            <DiffView
              original={code}
              migrated={migratedCode}
              isStreaming={isLoading}
            />
          </div>

          {/* Explanation Section */}
          <div className="border-t border-zinc-800" style={{ minHeight: '180px', maxHeight: '280px', overflow: 'auto' }}>
            <div className="px-4 py-3 border-b border-zinc-800/50">
              <span className="text-sm font-semibold text-zinc-300">Explanation</span>
            </div>
            <div className="p-4 text-sm text-zinc-400 leading-7">
              {explanation ? (
                <div className="whitespace-pre-wrap">{explanation}</div>
              ) : isLoading && !migratedCode ? (
                <span className="text-zinc-600">Waiting for response...</span>
              ) : isLoading && migratedCode ? (
                <span className="streaming-cursor text-zinc-500">Generating explanation</span>
              ) : (
                <span className="text-zinc-600">Step-by-step explanation will appear here after migration.</span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Examples Section */}
      <ExamplesSection onSelect={handleExampleSelect} />

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-3 text-center text-xs text-zinc-700">
        AI Code Migrator · Built with Next.js + Claude · Migrations may need review
      </footer>
    </div>
  );
}
