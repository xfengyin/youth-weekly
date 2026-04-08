/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // PWA 配置
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
}

module.exports = nextConfig
