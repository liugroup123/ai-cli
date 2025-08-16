/**
 * Base tool system inspired by Gemini CLI
 */

export interface ToolResult {
  llmContent: string;
  returnDisplay: string | FileDiff;
  error?: {
    message: string;
    type: string;
  };
}

export interface FileDiff {
  fileDiff: string;
  fileName: string;
  originalContent: string;
  newContent: string;
  diffStat?: {
    additions: number;
    deletions: number;
    changes: number;
  };
}

export interface ToolLocation {
  path: string;
}

export enum ToolConfirmationOutcome {
  Proceed = 'proceed',
  ProceedAlways = 'proceed_always',
  Cancel = 'cancel',
}

export interface ToolCallConfirmationDetails {
  type: 'exec' | 'edit';
  title: string;
  command?: string;
  filePath?: string;
  fileDiff?: string;
  originalContent?: string;
  newContent?: string;
  onConfirm?: (outcome: ToolConfirmationOutcome) => Promise<void>;
}

export enum Kind {
  Execute = 'execute',
  Edit = 'edit',
  Read = 'read',
}

export interface ToolSchema {
  name: string;
  description: string;
  parametersJsonSchema: any;
}

export abstract class BaseToolInvocation<TParams, TResult> {
  constructor(protected params: TParams) {}

  abstract execute(
    signal: AbortSignal,
    updateOutput?: (output: string) => void
  ): Promise<TResult>;

  abstract getDescription(): string;

  toolLocations(): ToolLocation[] {
    return [];
  }

  async shouldConfirmExecute(
    _abortSignal: AbortSignal
  ): Promise<ToolCallConfirmationDetails | false> {
    return false;
  }
}

export abstract class BaseDeclarativeTool<TParams, TResult> {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly kind: Kind,
    public readonly parametersJsonSchema: any,
    public readonly outputIsMarkdown: boolean = false,
    public readonly outputCanBeUpdated: boolean = false
  ) {}

  get schema(): ToolSchema {
    return {
      name: this.name,
      description: this.description,
      parametersJsonSchema: this.parametersJsonSchema,
    };
  }

  protected abstract validateToolParams(params: TParams): string | null;
  protected abstract createInvocation(params: TParams): BaseToolInvocation<TParams, TResult>;

  async invoke(
    params: TParams,
    signal: AbortSignal,
    updateOutput?: (output: string) => void
  ): Promise<TResult> {
    const validationError = this.validateToolParams(params);
    if (validationError) {
      throw new Error(`Tool validation failed: ${validationError}`);
    }

    const invocation = this.createInvocation(params);
    
    // Check if confirmation is needed
    const confirmationDetails = await invocation.shouldConfirmExecute(signal);
    if (confirmationDetails) {
      const confirmed = await this.requestUserConfirmation(confirmationDetails);
      if (!confirmed) {
        throw new Error('Tool execution cancelled by user');
      }
    }

    return invocation.execute(signal, updateOutput);
  }

  private async requestUserConfirmation(
    details: ToolCallConfirmationDetails
  ): Promise<boolean> {
    // This would integrate with your TUI confirmation system
    console.log(`\n🔧 ${details.title}`);
    if (details.command) {
      console.log(`Command: ${details.command}`);
    }
    if (details.fileDiff) {
      console.log('Diff preview:');
      console.log(details.fileDiff);
    }
    
    // For now, auto-approve (you can integrate with inquirer)
    return true;
  }
}

export interface ToolRegistry {
  registerTool(tool: BaseDeclarativeTool<any, any>): void;
  getTool(name: string): BaseDeclarativeTool<any, any> | undefined;
  getAllTools(): BaseDeclarativeTool<any, any>[];
  getToolSchemas(): ToolSchema[];
}

export class DefaultToolRegistry implements ToolRegistry {
  private tools = new Map<string, BaseDeclarativeTool<any, any>>();

  registerTool(tool: BaseDeclarativeTool<any, any>): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): BaseDeclarativeTool<any, any> | undefined {
    return this.tools.get(name);
  }

  getAllTools(): BaseDeclarativeTool<any, any>[] {
    return Array.from(this.tools.values());
  }

  getToolSchemas(): ToolSchema[] {
    return this.getAllTools().map(tool => tool.schema);
  }
}
