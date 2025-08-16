/**
 * Integration between AI providers and tool system
 * Enables AI to call tools like Gemini CLI
 */

import { ToolManager, ToolManagerConfig } from './tool-manager.js';
import { ToolSchema, ToolResult } from './base-tool.js';

export interface AIToolCall {
  name: string;
  parameters: any;
  id?: string;
}

export interface AIToolResponse {
  toolCallId?: string;
  result: ToolResult;
  success: boolean;
  error?: string;
}

export class AIToolsIntegration {
  private toolManager: ToolManager;
  private abortController = new AbortController();

  constructor(config: ToolManagerConfig) {
    this.toolManager = new ToolManager(config);
  }

  async initialize(): Promise<void> {
    await this.toolManager.initialize();
  }

  async shutdown(): Promise<void> {
    this.abortController.abort();
    await this.toolManager.shutdown();
  }

  // Get tool schemas for AI function calling
  getToolSchemas(): ToolSchema[] {
    return this.toolManager.getAllTools();
  }

  // Convert tool schemas to OpenAI function format
  getOpenAIFunctions(): any[] {
    return this.getToolSchemas().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parametersJsonSchema
    }));
  }

  // Convert tool schemas to Anthropic tool format
  getAnthropicTools(): any[] {
    return this.getToolSchemas().map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parametersJsonSchema
    }));
  }

  // Execute tool calls from AI
  async executeToolCalls(
    toolCalls: AIToolCall[],
    updateOutput?: (toolName: string, output: string) => void
  ): Promise<AIToolResponse[]> {
    const results: AIToolResponse[] = [];

    for (const toolCall of toolCalls) {
      try {
        console.log(`🔧 Executing tool: ${toolCall.name}`);
        
        const result = await this.toolManager.executeToolSafely(
          toolCall.name,
          toolCall.parameters,
          {
            signal: this.abortController.signal,
            updateOutput: updateOutput ? (output) => updateOutput(toolCall.name, output) : undefined,
            timeout: 60000 // 1 minute timeout
          }
        );

        results.push({
          toolCallId: toolCall.id,
          result,
          success: !result.error
        });

        console.log(`✅ Tool ${toolCall.name} completed successfully`);

      } catch (error: any) {
        console.error(`❌ Tool ${toolCall.name} failed:`, error.message);
        
        results.push({
          toolCallId: toolCall.id,
          result: {
            llmContent: `Tool execution failed: ${error.message}`,
            returnDisplay: `Error: ${error.message}`,
            error: {
              message: error.message,
              type: 'TOOL_EXECUTION_ERROR'
            }
          },
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Format tool results for AI consumption
  formatToolResultsForAI(responses: AIToolResponse[]): string {
    return responses.map(response => {
      const { result } = response;
      
      if (result.error) {
        return `Tool Error: ${result.error.message}`;
      }

      // For file operations, show diff
      if (typeof result.returnDisplay === 'object' && 'fileDiff' in result.returnDisplay) {
        const fileDiff = result.returnDisplay;
        return [
          `File Operation: ${fileDiff.fileName}`,
          `Changes: +${fileDiff.diffStat?.additions || 0} -${fileDiff.diffStat?.deletions || 0}`,
          '',
          'Diff:',
          fileDiff.fileDiff
        ].join('\n');
      }

      return result.llmContent || result.returnDisplay || 'Tool completed successfully';
    }).join('\n\n---\n\n');
  }

  // Get tool suggestions based on user message
  suggestToolsForMessage(message: string): ToolSchema[] {
    const lowerMessage = message.toLowerCase();
    
    const context = {
      hasFiles: /\b(file|write|create|save|edit)\b/.test(lowerMessage),
      needsExecution: /\b(run|execute|command|shell|install|build)\b/.test(lowerMessage),
      workingWithCode: /\b(code|git|commit|push|pull|branch)\b/.test(lowerMessage)
    };

    return this.toolManager.suggestTools(context);
  }

  // Check if message likely needs tools
  shouldUseTool(message: string): boolean {
    const toolKeywords = [
      'create', 'write', 'file', 'save', 'edit', 'modify',
      'run', 'execute', 'command', 'shell', 'install',
      'git', 'commit', 'push', 'pull', 'clone',
      'build', 'compile', 'test', 'deploy'
    ];

    const lowerMessage = message.toLowerCase();
    return toolKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get tool status for debugging
  getToolStatus(): {
    totalTools: number;
    builtinTools: number;
    mcpTools: number;
    mcpServers: Array<{ name: string; connected: boolean; toolCount: number }>;
  } {
    const toolsByCategory = this.toolManager.getToolsByCategory();
    
    return {
      totalTools: this.getToolSchemas().length,
      builtinTools: toolsByCategory.builtin.length,
      mcpTools: toolsByCategory.mcp.length,
      mcpServers: this.toolManager.getMCPServerStatus()
    };
  }

  // Cancel all running tools
  cancelAllTools(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  // Add MCP server (delegate to tool manager)
  async addMCPServer(config: any): Promise<void> {
    await this.toolManager.addMCPServer(config);
  }

  // Remove MCP server (delegate to tool manager)
  async removeMCPServer(serverName: string): Promise<void> {
    await this.toolManager.removeMCPServer(serverName);
  }
}

// Helper function to create tool integration with default config
export function createToolsIntegration(workspaceRoot: string, enableMCP = true): AIToolsIntegration {
  return new AIToolsIntegration({
    workspaceRoot,
    enableMCP,
    autoApprove: false, // Always require confirmation for safety
    useSimpleMCP: true  // Use simplified MCP by default for stability
  });
}

// Example usage in AI provider
export function enhanceAIPromptWithTools(
  originalPrompt: string,
  availableTools: ToolSchema[]
): string {
  if (availableTools.length === 0) {
    return originalPrompt;
  }

  const toolDescriptions = availableTools.map(tool =>
    `- ${tool.name}: ${tool.description}`
  ).join('\n');

  return `${originalPrompt}

IMPORTANT: You have access to these tools and should use them when appropriate:
${toolDescriptions}

TOOL USAGE GUIDELINES:
- When the user asks to "create", "write", "save", or "generate" a file, use the write_file tool
- When the user asks to run commands, use the run_shell_command tool
- When the user asks to read files or check directories, use the appropriate MCP tools
- Always prefer using tools over just explaining how to do something manually
- If the user's request can be accomplished with tools, DO IT instead of just describing it

For this request: "${originalPrompt}"
- If it involves creating/writing files, use write_file tool
- If it involves running commands, use run_shell_command tool
- If it involves reading/checking files, use appropriate MCP tools`;
}
