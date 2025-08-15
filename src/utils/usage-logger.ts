import { promises as fs } from 'fs';
import { resolve } from 'path';

export interface UsageEvent {
  timestamp: string;
  command: string;
  model?: string;
  tokensPromptEst?: number;
  tokensOutputEst?: number;
}

export class UsageLogger {
  private file: string;
  constructor(cwd: string = process.cwd()) {
    const dir = resolve(cwd, '.ai-cli', 'logs');
    this.file = resolve(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`);
    fs.mkdir(dir, { recursive: true }).catch(() => {});
  }
  async log(ev: UsageEvent) {
    const line = JSON.stringify(ev) + '\n';
    await fs.appendFile(this.file, line, 'utf-8');
  }
}

