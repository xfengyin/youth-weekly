/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  basePath: '/youth-weekly',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/youth-weekly',
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
