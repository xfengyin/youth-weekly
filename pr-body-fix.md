## Summary

Fix build errors and update dependencies for React 19 / Next.js 16 compatibility.

## Changes

| File | Change |
|------|--------|
| `web/package.json` | Upgrade lucide-react to ^0.460.0, ESLint to ^9.0.0, add @types/dompurify |
| `web/package-lock.json` | New lock file |
| `web/tsconfig.json` | Update for Next.js 16 types |
| `web/src/app/lib/content.ts` | Fix date type serialization in gray-matter parsing |
| `web/src/app/components/Footer.tsx` | Fix lucide-react icon imports |
| `web/src/app/issues/[slug]/page.tsx` | Update to Next.js 16 async params API |

## Root Cause

1. lucide-react ^0.300.0 not compatible with React 19
2. Next.js 16 changed params to be Promise-based
3. gray-matter parses dates as Date objects, causing serialization errors

## Verification

```bash
cd web
npm install
npm run build  # ✓ Builds successfully with all 5 issues
```

Build output shows all pages prerendered:
```
Route (app)
├ ● /issues/[slug]
│ ├ /issues/005
│ ├ /issues/004
│ ├ /issues/003
│ └ [+2 more paths]
```
