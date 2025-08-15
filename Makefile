# AI CLI Makefile

.PHONY: help install build test lint format clean dev setup docker-build docker-run

# Default target
help:
	@echo "AI CLI - Available commands:"
	@echo ""
	@echo "  setup      - Initial project setup"
	@echo "  install    - Install dependencies"
	@echo "  build      - Build the project"
	@echo "  dev        - Run in development mode"
	@echo "  test       - Run tests"
	@echo "  test-watch - Run tests in watch mode"
	@echo "  lint       - Run linter"
	@echo "  format     - Format code"
	@echo "  clean      - Clean build artifacts"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run - Run in Docker container"
	@echo ""

# Initial setup
setup:
	@echo "🚀 Setting up AI CLI..."
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@npm install

# Build the project
build:
	@echo "🔨 Building project..."
	@npm run build

# Development mode
dev:
	@echo "🔧 Starting development mode..."
	@npm run dev

# Run tests
test:
	@echo "🧪 Running tests..."
	@npm test

# Run tests in watch mode
test-watch:
	@echo "🧪 Running tests in watch mode..."
	@npm run test:watch

# Run linter
lint:
	@echo "🔍 Running linter..."
	@npm run lint

# Format code
format:
	@echo "✨ Formatting code..."
	@npm run format

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf coverage/
	@rm -rf node_modules/.cache/

# Full clean (including node_modules)
clean-all: clean
	@echo "🧹 Cleaning everything..."
	@rm -rf node_modules/

# Build Docker image
docker-build:
	@echo "🐳 Building Docker image..."
	@docker build -t ai-cli .

# Run in Docker container
docker-run:
	@echo "🐳 Running in Docker container..."
	@docker run -it --rm \
		-e OPENAI_API_KEY=${OPENAI_API_KEY} \
		-e ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY} \
		-e GEMINI_API_KEY=${GEMINI_API_KEY} \
		-v $(PWD):/workspace \
		ai-cli

# Development with Docker
docker-dev:
	@echo "🐳 Starting development environment with Docker..."
	@docker-compose up ai-cli-dev

# Run tests in Docker
docker-test:
	@echo "🐳 Running tests in Docker..."
	@docker run --rm \
		-v $(PWD):/app \
		-w /app \
		node:18-alpine \
		npm test

# Publish to npm (for maintainers)
publish:
	@echo "📦 Publishing to npm..."
	@npm run build
	@npm publish

# Create release (for maintainers)
release:
	@echo "🏷️ Creating release..."
	@npm version patch
	@git push origin main --tags
	@npm run build
	@npm publish

# Check project health
health-check:
	@echo "🏥 Running health check..."
	@npm audit
	@npm run lint
	@npm test
	@echo "✅ Health check complete"

# Update dependencies
update-deps:
	@echo "⬆️ Updating dependencies..."
	@npm update
	@npm audit fix

# Generate documentation
docs:
	@echo "📚 Generating documentation..."
	@npx typedoc src --out docs/api

# Benchmark performance
benchmark:
	@echo "⚡ Running performance benchmarks..."
	@node scripts/benchmark.js

# Security audit
security:
	@echo "🔒 Running security audit..."
	@npm audit
	@npx audit-ci

# Pre-commit checks
pre-commit: lint test
	@echo "✅ Pre-commit checks passed"

# CI pipeline
ci: install lint test build
	@echo "✅ CI pipeline completed"
