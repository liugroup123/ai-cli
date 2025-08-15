import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ConfigManager } from './config';
import { Logger } from '../utils/logger';
import { AIProvider } from './ai-provider';
import { FileManager } from './file-manager';
import { SessionManager } from './session-manager';
import { CodeAnalyzer } from './code-analyzer';

export interface ChatOptions {
  model?: string;
  prompt?: string;
  file?: string;
  directory?: string;
  stream?: boolean;
  render?: 'ansi' | 'md';
}

export interface ConfigOptions {
  set?: string;
  get?: string;
  list?: boolean;
  reset?: boolean;
}

export interface AnalyzeOptions {
  path?: string;
  output?: string;
}

export interface SessionOptions {
  list?: boolean;
  load?: string;
  delete?: string;
  export?: string;
}

export class CLI {
  private aiProvider: AIProvider;
  private fileManager: FileManager;
  private sessionManager: SessionManager;
  private codeAnalyzer: CodeAnalyzer;

  constructor(
    private configManager: ConfigManager,
    private logger: Logger
  ) {
    this.aiProvider = new AIProvider(configManager);
    this.fileManager = new FileManager();
    this.sessionManager = new SessionManager(configManager);
    this.codeAnalyzer = new CodeAnalyzer();
  }

  async startChat(options: ChatOptions): Promise<void> {
    try {
      // Check if API keys are configured
      await this.ensureConfiguration();

      // Single prompt mode
      if (options.prompt) {
        await this.handleSinglePrompt(options);
        return;
      }

      // Interactive chat mode
      await this.startInteractiveChat(options);
    } catch (error) {
      this.logger.error('Failed to start chat:', error);
      throw error;
    }
  }

  private async ensureConfiguration(): Promise<void> {
    const config = this.configManager.getConfig();
    
    if (!config.openaiApiKey && !config.anthropicApiKey && !config.geminiApiKey && !config.qwenApiKey) {
      console.log(chalk.yellow('No API keys configured. Let\'s set up your AI providers.'));

      const { providers } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'providers',
          message: 'Which AI providers would you like to configure?',
          choices: [
            { name: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
            { name: 'Anthropic (Claude)', value: 'anthropic' },
            { name: 'Google (Gemini)', value: 'gemini' },
            { name: 'Qwen (DashScope)', value: 'qwen' }
          ]
        }
      ]);

