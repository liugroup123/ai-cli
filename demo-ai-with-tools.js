import { createToolsIntegration } from './dist/core/tools/ai-tools-integration.js';

// Simulate AI decision making and tool usage
async function simulateAIWithTools() {
  console.log('🤖 AI CLI with MCP Tools - Real Usage Simulation\n');

  const toolsIntegration = createToolsIntegration(process.cwd(), true);
  
  try {
    await toolsIntegration.initialize();
    
    console.log('🔧 Tools initialized. Simulating AI conversations...\n');

    // Simulation 1: User asks AI to create a file
    console.log('👤 User: "Create a simple Express.js server file"');
    console.log('🤖 AI: I\'ll create an Express.js server file for you.\n');
    
    // AI decides to use write_file tool
    const shouldUseTool1 = toolsIntegration.shouldUseTool('Create a simple Express.js server file');
    console.log(`🧠 AI Analysis: Should use tools? ${shouldUseTool1}`);
    
    const suggestions1 = toolsIntegration.suggestToolsForMessage('Create a simple Express.js server file');
    console.log(`💡 AI Tool Suggestions: ${suggestions1.map(t => t.name).join(', ')}`);
    
    // AI executes the tool
    console.log('🔧 AI executing: write_file');
    const result1 = await toolsIntegration.executeToolCalls([
      {
        name: 'write_file',
        id: 'create_server',
        parameters: {
          file_path: process.cwd() + '/server.js',
          content: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to AI CLI Express Server!',
    timestamp: new Date().toISOString(),
    tools: 'Powered by MCP Tools'
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});

module.exports = app;
`,
          description: 'Create Express.js server file',
          create_directories: true
        }
      }
    ]);

    console.log(`✅ AI Tool Result: ${result1[0].success ? 'SUCCESS' : 'FAILED'}`);
    console.log('🤖 AI: I\'ve created a complete Express.js server file with basic routes and middleware.\n');

    // Simulation 2: User asks to check project structure
    console.log('👤 User: "Show me what files we have in the project now"');
    console.log('🤖 AI: Let me check the current project structure for you.\n');
    
    const shouldUseTool2 = toolsIntegration.shouldUseTool('Show me what files we have in the project');
    console.log(`🧠 AI Analysis: Should use tools? ${shouldUseTool2}`);
    
    const suggestions2 = toolsIntegration.suggestToolsForMessage('Show me what files we have in the project');
    console.log(`💡 AI Tool Suggestions: ${suggestions2.map(t => t.name).join(', ')}`);
    
    console.log('🔧 AI executing: run_shell_command');
    const result2 = await toolsIntegration.executeToolCalls([
      {
        name: 'run_shell_command',
        id: 'list_files',
        parameters: {
          command: process.platform === 'win32' ? 'dir *.js' : 'ls -la *.js',
          description: 'List JavaScript files in project'
        }
      }
    ]);

    console.log(`✅ AI Tool Result: ${result2[0].success ? 'SUCCESS' : 'FAILED'}`);
    if (result2[0].success) {
      console.log('🤖 AI: Here are the JavaScript files in your project:');
      console.log(result2[0].result.returnDisplay);
    }
    console.log();

    // Simulation 3: User asks to create package.json
    console.log('👤 User: "Create a package.json for this Express server"');
    console.log('🤖 AI: I\'ll create a proper package.json file for your Express server.\n');
    
    console.log('🔧 AI executing: write_file');
    const result3 = await toolsIntegration.executeToolCalls([
      {
        name: 'write_file',
        id: 'create_package',
        parameters: {
          file_path: process.cwd() + '/express-package.json',
          content: `{
  "name": "ai-cli-express-server",
  "version": "1.0.0",
  "description": "Express.js server created by AI CLI with MCP tools",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "keywords": [
    "express",
    "ai-cli",
    "mcp-tools",
    "nodejs"
  ],
  "author": "AI CLI with MCP Tools",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
`,
          description: 'Create package.json for Express server',
          create_directories: true
        }
      }
    ]);

    console.log(`✅ AI Tool Result: ${result3[0].success ? 'SUCCESS' : 'FAILED'}`);
    console.log('🤖 AI: I\'ve created a complete package.json with all necessary dependencies and scripts.\n');

    // Simulation 4: User asks about MCP tools
    console.log('👤 User: "What MCP tools do you have available?"');
    console.log('🤖 AI: Let me show you all the MCP tools I have access to.\n');
    
    const status = toolsIntegration.getToolStatus();
    console.log('🔧 AI analyzing available tools...');
    console.log(`📊 AI Report: I have access to ${status.totalTools} tools total:`);
    console.log(`   • ${status.builtinTools} built-in tools (file operations, shell commands)`);
    console.log(`   • ${status.mcpTools} MCP tools from ${status.mcpServers.filter(s => s.connected).length} connected servers`);
    
    console.log('\n🔌 MCP Servers Status:');
    status.mcpServers.forEach(server => {
      const statusIcon = server.connected ? '✅' : '❌';
      console.log(`   ${statusIcon} ${server.name}: ${server.toolCount} tools`);
    });

    console.log('\n🤖 AI: These tools allow me to:');
    console.log('   📝 Create and modify files with diff preview');
    console.log('   🖥️ Execute shell commands safely');
    console.log('   📁 Read and list files through MCP filesystem server');
    console.log('   🔄 Check git status and history through MCP git server');
    console.log('   🌐 Search the web through MCP web-search server');

    // Simulation 5: Complex multi-tool task
    console.log('\n👤 User: "Create a simple test file for the Express server"');
    console.log('🤖 AI: I\'ll create a test file and show you how to run it.\n');
    
    console.log('🔧 AI executing: write_file (creating test)');
    const result5 = await toolsIntegration.executeToolCalls([
      {
        name: 'write_file',
        id: 'create_test',
        parameters: {
          file_path: process.cwd() + '/server.test.js',
          content: `const request = require('supertest');
const app = require('./server');

describe('Express Server Tests', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body.message).toBe('Welcome to AI CLI Express Server!');
    expect(response.body.tools).toBe('Powered by MCP Tools');
  });

  test('GET /api/status should return server status', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);
    
    expect(response.body.status).toBe('running');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    expect(response.body.memory).toBeDefined();
  });
});
`,
          description: 'Create Jest test file for Express server',
          create_directories: true
        }
      }
    ]);

    console.log(`✅ AI Tool Result: ${result5[0].success ? 'SUCCESS' : 'FAILED'}`);
    console.log('🤖 AI: I\'ve created a comprehensive test file. To run it, you would need to install the dependencies first.\n');

    // Summary
    console.log('📋 Conversation Summary:');
    console.log('✅ Created Express.js server file');
    console.log('✅ Listed project files');
    console.log('✅ Created package.json with dependencies');
    console.log('✅ Explained available MCP tools');
    console.log('✅ Created test file for the server');

    console.log('\n🎯 This demonstrates how AI can:');
    console.log('   🧠 Analyze user requests and decide which tools to use');
    console.log('   🔧 Execute multiple tools in sequence');
    console.log('   📝 Create complete, working code files');
    console.log('   🔍 Inspect and understand project structure');
    console.log('   💡 Provide intelligent suggestions and explanations');

    console.log('\n🚀 Try it yourself:');
    console.log('   ai-cli chat -p "Create a React component with TypeScript"');
    console.log('   ai-cli chat --tui  # For interactive mode with tools');

    // Cleanup
    console.log('\n🧹 Cleaning up demo files...');
    const fs = await import('fs');
    const filesToClean = ['server.js', 'express-package.json', 'server.test.js'];
    filesToClean.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`   🗑️ Removed: ${file}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Could not remove: ${file}`);
      }
    });

  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
  } finally {
    await toolsIntegration.shutdown();
  }
}

simulateAIWithTools().catch(console.error);
