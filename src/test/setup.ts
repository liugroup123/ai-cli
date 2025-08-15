// Test setup file
import { jest } from '@jest/globals';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AI_CLI_CONFIG_DIR = '/tmp/ai-cli-test';

// Global test timeout
jest.setTimeout(10000);