      for (const provider of providers) {
        await this.configureProvider(provider);
      }
      // refresh providers after configuration
      this.aiProvider.refresh();
    }
  }

  private async configureProvider(provider: string): Promise<void> {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: `Enter your ${provider.toUpperCase()} API key:`,
        mask: '*'
      }
    ]);

    const configKey = `${provider}ApiKey` as 'openaiApiKey' | 'anthropicApiKey' | 'geminiApiKey' | 'qwenApiKey';
    this.configManager.set(configKey, apiKey);

    if (provider === 'qwen' && !this.configManager.get('qwenBaseUrl')) {
      // default to international endpoint; user can change via config
      this.configManager.set('qwenBaseUrl', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1');
    }
    console.log(chalk.green(`✓ ${provider.toUpperCase()} API key configured`));
  }

  private async handleSinglePrompt(options: ChatOptions): Promise<void> {
    const spinner = ora('Processing your request...').start();
    
    try {
      let context = '';
      
      // Add file context if specified
      if (options.file) {
        context += await this.fileManager.readFile(options.file);
      }
      
      // Add directory context if specified
      if (options.directory) {
        context += await this.fileManager.readDirectory(options.directory);
      }

      const model = options.model || this.configManager.get('defaultModel') || 'gpt-4';
      // Load project context
      const { loadProjectContext, summarizeContext } = await import('../utils/project-context');
      const projectCtx = summarizeContext(await loadProjectContext());

      const header = projectCtx ? `### Project Context\n${projectCtx}\n\n` : '';
      const fullPrompt = header + (context ? `${context}\n\n${options.prompt}` : options.prompt!);
      
      spinner.text = `Generating response with ${model}...`;
      
      const { printStatusline } = await import('../utils/statusline');
      const { UsageLogger } = await import('../utils/usage-logger');

      const response = await this.aiProvider.generateResponse(fullPrompt, {
        model,
        stream: options.stream !== false
      });

      spinner.stop();

      // Statusline + logging
      printStatusline({ model, tokensEst: this.aiProvider.estimateTokens(fullPrompt) });
      await new UsageLogger().log({ timestamp: new Date().toISOString(), command: 'chat-single', model, tokensPromptEst: this.aiProvider.estimateTokens(fullPrompt), tokensOutputEst: this.aiProvider.estimateTokens(response) });

      const rendered = options.render === 'ansi' ? require('../utils/markdown').renderMarkdownToAnsi(response) : response;
      console.log(chalk.blue('\nAI Response:'));
      console.log(rendered);
      
    } catch (error) {
      spinner.fail('Failed to process request');
      throw error;
    }
  }

  private async startInteractiveChat(options: ChatOptions): Promise<void> {
    console.log(chalk.blue('🤖 AI CLI - Interactive Chat Mode'));
    console.log(chalk.gray('Type /help for commands, /quit to exit\n'));

    let model = options.model || this.configManager.get('defaultModel') || 'gpt-4';
    // Fallback to first available model if chosen model not available
    if (!this.aiProvider.isModelAvailable(model)) {
      const available = await this.aiProvider.getAvailableModels();
      if (available.length === 0) {
        console.log(chalk.red('No AI providers configured. Use ai-cli config to set API keys.'));
        return;
      }
      model = available[0].name;
      this.configManager.set('defaultModel', model);
      console.log(chalk.yellow(`Model '${options.model || 'default'}' not available. Falling back to ${model}`));
    }
    console.log(chalk.green(`Using model: ${model}\n`));

    const session = await this.sessionManager.createSession(model);
    
    while (true) {
      const { input } = await inquirer.prompt([
        {
          type: 'input',
          name: 'input',
          message: chalk.cyan('You:'),
          prefix: ''
        }
      ]);

      if (!input.trim()) continue;

      // Handle commands
      if (input.startsWith('/')) {
        const shouldContinue = await this.handleCommand(input, session.id);
        if (!shouldContinue) break;
        continue;
      }

      // Generate AI response
      const spinner = ora('Thinking...').start();
      
      try {
        // Inject project context
        const { loadProjectContext, summarizeContext } = await import('../utils/project-context');
        const projectCtx = summarizeContext(await loadProjectContext());
        const header = projectCtx ? `### Project Context\n${projectCtx}\n\n` : '';

        const { printStatusline } = await import('../utils/statusline');
        const { UsageLogger } = await import('../utils/usage-logger');

        const response = await this.aiProvider.generateResponse(header + input, {
          model,
          sessionId: session.id,
          stream: options.stream !== false
        });

        spinner.stop();

        // Statusline + logging
        printStatusline({ model, tokensEst: this.aiProvider.estimateTokens(header + input) });
        await new UsageLogger().log({ timestamp: new Date().toISOString(), command: 'chat', model, tokensPromptEst: this.aiProvider.estimateTokens(header + input), tokensOutputEst: this.aiProvider.estimateTokens(response) });

        const rendered = options.render === 'ansi' ? require('../utils/markdown').renderMarkdownToAnsi(response) : response;
        console.log(chalk.blue('\nAI:'));
        console.log(rendered);
        console.log(); // Empty line for readability
        
        // Save to session
        await this.sessionManager.addMessage(session.id, 'user', input);
        await this.sessionManager.addMessage(session.id, 'assistant', response);
        
      } catch (error) {
        spinner.fail('Failed to generate response');
        this.logger.error('AI generation error:', error);
      }
    }
  }

  private async handleCommand(command: string, sessionId: string): Promise<boolean> {
    const [cmd, ...args] = command.slice(1).split(' ');
    
    switch (cmd) {
      case 'help':
        this.showHelp();
        break;
        
      case 'quit':
      case 'exit':
        console.log(chalk.yellow('Goodbye! 👋'));
        return false;
        
      case 'clear':
        console.clear();
        break;
        
      case 'save':
        await this.sessionManager.saveSession(sessionId, args[0]);
        console.log(chalk.green('Session saved!'));
        break;
        
      case 'model':
        if (args[0]) {
          this.configManager.set('defaultModel', args[0]);
          console.log(chalk.green(`Model changed to: ${args[0]}`));
        } else {
          console.log(chalk.blue(`Current model: ${this.configManager.get('defaultModel')}`));
        }
        break;
        
      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        this.showHelp();
    }
    
    return true;
  }

  private showHelp(): void {
    console.log(chalk.blue('\nAvailable commands:'));
    console.log(chalk.gray('/help     - Show this help message'));
    console.log(chalk.gray('/quit     - Exit the chat'));
    console.log(chalk.gray('/clear    - Clear the screen'));
    console.log(chalk.gray('/save     - Save current session'));
    console.log(chalk.gray('/model    - Change AI model'));
    console.log();
  }

  async handleConfig(options: ConfigOptions): Promise<void> {
    if (options.set) {
      const [key, value] = options.set.split('=');
      this.configManager.setDynamic(key, value);
      console.log(chalk.green(`✓ Set ${key} = ${value}`));
    } else if (options.get) {
      const value = this.configManager.getDynamic(options.get);
      console.log(chalk.blue(`${options.get} = ${value ?? 'undefined'}`));
    } else if (options.list) {
      const config = this.configManager.getConfig();
      console.log(chalk.blue('Current configuration:'));
      Object.entries(config).forEach(([key, value]) => {
        const displayValue = key.includes('Key') ? '***' : value;
        console.log(chalk.gray(`  ${key}: ${displayValue}`));
      });
    } else if (options.reset) {
      this.configManager.reset();
      console.log(chalk.green('✓ Configuration reset to defaults'));
    }
  }

  async listModels(): Promise<void> {
    const models = await this.aiProvider.getAvailableModels();
    console.log(chalk.blue('Available AI models:'));
    models.forEach(model => {
      console.log(chalk.gray(`  • ${model.name} (${model.provider})`));
    });
  }

  async analyzeCode(options: AnalyzeOptions): Promise<void> {
    const spinner = ora('Analyzing code...').start();
    
    try {
      const analysis = await this.codeAnalyzer.analyze(options.path || '.');
      spinner.succeed('Code analysis complete');
      
      if (options.output) {
        await this.fileManager.writeFile(options.output, JSON.stringify(analysis, null, 2));
        console.log(chalk.green(`Analysis saved to: ${options.output}`));
      } else {
        console.log(chalk.blue('\nCode Analysis:'));
        console.log(analysis);
      }
    } catch (error) {
      spinner.fail('Code analysis failed');
      throw error;
    }
  }

  async manageSessions(options: SessionOptions): Promise<void> {
    if (options.list) {
      const sessions = await this.sessionManager.listSessions();
      console.log(chalk.blue('Saved sessions:'));
      sessions.forEach(session => {
        console.log(chalk.gray(`  ${session.id} - ${session.name} (${session.createdAt})`));
      });
    } else if (options.load) {
      await this.sessionManager.loadSession(options.load);
      console.log(chalk.green(`Session ${options.load} loaded`));
    } else if (options.delete) {
      await this.sessionManager.deleteSession(options.delete);
      console.log(chalk.green(`Session ${options.delete} deleted`));
    } else if (options.export) {
      const exported = await this.sessionManager.exportSession(options.export);
      console.log(chalk.green('Session exported:'));
      console.log(exported);
    }
  }
}
