import chalk from 'chalk';
import inquirer from 'inquirer';
import { diffLines } from 'diff';
import { FileManager } from '../core/file-manager.js';

export interface EditOptions {
  file: string;
  prompt: string;
  apply?: boolean;
  backup?: boolean;
}

export async function handleEdit(options: EditOptions, suggest: (original: string, prompt: string) => Promise<string>) {
  const fm = new FileManager();

  if (!(await fm.fileExists(options.file))) {
    console.log(chalk.red(`File not found: ${options.file}`)); return;
  }
  const originalWrapped = await fm.readFile(options.file);
  const original = originalWrapped.replace(/^.*?--- File: .*? ---\n/s, '').replace(/\n--- End of .*? ---\n$/s, '');

  const suggested = await suggest(original, options.prompt);

  const diffs = diffLines(original, suggested);
  console.log(chalk.blue('\nDiff Preview:\n'));
  for (const part of diffs) {
    const color = part.added ? 'green' : part.removed ? 'red' : 'gray';
    process.stdout.write((chalk as any)[color](part.value));
  }
  console.log();

  if (!options.apply) {
    const { confirm } = await inquirer.prompt([
      { type: 'confirm', name: 'confirm', message: `Apply changes to ${options.file}?`, default: false }
    ]);
    if (!confirm) { console.log(chalk.yellow('Cancelled.')); return; }
  }

  if (options.backup) {
    await fm.writeFile(options.file + '.bak', original);
  }

  await fm.writeFile(options.file, suggested);
  console.log(chalk.green(`\n✓ Updated ${options.file}`));
}

