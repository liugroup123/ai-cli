# Contributing to AI CLI

Thank you for your interest in contributing to AI CLI! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ai-cli.git
   cd ai-cli
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. Run in development mode:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── core/           # Core functionality
│   ├── ai-provider.ts    # AI model integrations
│   ├── cli.ts           # Main CLI interface
│   ├── config.ts        # Configuration management
│   ├── file-manager.ts  # File operations
│   ├── session-manager.ts # Session handling
│   └── code-analyzer.ts # Code analysis
├── utils/          # Utility functions
│   └── logger.ts        # Logging utilities
├── test/           # Test setup
└── index.ts        # Entry point
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place test files next to the code they test with `.test.ts` extension
- Use Jest for testing framework
- Follow the existing test patterns
- Aim for high test coverage

Example test structure:
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  describe('method name', () => {
    it('should do something', () => {
      // Test implementation
    });
  });
});
```

## 📝 Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Define interfaces for all data structures
- Use proper type annotations
- Avoid `any` type when possible

### Code Formatting

We use Prettier and ESLint for code formatting:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(ai-provider): add support for new Gemini model
fix(config): handle missing config file gracefully
docs(readme): update installation instructions
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Detailed steps to reproduce the bug
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**: OS, Node.js version, AI CLI version
6. **Logs**: Relevant error messages or logs

Use the bug report template when creating issues.

## ✨ Feature Requests

When requesting features:

1. **Use case**: Describe the problem you're trying to solve
2. **Proposed solution**: Your idea for solving it
3. **Alternatives**: Other solutions you've considered
4. **Additional context**: Screenshots, examples, etc.

## 🔧 Development Guidelines

### Adding New AI Providers

1. Extend the `AIProvider` class
2. Add configuration options to `Config` interface
3. Update model validation in `ConfigManager`
4. Add tests for the new provider
5. Update documentation

### Adding New Commands

1. Add command definition in `src/index.ts`
2. Implement handler in `CLI` class
3. Add tests for the new command
4. Update help text and documentation

### Adding New Features

1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement the feature with tests
3. Update documentation
4. Submit pull request

## 📚 Documentation

### Code Documentation

- Use JSDoc comments for public APIs
- Include examples in documentation
- Keep documentation up to date with code changes

### User Documentation

- Update README.md for user-facing changes
- Add examples for new features
- Update help text in CLI

## 🔄 Pull Request Process

1. **Fork and branch**: Create a feature branch from `main`
2. **Implement**: Make your changes with tests
3. **Test**: Ensure all tests pass
4. **Document**: Update relevant documentation
5. **Submit**: Create a pull request with clear description

### Pull Request Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No breaking changes (or clearly documented)

### Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. Address review feedback
4. Maintainer will merge when approved

## 🏷️ Release Process

Releases are handled by maintainers:

1. Version bump following semantic versioning
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm
5. Update documentation

## 🤝 Community

### Code of Conduct

Please follow our Code of Conduct in all interactions.

### Getting Help

- 📖 Check the documentation first
- 🐛 Search existing issues
- 💬 Start a discussion for questions
- 📧 Contact maintainers for sensitive issues

### Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Special recognition for significant contributions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AI CLI! 🎉
