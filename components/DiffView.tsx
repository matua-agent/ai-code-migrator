'use client';

interface DiffViewProps {
  original: string;
  migrated: string;
  isStreaming: boolean;
}

function computeDiff(original: string, migrated: string) {
  const originalLines = original.split('\n');
  const migratedLines = migrated.split('\n');

  // Simple LCS-based diff
  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; line: string }> = [];

  // Build a set for O(n) lookup
  const originalSet = new Set(originalLines);
  const migratedSet = new Set(migratedLines);

  // Track used original lines
  const usedOriginal = new Set<number>();
  const usedMigrated = new Set<number>();

  // Find unchanged lines (exact match at same relative position)
  const unchanged: Array<[number, number]> = [];
  let oi = 0;
  let mi = 0;

  // Simple greedy matching
  while (oi < originalLines.length && mi < migratedLines.length) {
    if (originalLines[oi] === migratedLines[mi]) {
      unchanged.push([oi, mi]);
      usedOriginal.add(oi);
      usedMigrated.add(mi);
      oi++;
      mi++;
    } else {
      // Try to find next match
      let found = false;
      for (let lookAhead = 1; lookAhead < 5; lookAhead++) {
        if (oi + lookAhead < originalLines.length && originalLines[oi + lookAhead] === migratedLines[mi]) {
          // Skip original lines (removed)
          for (let k = 0; k < lookAhead; k++) {
            result.push({ type: 'removed', line: originalLines[oi + k] });
          }
          oi += lookAhead;
          found = true;
          break;
        }
        if (mi + lookAhead < migratedLines.length && originalLines[oi] === migratedLines[mi + lookAhead]) {
          // Skip migrated lines (added)
          for (let k = 0; k < lookAhead; k++) {
            result.push({ type: 'added', line: migratedLines[mi + k] });
          }
          mi += lookAhead;
          found = true;
          break;
        }
      }
      if (!found) {
        result.push({ type: 'removed', line: originalLines[oi] });
        result.push({ type: 'added', line: migratedLines[mi] });
        oi++;
        mi++;
      }
    }

    // Add any unchanged from the pair
    if (unchanged.length > 0) {
      const last = unchanged[unchanged.length - 1];
      if (last[0] === oi - 1 && last[1] === mi - 1) {
        result.push({ type: 'unchanged', line: originalLines[oi - 1] });
      }
    }
  }

  // Remaining original lines = removed
  while (oi < originalLines.length) {
    result.push({ type: 'removed', line: originalLines[oi] });
    oi++;
  }

  // Remaining migrated lines = added
  while (mi < migratedLines.length) {
    result.push({ type: 'added', line: migratedLines[mi] });
    mi++;
  }

  return result;
}

export default function DiffView({ original, migrated, isStreaming }: DiffViewProps) {
  if (!migrated) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        {isStreaming ? (
          <span className="streaming-cursor">Migrating code</span>
        ) : (
          <span>Migrated code will appear here</span>
        )}
      </div>
    );
  }

  const diff = computeDiff(original, migrated);

  return (
    <div className="h-full overflow-auto">
      <pre className="code-font text-sm p-4 leading-6">
        {diff.map((item, i) => (
          <div
            key={i}
            className={`px-2 ${
              item.type === 'added'
                ? 'diff-added'
                : item.type === 'removed'
                ? 'diff-removed'
                : 'diff-unchanged'
            }`}
          >
            <span className="select-none mr-2 text-xs opacity-50 inline-block w-4">
              {item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '}
            </span>
            {item.line || ' '}
          </div>
        ))}
        {isStreaming && (
          <span className="streaming-cursor" />
        )}
      </pre>
    </div>
  );
}
