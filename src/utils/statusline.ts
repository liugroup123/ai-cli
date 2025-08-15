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

export function buildStatusline(opts: StatuslineOptions, plain: boolean = false): string {
  const parts: string[] = [];
  if (plain) {
    parts.push(`model=${opts.model}`);
    const branch = getGitBranch();
    if (branch) parts.push(`branch=${branch}`);
    if (typeof opts.tokensEst === 'number') parts.push(`tokens~${opts.tokensEst}`);
    return chalk.dim(parts.join(' | '));
  }
  // Fancy icons (may require Nerd Font)
  const partsFancy: string[] = [];
  partsFancy.push(chalk.cyan(` ${opts.model}`));
  const branch = getGitBranch();
  if (branch) partsFancy.push(chalk.magenta(` ${branch}`));
  if (typeof opts.tokensEst === 'number') partsFancy.push(chalk.yellow(`⎍ ~${opts.tokensEst} tok`));
  return chalk.dim(partsFancy.join('  •  '));
}

export function printStatusline(opts: StatuslineOptions, plain: boolean = false) {
  // eslint-disable-next-line no-console
  console.log(buildStatusline(opts, plain));
}

