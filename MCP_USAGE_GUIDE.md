# 🔧 AI CLI MCP Tools Usage Guide

## 🎯 What is MCP?

**MCP (Model Context Protocol)** is a protocol that allows AI models to interact with external tools and services. Your AI CLI now has the same tool capabilities as Google Gemini CLI!

## 🚀 How to Use MCP Tools

### **1. Basic Usage**

```bash
# Single prompt with tools enabled (automatic)
ai-cli chat -p "Create a new React component file"

# Interactive chat with tools (TUI mode)
ai-cli chat --tui

# The AI will automatically decide when to use tools!
```

### **2. What Tools Are Available**

Your AI CLI has **7 tools** available:

#### **Built-in Tools (2)**
- **`write_file`**: Create/edit files with diff preview
- **`run_shell_command`**: Execute shell commands safely

#### **MCP Tools (5)**
- **`filesystem_read_file`**: Read file contents
- **`filesystem_list_directory`**: List directory contents  
- **`git_status`**: Check git repository status
- **`git_log`**: View git commit history
- **`web-search_search_web`**: Search the internet

## 🎬 Real Usage Examples

### **Example 1: Create a TypeScript Interface**

```bash
ai-cli chat -p "Create a TypeScript interface for a user profile with name, email, age, and preferences"
```

**What happens:**
1. 🧠 AI analyzes: "This needs file creation"
2. 🔧 AI chooses: `write_file` tool
3. 📝 AI creates: `UserProfile.ts` with complete interface
4. ✅ You see: Diff preview and confirmation

### **Example 2: Project Setup**

```bash
ai-cli chat -p "Set up a new Express.js project with TypeScript"
```

**What happens:**
1. 🔧 AI uses `write_file` to create `package.json`
2. 🔧 AI uses `write_file` to create `tsconfig.json`
3. 🔧 AI uses `write_file` to create `src/server.ts`
4. 🔧 AI uses `run_shell_command` to run `npm install`

### **Example 3: Git Operations**

```bash
ai-cli chat -p "Check the git status and show me recent commits"
```

**What happens:**
1. 🔧 AI uses `git_status` MCP tool
2. 🔧 AI uses `git_log` MCP tool  
3. 📊 AI presents formatted results

### **Example 4: Research and Create**

```bash
ai-cli chat -p "Research the latest React patterns and create a modern component"
```

**What happens:**
1. 🔧 AI uses `web-search_search_web` to research
2. 🔧 AI uses `write_file` to create component
3. 📚 AI explains the patterns used

## 🎨 Interactive TUI Mode

```bash
ai-cli chat --tui
```

In TUI mode, you'll see:
- 🎯 **Tool confirmations**: Preview what AI wants to do
- 📊 **Real-time progress**: Watch tools execute
- 🔧 **Tool suggestions**: See which tools AI recommends
- ✅ **Results display**: Beautiful diff previews

## 🛡️ Safety Features

### **Automatic Confirmations**
- All file changes show **diff preview**
- Shell commands show **command preview**
- You can approve **once** or **always**

### **Workspace Protection**
- Tools only work within your project directory
- No access to system files outside workspace
- Shell commands are sandboxed

### **Smart Validation**
- File paths are validated
- Commands are checked against allowlist
- Parameters are type-checked

## 🔧 Advanced Configuration

### **Enable/Disable Tools**
```bash
# Tools are enabled by default in chat mode
# To disable tools (not recommended):
export AI_CLI_DISABLE_TOOLS=true
```

### **MCP Server Configuration**
```bash
# Use full MCP SDK (advanced)
export AI_CLI_USE_SIMPLE_MCP=false

# Use simplified MCP (default, more stable)
export AI_CLI_USE_SIMPLE_MCP=true
```

## 📊 Tool Status

Check what tools are available:

```bash
# Run the demo to see tool status
node demo-mcp-usage.js
```

You'll see:
- **Total tools**: 7
- **Built-in tools**: 2  
- **MCP tools**: 5
- **Connected servers**: 3

## 🎯 Best Practices

### **1. Be Specific**
```bash
# Good
ai-cli chat -p "Create a React component called UserCard with props for name and email"

# Less specific
ai-cli chat -p "Make a component"
```

### **2. Let AI Choose Tools**
The AI is smart about tool selection. Just describe what you want!

### **3. Review Changes**
Always review the diff preview before confirming file changes.

### **4. Use TUI for Complex Tasks**
For multi-step tasks, use `--tui` mode for better interaction.

## 🚀 Try These Examples

```bash
# File operations
ai-cli chat -p "Create a README.md for this project"
ai-cli chat -p "Add TypeScript types for an API response"

# Development tasks  
ai-cli chat -p "Set up Jest testing for this project"
ai-cli chat -p "Create a Docker configuration"

# Git operations
ai-cli chat -p "Show me the git status and recent changes"

# Research tasks
ai-cli chat -p "Find the latest best practices for React hooks and create an example"

# Complex workflows
ai-cli chat --tui
# Then type: "Help me refactor this component to use modern React patterns"
```

## 🎉 What Makes This Special

Your AI CLI now has **the same tool capabilities as Google Gemini CLI**:

- ✅ **Same architecture**: BaseDeclarativeTool pattern
- ✅ **Same safety**: Confirmation and validation
- ✅ **Same MCP integration**: External tool servers
- ✅ **Better AI support**: Multiple providers (OpenAI, Claude, Gemini, Qwen)
- ✅ **Better stability**: Fallback implementations

## 🔮 Coming Soon

- 🎨 **Visual diff UI** in TUI mode
- 🔌 **Custom MCP servers** for your specific needs
- 🤖 **Tool learning** from your preferences
- 📊 **Usage analytics** and optimization

---

**🎯 Ready to try it? Start with:**
```bash
ai-cli chat -p "Create a simple TypeScript function that validates email addresses"
```

Watch the AI automatically choose tools and create the file for you! 🚀
