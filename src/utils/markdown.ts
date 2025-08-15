import chalk from 'chalk';
import { marked } from 'marked';
// @ts-ignore - types may not be available for marked-terminal
import TerminalRenderer from 'marked-terminal';
import highlight from 'cli-highlight';

export type RenderMode = 'ansi' | 'md';

marked.setOptions({
  // @ts-ignore
  renderer: new TerminalRenderer({
    reflowText: true,
    width: process.stdout.columns ? Math.min(process.stdout.columns, 120) : 100,
    code: (code: string, language?: string) => {
      try {
        return highlight(code, { language: language || undefined, ignoreIllegals: true });
      } catch {
        return chalk.gray(code);
      }
    }
  })
});

export function renderMarkdownToAnsi(md: string): string {
  try {
    return marked.parse(md) as string;
  } catch {
    return md;
  }
}

