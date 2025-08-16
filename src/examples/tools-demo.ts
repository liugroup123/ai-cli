/**
 * Demo of the Gemini CLI-style tool system
 */

import { createToolsIntegration, AIToolsIntegration } from '../core/tools/ai-tools-integration.js';
import { MCPServerConfig } from '../core/tools/mcp-client.js';

async function demoToolSystem() {
  console.log('🚀 AI CLI Tools Demo - Gemini CLI Style\n');

  // Initialize tool system
  const toolsIntegration = createToolsIntegration(process.cwd(), true);
  
  try {
    await toolsIntegration.initialize();
    
    // Show available tools
    console.log('📦 Available Tools:');
    const tools = toolsIntegration.getToolSchemas();
    tools.forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description}`);
    });
    
    console.log('\n🔧 Tool Status:');
    const status = toolsIntegration.getToolStatus();
    console.log(`  • Total tools: ${status.totalTools}`);
    console.log(`  • Built-in tools: ${status.builtinTools}`);
    console.log(`  • MCP tools: ${status.mcpTools}`);
    
    console.log('\n🔌 MCP Servers:');
    status.mcpServers.forEach(server => {
      const statusIcon = server.connected ? '✅' : '❌';
      console.log(`  ${statusIcon} ${server.name}: ${server.toolCount} tools`);
    });

    // Demo 1: File creation
    console.log('\n📝 Demo 1: Creating a file');
    const fileResult = await toolsIntegration.executeToolCalls([
      {
        name: 'write_file',
        parameters: {
          file_path: './demo-output.txt',
          content: 'Hello from AI CLI Tools!\n\nThis file was created using the Gemini CLI-style tool system.',
          description: 'Demo file creation',
          create_directories: true
        }
      }
    ]);
    
    console.log('Result:', fileResult[0].result.llmContent);

    // Demo 2: Shell command
    console.log('\n🖥️ Demo 2: Running a shell command');
    const shellResult = await toolsIntegration.executeToolCalls([
      {
        name: 'run_shell_command',
        parameters: {
          command: 'ls -la',
          description: 'List current directory contents'
        }
      }
    ]);
    
    console.log('Result:', shellResult[0].result.returnDisplay);

    // Demo 3: Tool suggestions
    console.log('\n💡 Demo 3: Tool suggestions');
    const suggestions = toolsIntegration.suggestToolsForMessage(
      'I want to create a new Python file and run some tests'
    );
    
    console.log('Suggested tools for "create Python file and run tests":');
    suggestions.forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description}`);
    });

    // Demo 4: OpenAI function format
    console.log('\n🤖 Demo 4: OpenAI function format');
    const openAIFunctions = toolsIntegration.getOpenAIFunctions();
    console.log('Tools in OpenAI format:', JSON.stringify(openAIFunctions.slice(0, 2), null, 2));

  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    await toolsIntegration.shutdown();
  }
}

// Advanced demo with custom MCP server
async function demoCustomMCPServer() {
  console.log('\n🔧 Advanced Demo: Custom MCP Server\n');

  const customMCPConfig: MCPServerConfig = {
    name: 'custom-tools',
    command: 'node',
    args: ['./custom-mcp-server.js'], // You would create this
    description: 'Custom tools for your project'
  };

  const toolsIntegration = createToolsIntegration(process.cwd(), true);
  
  try {
    await toolsIntegration.initialize();
    
    // Add custom MCP server
    console.log('🔌 Adding custom MCP server...');
    await toolsIntegration.addMCPServer(customMCPConfig);
    
    const status = toolsIntegration.getToolStatus();
    console.log(`✅ Now have ${status.totalTools} total tools available`);
    
  } catch (error: any) {
    console.error('❌ Custom MCP demo failed:', error.message);
  } finally {
    await toolsIntegration.shutdown();
  }
}

// Integration with AI provider demo
async function demoAIIntegration() {
  console.log('\n🤖 AI Integration Demo\n');

  const toolsIntegration = createToolsIntegration(process.cwd(), true);
  
  try {
    await toolsIntegration.initialize();
    
    // Simulate AI wanting to create a file
    const userMessage = "Create a README.md file for this project";
    
    console.log(`User: ${userMessage}`);
    
    // Check if tools should be used
    const shouldUseTool = toolsIntegration.shouldUseTool(userMessage);
    console.log(`Should use tools: ${shouldUseTool}`);
    
    if (shouldUseTool) {
      // Get tool suggestions
      const suggestions = toolsIntegration.suggestToolsForMessage(userMessage);
      console.log('Suggested tools:', suggestions.map(t => t.name));
      
      // Simulate AI deciding to use write_file tool
      const toolCalls = [
        {
          name: 'write_file',
          id: 'call_1',
          parameters: {
            file_path: './README.md',
            content: `# AI CLI Project

This is an AI-powered command line interface with Gemini CLI-style tools.

## Features

- Multiple AI providers (OpenAI, Claude, Gemini, Qwen)
- Gemini CLI-style React + Ink TUI
- MCP (Model Context Protocol) integration
- Advanced file operations with diff preview
- Shell command execution with safety checks

## Usage

\`\`\`bash
ai-cli chat --tui
\`\`\`

Generated by AI CLI Tools System.
`,
            description: 'Project README file',
            create_directories: true
          }
        }
      ];
      
      console.log('\n🔧 AI is executing tools...');
      const results = await toolsIntegration.executeToolCalls(toolCalls);
      
      // Format results for AI
      const formattedResults = toolsIntegration.formatToolResultsForAI(results);
      console.log('\n📋 Results for AI:');
      console.log(formattedResults);
    }
    
  } catch (error: any) {
    console.error('❌ AI integration demo failed:', error.message);
  } finally {
    await toolsIntegration.shutdown();
  }
}

// Run all demos
async function runAllDemos() {
  await demoToolSystem();
  await demoAIIntegration();
  
  console.log('\n🎉 All demos completed!');
  console.log('\n📚 Next steps:');
  console.log('1. Integrate tools into your AI provider');
  console.log('2. Add tool confirmation UI to your TUI');
  console.log('3. Create custom MCP servers for your specific needs');
  console.log('4. Add more built-in tools (git, npm, etc.)');
}

// Export for use in other files
export { demoToolSystem, demoCustomMCPServer, demoAIIntegration, runAllDemos };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos().catch(console.error);
}
