# GitHub Branch Protection Rules for Master Branch

## 🔒 Recommended Branch Protection Configuration

### **Step 1: Navigate to Repository Settings**
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Select **Branches** from the left sidebar
4. Click **Add rule** or **Add branch protection rule**

### **Step 2: Branch Name Pattern**
```
Branch name pattern: master
```

### **Step 3: Protection Rules Configuration**

#### ✅ **Require Pull Request Reviews**
- [x] **Require a pull request before merging**
- [x] **Require approvals: 1** (minimum recommended)
- [x] **Dismiss stale PR approvals when new commits are pushed**
- [x] **Require review from code owners** (if CODEOWNERS file exists)
- [x] **Restrict pushes that create files that contain secrets**

#### ✅ **Require Status Checks**
- [x] **Require status checks to pass before merging**
- [x] **Require branches to be up to date before merging**
- **Required status checks:**
  - `ci/tests` (if using GitHub Actions)
  - `ci/lint` (if using linting)
  - `ci/security-scan` (if using security scanning)

#### ✅ **Require Conversation Resolution**
- [x] **Require conversation resolution before merging**

#### ✅ **Require Signed Commits**
- [x] **Require signed commits**

#### ✅ **Require Linear History**
- [x] **Require linear history** (prevents merge commits)

#### ✅ **Require Deployments to Succeed**
- [x] **Require deployments to succeed before merging** (if applicable)

#### ✅ **Lock Branch**
- [ ] **Lock branch** (only enable if you want read-only)

#### ✅ **Do Not Allow Bypassing**
- [x] **Do not allow bypassing the above settings**
- [ ] **Allow force pushes** (keep disabled for security)
- [ ] **Allow deletions** (keep disabled for security)

#### ✅ **Restrict Pushes**
- [x] **Restrict pushes that create files that contain secrets**

### **Step 4: Apply to Administrators**
- [x] **Include administrators** (recommended for consistency)

---

## 🔧 GitHub Actions Workflow for Automated Checks

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Security Scan
        run: |
          echo "🔍 Scanning for secrets..."
          # Check for potential secrets
          if grep -r "eyJ[A-Za-z0-9]" . --exclude-dir=.git --exclude-dir=node_modules; then
            echo "❌ Potential JWT tokens found!"
            exit 1
          fi
          if grep -r "sk_[A-Za-z0-9]" . --exclude-dir=.git --exclude-dir=node_modules; then
            echo "❌ Potential API keys found!"
            exit 1
          fi
          if grep -r "AKIA[A-Z0-9]" . --exclude-dir=.git --exclude-dir=node_modules; then
            echo "❌ Potential AWS keys found!"
            exit 1
          fi
          echo "✅ No secrets detected"

  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ESLint
        run: npm run lint --if-present

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test

  validate-config:
    name: Validate Configuration Files
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate Package.json
        run: |
          if ! node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"; then
            echo "❌ Invalid package.json"
            exit 1
          fi
          echo "✅ package.json is valid"
          
      - name: Check for Required Placeholders
        run: |
          echo "🔍 Checking for proper placeholder usage..."
          if ! grep -q "YOUR_.*_HERE" README.md; then
            echo "❌ README should contain setup placeholders"
            exit 1
          fi
          echo "✅ Placeholder checks passed"
```

---

## 📋 CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Global code owners
* @ShubhamAgr

# Specific areas
/src/brokers/ @ShubhamAgr
/cloudflare/ @ShubhamAgr
/tests/ @ShubhamAgr
/.github/ @ShubhamAgr

# Security-sensitive files
/src/utils/SessionManager.js @ShubhamAgr
/src/server/ @ShubhamAgr
```

---

## 🚨 Security-Focused Rules

### **Additional Security Measures:**

1. **Secret Scanning:**
   - Enable GitHub's secret scanning
   - Configure custom patterns for broker API keys

2. **Dependency Scanning:**
   - Enable Dependabot alerts
   - Configure automatic security updates

3. **Code Scanning:**
   - Enable CodeQL analysis
   - Set up third-party security tools

### **Custom Security Patterns:**

Add to repository settings → Code security → Secret scanning:

```regex
# Kite API Keys
kite_api_[a-z0-9]{32}

# Groww JWT Tokens  
eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+

# Dhan API Keys
dhan_[a-z0-9]{40}

# Generic API Keys
[a-zA-Z0-9]{32,}
```

---

## 🎯 Quick Setup Commands

Run these commands to set up your repository:

```bash
# 1. Create GitHub directories
mkdir -p .github/workflows

# 2. Create CODEOWNERS file
cat > .github/CODEOWNERS << 'EOF'
* @ShubhamAgr
/src/brokers/ @ShubhamAgr
/cloudflare/ @ShubhamAgr
EOF

# 3. Create CI workflow
cat > .github/workflows/ci.yml << 'EOF'
# [Copy the CI workflow from above]
EOF

# 4. Commit and push
git add .github/
git commit -m "Add GitHub protection rules and CI workflow"
git push origin master
```

---

## ✅ Verification Checklist

After applying these rules:

- [ ] Pull requests are required for master
- [ ] At least 1 approval required
- [ ] Status checks must pass
- [ ] Conversations must be resolved
- [ ] Commits must be signed
- [ ] Linear history enforced
- [ ] Secret scanning enabled
- [ ] Dependabot alerts enabled
- [ ] CODEOWNERS file active
- [ ] CI/CD pipeline running

---

## 🔧 Repository Settings Recommendations

### **General Settings:**
- [ ] Disable wiki (if not needed)
- [ ] Disable projects (if not needed)
- [ ] Enable discussions (optional)
- [ ] Disable packages (if not needed)

### **Security Settings:**
- [x] Private vulnerability reporting
- [x] Dependency graph
- [x] Dependabot alerts
- [x] Dependabot security updates
- [x] Secret scanning
- [x] Code scanning

### **Access Settings:**
- Set repository visibility appropriately
- Configure team permissions
- Review collaborator access

This comprehensive ruleset ensures your master branch is protected against:
- Unauthorized direct pushes
- Unreviewed code changes
- Security vulnerabilities
- Secret leaks
- Code quality issues