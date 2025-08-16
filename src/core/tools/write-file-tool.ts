/**
 * Advanced file writing tool inspired by Gemini CLI
 */

import fs from 'fs';
import path from 'path';
import * as Diff from 'diff';
import { 
  BaseDeclarativeTool, 
  BaseToolInvocation, 
  ToolResult, 
  FileDiff, 
  Kind,
  ToolCallConfirmationDetails,
  ToolConfirmationOutcome 
} from './base-tool.js';

export interface WriteFileToolParams {
  file_path: string;
  content: string;
  description?: string;
  create_directories?: boolean;
}

class WriteFileToolInvocation extends BaseToolInvocation<WriteFileToolParams, ToolResult> {
  constructor(
    params: WriteFileToolParams,
    private workspaceRoot: string
  ) {
    super(params);
  }

  getDescription(): string {
    const relativePath = path.relative(this.workspaceRoot, this.params.file_path);
    return `Writing to ${relativePath}${this.params.description ? ` (${this.params.description})` : ''}`;
  }

  override async shouldConfirmExecute(): Promise<ToolCallConfirmationDetails | false> {
    const { file_path, content } = this.params;
    
    let originalContent = '';
    let fileExists = false;
    
    try {
      originalContent = fs.readFileSync(file_path, 'utf8');
      fileExists = true;
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err; // Re-throw if it's not a "file not found" error
      }
    }

    // Generate diff for confirmation
    const fileName = path.basename(file_path);
    const fileDiff = Diff.createPatch(
      fileName,
      originalContent,
      content,
      fileExists ? 'Current' : 'New File',
      'Proposed',
      { context: 3 }
    );

    const relativePath = path.relative(this.workspaceRoot, file_path);
    
    return {
      type: 'edit',
      title: fileExists ? `Modify ${relativePath}` : `Create ${relativePath}`,
      filePath: file_path,
      fileDiff,
      originalContent,
      newContent: content,
      onConfirm: async (outcome: ToolConfirmationOutcome) => {
        if (outcome === ToolConfirmationOutcome.ProceedAlways) {
          // Could set auto-approve mode here
          console.log('Auto-approve enabled for file operations');
        }
      }
    };
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    const { file_path, content, create_directories } = this.params;
    
    if (signal.aborted) {
      throw new Error('Operation was cancelled');
    }

    let originalContent = '';
    let fileExists = false;
    
    try {
      originalContent = fs.readFileSync(file_path, 'utf8');
      fileExists = true;
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        return {
          llmContent: `Error reading existing file: ${err.message}`,
          returnDisplay: `Error: ${err.message}`,
          error: {
            message: err.message,
            type: 'FILE_READ_ERROR'
          }
        };
      }
    }

    try {
      // Create directories if needed
      if (create_directories) {
        const dirName = path.dirname(file_path);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
      }

      // Write the file
      fs.writeFileSync(file_path, content, 'utf8');

      // Generate diff for result
      const fileName = path.basename(file_path);
      const fileDiff = Diff.createPatch(
        fileName,
        originalContent,
        content,
        'Original',
        'Written',
        { context: 3 }
      );

      const diffStat = this.calculateDiffStat(originalContent, content);
      const relativePath = path.relative(this.workspaceRoot, file_path);

      const displayResult: FileDiff = {
        fileDiff,
        fileName,
        originalContent,
        newContent: content,
        diffStat
      };

      const successMessage = fileExists 
        ? `Successfully updated file: ${relativePath}`
        : `Successfully created file: ${relativePath}`;

      return {
        llmContent: `${successMessage}\n\nChanges: +${diffStat.additions} -${diffStat.deletions}`,
        returnDisplay: displayResult
      };

    } catch (error: any) {
      const errorMessage = `Error writing to file '${file_path}': ${error.message}`;
      return {
        llmContent: errorMessage,
        returnDisplay: errorMessage,
        error: {
          message: error.message,
          type: 'FILE_WRITE_ERROR'
        }
      };
    }
  }

  private calculateDiffStat(oldContent: string, newContent: string) {
    const diff = Diff.diffLines(oldContent, newContent);
    let additions = 0;
    let deletions = 0;
    
    diff.forEach(part => {
      if (part.added) {
        additions += part.count || 0;
      } else if (part.removed) {
        deletions += part.count || 0;
      }
    });

    return {
      additions,
      deletions,
      changes: additions + deletions
    };
  }
}

export class WriteFileTool extends BaseDeclarativeTool<WriteFileToolParams, ToolResult> {
  static readonly Name = 'write_file';

  constructor(private workspaceRoot: string) {
    super(
      WriteFileTool.Name,
      'WriteFile',
      'Writes content to a specified file. Shows diff preview and requires confirmation for safety.',
      Kind.Edit,
      {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute path to the file to write'
          },
          content: {
            type: 'string',
            description: 'Content to write to the file'
          },
          description: {
            type: 'string',
            description: 'Brief description of what this file change does'
          },
          create_directories: {
            type: 'boolean',
            description: 'Whether to create parent directories if they don\'t exist',
            default: true
          }
        },
        required: ['file_path', 'content']
      }
    );
  }

  protected validateToolParams(params: WriteFileToolParams): string | null {
    if (!params.file_path) {
      return 'file_path is required';
    }

    if (!path.isAbsolute(params.file_path)) {
      return 'file_path must be absolute';
    }

    if (params.content === undefined || params.content === null) {
      return 'content is required';
    }

    // Check if path is within workspace
    const relativePath = path.relative(this.workspaceRoot, params.file_path);
    if (relativePath.startsWith('..')) {
      return `File path must be within workspace: ${this.workspaceRoot}`;
    }

    return null;
  }

  protected createInvocation(params: WriteFileToolParams): BaseToolInvocation<WriteFileToolParams, ToolResult> {
    return new WriteFileToolInvocation(params, this.workspaceRoot);
  }
}
