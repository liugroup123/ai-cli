import { promises as fs } from 'fs';
import { resolve } from 'path';

export async function loadProjectContext(cwd: string = process.cwd()): Promise<string> {
  const candidates = [
    '.ai-cli/PROJECT.md',
    '.ai-cli/Project.md',
    'CLAUDE.md',
    'Claude.md',
  ];

  for (const rel of candidates) {
    try {
      const full = resolve(cwd, rel);
      const content = await fs.readFile(full, 'utf-8');
      if (content && content.trim().length > 0) {
        return content;
      }
    } catch {
      // ignore and continue
    }
  }
  return '';
}

export function summarizeContext(md: string, maxChars = 4000): string {
  const text = md.trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n... (truncated)';
}

