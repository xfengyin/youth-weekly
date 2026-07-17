/**
 * Jest 配置文件
 *
 * 关键约定:
 * - preset: 'ts-jest'  使用 TypeScript 预处理器,直接解析 .ts/.tsx
 * - testEnvironment: 'jsdom'  提供 DOM 环境以支持 @testing-library/react
 * - moduleNameMapper:  将 @/ 路径别名映射到 src/,与 tsconfig.json 保持一致
 * - setupFilesAfterEach: 在每个测试文件执行前加载 setupTests,注册 jest-dom 扩展
 * - collectCoverageFrom: 指定需要统计覆盖率的源码范围
 */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: __dirname,
  roots: ['<rootDir>/src'],
  setupFilesAfterEach: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowJs: true,
          module: 'commonjs',
          target: 'es2017',
          lib: ['dom', 'dom.iterable', 'esnext'],
          strict: true,
          resolveJsonModule: true,
        },
        diagnostics: {
          ignoreCodes: [151001], // 忽略 ts-jest 内部诊断,聚焦业务代码
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/app/**/*.{ts,tsx}',
    '!src/app/**/*.d.ts',
    '!src/app/**/__tests__/**',
    '!src/app/**/layout.tsx',
    '!src/app/**/page.tsx',
    '!src/app/**/not-found.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  clearMocks: true,
  resetModules: true,
  verbose: true,
}
