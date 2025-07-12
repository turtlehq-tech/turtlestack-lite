# Pull Request

## 📋 Description
<!-- Provide a brief description of the changes -->

## 🔄 Type of Change
<!-- Mark the appropriate option with an "x" -->
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🧪 Test improvement
- [ ] 🔒 Security enhancement

## 🧪 Testing
<!-- Describe the tests you ran and how to reproduce them -->
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] Manual testing completed
- [ ] Security scan passed

## 🔒 Security Checklist
<!-- Verify all security requirements are met -->
- [ ] No hardcoded credentials, API keys, or secrets
- [ ] All sensitive values use placeholder tokens (YOUR_*_HERE)
- [ ] No personal URLs or identifiable information
- [ ] Authentication logic properly reviewed
- [ ] Input validation implemented where needed
- [ ] Error handling doesn't expose sensitive information

## 🚀 Broker Changes (if applicable)
<!-- If changes affect broker implementations -->
- [ ] Kite broker tested
- [ ] Groww broker tested  
- [ ] Dhan broker tested
- [ ] AngelOne broker tested
- [ ] Authentication flows verified
- [ ] API responses properly handled

## 📊 Technical Analysis (if applicable)
<!-- If changes affect technical indicators -->
- [ ] Indicator calculations verified
- [ ] Cross-broker compatibility maintained
- [ ] Historical data handling correct
- [ ] Performance impact assessed

## ☁️ Cloudflare Workers (if applicable)
<!-- If changes affect Cloudflare deployment -->
- [ ] Worker deployment tested
- [ ] KV storage operations verified
- [ ] Rate limiting functionality works
- [ ] Error handling for worker environment
- [ ] Memory and CPU usage optimized

## 📖 Documentation
- [ ] README.md updated (if needed)
- [ ] Authentication guide updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] Code comments added for complex logic

## 🔗 Related Issues
<!-- Link any related issues -->
Fixes #(issue number)
Relates to #(issue number)

## 📝 Additional Notes
<!-- Any additional information, warnings, or considerations -->

---

## 🔍 Reviewer Guidelines

### Security Review Focus:
1. **Credential Safety**: Ensure no real API keys, tokens, or secrets
2. **Authentication Logic**: Verify secure session handling
3. **Input Validation**: Check for proper sanitization
4. **Error Handling**: Ensure no sensitive data leakage

### Code Quality Review:
1. **Broker Compliance**: API implementations follow broker requirements
2. **Error Handling**: Comprehensive error management
3. **Testing**: Adequate test coverage
4. **Documentation**: Clear and accurate documentation

### Performance Review:
1. **Memory Usage**: Efficient data structures
2. **API Calls**: Minimize unnecessary requests
3. **Caching**: Appropriate use of caching mechanisms
4. **Cloudflare Limits**: Stays within worker constraints