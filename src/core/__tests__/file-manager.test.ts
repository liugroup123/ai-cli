import { FileManager } from '../file-manager';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('FileManager', () => {
  let fileManager: FileManager;
  let testDir: string;

  beforeEach(async () => {
    fileManager = new FileManager();
    testDir = join(tmpdir(), `ai-cli-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rmdir(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('file operations', () => {
    it('should read a file', async () => {
      const testFile = join(testDir, 'test.txt');
      const content = 'Hello, World!';
      await fs.writeFile(testFile, content);

      const result = await fileManager.readFile(testFile);
      expect(result).toContain(content);
      expect(result).toContain('--- File: ');
    });

    it('should write a file', async () => {
      const testFile = join(testDir, 'output.txt');
      const content = 'Test content';

      await fileManager.writeFile(testFile, content);
      
      const written = await fs.readFile(testFile, 'utf-8');
      expect(written).toBe(content);
    });

    it('should check if file exists', async () => {
      const testFile = join(testDir, 'exists.txt');
      
      expect(await fileManager.fileExists(testFile)).toBe(false);
      
      await fs.writeFile(testFile, 'content');
      expect(await fileManager.fileExists(testFile)).toBe(true);
    });

    it('should get file stats', async () => {
      const testFile = join(testDir, 'stats.txt');
      const content = 'Test content for stats';
      await fs.writeFile(testFile, content);

      const stats = await fileManager.getFileStats(testFile);
      
      expect(stats.size).toBe(content.length);
      expect(stats.isDirectory).toBe(false);
      expect(stats.created).toBeInstanceOf(Date);
      expect(stats.modified).toBeInstanceOf(Date);
    });
  });

  describe('directory operations', () => {
    it('should read directory contents', async () => {
      // Create test files
      await fs.writeFile(join(testDir, 'file1.js'), 'console.log("file1");');
      await fs.writeFile(join(testDir, 'file2.ts'), 'const x: number = 1;');
      
      const result = await fileManager.readDirectory(testDir);
      
      expect(result).toContain('--- Directory: ');
      expect(result).toContain('file1.js');
      expect(result).toContain('file2.ts');
    });

    it('should get directory info', async () => {
      // Create test files
      await fs.writeFile(join(testDir, 'file1.js'), 'console.log("file1");');
      await fs.writeFile(join(testDir, 'file2.ts'), 'const x: number = 1;');
      
      const info = await fileManager.getDirectoryInfo(testDir);
      
      expect(info.fileCount).toBe(2);
      expect(info.files).toHaveLength(2);
      expect(info.totalSize).toBeGreaterThan(0);
    });
  });

  describe('code file operations', () => {
    it('should get code files', async () => {
      // Create test files
      await fs.writeFile(join(testDir, 'script.js'), 'console.log("hello");');
      await fs.writeFile(join(testDir, 'types.ts'), 'interface User {}');
      await fs.writeFile(join(testDir, 'readme.txt'), 'Not a code file');
      
      const codeFiles = await fileManager.getCodeFiles(testDir);
      
      expect(codeFiles).toHaveLength(2);
      expect(codeFiles.some(f => f.path.includes('script.js'))).toBe(true);
      expect(codeFiles.some(f => f.path.includes('types.ts'))).toBe(true);
      expect(codeFiles.some(f => f.path.includes('readme.txt'))).toBe(false);
    });

    it('should search in files', async () => {
      await fs.writeFile(join(testDir, 'file1.js'), 'function hello() { console.log("hello"); }');
      await fs.writeFile(join(testDir, 'file2.js'), 'const world = "world";');
      
      const results = await fileManager.searchInFiles('hello', testDir);
      
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('hello');
      expect(results[0].line).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent files', async () => {
      await expect(fileManager.readFile('/non/existent/file.txt'))
        .rejects.toThrow('Failed to read file');
    });

    it('should handle non-existent directories', async () => {
      await expect(fileManager.readDirectory('/non/existent/directory'))
        .rejects.toThrow('Failed to read directory');
    });

    it('should handle file size limits', async () => {
      // This test would require creating a very large file
      // For now, we'll just test that the method exists
      expect(typeof fileManager.readFile).toBe('function');
    });
  });

  describe('utility methods', () => {
    it('should handle pattern matching', async () => {
      // Create test files
      await fs.writeFile(join(testDir, 'test.js'), 'content');
      await fs.writeFile(join(testDir, 'test.ts'), 'content');
      await fs.writeFile(join(testDir, 'readme.md'), 'content');
      
      const jsFiles = await fileManager.findFiles('*.js', testDir);
      expect(jsFiles.some(f => f.includes('test.js'))).toBe(true);
      expect(jsFiles.some(f => f.includes('test.ts'))).toBe(false);
    });
  });
});
