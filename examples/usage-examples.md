# AI CLI Usage Examples

This document provides practical examples of how to use AI CLI for various tasks.

## 🚀 Getting Started

### First Time Setup

```bash
# Start AI CLI for the first time
ai-cli

# The tool will guide you through API key setup
# Alternatively, set environment variables:
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export GEMINI_API_KEY="your-gemini-key"
```

## 💬 Basic Chat Examples

### Simple Questions

```bash
# Ask a quick question
ai-cli chat -p "What is the difference between let and const in JavaScript?"

# Use a specific model
ai-cli chat -m claude-3-sonnet -p "Explain quantum computing in simple terms"

# Disable streaming for cleaner output
ai-cli chat --no-stream -p "Generate a Python function to calculate fibonacci numbers"
```

### Interactive Chat

```bash
# Start interactive mode
ai-cli chat

# In interactive mode, you can use commands:
# /help - Show available commands
# /model gpt-4 - Switch to GPT-4
# /save my-session - Save current conversation
# /clear - Clear screen
# /quit - Exit
```

## 📁 File and Directory Analysis

### Single File Analysis

```bash
# Analyze a specific file
ai-cli chat -f package.json -p "What dependencies does this project have?"

# Code review
ai-cli chat -f src/main.js -p "Review this code and suggest improvements"

# Explain complex code
ai-cli chat -f algorithm.py -p "Explain how this algorithm works step by step"
```

### Directory Analysis

```bash
# Analyze entire project structure
ai-cli chat -d src/ -p "Analyze this codebase and provide an architecture overview"

# Security review
ai-cli chat -d . -p "Review this project for potential security vulnerabilities"

# Code quality assessment
ai-cli chat -d src/ -p "Assess the code quality and suggest refactoring opportunities"
```

## 🔍 Code Analysis Commands

### Project Analysis

```bash
# Analyze current directory
ai-cli analyze

# Analyze specific project
ai-cli analyze -p /path/to/project

# Save analysis to file
ai-cli analyze -o project-analysis.json

# Analyze and get recommendations
ai-cli analyze -p . | ai-cli chat -p "Based on this analysis, what are the top 3 improvements I should make?"
```

## 🛠️ Development Workflows

### Code Generation

```bash
# Generate a new component
ai-cli chat -p "Create a React component for a user profile card with TypeScript"

# Generate tests
ai-cli chat -f src/utils.js -p "Generate comprehensive unit tests for these utility functions"

# Generate documentation
ai-cli chat -d src/ -p "Generate API documentation for this codebase"
```

### Debugging Help

```bash
# Debug an error
ai-cli chat -f error.log -p "Help me understand and fix this error"

# Performance optimization
ai-cli chat -f slow-function.js -p "How can I optimize this function for better performance?"

# Code explanation
ai-cli chat -f complex-algorithm.py -p "Explain this algorithm and suggest optimizations"
```

### Refactoring Assistance

```bash
# Modernize old code
ai-cli chat -f legacy-code.js -p "Refactor this code to use modern JavaScript features"

# Convert between languages
ai-cli chat -f script.py -p "Convert this Python script to JavaScript"

# Apply design patterns
ai-cli chat -f messy-code.js -p "Refactor this code to use appropriate design patterns"
```

## 📊 Project Management

### Code Review

```bash
# Review recent changes
git diff HEAD~1 | ai-cli chat -p "Review these code changes and provide feedback"

# Review pull request
ai-cli chat -d . -p "I'm about to submit a PR. Review the codebase and suggest any final improvements"
```

### Documentation

```bash
# Generate README
ai-cli chat -d . -p "Generate a comprehensive README.md for this project"

# Create API docs
ai-cli chat -f api.js -p "Generate API documentation in OpenAPI format"

# Write user guide
ai-cli chat -d . -p "Create a user guide for this application"
```

## ⚙️ Configuration Examples

### Model Selection

