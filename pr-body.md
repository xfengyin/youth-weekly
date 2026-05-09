## Summary

This PR addresses the code review findings with the following improvements:

### 🔴 Security
- **XSS Protection**: Added DOMPurify to sanitize Markdown HTML output

### 🟡 Architecture
- **Shared Python Module**: Extracted `load_issue()` function from 4 duplicate locations
- **Centralized Config**: Created `config.yaml` for all configuration management

### 🔴 Testing
- **Unit Tests**: Added 18 pytest test cases covering core content loading functionality
- **Coverage**: Tests for valid/invalid issues, path traversal protection, edge cases

### 🟡 CI/CD
- **Quality Gates**: Removed `|| true` from CI workflow
- **Real Tests**: CI now runs actual pytest unit tests
- **Deployment Verification**: Added post-build verification step

## Files Changed
- `web/package.json` - Added DOMPurify dependencies
- `web/src/app/lib/content.ts` - XSS protection
- `scripts/src/__init__.py` - New shared module
- `scripts/src/config.py` - New config loader
- `scripts/tests/test_content.py` - 18 unit tests
- `.github/workflows/ci.yml` - Real quality gates
- `.github/workflows/deploy.yml` - Verification step
- `config.yaml` - Centralized config

## Testing
```bash
cd scripts
pip install -r requirements.txt
pip install pytest
python -m pytest tests/ -v  # 18 tests pass
```

## Checklist
- [x] All tests pass
- [x] No XSS vulnerabilities
- [x] Code duplication eliminated
- [x] CI quality gates enforced
