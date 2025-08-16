import chalk from 'chalk';
import inquirer from 'inquirer';
import { FileManager } from '../core/file-manager.js';
import { renderMarkdownToAnsi } from '../utils/markdown.js';

export interface GenOptions {
  prompt: string;
  output: string;
  model?: string;
  apply?: boolean;
  backup?: boolean;
}

export async function handleGen(options: GenOptions, generate: (prompt: string) => Promise<string>) {
  const fm = new FileManager();

  const content = await generate(options.prompt);
  const preview = renderMarkdownToAnsi(content);

  console.log(chalk.blue('\nPreview (rendered):\n'));
  console.log(preview);

  if (!options.apply) {
    const { confirm } = await inquirer.prompt([
      { type: 'confirm', name: 'confirm', message: `Write to ${options.output}?`, default: false }
    ]);
    if (!confirm) {
      console.log(chalk.yellow('Cancelled.')); return;
    }
  }

  if (options.backup && await fm.fileExists(options.output)) {
    await fm.writeFile(options.output + '.bak', (await fm.readFile(options.output)));
  }

  await fm.writeFile(options.output, content);
  console.log(chalk.green(`\n✓ Written to ${options.output}`));
}

