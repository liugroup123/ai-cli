# AI CLI

A powerful AI-powered command line interface tool that brings multiple AI models directly to your terminal.

## 🚀 Features

- **Multiple AI Providers**: OpenAI (GPT), Anthropic (Claude), Google (Gemini), and Qwen (DashScope)
- **Interactive Chat + Banner**: Seamless chat with streaming responses and a startup banner splash
- **Markdown Rendering**: Render AI answers as colorful ANSI in terminal with `--render=ansi`
- **Gen/Edit with Diff**: `gen` 生成文件、`edit` 安全改文件（彩色 diff 预览、可备份）
- **Code Analysis**: Analyze codebases with detailed metrics and insights
- **File Operations**: Read and process files and directories
- **Session Management**: Save, load, and manage conversation sessions
- **Configurable**: Extensive configuration options for personalization
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 📦 Installation

### Prerequisites

- Node.js 18.0.0 or higher (recommend Node 20+)
- npm (or yarn/pnpm)

### Install from npm (Coming Soon)

```bash
npm install -g ai-cli
```

### Install from Source

```bash
git clone <repository-url>
cd ai-cli
npm install
npm run build
npm link
```

## 🔐 Setup

Before using AI CLI, you need to configure at least one AI provider:

### Option 1: Interactive Setup

```bash
ai-cli
```

The tool will guide you through the setup process on first run.

### Option 2: Manual Configuration

Set your API keys as environment variables:

```bash
# OpenAI
export OPENAI_API_KEY="your-openai-api-key"

# Anthropic (Claude)
export ANTHROPIC_API_KEY="your-anthropic-api-key"

# Google (Gemini)
export GEMINI_API_KEY="your-gemini-api-key"
```

Or configure them directly:

```bash
ai-cli config --set openaiApiKey=your-key
ai-cli config --set anthropicApiKey=your-key
ai-cli config --set geminiApiKey=your-key
```

## 🚀 Quick Start

### Start Interactive Chat

```bash
ai-cli
# or
ai-cli chat
```

### Single Prompt Mode

```bash
ai-cli chat -p "Explain how async/await works in JavaScript"
```

### Include Files in Context

```bash
ai-cli chat -f package.json -p "Analyze this package.json file"
```

### Include Directory in Context

```bash
ai-cli chat -d src/ -p "Review this codebase and suggest improvements"
```

### Use Specific Model

```bash
ai-cli chat -m claude-3-sonnet -p "Write a Python function to sort a list"
```

### Rendering (Markdown → ANSI)

```bash
# Render colorful ANSI in terminal (recommended)
ai-cli chat -p "示例" --render=ansi --no-stream

# Keep raw Markdown
ai-cli chat -p "示例" --render=md
```

### Generate and Edit

```bash
# Generate a file with preview
ai-cli gen -p "为项目生成一个README" -o README.md

# Edit a file with diff preview (confirm before apply)
ai-cli edit -f src/app.ts -p "添加/health路由"
```

```bash
ai-cli chat -m claude-3-sonnet -p "Write a Python function to sort a list"
```

## 📋 Commands

### Chat Commands

```bash
# Start interactive chat (default)
ai-cli chat

# Single prompt mode
ai-cli chat -p "Your prompt here"

# Include file context
ai-cli chat -f file.js -p "Explain this code"

# Include directory context
ai-cli chat -d src/ -p "Analyze this project"

# Use specific model
ai-cli chat -m gpt-4 -p "Your prompt"

# Disable streaming
ai-cli chat --no-stream -p "Your prompt"
```

### Configuration

```bash
# List all configuration
ai-cli config --list

# Set configuration value
ai-cli config --set key=value

# Get configuration value
ai-cli config --get key

# Reset to defaults
ai-cli config --reset
```

### Model Management

```bash
# List available models
ai-cli models
```

### Code Analysis

```bash
# Analyze current directory
ai-cli analyze

# Analyze specific path
ai-cli analyze -p /path/to/project

# Save analysis to file
ai-cli analyze -o analysis.json
```

### Session Management

```bash
# List all sessions
ai-cli sessions --list

# Load a session
ai-cli sessions --load session-id

# Delete a session
ai-cli sessions --delete session-id

# Export a session
ai-cli sessions --export session-id
```

## 🎮 Interactive Commands

When in interactive chat mode, you can use these commands:

- `/help` - Show available commands
- `/quit` or `/exit` - Exit the chat
- `/clear` - Clear the screen
- `/save [name]` - Save current session
- `/model [model-name]` - Change AI model

## ⚙️ Configuration

AI CLI stores configuration in `~/.ai-cli/config.json`. Available options:

```json
{
  "defaultModel": "gpt-4",
  "maxTokens": 4096,
  "temperature": 0.7,
  "theme": "auto",
  "streaming": true,
  "maxFileSize": 1048576,
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    "*.log",
    ".env*"
  ],
  "autoSave": true,
  "maxSessions": 50
}
```

## 🔧 Advanced Usage

### Environment Variables

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GEMINI_API_KEY` - Google Gemini API key
- `DASHSCOPE_API_KEY`/`QWEN_API_KEY` - Qwen (DashScope) API key（与你的站点 baseURL 匹配）
- `AI_CLI_CONFIG_DIR` - Custom config directory
- `AI_CLI_LOG_LEVEL` - Log level (debug, info, warn, error)

### Custom Configuration Directory

```bash
export AI_CLI_CONFIG_DIR="/custom/path"
ai-cli
```

### Logging

Enable file logging:

```bash
ai-cli config --set logLevel=debug
ai-cli config --set logFile=~/.ai-cli/app.log
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone <repository-url>
cd ai-cli
npm install
npm run dev
```

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](issues)
- 💬 [Discussions](discussions)

## 🙏 Acknowledgments

- OpenAI for GPT models
- Anthropic for Claude models
- Google for Gemini models
- The open source community for inspiration

---

Built with ❤️ for developers who love the command line.
