import chalk from 'chalk';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import YAML from 'yaml';
import { FileManager } from '../core/file-manager';
import { interpolate } from '../utils/template';
import { renderMarkdownToAnsi } from '../utils/markdown';

export interface RunOptions {
  name: string;
  args?: string[];
  model?: string;
  noStream?: boolean;
  render?: 'ansi' | 'md';
}

interface CommandTemplate {
  name: string;
  prompt: string;
  inputs?: Array<{ type: 'file' | 'dir' | 'glob'; path: string; includeContent?: boolean; maxFiles?: number }>;
  variables?: Record<string, string>;
  output?: { format?: 'markdown' | 'text' };
}

export async function handleRun(options: RunOptions, generate: (prompt: string) => Promise<string>) {
  const fm = new FileManager();
  const cwd = process.cwd();
  const templatesDir = resolve(cwd, '.ai-cli', 'commands');
  const filePathYaml = join(templatesDir, `${options.name}.yaml`);
  const filePathYml = join(templatesDir, `${options.name}.yml`);

  let templateFile = filePathYaml;
  if (!(await fm.fileExists(filePathYaml)) && (await fm.fileExists(filePathYml))) {
    templateFile = filePathYml;
  }
  if (!(await fm.fileExists(templateFile))) {
    console.log(chalk.red(`Command template not found: ${templateFile}`));
    return;
  }

  const text = await fs.readFile(templateFile, 'utf-8');
  const tpl = YAML.parse(text) as CommandTemplate;

  // Load inputs
  let context = '';
  if (tpl.inputs) {
    for (const inp of tpl.inputs) {
      if (inp.type === 'file') {
        try { context += await fm.readFile(resolve(cwd, inp.path)); } catch {}
      } else if (inp.type === 'dir') {
        try { context += await fm.readDirectory(resolve(cwd, inp.path), { includeContent: !!inp.includeContent, maxFiles: inp.maxFiles ?? 50 }); } catch {}
      } else if (inp.type === 'glob') {
        try {
          const matches = await fm.findFiles(inp.path, cwd);
          for (const m of matches.slice(0, inp.maxFiles ?? 50)) {
            try { context += await fm.readFile(resolve(cwd, m)); } catch {}
          }
        } catch {}
      }
    }
  }

  const vars: Record<string, string> = {
    ...(tpl.variables || {}),
  };

  const prompt = interpolate(tpl.prompt, vars) + (context ? `\n\n### Context\n${context}` : '');

  // Inject Project Context
  const { loadProjectContext, summarizeContext } = await import('../utils/project-context');
  const projectCtx = summarizeContext(await loadProjectContext(cwd));
  const finalPrompt = (projectCtx ? `### Project Context\n${projectCtx}\n\n` : '') + prompt;

  const result = await generate(finalPrompt);
  const rendered = (options.render ?? 'ansi') === 'ansi' ? renderMarkdownToAnsi(result) : result;

  console.log(chalk.blue('\nResult:\n'));
  console.log(rendered);
}