```bash
# Set default model
ai-cli config --set defaultModel=claude-3-sonnet

# Check current configuration
ai-cli config --list

# Reset to defaults
ai-cli config --reset
```

### Custom Settings

```bash
# Adjust response length
ai-cli config --set maxTokens=8192

# Change temperature for creativity
ai-cli config --set temperature=0.9

# Disable auto-save
ai-cli config --set autoSave=false
```

## 💾 Session Management

### Saving and Loading Sessions

```bash
# List all sessions
ai-cli sessions --list

# Load a previous session
ai-cli sessions --load session-id

# Export session for sharing
ai-cli sessions --export session-id > my-conversation.json

# Delete old sessions
ai-cli sessions --delete old-session-id
```

### Session Workflows

```bash
# Start a project-specific session
ai-cli chat -d . -p "I'm working on a new feature. Let's start by analyzing the current codebase."
# In chat: /save feature-development

# Continue later
ai-cli sessions --load feature-development
```

## 🔧 Advanced Usage

### Combining with Other Tools

```bash
# Pipe output to AI CLI
cat error.log | ai-cli chat -p "Analyze this log file and identify the root cause"

# Use with git
git log --oneline -10 | ai-cli chat -p "Summarize these recent commits"

# Process multiple files
find . -name "*.js" -exec ai-cli chat -f {} -p "Check for security issues" \;
```

### Automation Scripts

```bash
#!/bin/bash
# Daily code review script

echo "Running daily code review..."

# Analyze recent changes
git diff --name-only HEAD~1 | while read file; do
    if [[ $file == *.js || $file == *.ts ]]; then
        echo "Reviewing $file..."
        ai-cli chat -f "$file" -p "Quick code review: any issues or improvements?" --no-stream
    fi
done
```

### Custom Workflows

```bash
# Code quality check
ai-cli analyze -o analysis.json
ai-cli chat -f analysis.json -p "Based on this analysis, create a prioritized action plan for code improvements"

# Security audit
ai-cli chat -d . -p "Perform a security audit of this codebase. Focus on common vulnerabilities like XSS, SQL injection, and authentication issues."

# Performance review
ai-cli chat -d src/ -p "Analyze this codebase for performance bottlenecks and suggest optimizations."
```

## 🎯 Best Practices

### Effective Prompting

```bash
# Be specific
ai-cli chat -p "Review this React component for accessibility issues and suggest WCAG 2.1 AA compliance improvements" -f component.jsx

# Provide context
ai-cli chat -d . -p "This is a Node.js e-commerce API. Review the authentication middleware for security vulnerabilities."

# Ask for structured output
ai-cli chat -p "Analyze this code and provide feedback in this format: 1) Issues found, 2) Suggested fixes, 3) Best practices to follow" -f code.js
```

### Workflow Integration

```bash
# Pre-commit hook
ai-cli chat -d . -p "Quick review: any obvious issues before I commit?" --no-stream

# Code review preparation
ai-cli chat -d . -p "I'm about to create a PR. Summarize the changes and potential impact."

# Learning and documentation
ai-cli chat -f complex-code.js -p "Explain this code as if teaching a junior developer. Include key concepts and best practices."
```

## 🚨 Troubleshooting

### Common Issues

```bash
# API key issues
ai-cli config --get openaiApiKey  # Check if key is set
ai-cli config --set openaiApiKey=new-key  # Update key

# Model not available
ai-cli models  # List available models
ai-cli config --set defaultModel=gpt-3.5-turbo  # Use different model

# Large file issues
ai-cli config --set maxFileSize=2097152  # Increase file size limit (2MB)
```

### Getting Help

```bash
# Show help
ai-cli --help
ai-cli chat --help

# Check version
ai-cli --version

# Debug mode
AI_CLI_LOG_LEVEL=debug ai-cli chat -p "test"
```

---

For more examples and advanced usage, check the [documentation](../README.md) or start a discussion in the project repository.
