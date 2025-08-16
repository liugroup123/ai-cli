# 🔧 AI CLI Tools System - Gemini CLI Style

This document explains the advanced tool system inspired by Google Gemini CLI, featuring MCP (Model Context Protocol) integration and sophisticated file operations.

## 🏗️ Architecture Overview

```
AI CLI Tools System
├── Base Tool Framework
│   ├── BaseDeclarativeTool     # Abstract tool class
│   ├── BaseToolInvocation      # Tool execution wrapper
│   └── ToolRegistry           # Tool management
├── Built-in Tools
│   ├── WriteFileTool          # File creation/editing with diff
│   └── ShellTool              # Safe shell command execution
├── MCP Integration
│   ├── MCPClient              # MCP protocol client
│   ├── MCPToolWrapper         # Wrap MCP tools as local tools
│   └── Default MCP Servers    # Filesystem, Git, Web Search
└── AI Integration
    ├── AIToolsIntegration     # Bridge between AI and tools
    └── Tool Format Converters # OpenAI/Anthropic formats
```

## 🚀 Key Features

### **1. Gemini CLI-Style Tool Execution**
- **Confirmation System**: Preview changes before execution
- **Diff Visualization**: See exactly what will change
- **Safety Checks**: Validate parameters and permissions
- **Progress Updates**: Real-time execution feedback

### **2. MCP (Model Context Protocol) Support**
- **External Tool Servers**: Connect to MCP-compatible tools
- **Dynamic Discovery**: Automatically register available tools
- **Standard Protocols**: Compatible with MCP ecosystem

### **3. Advanced File Operations**
- **Smart Diff Preview**: Visual diff before writing files
- **Directory Creation**: Auto-create parent directories
- **Content Validation**: Ensure file operations are safe
- **Backup Support**: Optional backup before modifications

### **4. Shell Command Safety**
- **Command Allowlisting**: Only approved commands by default
- **Workspace Isolation**: Commands run within project bounds
- **Timeout Protection**: Prevent runaway processes
- **Output Streaming**: Real-time command output

## 📦 Built-in Tools

### **WriteFileTool**
Creates or modifies files with safety checks and diff preview.

```typescript
{
  name: "write_file",
  parameters: {
    file_path: string,      // Absolute path to file
    content: string,        // File content
    description?: string,   // Change description
    create_directories?: boolean  // Create parent dirs
  }
}
```

**Example:**
```typescript
await toolManager.callTool('write_file', {
  file_path: '/path/to/file.js',
  content: 'console.log("Hello World");',
  description: 'Add hello world script',
  create_directories: true
});
```

### **ShellTool**
Executes shell commands with safety restrictions.

```typescript
{
  name: "run_shell_command",
  parameters: {
    command: string,        // Shell command to run
    description?: string,   // What this command does
    directory?: string,     // Working directory (relative)
    timeout?: number        // Timeout in milliseconds
  }
}
```

**Example:**
```typescript
await toolManager.callTool('run_shell_command', {
  command: 'npm install',
  description: 'Install project dependencies',
  directory: '.',
  timeout: 60000
});
```

## 🔌 MCP Integration

### **Default MCP Servers**

1. **Filesystem Server**
   - File reading/writing operations
   - Directory traversal
   - File metadata access

2. **Git Server**
   - Repository operations
   - Commit history access
   - Branch management

3. **Web Search Server**
   - Internet search capabilities
   - Real-time information access

### **Adding Custom MCP Servers**

```typescript
const customServer: MCPServerConfig = {
  name: 'my-tools',
  command: 'node',
  args: ['./my-mcp-server.js'],
  description: 'Custom project tools',
  env: {
    API_KEY: process.env.MY_API_KEY
  }
};

await toolManager.addMCPServer(customServer);
```

## 🤖 AI Integration

### **OpenAI Function Calling**

