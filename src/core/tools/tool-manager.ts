/**
 * Central tool management system
 * Integrates built-in tools with MCP tools
 */

import { 
  DefaultToolRegistry, 
  ToolSchema, 
  ToolResult,
  BaseDeclarativeTool 
} from './base-tool.js';
import { WriteFileTool } from './write-file-tool.js';
import { ShellTool } from './shell-tool.js';
import { MCPClient, MCPServerConfig, DEFAULT_MCP_SERVERS } from './mcp-client.js';
import { SimpleMCPClient, SimpleMCPServerConfig, SIMPLE_DEFAULT_MCP_SERVERS } from './simple-mcp-client.js';

export interface ToolManagerConfig {
  workspaceRoot: string;
  enableMCP?: boolean;
  mcpServers?: MCPServerConfig[];
  autoApprove?: boolean;
  useSimpleMCP?: boolean; // Fallback to simple MCP implementation
}

export class ToolManager {
  private builtinRegistry = new DefaultToolRegistry();
  private mcpClient: MCPClient | SimpleMCPClient;
  private config: ToolManagerConfig;

  constructor(config: ToolManagerConfig) {
    this.config = config;

    // Choose MCP implementation based on config
    if (config.useSimpleMCP) {
      this.mcpClient = new SimpleMCPClient();
      console.log('🔧 Using simplified MCP client');
    } else {
      this.mcpClient = new MCPClient();
      console.log('🔧 Using full MCP client');
    }

    this.initializeBuiltinTools();
  }

  private initializeBuiltinTools(): void {
    // Register built-in tools
    this.builtinRegistry.registerTool(new WriteFileTool(this.config.workspaceRoot));
    this.builtinRegistry.registerTool(new ShellTool(this.config.workspaceRoot));
    
    console.log('📦 Registered built-in tools:', this.builtinRegistry.getAllTools().map(t => t.name));
  }

  async initialize(): Promise<void> {
    if (this.config.enableMCP) {
      await this.initializeMCPServers();
    }
  }

  private async initializeMCPServers(): Promise<void> {
    const servers = this.config.useSimpleMCP
      ? SIMPLE_DEFAULT_MCP_SERVERS
      : (this.config.mcpServers || DEFAULT_MCP_SERVERS);

    console.log('🔌 Initializing MCP servers...');

    for (const serverConfig of servers) {
      try {
        await this.mcpClient.connectServer(serverConfig);
      } catch (error: any) {
        console.warn(`⚠️ Failed to connect to MCP server ${serverConfig.name}: ${error.message}`);

        // If using full MCP and it fails, suggest fallback
        if (!this.config.useSimpleMCP) {
          console.warn(`💡 Consider using simplified MCP mode: useSimpleMCP: true`);
        }
        // Continue with other servers
      }
    }

    const connectedServers = this.mcpClient.getConnectedServers();
    if (connectedServers.length > 0) {
      console.log('✅ Connected MCP servers:', connectedServers);
    } else {
      console.log('⚠️ No MCP servers connected');
    }
  }

  async shutdown(): Promise<void> {
    await this.mcpClient.disconnectAll();
  }

  getAllTools(): ToolSchema[] {
    const builtinTools = this.builtinRegistry.getToolSchemas();
    const mcpTools = this.mcpClient.getAvailableTools();
    
    return [...builtinTools, ...mcpTools];
  }

  getBuiltinTools(): ToolSchema[] {
    return this.builtinRegistry.getToolSchemas();
  }

  getMCPTools(): ToolSchema[] {
    return this.mcpClient.getAvailableTools();
  }

  async callTool(
    toolName: string, 
    params: any, 
    signal: AbortSignal,
    updateOutput?: (output: string) => void
  ): Promise<ToolResult> {
    // Try built-in tools first
    const builtinTool = this.builtinRegistry.getTool(toolName);
    if (builtinTool) {
      return builtinTool.invoke(params, signal, updateOutput);
    }

    // Try MCP tools
    return this.mcpClient.callTool(toolName, params, signal);
  }

  getToolInfo(toolName: string): ToolSchema | null {
    const allTools = this.getAllTools();
    return allTools.find(tool => tool.name === toolName) || null;
  }

  getToolsByCategory(): { builtin: ToolSchema[]; mcp: ToolSchema[] } {
    return {
      builtin: this.getBuiltinTools(),
      mcp: this.getMCPTools()
    };
  }

  getMCPServerStatus(): Array<{ name: string; connected: boolean; toolCount: number }> {
    const servers = this.config.mcpServers || DEFAULT_MCP_SERVERS;
    return servers.map(server => ({
      name: server.name,
      ...this.mcpClient.getServerInfo(server.name)
    }));
  }

  async addMCPServer(config: MCPServerConfig): Promise<void> {
    await this.mcpClient.connectServer(config);
  }

  async removeMCPServer(serverName: string): Promise<void> {
    await this.mcpClient.disconnectServer(serverName);
  }

  // Tool execution with enhanced error handling
  async executeToolSafely(
    toolName: string,
    params: any,
    options: {
      signal?: AbortSignal;
      updateOutput?: (output: string) => void;
      timeout?: number;
    } = {}
  ): Promise<ToolResult> {
    const { signal = new AbortController().signal, updateOutput, timeout = 30000 } = options;

    // Create timeout signal if specified
    const timeoutController = new AbortController();
    const timeoutId = timeout > 0 ? setTimeout(() => {
      timeoutController.abort();
    }, timeout) : null;

    // Combine signals
    const combinedSignal = this.combineAbortSignals([signal, timeoutController.signal]);

    try {
      const result = await this.callTool(toolName, params, combinedSignal, updateOutput);
      
      if (timeoutId) clearTimeout(timeoutId);
      
      return result;
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (combinedSignal.aborted) {
        return {
          llmContent: 'Tool execution was cancelled or timed out',
          returnDisplay: 'Operation cancelled',
          error: {
            message: 'Operation cancelled or timed out',
            type: 'EXECUTION_CANCELLED'
          }
        };
      }
      
      throw error;
    }
  }

  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      signal.addEventListener('abort', () => controller.abort());
    }
    
    return controller.signal;
  }

  // Get tool suggestions based on context
  suggestTools(context: {
    hasFiles?: boolean;
    needsExecution?: boolean;
    workingWithCode?: boolean;
  }): ToolSchema[] {
    const allTools = this.getAllTools();
    const suggestions: ToolSchema[] = [];

    if (context.hasFiles) {
      suggestions.push(...allTools.filter(t => 
        t.name.includes('file') || t.name.includes('read') || t.name.includes('write')
      ));
    }

    if (context.needsExecution) {
      suggestions.push(...allTools.filter(t => 
        t.name.includes('shell') || t.name.includes('run') || t.name.includes('exec')
      ));
    }

    if (context.workingWithCode) {
      suggestions.push(...allTools.filter(t => 
        t.name.includes('git') || t.name.includes('code') || t.name.includes('lint')
      ));
    }

    // Remove duplicates
    return suggestions.filter((tool, index, self) => 
      self.findIndex(t => t.name === tool.name) === index
    );
  }
}
