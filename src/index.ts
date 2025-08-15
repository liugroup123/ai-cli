#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from 'dotenv';
import { CLI } from './core/cli';
import { ConfigManager } from './core/config';
import { Logger } from './utils/logger';
import { printBanner } from './utils/banner';

// Load environment variables
config();

const program = new Command();

async function main() {
  try {
    const configManager = new ConfigManager();
    const logger = new Logger();
    const cli = new CLI(configManager, logger);

    program
      .name('ai-cli')
      .description('A powerful AI-powered command line interface tool')
      .version('1.0.0');

    // Fancy banner splash when starting without sub-commands (chat default)
    printBanner('1.0.0');

    // Interactive mode (default)
    program
      .command('chat', { isDefault: true })
      .description('Start interactive chat mode')
      .option('-m, --model <model>', 'AI model to use (gpt-4, claude-3, gemini-pro)')
      .option('-p, --prompt <prompt>', 'Single prompt mode')
      .option('-f, --file <file>', 'Include file in context')
      .option('-d, --directory <directory>', 'Include directory in context')
      .option('--no-stream', 'Disable streaming responses')
      .option('-r, --render <mode>', 'Render mode: ansi|md', 'ansi')
      .option('--tui', 'Enable lightweight terminal UI', false)
      .action(async (options) => {
        await cli.startChat(options);
      });

    // Configuration commands
    program
      .command('config')
      .description('Manage configuration')
      .option('--set <key=value>', 'Set configuration value')
      .option('--get <key>', 'Get configuration value')
      .option('--list', 'List all configuration')
      .option('--reset', 'Reset configuration to defaults')
      .action(async (options) => {
        await cli.handleConfig(options);
      });

    // Model management
    program
      .command('models')
      .description('List available AI models')
      .action(async () => {
        await cli.listModels();
      });

    // Generate file from prompt
    program
      .command('gen')
      .description('Generate content by AI and write to a file (with preview)')
      .requiredOption('-p, --prompt <prompt>', 'Prompt to generate content')
      .requiredOption('-o, --output <file>', 'Output file path')
      .option('-m, --model <model>', 'AI model to use')
      .option('--apply', 'Apply without confirmation', false)
      .option('--backup', 'Create .bak backup if file exists', true)
      .action(async (opts) => {
        const { handleGen } = await import('./commands/gen');
        await handleGen(opts, async (prompt: string) => {
          return await cli['aiProvider'].generateResponse(prompt, { model: opts.model || (cli as any)['configManager'].get('defaultModel') || 'gpt-4', stream: false });
        });
      });

    // Edit file by AI with diff preview
    program
      .command('edit')
      .description('Edit a file by AI with diff preview and confirmation')
      .requiredOption('-f, --file <file>', 'Target file to edit')
      .requiredOption('-p, --prompt <prompt>', 'Instructions to modify the file')
      .option('--apply', 'Apply without confirmation', false)
      .option('--backup', 'Create .bak backup before writing', true)
      .action(async (opts) => {
        const { handleEdit } = await import('./commands/edit');
        await handleEdit(opts, async (original: string, prompt: string) => {
          const full = `You are a code editor. Modify the following file according to the instructions. Return the FULL updated file content only, no explanations.\n\nInstructions:\n${prompt}\n\nFile content:\n${original}`;
          return await cli['aiProvider'].generateResponse(full, { model: (cli as any)['configManager'].get('defaultModel') || 'gpt-4', stream: false });
        });
      });

    // Code analysis
    program
      .command('analyze')
      .description('Analyze code in current directory')
      .option('-p, --path <path>', 'Path to analyze', '.')
      .option('-o, --output <file>', 'Output file for analysis')
      .action(async (options) => {
        await cli.analyzeCode(options);
      });

    // Slash-Commands runner
    program
      .command('run <name>')
      .description('Run a slash-command template from .ai-cli/commands/<name>.yaml')
      .option('-a, --arg <key=value...>', 'Variables to interpolate')
      .option('-m, --model <model>', 'AI model to use')
      .option('--no-stream', 'Disable streaming responses')
      .option('-r, --render <mode>', 'Render mode: ansi|md', 'ansi')
      .action(async (name, opts) => {
        const { handleRun } = await import('./commands/run');
        await handleRun({ name, args: opts.arg, model: opts.model, noStream: opts.stream === false, render: opts.render }, async (prompt: string) => {
          return await cli['aiProvider'].generateResponse(prompt, { model: opts.model || (cli as any)['configManager'].get('defaultModel') || 'gpt-4', stream: false });
        });
      });

    // Init PROJECT.md
    program
      .command('init-project-md')
      .description('Scaffold ./.ai-cli/PROJECT.md for global project context')
      .action(async () => {
        const { initProjectMd } = await import('./commands/init-project-md');
        await initProjectMd();
      });

    // Session management
    program
      .command('sessions')
      .description('Manage chat sessions')
      .option('--list', 'List all sessions')
      .option('--load <id>', 'Load session by ID')
      .option('--delete <id>', 'Delete session by ID')
      .option('--export <id>', 'Export session to file')
      .action(async (options) => {
        await cli.manageSessions(options);
      });

    await program.parseAsync();
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
  process.exit(1);
});

main();