```typescript
const tools = toolsIntegration.getOpenAIFunctions();

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...],
  functions: tools,
  function_call: 'auto'
});

// Execute tool calls
if (response.choices[0].message.function_call) {
  const toolCalls = [response.choices[0].message.function_call];
  const results = await toolsIntegration.executeToolCalls(toolCalls);
}
```

### **Anthropic Tool Use**

```typescript
const tools = toolsIntegration.getAnthropicTools();

const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  messages: [...],
  tools: tools,
  tool_choice: { type: 'auto' }
});

// Execute tool calls
if (response.content.some(c => c.type === 'tool_use')) {
  const toolCalls = response.content
    .filter(c => c.type === 'tool_use')
    .map(c => ({ name: c.name, parameters: c.input }));
  
  const results = await toolsIntegration.executeToolCalls(toolCalls);
}
```

## 🛠️ Usage Examples

### **Basic Setup**

```typescript
import { createToolsIntegration } from './core/tools/ai-tools-integration.js';

// Initialize tool system
const toolsIntegration = createToolsIntegration(process.cwd(), true);
await toolsIntegration.initialize();

// Get available tools
const tools = toolsIntegration.getToolSchemas();
console.log('Available tools:', tools.map(t => t.name));
```

### **Execute Tools Manually**

```typescript
// Create a file
const fileResult = await toolsIntegration.executeToolCalls([
  {
    name: 'write_file',
    parameters: {
      file_path: './example.js',
      content: 'console.log("Hello from AI CLI");',
      description: 'Create example script'
    }
  }
]);

// Run a command
const shellResult = await toolsIntegration.executeToolCalls([
  {
    name: 'run_shell_command',
    parameters: {
      command: 'node example.js',
      description: 'Run the example script'
    }
  }
]);
```

### **Tool Suggestions**

```typescript
// Get tool suggestions based on user message
const message = "I want to create a new React component and test it";
const suggestions = toolsIntegration.suggestToolsForMessage(message);

console.log('Suggested tools:', suggestions.map(t => t.name));
// Output: ['write_file', 'run_shell_command', 'git_*']
```

## 🔒 Safety Features

### **Confirmation System**
- All potentially dangerous operations require confirmation
- Diff preview for file changes
- Command preview for shell operations
- User can approve once or always for trusted operations

### **Workspace Isolation**
- All file operations restricted to workspace
- Shell commands run in controlled environment
- Path validation prevents directory traversal

### **Error Handling**
- Comprehensive error reporting
- Graceful failure recovery
- Timeout protection for long-running operations

## 📊 Monitoring and Debugging

### **Tool Status**

```typescript
const status = toolsIntegration.getToolStatus();
console.log({
  totalTools: status.totalTools,
  builtinTools: status.builtinTools,
  mcpTools: status.mcpTools,
  mcpServers: status.mcpServers
});
```

### **MCP Server Health**

```typescript
const servers = toolsIntegration.getMCPServerStatus();
servers.forEach(server => {
  console.log(`${server.name}: ${server.connected ? 'Connected' : 'Disconnected'} (${server.toolCount} tools)`);
});
```

## 🎯 Best Practices

1. **Always Use Confirmation**: Never disable safety checks in production
2. **Validate Inputs**: Check tool parameters before execution
3. **Handle Errors Gracefully**: Provide meaningful error messages
4. **Monitor Performance**: Track tool execution times
5. **Update Regularly**: Keep MCP servers and tools updated

## 🔮 Future Enhancements

- [ ] **Visual Diff UI**: Rich diff display in TUI
- [ ] **Tool Marketplace**: Discover and install community tools
- [ ] **Workflow Automation**: Chain tools together
- [ ] **Permission System**: Fine-grained access control
- [ ] **Tool Analytics**: Usage statistics and optimization
- [ ] **Custom Tool SDK**: Easy tool development framework

## 📚 Related Documentation

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Tool Development Guide](./TOOL_DEVELOPMENT.md)
- [Security Guidelines](./SECURITY.md)
- [API Reference](./API_REFERENCE.md)
