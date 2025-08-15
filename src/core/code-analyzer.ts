import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { FileManager, FileInfo } from './file-manager';

export interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  totalSize: number;
  languageBreakdown: Record<string, {
    files: number;
    lines: number;
    size: number;
  }>;
  complexity: {
    averageFileSize: number;
    largestFile: string;
    smallestFile: string;
    filesWithIssues: string[];
  };
}

export interface FileAnalysis {
  path: string;
  language: string;
  lines: number;
  size: number;
  functions: string[];
  classes: string[];
  imports: string[];
  exports: string[];
  issues: string[];
  complexity: number;
}

export interface ProjectAnalysis {
  overview: CodeMetrics;
  files: FileAnalysis[];
  dependencies: string[];
  architecture: {
    entryPoints: string[];
    modules: string[];
    testFiles: string[];
    configFiles: string[];
  };
  recommendations: string[];
}

export class CodeAnalyzer {
  private fileManager: FileManager;

  constructor() {
    this.fileManager = new FileManager();
  }

  async analyze(projectPath: string): Promise<ProjectAnalysis> {
    try {
      const codeFiles = await this.fileManager.getCodeFiles(projectPath);
      const configFiles = await this.findConfigFiles(projectPath);
      const testFiles = await this.findTestFiles(projectPath);
      
      const overview = await this.calculateMetrics(codeFiles);
      const fileAnalyses = await this.analyzeFiles(codeFiles);
      const dependencies = await this.extractDependencies(projectPath);
      const architecture = await this.analyzeArchitecture(projectPath, codeFiles, testFiles, configFiles);
      const recommendations = this.generateRecommendations(overview, fileAnalyses);

      return {
        overview,
        files: fileAnalyses,
        dependencies,
        architecture,
        recommendations
      };
    } catch (error) {
      throw new Error(`Code analysis failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async calculateMetrics(files: FileInfo[]): Promise<CodeMetrics> {
    const metrics: CodeMetrics = {
      totalFiles: files.length,
      totalLines: 0,
      totalSize: 0,
      languageBreakdown: {},
      complexity: {
        averageFileSize: 0,
        largestFile: '',
        smallestFile: '',
        filesWithIssues: []
      }
    };

    let largestSize = 0;
    let smallestSize = Infinity;

    for (const file of files) {
      const lines = file.content ? file.content.split('\n').length : 0;
      metrics.totalLines += lines;
      metrics.totalSize += file.size;

      // Language breakdown
      if (!metrics.languageBreakdown[file.type]) {
        metrics.languageBreakdown[file.type] = { files: 0, lines: 0, size: 0 };
      }
      metrics.languageBreakdown[file.type].files++;
      metrics.languageBreakdown[file.type].lines += lines;
      metrics.languageBreakdown[file.type].size += file.size;

      // Track largest and smallest files
      if (file.size > largestSize) {
        largestSize = file.size;
        metrics.complexity.largestFile = file.path;
      }
      if (file.size < smallestSize) {
        smallestSize = file.size;
        metrics.complexity.smallestFile = file.path;
      }

      // Flag files with potential issues
      if (lines > 1000) {
        metrics.complexity.filesWithIssues.push(`${file.path} (too many lines: ${lines})`);
      }
      if (file.size > 100000) {
        metrics.complexity.filesWithIssues.push(`${file.path} (too large: ${file.size} bytes)`);
      }
    }

    metrics.complexity.averageFileSize = metrics.totalFiles > 0 
      ? Math.round(metrics.totalSize / metrics.totalFiles) 
      : 0;

    return metrics;
  }

  private async analyzeFiles(files: FileInfo[]): Promise<FileAnalysis[]> {
    const analyses: FileAnalysis[] = [];

    for (const file of files) {
      if (file.content) {
        const analysis = await this.analyzeFile(file);
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  private async analyzeFile(file: FileInfo): Promise<FileAnalysis> {
    const content = file.content || '';
    const lines = content.split('\n');

    const analysis: FileAnalysis = {
      path: file.path,
      language: file.type,
      lines: lines.length,
      size: file.size,
      functions: this.extractFunctions(content, file.type),
      classes: this.extractClasses(content, file.type),
      imports: this.extractImports(content, file.type),
      exports: this.extractExports(content, file.type),
      issues: this.findIssues(content, file.type),
      complexity: this.calculateComplexity(content)
    };

    return analysis;
  }

  private extractFunctions(content: string, language: string): string[] {
    const functions: string[] = [];
    const lines = content.split('\n');

    const patterns: Record<string, RegExp[]> = {
      'JavaScript': [
        /function\s+(\w+)/g,
        /const\s+(\w+)\s*=\s*\(/g,
        /(\w+)\s*:\s*function/g,
        /(\w+)\s*=>\s*/g
      ],
      'TypeScript': [
        /function\s+(\w+)/g,
        /const\s+(\w+)\s*=\s*\(/g,
        /(\w+)\s*:\s*function/g,
        /(\w+)\s*=>\s*/g,
        /(\w+)\s*\([^)]*\)\s*:\s*\w+/g
      ],
      'Python': [
        /def\s+(\w+)/g
      ],
      'Java': [
        /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g
      ]
    };

    const languagePatterns = patterns[language] || [];
    
    for (const pattern of languagePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push(match[1]);
      }
    }

    return [...new Set(functions)]; // Remove duplicates
  }

  private extractClasses(content: string, language: string): string[] {
    const classes: string[] = [];

    const patterns: Record<string, RegExp> = {
      'JavaScript': /class\s+(\w+)/g,
      'TypeScript': /class\s+(\w+)/g,
      'Python': /class\s+(\w+)/g,
      'Java': /(?:public|private|protected)?\s*class\s+(\w+)/g,
      'C#': /(?:public|private|protected|internal)?\s*class\s+(\w+)/g
    };

    const pattern = patterns[language];
    if (pattern) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        classes.push(match[1]);
      }
    }

    return classes;
  }

  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];

    const patterns: Record<string, RegExp[]> = {
      'JavaScript': [
        /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
        /require\(['"]([^'"]+)['"]\)/g
      ],
      'TypeScript': [
        /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
        /require\(['"]([^'"]+)['"]\)/g
      ],
      'Python': [
        /import\s+(\w+)/g,
        /from\s+(\w+)\s+import/g
      ],
      'Java': [
        /import\s+([\w.]+)/g
      ]
    };

    const languagePatterns = patterns[language] || [];
    
    for (const pattern of languagePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }

    return [...new Set(imports)];
  }

  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];

    const patterns: Record<string, RegExp[]> = {
      'JavaScript': [
        /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
        /export\s*{\s*([^}]+)\s*}/g
      ],
      'TypeScript': [
        /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g,
        /export\s*{\s*([^}]+)\s*}/g
      ]
    };

    const languagePatterns = patterns[language] || [];
    
    for (const pattern of languagePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',')) {
          // Handle multiple exports in braces
          const multipleExports = match[1].split(',').map(e => e.trim());
          exports.push(...multipleExports);
        } else {
          exports.push(match[1]);
        }
      }
    }

    return [...new Set(exports)];
  }

  private findIssues(content: string, language: string): string[] {
    const issues: string[] = [];
    const lines = content.split('\n');

    // Common issues
    if (lines.length > 1000) {
      issues.push('File is very large (>1000 lines)');
    }

    // Language-specific issues
    if (language === 'JavaScript' || language === 'TypeScript') {
      if (content.includes('console.log')) {
        issues.push('Contains console.log statements');
      }
      if (content.includes('debugger')) {
        issues.push('Contains debugger statements');
      }
      if (content.includes('eval(')) {
        issues.push('Uses eval() - potential security risk');
      }
    }

    if (language === 'Python') {
      if (content.includes('print(')) {
        issues.push('Contains print statements');
      }
    }

    // Check for very long lines
    const longLines = lines.filter(line => line.length > 120);
    if (longLines.length > 0) {
      issues.push(`${longLines.length} lines exceed 120 characters`);
    }

    return issues;
  }

  private calculateComplexity(content: string): number {
    // Simple complexity calculation based on control structures
    const complexityKeywords = [
      'if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try'
    ];

    let complexity = 1; // Base complexity
    
    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private async findConfigFiles(projectPath: string): Promise<string[]> {
    const configPatterns = [
      'package.json', 'tsconfig.json', 'webpack.config.js', 'babel.config.js',
      '.eslintrc*', '.prettierrc*', 'jest.config.js', 'vite.config.js',
      'rollup.config.js', 'next.config.js', 'nuxt.config.js'
    ];

    const configFiles: string[] = [];
    
    for (const pattern of configPatterns) {
      try {
        const files = await this.fileManager.findFiles(pattern, projectPath);
        configFiles.push(...files);
      } catch {
        // Pattern not found, continue
      }
    }

    return configFiles;
  }

  private async findTestFiles(projectPath: string): Promise<string[]> {
    const testPatterns = [
      '**/*.test.js', '**/*.test.ts', '**/*.spec.js', '**/*.spec.ts',
      '**/test/**/*.js', '**/test/**/*.ts', '**/__tests__/**/*.js', '**/__tests__/**/*.ts'
    ];

    const testFiles: string[] = [];
    
    for (const pattern of testPatterns) {
      try {
        const files = await this.fileManager.findFiles(pattern, projectPath);
        testFiles.push(...files);
      } catch {
        // Pattern not found, continue
      }
    }

    return testFiles;
  }

  private async extractDependencies(projectPath: string): Promise<string[]> {
    const dependencies: string[] = [];

    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      if (packageJson.dependencies) {
        dependencies.push(...Object.keys(packageJson.dependencies));
      }
      if (packageJson.devDependencies) {
        dependencies.push(...Object.keys(packageJson.devDependencies));
      }
    } catch {
      // No package.json found
    }

    return dependencies;
  }

  private async analyzeArchitecture(
    projectPath: string, 
    codeFiles: FileInfo[], 
    testFiles: string[], 
    configFiles: string[]
  ): Promise<ProjectAnalysis['architecture']> {
    const entryPoints: string[] = [];
    const modules: string[] = [];

    // Find potential entry points
    const entryPatterns = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts'];
    for (const file of codeFiles) {
      if (entryPatterns.some(pattern => file.path.endsWith(pattern))) {
        entryPoints.push(file.path);
      }
    }

    // Identify modules (directories with multiple files)
    const directories = new Set<string>();
    for (const file of codeFiles) {
      const dir = file.path.split('/').slice(0, -1).join('/');
      if (dir) {
        directories.add(dir);
      }
    }
    modules.push(...Array.from(directories));

    return {
      entryPoints,
      modules,
      testFiles,
      configFiles
    };
  }

  private generateRecommendations(overview: CodeMetrics, files: FileAnalysis[]): string[] {
    const recommendations: string[] = [];

    // Size-based recommendations
    if (overview.totalFiles > 100) {
      recommendations.push('Consider breaking down the project into smaller modules');
    }

    if (overview.complexity.averageFileSize > 50000) {
      recommendations.push('Average file size is large - consider splitting large files');
    }

    // Language-specific recommendations
    const jsFiles = overview.languageBreakdown['JavaScript']?.files || 0;
    const tsFiles = overview.languageBreakdown['TypeScript']?.files || 0;
    
    if (jsFiles > tsFiles && jsFiles > 10) {
      recommendations.push('Consider migrating JavaScript files to TypeScript for better type safety');
    }

    // Code quality recommendations
    const filesWithIssues = files.filter(f => f.issues.length > 0);
    if (filesWithIssues.length > overview.totalFiles * 0.3) {
      recommendations.push('More than 30% of files have issues - consider code review and refactoring');
    }

    // Test coverage recommendations
    const hasTestFiles = files.some(f => f.path.includes('test') || f.path.includes('spec'));
    if (!hasTestFiles) {
      recommendations.push('No test files found - consider adding unit tests');
    }

    return recommendations;
  }
}
