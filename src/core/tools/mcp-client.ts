/**
 * MCP (Model Context Protocol) client implementation
 * Inspired by Gemini CLI's MCP integration
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  ToolResult,
  Kind,
  ToolSchema,
  DefaultToolRegistry
} from './base-tool.js';

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

class MCPToolWrapper extends BaseDeclarativeTool<any, ToolResult> {
  constructor(
    private client: Client,
    private mcpTool: MCPTool,
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
    // Basic validation - could be enhanced with JSON schema validation
    if (typeof params !== 'object' || params === null) {
      return 'Parameters must be an object';
    }
    return null;
  }

  protected createInvocation(params: any): BaseToolInvocation<any, ToolResult> {
    return new MCPToolInvocation(params, this.client, this.mcpTool, this.serverName);
  }
}

class MCPToolInvocation extends BaseToolInvocation<any, ToolResult> {
  constructor(
    params: any,
    private client: Client,
    private mcpTool: MCPTool,
    private serverName: string
  ) {
    super(params);
  }

  getDescription(): string {
    return `${this.mcpTool.name} via MCP server ${this.serverName}`;
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    if (signal.aborted) {
      throw new Error('Operation was cancelled');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: this.mcpTool.name,
            arguments: this.params
          }
        },
        CallToolResultSchema
      );

      // Handle the response content properly
      let content = '';
      if (response && typeof response === 'object') {
        if ('content' in response && Array.isArray(response.content)) {
          content = response.content
            .map((item: any) => item.type === 'text' ? item.text : `[${item.type}]`)
            .join('\n');
        } else if ('result' in response) {
          content = String(response.result);
        } else {
          content = JSON.stringify(response);
        }
      } else {
        content = String(response);
      }

      return {
        llmContent: content,
        returnDisplay: content
      };

    } catch (error: any) {
      const errorMessage = `MCP tool error: ${error.message}`;
      return {
        llmContent: errorMessage,
        returnDisplay: errorMessage,
        error: {
          message: error.message,
          type: 'MCP_TOOL_ERROR'
        }
      };
    }
  }
}

export class MCPClient {
  private servers = new Map<string, { client: Client; transport: StdioClientTransport }>();
  private toolRegistry = new DefaultToolRegistry();

  async connectServer(config: MCPServerConfig): Promise<void> {
    try {
      console.log(`🔌 Connecting to MCP server: ${config.name}`);
      
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: { ...process.env, ...config.env }
      });

      const client = new Client(
        {
          name: 'ai-cli',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );

      await client.connect(transport);
      
      // Store the connection
      this.servers.set(config.name, { client, transport });

      // Register tools from this server
      await this.registerServerTools(config.name, client);

      console.log(`✅ Connected to MCP server: ${config.name}`);

    } catch (error: any) {
      console.error(`❌ Failed to connect to MCP server ${config.name}:`, error.message);
      throw error;
    }
  }

  private async registerServerTools(serverName: string, client: Client): Promise<void> {
    try {
      const response = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema
      );

      // Handle the response properly
      const tools = response && typeof response === 'object' && 'tools' in response
        ? response.tools
        : [];

      if (!Array.isArray(tools)) {
        console.warn(`No tools found in response from server ${serverName}`);
        return;
      }

      for (const tool of tools) {
        const mcpTool: MCPTool = {
          name: tool.name,
          description: tool.description || `Tool from MCP server ${serverName}`,
          inputSchema: tool.inputSchema
        };

        const wrappedTool = new MCPToolWrapper(client, mcpTool, serverName);
        this.toolRegistry.registerTool(wrappedTool);

        console.log(`📝 Registered MCP tool: ${wrappedTool.name}`);
      }

    } catch (error: any) {
      console.error(`Failed to register tools from server ${serverName}:`, error.message);
    }
  }

  async disconnectServer(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (server) {
      try {
        await server.client.close();
        await server.transport.close();
        this.servers.delete(serverName);
        console.log(`🔌 Disconnected from MCP server: ${serverName}`);
      } catch (error: any) {
        console.error(`Error disconnecting from ${serverName}:`, error.message);
      }
    }
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.servers.keys()).map(
      serverName => this.disconnectServer(serverName)
    );
    await Promise.all(disconnectPromises);
  }

  getToolRegistry(): DefaultToolRegistry {
    return this.toolRegistry;
  }

  getConnectedServers(): string[] {
    return Array.from(this.servers.keys());
  }

  getServerInfo(serverName: string): { connected: boolean; toolCount: number } {
    const server = this.servers.get(serverName);
    if (!server) {
      return { connected: false, toolCount: 0 };
    }

    const tools = this.toolRegistry.getAllTools().filter(
      tool => tool.name.startsWith(`${serverName}_`)
    );

    return {
      connected: true,
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

// Default MCP server configurations
export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    description: 'File system operations'
  },
  {
    name: 'git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', process.cwd()],
    description: 'Git operations'
  },
  {
    name: 'web-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    description: 'Web search capabilities',
    env: {
      BRAVE_API_KEY: process.env.BRAVE_API_KEY || ''
    }
  }
];
