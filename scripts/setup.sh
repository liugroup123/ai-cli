#!/bin/bash

# AI CLI Setup Script

set -e

echo "🚀 Setting up AI CLI..."

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
if [[ "$NODE_VERSION" == "not found" ]]; then
    echo "❌ Node.js is not installed. Please install Node.js 18.0.0 or higher."
    exit 1
fi

# Extract version number
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [[ $NODE_MAJOR -lt 18 ]]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18.0.0 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Create global link
echo "🔗 Creating global link..."
npm link

echo "✅ AI CLI setup complete!"
echo ""
echo "🎉 You can now use 'ai-cli' or 'ai' command from anywhere!"
echo ""
echo "Next steps:"
echo "1. Set up your API keys:"
echo "   export OPENAI_API_KEY='your-openai-key'"
echo "   export ANTHROPIC_API_KEY='your-anthropic-key'"
echo "   export GEMINI_API_KEY='your-gemini-key'"
echo ""
echo "2. Start using AI CLI:"
echo "   ai-cli"
echo ""
echo "3. Get help:"
echo "   ai-cli --help"
