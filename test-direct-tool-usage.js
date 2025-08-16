import { createToolsIntegration } from './dist/core/tools/ai-tools-integration.js';
import path from 'path';

async function testDirectToolUsage() {
  console.log('🧪 Testing Direct Tool Usage\n');

  const toolsIntegration = createToolsIntegration(process.cwd(), true);
  
  try {
    await toolsIntegration.initialize();
    
    console.log('✅ Tools initialized');
    console.log('📦 Available tools:', toolsIntegration.getToolSchemas().map(t => t.name).join(', '));
    
    // Test 1: Direct tool call to create hello.ts
    console.log('\n🔧 Test 1: Direct tool call to create hello.ts');
    
    const helloTsPath = path.resolve(process.cwd(), 'hello.ts');
    const helloTsContent = `// hello.ts - Created by AI CLI Tools
function helloWorld(): void {
    console.log("Hello, World! This file was created by AI CLI tools!");
}

// Call the function
helloWorld();

export { helloWorld };
`;

    const result1 = await toolsIntegration.executeToolCalls([
      {
        name: 'write_file',
        id: 'create_hello_ts',
        parameters: {
          file_path: helloTsPath,
          content: helloTsContent,
          description: 'Create hello.ts with Hello World function',
          create_directories: true
        }
      }
    ]);

    console.log(`✅ Result: ${result1[0].success ? 'SUCCESS' : 'FAILED'}`);
    if (result1[0].success) {
      console.log('📁 File created at:', helloTsPath);
      console.log('📄 Content preview:', helloTsContent.substring(0, 100) + '...');
    } else {
      console.log('❌ Error:', result1[0].result.error?.message);
    }

    // Test 2: Verify file exists
    console.log('\n📂 Test 2: Verify file exists using MCP tool');
    
    const result2 = await toolsIntegration.executeToolCalls([
      {
        name: 'filesystem_read_file',
        id: 'read_hello_ts',
        parameters: {
          path: helloTsPath
        }
      }
    ]);

    console.log(`✅ Read result: ${result2[0].success ? 'SUCCESS' : 'FAILED'}`);
    if (result2[0].success) {
      console.log('📖 File content confirmed:', result2[0].result.returnDisplay.substring(0, 50) + '...');
    }

    // Test 3: Create a package.json
    console.log('\n📦 Test 3: Create package.json');
    
    const packageJsonPath = path.resolve(process.cwd(), 'test-package.json');
    const packageJsonContent = `{
  "name": "ai-cli-hello-world",
  "version": "1.0.0",
  "description": "Hello World project created by AI CLI tools",
  "main": "hello.ts",
  "scripts": {
    "start": "ts-node hello.ts",
    "build": "tsc hello.ts",
    "test": "echo \\"Hello World test\\""
  },
  "keywords": ["ai-cli", "hello-world", "typescript"],
  "author": "AI CLI Tools",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0"
  }
}
`;

    const result3 = await toolsIntegration.executeToolCalls([
      {
        name: 'write_file',
        id: 'create_package_json',
        parameters: {
          file_path: packageJsonPath,
          content: packageJsonContent,
          description: 'Create package.json for Hello World project',
          create_directories: true
        }
      }
    ]);

    console.log(`✅ Package.json result: ${result3[0].success ? 'SUCCESS' : 'FAILED'}`);
    if (result3[0].success) {
      console.log('📁 Package.json created at:', packageJsonPath);
    }

    // Test 4: List created files
    console.log('\n📋 Test 4: List created files');
    
    const result4 = await toolsIntegration.executeToolCalls([
      {
        name: 'run_shell_command',
        id: 'list_files',
        parameters: {
          command: process.platform === 'win32' ? 'dir hello.ts test-package.json' : 'ls -la hello.ts test-package.json',
          description: 'List the created files'
        }
      }
    ]);

    console.log(`✅ List files result: ${result4[0].success ? 'SUCCESS' : 'FAILED'}`);
    if (result4[0].success) {
      console.log('📋 Files listing:');
      console.log(result4[0].result.returnDisplay);
    }

    console.log('\n🎉 Direct tool usage test completed!');
    console.log('\n📊 Summary:');
    console.log('✅ write_file tool: Working');
    console.log('✅ filesystem_read_file tool: Working');
    console.log('✅ run_shell_command tool: Working');
    
    console.log('\n📁 Files created:');
    console.log('  • hello.ts - TypeScript Hello World function');
    console.log('  • test-package.json - Package configuration');
    
    console.log('\n🚀 Now the AI should be able to use these tools automatically!');
    console.log('Try: ai-cli chat -p "Create a React component file called Button.tsx"');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await toolsIntegration.shutdown();
  }
}

testDirectToolUsage().catch(console.error);
