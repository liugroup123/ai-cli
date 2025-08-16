import { ConfigManager } from '../config.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let testConfigDir: string;

  beforeEach(async () => {
    // Create a temporary config directory for testing
    testConfigDir = join(tmpdir(), `ai-cli-test-${Date.now()}`);
    await fs.mkdir(testConfigDir, { recursive: true });
    
    // Mock the config directory
    jest.spyOn(ConfigManager.prototype as any, 'configDir', 'get').mockReturnValue(testConfigDir);
    
    configManager = new ConfigManager();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rmdir(testConfigDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('default configuration', () => {
    it('should have default values', () => {
      const config = configManager.getConfig();
      
      expect(config.defaultModel).toBe('gpt-4');
      expect(config.maxTokens).toBe(4096);
      expect(config.temperature).toBe(0.7);
      expect(config.streaming).toBe(true);
      expect(config.autoSave).toBe(true);
    });
  });

  describe('get and set', () => {
    it('should get and set configuration values', () => {
      configManager.set('defaultModel', 'claude-3-sonnet');
      expect(configManager.get('defaultModel')).toBe('claude-3-sonnet');
      
      configManager.set('temperature', 0.5);
      expect(configManager.get('temperature')).toBe(0.5);
    });

    it('should check if key exists', () => {
      expect(configManager.has('defaultModel')).toBe(true);
      expect(configManager.has('nonExistentKey' as any)).toBe(false);
    });
  });

  describe('API key validation', () => {
    it('should validate API keys', () => {
      expect(configManager.validateApiKey('openai')).toBe(false);
      
      configManager.set('openaiApiKey', 'test-key');
      expect(configManager.validateApiKey('openai')).toBe(true);
    });

    it('should return valid providers', () => {
      expect(configManager.getValidProviders()).toEqual([]);
      
      configManager.set('openaiApiKey', 'test-key');
      configManager.set('anthropicApiKey', 'test-key');
      
      const providers = configManager.getValidProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
    });
  });

  describe('model validation', () => {
    it('should validate model names', () => {
      expect(configManager.isValidModel('gpt-4')).toBe(true);
      expect(configManager.isValidModel('claude-3-sonnet')).toBe(true);
      expect(configManager.isValidModel('invalid-model')).toBe(false);
    });
  });

  describe('reset configuration', () => {
    it('should reset to defaults', () => {
      configManager.set('defaultModel', 'claude-3-sonnet');
      configManager.set('temperature', 0.5);
      
      configManager.reset();
      
      expect(configManager.get('defaultModel')).toBe('gpt-4');
      expect(configManager.get('temperature')).toBe(0.7);
    });
  });

  describe('export and import', () => {
    it('should export configuration without sensitive data', () => {
      configManager.set('openaiApiKey', 'secret-key');
      configManager.set('defaultModel', 'gpt-4');
      
      const exported = configManager.exportConfig();
      const parsed = JSON.parse(exported);
      
      expect(parsed.defaultModel).toBe('gpt-4');
      expect(parsed.openaiApiKey).toBeUndefined();
    });

    it('should import configuration', () => {
      const importConfig = JSON.stringify({
        defaultModel: 'claude-3-sonnet',
        temperature: 0.5
      });
      
      configManager.importConfig(importConfig);
      
      expect(configManager.get('defaultModel')).toBe('claude-3-sonnet');
      expect(configManager.get('temperature')).toBe(0.5);
    });

    it('should handle invalid import data', () => {
      expect(() => {
        configManager.importConfig('invalid json');
      }).toThrow('Invalid configuration format');
    });
  });
});
