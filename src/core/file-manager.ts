import { promises as fs } from 'fs';
import { join, extname, relative } from 'path';
// Note: Using a simple glob implementation since glob package might not be available
// In production, you would install: npm install glob @types/glob

export interface FileInfo {
  path: string;
  size: number;
  type: string;
  content?: string;
}

export interface DirectoryInfo {
  path: string;
  files: FileInfo[];
  totalSize: number;
  fileCount: number;
}

export class FileManager {
  private readonly maxFileSize = 1024 * 1024; // 1MB default
  private readonly excludePatterns = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '*.log',
    '.env*',
    '*.lock',
    '*.tmp'
  ];

  async readFile(filePath: string): Promise<string> {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large: ${filePath} (${stats.size} bytes)`);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      return `\n--- File: ${filePath} ---\n${content}\n--- End of ${filePath} ---\n`;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async readDirectory(dirPath: string, options: {
    recursive?: boolean;
    includeContent?: boolean;
    maxFiles?: number;
  } = {}): Promise<string> {
    const { recursive = true, includeContent = false, maxFiles = 50 } = options;
    
    try {
      const info = await this.getDirectoryInfo(dirPath, { recursive, includeContent, maxFiles });
      
      let result = `\n--- Directory: ${dirPath} ---\n`;
      result += `Files: ${info.fileCount}, Total size: ${this.formatBytes(info.totalSize)}\n\n`;
      
      for (const file of info.files) {
        result += `📄 ${file.path} (${this.formatBytes(file.size)})\n`;
        
        if (includeContent && file.content) {
          result += `${file.content}\n`;
        }
      }
      
      result += `--- End of ${dirPath} ---\n`;
      return result;
    } catch (error) {
      throw new Error(`Failed to read directory ${dirPath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async getDirectoryInfo(dirPath: string, options: {
    recursive?: boolean;
    includeContent?: boolean;
    maxFiles?: number;
  } = {}): Promise<DirectoryInfo> {
    const { recursive = true, includeContent = false, maxFiles = 50 } = options;
    
    const pattern = recursive ? '**/*' : '*';
    const fullPattern = join(dirPath, pattern);
    
    // Simple glob implementation - in production use proper glob package
    const filePaths = await this.simpleGlob(fullPattern, this.excludePatterns);

    const files: FileInfo[] = [];
    let totalSize = 0;
    
    for (const filePath of filePaths.slice(0, maxFiles)) {
      try {
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && stats.size <= this.maxFileSize) {
          const fileInfo: FileInfo = {
            path: relative(dirPath, filePath),
            size: stats.size,
            type: this.getFileType(filePath)
          };
          
          if (includeContent && this.isTextFile(filePath)) {
            try {
              fileInfo.content = await fs.readFile(filePath, 'utf-8');
            } catch {
              // Skip files that can't be read as text
            }
          }
          
          files.push(fileInfo);
          totalSize += stats.size;
        }
      } catch {
        // Skip files that can't be accessed
      }
    }

    return {
      path: dirPath,
      files,
      totalSize,
      fileCount: files.length
    };
  }

  async findFiles(pattern: string, basePath: string = '.'): Promise<string[]> {
    try {
      return await this.simpleGlob(join(basePath, pattern), this.excludePatterns);
    } catch (error) {
      throw new Error(`Failed to find files with pattern ${pattern}: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Simple glob implementation for basic patterns
  private async simpleGlob(pattern: string, excludePatterns: string[]): Promise<string[]> {
    const results: string[] = [];

    try {
      const basePath = pattern.includes('**') ? pattern.split('**')[0] : pattern.split('*')[0];
      const dir = basePath || '.';

      const files = await this.getAllFiles(dir);

      for (const file of files) {
        // Simple pattern matching - in production use proper glob library
        if (this.matchesPattern(file, pattern) && !this.isExcluded(file, excludePatterns)) {
          results.push(file);
        }
      }
    } catch (error) {
      // Return empty array if directory doesn't exist or can't be read
    }

    return results;
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }

    return files;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Very basic pattern matching - replace with proper glob in production
    if (pattern.includes('**')) {
      const parts = pattern.split('**');
      return filePath.includes(parts[0]) && filePath.endsWith(parts[1] || '');
    }

    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }

    return filePath.includes(pattern);
  }

  private isExcluded(filePath: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => this.matchesPattern(filePath, pattern));
  }

  async createFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = join(filePath, '..');
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to create file ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(filePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
    isDirectory: boolean;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      throw new Error(`Failed to get stats for ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  private getFileType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const typeMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.toml': 'TOML',
      '.ini': 'INI',
      '.md': 'Markdown',
      '.txt': 'Text',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bat': 'Batch',
      '.ps1': 'PowerShell'
    };
    
    return typeMap[ext] || 'Unknown';
  }

  private isTextFile(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    const textExtensions = [
      '.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs',
      '.php', '.rb', '.swift', '.kt', '.scala', '.html', '.css', '.scss',
      '.sass', '.less', '.json', '.xml', '.yaml', '.yml', '.toml', '.ini',
      '.md', '.txt', '.sql', '.sh', '.bat', '.ps1', '.gitignore', '.env'
    ];
    
    return textExtensions.includes(ext) || !ext;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility methods for code analysis
  async getCodeFiles(basePath: string = '.'): Promise<FileInfo[]> {
    const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb'];

    const allFiles = await this.getAllFiles(basePath);
    const filePaths = allFiles.filter(file =>
      codeExtensions.some(ext => file.endsWith(ext)) &&
      !this.isExcluded(file, this.excludePatterns)
    );

    const files: FileInfo[] = [];
    
    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(join(basePath, filePath));
        
        if (stats.size <= this.maxFileSize) {
          const content = await fs.readFile(join(basePath, filePath), 'utf-8');
          
          files.push({
            path: filePath,
            size: stats.size,
            type: this.getFileType(filePath),
            content
          });
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return files;
  }

  async searchInFiles(searchTerm: string, basePath: string = '.'): Promise<Array<{
    file: string;
    line: number;
    content: string;
  }>> {
    const files = await this.getCodeFiles(basePath);
    const results: Array<{ file: string; line: number; content: string }> = [];
    
    for (const file of files) {
      if (file.content) {
        const lines = file.content.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              file: file.path,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    }
    
    return results;
  }
}
