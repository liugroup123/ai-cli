import { promises as fs, readFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface Config {
  // API Keys
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  // Qwen (DashScope)
  qwenApiKey?: string;
  qwenBaseUrl?: string;


  // Default settings
  defaultModel: string;
  maxTokens: number;
  temperature: number;

  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  streaming: boolean;

  // File handling
  maxFileSize: number;
  excludePatterns: string[];

  // Session settings
  autoSave: boolean;
  maxSessions: number;
}

const defaultConfig: Config = {
  defaultModel: 'gpt-4',
  maxTokens: 4096,
  temperature: 0.7,
  theme: 'auto',
  streaming: true,
  maxFileSize: 1024 * 1024, // 1MB
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '*.log',
    '.env*'
  ],
  qwenBaseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  autoSave: true,
  maxSessions: 50
};

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private store: Config;

  constructor() {
    this.configDir = join(homedir(), '.ai-cli');
    this.configPath = join(this.configDir, 'config.json');
    try { mkdirSync(this.configDir, { recursive: true }); } catch {}
    try {
      const content = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.store = { ...defaultConfig, ...parsed } as Config;
    } catch {
      this.store = { ...defaultConfig };
      // write initial defaults so subsequent reads work
      try { mkdirSync(this.configDir, { recursive: true }); } catch {}
      try { fs.writeFile(this.configPath, JSON.stringify(this.store, null, 2), 'utf-8'); } catch {}
    }
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch {
      // ignore
    }
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.store = { ...defaultConfig, ...parsed } as Config;
    } catch {
      this.store = { ...defaultConfig };
    }
  }

  private async saveToDisk(): Promise<void> {
    try {
      await this.ensureConfigDir();
      await fs.writeFile(this.configPath, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch {
      // ignore disk write errors silently
    }
  }

  getConfig(): Config {
    // return in-memory store
    return this.store;
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.store[key];
  }

  set<K extends keyof Config>(key: K, value: Config[K]): void {
    (this.store as any)[key] = value;
    this.saveToDisk();
  }

  // Dynamic accessors for CLI where key is dynamic string
  getDynamic(key: string): any {
    return (this.store as any)[key];
  }

  setDynamic(key: string, value: any): void {
    (this.store as any)[key] = value;
    this.saveToDisk();
  }

  has(key: keyof Config): boolean {
    return this.store[key] !== undefined;
  }

  delete(key: keyof Config): void {
    delete (this.store as any)[key];
    this.saveToDisk();
  }

  reset(): void {
    this.store = { ...defaultConfig };
    this.saveToDisk();
  }

  getConfigPath(): string {
    return this.configPath;
  }

  getConfigDir(): string {
    return this.configDir;
  }

  // Validation methods
  validateApiKey(provider: 'openai' | 'anthropic' | 'gemini'): boolean {
    const key = this.get(`${provider}ApiKey` as keyof Config) as unknown as string | undefined;
    return typeof key === 'string' && key.length > 0;
  }

  getValidProviders(): string[] {
    const providers: string[] = [];

    if (this.validateApiKey('openai')) providers.push('openai');
    if (this.validateApiKey('anthropic')) providers.push('anthropic');
    if (this.validateApiKey('gemini')) providers.push('gemini');

    return providers;
  }

  // Model validation
  isValidModel(model: string): boolean {
    const validModels = [
      // OpenAI models
      'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo',
      // Anthropic models
      'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku',
      // Gemini models
      'gemini-pro', 'gemini-pro-vision'
    ];

    return validModels.includes(model);
  }

  // Export/Import configuration
  exportConfig(): string {
    const exportConfig: Partial<Config> = { ...this.store };
    delete exportConfig.openaiApiKey;
    delete exportConfig.anthropicApiKey;
    delete exportConfig.geminiApiKey;
    return JSON.stringify(exportConfig, null, 2);
  }

  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson) as Partial<Config>;
      Object.entries(importedConfig).forEach(([key, value]) => {
        if (key in defaultConfig && key !== 'openaiApiKey' && key !== 'anthropicApiKey' && key !== 'geminiApiKey') {
          this.set(key as keyof Config, value as any);
        }
      });
    } catch (error) {
      throw new Error('Invalid configuration format');
    }
  }

  // Migration helpers (placeholder)
  migrateConfig(): void {
    // implement when needed
  }
}
