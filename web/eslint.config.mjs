import next from 'eslint-config-next/core-web-vitals'

const config = [
  ...next,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      // react-hooks v7 新增规则，对 setMounted/setIsLoading 等常见 effect 内 setState
      // 模式过于严格；这些是有意用法，关闭以避免误报阻断 CI。
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config

