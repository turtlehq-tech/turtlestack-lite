# Contributing to TurtleStack Lite

Thank you for your interest in contributing to TurtleStack Lite! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs
1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Include detailed reproduction steps
4. Specify your environment (OS, Node.js version, broker)

### Suggesting Features
1. Check existing feature requests
2. Use the feature request template
3. Explain the use case and benefits
4. Consider which brokers it would apply to

### Code Contributions
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Update documentation if needed
7. Submit a pull request

## 🏗️ Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/turtlestack-lite.git
cd turtlestack-lite

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

## 📋 Code Style Guidelines

- Use ES6+ features and modules
- Follow existing code formatting
- Add JSDoc comments for functions
- Use descriptive variable and function names
- Keep functions small and focused

## 🧪 Testing

- Write unit tests for new functions
- Add integration tests for broker interactions
- Test with real broker credentials (use test accounts)
- Ensure all tests pass before submitting

## 🔒 Security Guidelines

- Never commit API keys or credentials
- Use placeholder values in examples
- Sanitize sensitive data in logs
- Follow security best practices

## 📚 Documentation

- Update README.md for new features
- Add inline code comments
- Include usage examples
- Update API documentation

## 🏷️ Commit Messages

Use conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `perf:` Performance improvements

Example: `feat(kite): add support for GTT orders`

## 🔄 Pull Request Process

1. Ensure your PR description is clear
2. Link related issues
3. Include screenshots for UI changes
4. Mark which brokers are affected
5. Request review from maintainers

## 🌟 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Documentation credits

## 📞 Getting Help

- Open an issue for questions
- Join discussions in GitHub Discussions
- Check existing documentation
- Contact maintainers: support@turtlehq.tech

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

---

Thank you for making TurtleStack Lite better! 🚀