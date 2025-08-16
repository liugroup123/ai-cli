/**
 * Shell execution tool inspired by Gemini CLI
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import { 
  BaseDeclarativeTool, 
  BaseToolInvocation, 
  ToolResult, 
  Kind,
  ToolCallConfirmationDetails,
  ToolConfirmationOutcome 
} from './base-tool.js';

export interface ShellToolParams {
  command: string;
  description?: string;
  directory?: string;
  timeout?: number;
}

interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  aborted: boolean;
}

class ShellToolInvocation extends BaseToolInvocation<ShellToolParams, ToolResult> {
  private allowedCommands = new Set([
    'ls', 'dir', 'pwd', 'echo', 'cat', 'head', 'tail', 'grep', 'find',
    'git', 'npm', 'node', 'python', 'pip', 'cargo', 'rustc',
    'mkdir', 'touch', 'cp', 'mv', 'rm'
  ]);

  constructor(
    params: ShellToolParams,
    private workspaceRoot: string
  ) {
    super(params);
  }

  getDescription(): string {
    let description = `Execute: ${this.params.command}`;
    if (this.params.directory) {
      description += ` [in ${this.params.directory}]`;
    }
    if (this.params.description) {
      description += ` (${this.params.description})`;
    }
    return description;
  }

  override async shouldConfirmExecute(): Promise<ToolCallConfirmationDetails | false> {
    const command = this.params.command.trim();
    const rootCommand = command.split(' ')[0];
    
    // Check if command needs confirmation
    if (!this.allowedCommands.has(rootCommand)) {
      return {
        type: 'exec',
        title: 'Confirm Shell Command',
        command: this.params.command,
        onConfirm: async (outcome: ToolConfirmationOutcome) => {
          if (outcome === ToolConfirmationOutcome.ProceedAlways) {
            this.allowedCommands.add(rootCommand);
          }
        }
      };
    }

    return false;
  }

  async execute(
    signal: AbortSignal,
    updateOutput?: (output: string) => void
  ): Promise<ToolResult> {
    const { command, directory, timeout = 30000 } = this.params;
    
    if (signal.aborted) {
      return {
        llmContent: 'Command was cancelled before execution',
        returnDisplay: 'Command cancelled'
      };
    }

    const cwd = directory 
      ? path.resolve(this.workspaceRoot, directory)
      : this.workspaceRoot;

    try {
      const result = await this.executeCommand(command, cwd, timeout, signal, updateOutput);
      
      const llmContent = [
        `Command: ${command}`,
        `Directory: ${directory || '(root)'}`,
        `Stdout: ${result.stdout || '(empty)'}`,
        `Stderr: ${result.stderr || '(empty)'}`,
        `Exit Code: ${result.exitCode ?? '(none)'}`,
        `Signal: ${result.signal ?? '(none)'}`
      ].join('\n');

      let returnDisplay = '';
      if (result.aborted) {
        returnDisplay = 'Command cancelled by user';
      } else if (result.stdout.trim()) {
        returnDisplay = result.stdout;
      } else if (result.stderr.trim()) {
        returnDisplay = `Error: ${result.stderr}`;
      } else if (result.exitCode !== 0) {
        returnDisplay = `Command exited with code: ${result.exitCode}`;
      } else {
        returnDisplay = 'Command completed successfully';
      }

      return {
        llmContent,
        returnDisplay
      };

    } catch (error: any) {
      const errorMessage = `Failed to execute command: ${error.message}`;
      return {
        llmContent: errorMessage,
        returnDisplay: errorMessage,
        error: {
          message: error.message,
          type: 'SHELL_EXECUTION_ERROR'
        }
      };
    }
  }

  private executeCommand(
    command: string,
    cwd: string,
    timeout: number,
    signal: AbortSignal,
    updateOutput?: (output: string) => void
  ): Promise<ShellResult> {
    return new Promise((resolve) => {
      const isWindows = os.platform() === 'win32';
      const shell = isWindows ? 'cmd.exe' : 'bash';
      const shellArgs = isWindows ? ['/c', command] : ['-c', command];

      const child: ChildProcess = spawn(shell, shellArgs, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';
      let aborted = false;

      // Handle abort signal
      const abortHandler = () => {
        aborted = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      };

      signal.addEventListener('abort', abortHandler);

      // Collect output
      child.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        updateOutput?.(stdout + (stderr ? `\n${stderr}` : ''));
      });

      child.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
        updateOutput?.(stdout + (stderr ? `\n${stderr}` : ''));
      });

      // Handle completion
      child.on('close', (exitCode, signal) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode,
          signal,
          aborted
        });
      });

      child.on('error', (error) => {
        resolve({
          stdout: stdout.trim(),
          stderr: error.message,
          exitCode: null,
          signal: null,
          aborted
        });
      });

      // Timeout handling
      const timeoutId = setTimeout(() => {
        aborted = true;
        child.kill('SIGTERM');
      }, timeout);

      child.on('close', () => {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', abortHandler);
      });
    });
  }
}

export class ShellTool extends BaseDeclarativeTool<ShellToolParams, ToolResult> {
  static readonly Name = 'run_shell_command';

  constructor(private workspaceRoot: string) {
    super(
      ShellTool.Name,
      'Shell',
      'Executes shell commands in the workspace. Requires confirmation for potentially dangerous commands.',
      Kind.Execute,
      {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to execute'
          },
          description: {
            type: 'string',
            description: 'Brief description of what this command does'
          },
          directory: {
            type: 'string',
            description: 'Directory to run the command in (relative to workspace root)'
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 30000)',
            default: 30000
          }
        },
        required: ['command']
      }
    );
  }

  protected validateToolParams(params: ShellToolParams): string | null {
    if (!params.command?.trim()) {
      return 'command is required and cannot be empty';
    }

    if (params.directory) {
      if (path.isAbsolute(params.directory)) {
        return 'directory must be relative to workspace root';
      }
      
      const fullPath = path.resolve(this.workspaceRoot, params.directory);
      const relativePath = path.relative(this.workspaceRoot, fullPath);
      if (relativePath.startsWith('..')) {
        return 'directory must be within workspace';
      }
    }

    if (params.timeout && (params.timeout < 1000 || params.timeout > 300000)) {
      return 'timeout must be between 1000ms and 300000ms';
    }

    return null;
  }

  protected createInvocation(params: ShellToolParams): BaseToolInvocation<ShellToolParams, ToolResult> {
    return new ShellToolInvocation(params, this.workspaceRoot);
  }
}
