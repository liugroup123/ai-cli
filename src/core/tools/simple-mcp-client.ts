/**
 * Simplified MCP client for basic functionality
 * Falls back when full MCP SDK has issues
 */

import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  ToolResult,
  Kind,
  ToolSchema,
  DefaultToolRegistry
} from './base-tool.js';

export interface SimpleMCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
}

export interface SimpleMCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

class SimpleMCPToolInvocation extends BaseToolInvocation<any, ToolResult> {
  constructor(
    params: any,
    private toolName: string,
    private serverName: string
  ) {
    super(params);
  }

  getDescription(): string {
    return `${this.toolName} via MCP server ${this.serverName}`;
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    if (signal.aborted) {
      throw new Error('Operation was cancelled');
    }

    // For now, return a placeholder result
    // In a real implementation, this would communicate with the MCP server
    return {
      llmContent: `MCP tool ${this.toolName} executed with params: ${JSON.stringify(this.params)}`,
      returnDisplay: `MCP tool ${this.toolName} completed (placeholder implementation)`
    };
  }
}

class SimpleMCPToolWrapper extends BaseDeclarativeTool<any, ToolResult> {
  constructor(
    private mcpTool: SimpleMCPTool,
    private serverName: string
  ) {
    super(
      `${serverName}_${mcpTool.name}`,
      `MCP:${serverName}`,
      `${mcpTool.description} (via MCP server: ${serverName})`,
      Kind.Execute,
      mcpTool.inputSchema || { type: 'object', properties: {} }
    );
  }

  protected validateToolParams(params: any): string | null {
    if (typeof params !== 'object' || params === null) {
      return 'Parameters must be an object';
    }
    return null;
  }

  protected createInvocation(params: any): BaseToolInvocation<any, ToolResult> {
    return new SimpleMCPToolInvocation(params, this.mcpTool.name, this.serverName);
  }
}

export class SimpleMCPClient {
  private toolRegistry = new DefaultToolRegistry();
  private connectedServers = new Set<string>();

  async connectServer(config: SimpleMCPServerConfig): Promise<void> {
    try {
      console.log(`🔌 Connecting to MCP server: ${config.name} (simplified mode)`);
      
      // Simulate connection and register some example tools
      await this.registerExampleTools(config.name);
      
      this.connectedServers.add(config.name);
      console.log(`✅ Connected to MCP server: ${config.name}`);

    } catch (error: any) {
      console.error(`❌ Failed to connect to MCP server ${config.name}:`, error.message);
      throw error;
    }
  }

  private async registerExampleTools(serverName: string): Promise<void> {
    // Register some example tools based on server type
    const exampleTools: SimpleMCPTool[] = [];

    if (serverName === 'filesystem') {
      exampleTools.push(
        {
          name: 'read_file',
          description: 'Read contents of a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to read' }
            },
            required: ['path']
          }
        },
        {
          name: 'list_directory',
          description: 'List contents of a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Directory path to list' }
            },
            required: ['path']
          }
        }
      );
    } else if (serverName === 'git') {
      exampleTools.push(
        {
          name: 'git_status',
          description: 'Get git repository status',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Repository path' }
            }
          }
        },
        {
          name: 'git_log',
          description: 'Get git commit history',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Repository path' },
              limit: { type: 'number', description: 'Number of commits to show' }
            }
          }
        }
      );
    } else if (serverName === 'web-search') {
      exampleTools.push(
        {
          name: 'search_web',
          description: 'Search the web for information',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              limit: { type: 'number', description: 'Number of results' }
            },
            required: ['query']
          }
        }
      );
    }

    for (const tool of exampleTools) {
      const wrappedTool = new SimpleMCPToolWrapper(tool, serverName);
      this.toolRegistry.registerTool(wrappedTool);
      console.log(`📝 Registered MCP tool: ${wrappedTool.name}`);
    }
  }

  async disconnectServer(serverName: string): Promise<void> {
    if (this.connectedServers.has(serverName)) {
      this.connectedServers.delete(serverName);
      console.log(`🔌 Disconnected from MCP server: ${serverName}`);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const serverName of this.connectedServers) {
      await this.disconnectServer(serverName);
    }
  }

  getToolRegistry(): DefaultToolRegistry {
    return this.toolRegistry;
  }

  getConnectedServers(): string[] {
    return Array.from(this.connectedServers);
  }

  getServerInfo(serverName: string): { connected: boolean; toolCount: number } {
    const connected = this.connectedServers.has(serverName);
    const tools = this.toolRegistry.getAllTools().filter(
      tool => tool.name.startsWith(`${serverName}_`)
    );

    return {
      connected,
      toolCount: tools.length
    };
  }

  async callTool(toolName: string, params: any, signal: AbortSignal): Promise<ToolResult> {
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    return tool.invoke(params, signal);
  }

  getAvailableTools(): ToolSchema[] {
    return this.toolRegistry.getToolSchemas();
  }
}

// Default simple MCP server configurations
export const SIMPLE_DEFAULT_MCP_SERVERS: SimpleMCPServerConfig[] = [
  {
    name: 'filesystem',
    command: 'echo',
    args: ['filesystem-server-placeholder'],
    description: 'File system operations (simplified)'
  },
  {
    name: 'git',
    command: 'echo',
    args: ['git-server-placeholder'],
    description: 'Git operations (simplified)'
  },
  {
    name: 'web-search',
    command: 'echo',
    args: ['web-search-server-placeholder'],
    description: 'Web search capabilities (simplified)'
  }
];
