import chalk from 'chalk';
import { execSync } from 'child_process';

function getGitBranch(): string | undefined {
  try {
    const out = execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

export interface StatuslineOptions {
  model: string;
  tokensEst?: number;
}

export function buildStatusline(opts: StatuslineOptions): string {
  const parts: string[] = [];
  parts.push(chalk.cyan(` ${opts.model}`));
  const branch = getGitBranch();
  if (branch) parts.push(chalk.magenta(` ${branch}`));
  if (typeof opts.tokensEst === 'number') parts.push(chalk.yellow(`⎍ ~${opts.tokensEst} tok`));
  return chalk.dim(parts.join('  •  '));
}

export function printStatusline(opts: StatuslineOptions) {
  // eslint-disable-next-line no-console
  console.log(buildStatusline(opts));
}

