import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';

export async function promptExternalEditor(initialText = ''): Promise<string> {
  const file = join(tmpdir(), `ai-cli-input-${Date.now()}.txt`);
  await fs.writeFile(file, initialText, 'utf-8');

  // Choose an editor by platform
  const isWin = process.platform === 'win32';
  const editor = isWin ? 'notepad.exe' : (process.env.EDITOR || 'nano');

  await new Promise<void>((resolve) => {
    const child = spawn(editor, [file], {
      stdio: isWin ? 'ignore' : 'inherit',
    });
    child.on('exit', () => resolve());
    child.on('close', () => resolve());
  });

  const content = await fs.readFile(file, 'utf-8');
  try { await fs.unlink(file); } catch {}
  return content.trim();
}

